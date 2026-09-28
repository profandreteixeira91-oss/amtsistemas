/**
 * Executor server-only da prospecção automática diária.
 * Alterna (UF, sistema) em rodízio, roda a busca em 1 cidade
 * (a mais populosa da UF ainda ativa) e encaminha automaticamente
 * ao CRM os leads qualificados (score >= score_min e com contato).
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { processarCidade } from "@/lib/lead-scraper.functions";

type AutoConfig = {
  id: string;
  ativo: boolean;
  sistemas_ids: string[];
  ufs: string[];
  score_min: number;
  enriquecer: boolean;
  limite_por_busca: number;
  ultimo_uf: string | null;
  ultimo_sistema_id: string | null;
};

function proximoCombo(cfg: AutoConfig): { uf: string; sistema_id: string } | null {
  const ufs = (cfg.ufs ?? []).filter(Boolean);
  const sistemas = (cfg.sistemas_ids ?? []).filter(Boolean);
  if (ufs.length === 0 || sistemas.length === 0) return null;

  // Combinações no formato (uf, sistema) ordenadas — rodízio determinístico
  const combos: Array<{ uf: string; sistema_id: string }> = [];
  for (const s of sistemas) for (const u of ufs) combos.push({ uf: u, sistema_id: s });

  if (!cfg.ultimo_uf || !cfg.ultimo_sistema_id) return combos[0];

  const idx = combos.findIndex(
    (c) => c.uf === cfg.ultimo_uf && c.sistema_id === cfg.ultimo_sistema_id,
  );
  const next = combos[(idx + 1) % combos.length];
  return next ?? combos[0];
}

export async function executarAutoScraper(): Promise<{
  status: "ok" | "skipped";
  motivo?: string;
  busca_id?: string;
  uf?: string;
  sistema_id?: string;
  contadores?: Record<string, number> | null;
  encaminhados_crm?: number;
}> {
  const { data: cfgRow } = await supabaseAdmin
    .from("manager_scraper_auto_config")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const cfg = cfgRow as AutoConfig | null;
  if (!cfg) return { status: "skipped", motivo: "sem configuração" };
  if (!cfg.ativo) return { status: "skipped", motivo: "automação desativada" };

  const combo = proximoCombo(cfg);
  if (!combo) return { status: "skipped", motivo: "sem UFs ou sistemas configurados" };

  // Nichos do sistema alvo
  const { data: nichos } = await supabaseAdmin
    .from("manager_scraper_nichos")
    .select("*")
    .eq("sistema_id", combo.sistema_id)
    .eq("ativo", true);
  if (!nichos || nichos.length === 0) {
    // Avança rotação mesmo sem nichos, para não travar
    await supabaseAdmin
      .from("manager_scraper_auto_config")
      .update({
        ultimo_uf: combo.uf,
        ultimo_sistema_id: combo.sistema_id,
        ultima_execucao: new Date().toISOString(),
      })
      .eq("id", cfg.id);
    return { status: "skipped", motivo: `sistema ${combo.sistema_id} sem nichos ativos` };
  }

  // Cidade alvo: a maior cidade ativa daquela UF
  const { data: cidades } = await supabaseAdmin
    .from("manager_scraper_cidades")
    .select("uf, nome, latitude, longitude, populacao")
    .eq("uf", combo.uf)
    .eq("ativa", true)
    .order("populacao", { ascending: false })
    .limit(1);

  if (!cidades || cidades.length === 0) {
    await supabaseAdmin
      .from("manager_scraper_auto_config")
      .update({
        ultimo_uf: combo.uf,
        ultimo_sistema_id: combo.sistema_id,
        ultima_execucao: new Date().toISOString(),
      })
      .eq("id", cfg.id);
    return { status: "skipped", motivo: `UF ${combo.uf} sem cidades ativas` };
  }

  const cidade = cidades[0];

  // Registra a busca automática
  const { data: sistema } = await supabaseAdmin
    .from("manager_sistemas")
    .select("nome")
    .eq("id", combo.sistema_id)
    .maybeSingle();

  const { data: busca, error: bErr } = await supabaseAdmin
    .from("manager_scraper_buscas")
    .insert({
      sistema_id: combo.sistema_id,
      tipo_negocio: `[AUTO] ${sistema?.nome ?? "Sistema"} · ${nichos.map((n: any) => n.nome).slice(0, 3).join(", ")}`,
      cidade: cidade.nome,
      estado: combo.uf,
      uf: combo.uf,
      rede: "google_places",
      nichos: nichos.map((n: any) => n.slug),
      escopo: "cidade",
      latitude: cidade.latitude,
      longitude: cidade.longitude,
      query_final: `Rodízio automático diário — ${cidade.nome}/${combo.uf}`,
      status: "processando",
      total_cidades: 1,
      cidades_processadas: 0,
      contadores: {},
      iniciado_em: new Date().toISOString(),
      automatica: true,
    })
    .select()
    .single();

  if (bErr || !busca) {
    console.error("[auto-scraper] falha ao criar busca", bErr);
    return { status: "skipped", motivo: `falha ao criar busca: ${bErr?.message ?? "?"}` };
  }

  // Processa a cidade
  const contadores = await processarCidade({
    supabase: supabaseAdmin,
    busca_id: busca.id,
    sistema_id: combo.sistema_id,
    cidade: {
      uf: combo.uf,
      nome: cidade.nome,
      latitude: cidade.latitude,
      longitude: cidade.longitude,
    },
    nichos: nichos.map((n: any) => ({ nome: n.nome, termos: n.termos ?? [] })),
    maxPorBusca: cfg.limite_por_busca,
    raio_km: null,
    enriquecer: cfg.enriquecer,
  });

  await supabaseAdmin
    .from("manager_scraper_buscas")
    .update({
      status: "concluido",
      cidades_processadas: 1,
      contadores,
      total_resultados: contadores.validos,
      finalizado_em: new Date().toISOString(),
    })
    .eq("id", busca.id);

  // Encaminha automaticamente os leads qualificados ao CRM
  const { data: qualificados } = await supabaseAdmin
    .from("manager_scraper_leads")
    .select("*")
    .eq("busca_id", busca.id)
    .eq("enviado_crm", false)
    .gte("score", cfg.score_min);

  let encaminhados = 0;
  for (const l of qualificados ?? []) {
    const temContato = Boolean(l.email || l.whatsapp || l.telefone);
    if (!temContato) continue;

    const { data: novo, error: e2 } = await supabaseAdmin
      .from("manager_leads")
      .insert({
        nome: l.nome,
        empresa: l.nome,
        email: l.email,
        telefone: l.whatsapp ?? l.telefone,
        origem: `scraper-auto:${l.origem ?? "google_places"}`,
        status: "novo",
        score: l.score,
        sistema_interesse_id: l.sistema_id,
        observacoes: [
          "Encaminhado automaticamente pelo robô de prospecção diária.",
          l.endereco && `Endereço: ${l.endereco}`,
          l.website && `Site: ${l.website}`,
          l.instagram && `Instagram: ${l.instagram}`,
          l.facebook && `Facebook: ${l.facebook}`,
          l.google_maps_url && `Maps: ${l.google_maps_url}`,
          l.avaliacao != null && `Avaliação Google: ${l.avaliacao} (${l.total_avaliacoes ?? 0})`,
        ]
          .filter(Boolean)
          .join("\n"),
      })
      .select()
      .single();
    if (e2 || !novo) continue;
    await supabaseAdmin
      .from("manager_scraper_leads")
      .update({ enviado_crm: true, lead_id: novo.id })
      .eq("id", l.id);
    encaminhados++;
  }

  await supabaseAdmin
    .from("manager_scraper_auto_config")
    .update({
      ultimo_uf: combo.uf,
      ultimo_sistema_id: combo.sistema_id,
      ultima_execucao: new Date().toISOString(),
    })
    .eq("id", cfg.id);

  return {
    status: "ok",
    busca_id: busca.id,
    uf: combo.uf,
    sistema_id: combo.sistema_id,
    contadores: contadores as unknown as Record<string, number>,
    encaminhados_crm: encaminhados,
  };
}

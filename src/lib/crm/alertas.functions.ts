import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function requireSuperAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_super_admin", { _user_id: userId });
  if (!data) throw new Error("Acesso negado");
}

/** Motor de geração de alertas — idempotente por (tipo, lead_id) do mesmo dia. */
async function gerarAlertasInternal(supabase: any) {
  const hoje = new Date().toISOString().slice(0, 10);
  const alertas: Array<any> = [];

  // 1) Leads quentes (score >= 75) sem contato há >3 dias
  const tresDiasAtras = new Date(Date.now() - 3 * 86400_000).toISOString();
  const { data: quentes } = await supabase
    .from("manager_leads")
    .select("id, empresa, nome, score, score_atualizado_em")
    .gte("score", 75)
    .not("status", "in", '("cliente","perdido","descartado")')
    .limit(50);
  for (const l of quentes ?? []) {
    const { count } = await supabase
      .from("crm_mensagens").select("id", { count: "exact", head: true })
      .eq("lead_id", l.id).gte("created_at", tresDiasAtras);
    if ((count ?? 0) === 0) {
      alertas.push({
        tipo: "lead_quente_sem_contato", severidade: "alta",
        titulo: `Lead quente sem contato: ${l.empresa ?? l.nome}`,
        mensagem: `Score ${l.score} e sem interação há +3 dias.`,
        lead_id: l.id, link: `/crm/leads`,
      });
    }
  }

  // 2) Propostas enviadas há >7 dias sem resposta
  const seteDiasAtras = new Date(Date.now() - 7 * 86400_000).toISOString();
  const { data: props } = await supabase
    .from("crm_propostas").select("id, titulo, lead_id, cliente_id, enviada_em, status")
    .eq("status", "enviada").lt("enviada_em", seteDiasAtras).limit(50);
  for (const p of props ?? []) {
    alertas.push({
      tipo: "proposta_sem_resposta", severidade: "media",
      titulo: `Proposta parada: ${p.titulo}`,
      mensagem: `Enviada em ${new Date(p.enviada_em).toLocaleDateString("pt-BR")} sem retorno.`,
      lead_id: p.lead_id, cliente_id: p.cliente_id, link: `/crm/propostas`,
    });
  }

  // 3) Mensagens de alta urgência não respondidas (últimas 48h)
  const doisDiasAtras = new Date(Date.now() - 2 * 86400_000).toISOString();
  const { data: urgentes } = await supabase
    .from("crm_mensagens").select("id, lead_id, conteudo, urgencia, created_at")
    .eq("direcao", "entrada").eq("urgencia", "alta").gte("created_at", doisDiasAtras).limit(50);
  for (const m of urgentes ?? []) {
    const { count } = await supabase.from("crm_mensagens").select("id", { count: "exact", head: true })
      .eq("lead_id", m.lead_id).eq("direcao", "saida").gt("created_at", m.created_at);
    if ((count ?? 0) === 0) {
      alertas.push({
        tipo: "mensagem_urgente", severidade: "alta",
        titulo: `Mensagem urgente sem resposta`,
        mensagem: (m.conteudo ?? "").slice(0, 160),
        lead_id: m.lead_id, link: `/crm/mensagens`,
      });
    }
  }

  // 4) Contratos expirando em 30 dias
  const em30 = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
  const { data: contratos } = await supabase
    .from("crm_contratos").select("id, titulo, cliente_id, status")
    .eq("status", "ativo").limit(50);
  // sem coluna de expiração explícita — deixamos hook aberto para futuro

  // Persistir (evitando duplicatas do mesmo dia)
  let criados = 0;
  for (const a of alertas) {
    const { count } = await supabase.from("crm_alertas")
      .select("id", { count: "exact", head: true })
      .eq("tipo", a.tipo).eq("lead_id", a.lead_id ?? null)
      .gte("created_at", `${hoje}T00:00:00Z`);
    if ((count ?? 0) === 0) {
      const { error } = await supabase.from("crm_alertas").insert(a);
      if (!error) criados++;
    }
  }
  return { verificados: alertas.length, criados };
}

export const gerarAlertas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireSuperAdmin(context.supabase, context.userId);
    return await gerarAlertasInternal(context.supabase);
  });

export const listarAlertas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    apenas_nao_lidos: z.boolean().default(false),
    limite: z.number().default(50),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.supabase, context.userId);
    let q = context.supabase.from("crm_alertas").select("*").order("created_at", { ascending: false }).limit(data.limite);
    if (data.apenas_nao_lidos) q = q.eq("lido", false);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows;
  });

export const marcarAlertaLido = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid().optional(), todos: z.boolean().default(false) }).parse(d))
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.supabase, context.userId);
    let q = context.supabase.from("crm_alertas").update({ lido: true, lido_em: new Date().toISOString() });
    q = data.todos ? q.eq("lido", false) : q.eq("id", data.id!);
    const { error } = await q;
    if (error) throw error;
    return { ok: true };
  });

export { gerarAlertasInternal };

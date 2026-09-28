import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Fase 6 — Scoring, Copiloto e Análise de Mensagem.
 * Todas as chamadas de IA vão pelo Lovable Gateway (Gemini free) por padrão.
 */

type Msg = { role: "system" | "user" | "assistant"; content: string };

async function callAI(messages: Msg[], model = "google/gemini-2.5-flash") {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages }),
  });
  if (!resp.ok) {
    if (resp.status === 429) throw new Error("Limite de IA atingido. Tente em alguns segundos.");
    if (resp.status === 402) throw new Error("Créditos de IA insuficientes.");
    throw new Error(`IA ${resp.status}: ${await resp.text()}`);
  }
  const j = await resp.json() as { choices: Array<{ message: { content: string } }> };
  return j.choices[0]?.message?.content ?? "";
}

function extractJson<T = any>(txt: string): T | null {
  const clean = txt.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(clean) as T; } catch {}
  const m = txt.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]) as T; } catch {} }
  return null;
}

async function requireSuperAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_super_admin", { _user_id: userId });
  if (!data) throw new Error("Acesso negado");
}

/* ---------- LEAD SCORING ---------- */

export const iaScoreLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ lead_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.supabase, context.userId);
    const { data: lead } = await context.supabase.from("manager_leads").select("*").eq("id", data.lead_id).maybeSingle();
    if (!lead) throw new Error("Lead não encontrado");
    const { data: msgs } = await context.supabase
      .from("crm_mensagens").select("direcao, canal, conteudo, created_at")
      .eq("lead_id", data.lead_id).order("created_at", { ascending: false }).limit(20);

    const prompt = `Você é analista comercial B2B da AMT Sistemas (ERPs para restaurantes/comércio).
Avalie o lead abaixo e retorne SOMENTE JSON válido no formato:
{"score": 0-100, "motivo": "explicação curta em PT-BR (máx 240 chars)", "categoria": "frio|morno|quente|super_quente"}

Critérios de score:
- Empresa preenchida com nome de negócio real: +15
- Email e telefone válidos: +10 cada
- Origem "google_maps"/"scraper": +5, "site"/"indicação": +20
- Interações recentes (mensagens): +15 se respondeu, +25 se demonstrou interesse
- Segmento aderente (restaurante, bar, comércio): +15
- Sem contato há >7 dias: -10

Lead: ${JSON.stringify(lead)}
Últimas ${msgs?.length ?? 0} mensagens: ${JSON.stringify(msgs ?? [])}`;

    const raw = await callAI([
      { role: "system", content: "Você retorna SEMPRE JSON válido, sem texto adicional." },
      { role: "user", content: prompt },
    ]);
    const parsed = extractJson<{ score: number; motivo: string; categoria: string }>(raw);
    if (!parsed) throw new Error("IA retornou formato inválido");

    const score = Math.max(0, Math.min(100, Math.round(parsed.score)));
    await context.supabase.from("manager_leads").update({
      score, score_motivo: parsed.motivo, score_atualizado_em: new Date().toISOString(),
    }).eq("id", data.lead_id);

    return { score, motivo: parsed.motivo, categoria: parsed.categoria };
  });

/* ---------- COPILOTO DE VENDAS ---------- */

export const iaCopiloto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ lead_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.supabase, context.userId);
    const { data: lead } = await context.supabase.from("manager_leads").select("*").eq("id", data.lead_id).maybeSingle();
    if (!lead) throw new Error("Lead não encontrado");
    const { data: msgs } = await context.supabase
      .from("crm_mensagens").select("direcao, canal, conteudo, created_at, sentimento, intencao")
      .eq("lead_id", data.lead_id).order("created_at", { ascending: false }).limit(30);
    const { data: props } = await context.supabase
      .from("crm_propostas").select("titulo, status, valor_mensal, valor_setup, created_at")
      .eq("lead_id", data.lead_id);

    const prompt = `Você é copiloto de vendas da AMT Sistemas. Analise o lead e gere um briefing acionável.
Retorne SOMENTE JSON válido:
{
  "resumo": "3-5 linhas sobre quem é o lead e onde está no funil",
  "proxima_acao": "ação concreta em 1 frase",
  "quando": "quando executar (ex: hoje, amanhã 14h)",
  "objecoes_provaveis": ["obj1", "obj2"],
  "rebatidas": ["resposta para obj1", "resposta para obj2"],
  "sistema_recomendado": "qual produto AMT faz sentido",
  "mensagem_pronta": {
    "canal": "whatsapp|email",
    "assunto": "só se email",
    "texto": "mensagem pronta para copiar/enviar, curta, PT-BR"
  }
}

LEAD: ${JSON.stringify(lead)}
HISTÓRICO: ${JSON.stringify(msgs ?? [])}
PROPOSTAS: ${JSON.stringify(props ?? [])}`;

    const raw = await callAI([
      { role: "system", content: "Você é SDR/AE B2B brasileiro. Direto, consultivo. Retorne SEMPRE JSON válido." },
      { role: "user", content: prompt },
    ]);
    const parsed = extractJson(raw);
    if (!parsed) return { raw };
    return { briefing: parsed };
  });

/* ---------- GERAR MENSAGEM PERSONALIZADA E ENFILEIRAR ---------- */

export const iaEnfileirarMensagem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    lead_id: z.string().uuid(),
    canal: z.enum(["whatsapp", "email"]),
    conteudo: z.string().min(3),
    assunto: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.supabase, context.userId);
    const { data: lead } = await context.supabase.from("manager_leads")
      .select("id, email, telefone").eq("id", data.lead_id).maybeSingle();
    if (!lead) throw new Error("Lead não encontrado");
    const destinatario = data.canal === "email" ? lead.email : lead.telefone;
    if (!destinatario) throw new Error(`Lead sem ${data.canal === "email" ? "email" : "telefone"}`);
    const { data: msg, error } = await context.supabase.from("crm_mensagens").insert({
      canal: data.canal, direcao: "saida", conteudo: data.conteudo,
      assunto: data.assunto ?? null, lead_id: data.lead_id,
      destinatario, status: "pendente", criado_por: context.userId,
    }).select("id").single();
    if (error) throw error;
    return { mensagem_id: msg.id };
  });

/* ---------- ANÁLISE DE UMA MENSAGEM ---------- */

export const iaAnalisarMensagem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ mensagem_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.supabase, context.userId);
    return await analisarMensagemInternal(context.supabase, data.mensagem_id);
  });

async function analisarMensagemInternal(supabase: any, mensagem_id: string) {
  const { data: m } = await supabase.from("crm_mensagens")
    .select("id, conteudo, canal, direcao").eq("id", mensagem_id).maybeSingle();
  if (!m || m.direcao !== "entrada") return { skipped: true };

  const raw = await callAI([
    { role: "system", content: "Você analisa mensagens de leads B2B em PT-BR. Retorne SEMPRE JSON válido." },
    { role: "user", content: `Analise a mensagem e retorne JSON:
{"sentimento": "positivo|neutro|negativo",
 "intencao": "duvida|objecao|interesse_compra|cancelamento|elogio|reclamacao|agendamento|outro",
 "urgencia": "baixa|media|alta",
 "resumo": "até 120 chars"}

Mensagem (${m.canal}): "${m.conteudo}"` },
  ], "google/gemini-2.5-flash-lite");

  const parsed = extractJson<{ sentimento: string; intencao: string; urgencia: string; resumo: string }>(raw);
  if (!parsed) return { skipped: true, raw };

  await supabase.from("crm_mensagens").update({
    sentimento: parsed.sentimento, intencao: parsed.intencao,
    urgencia: parsed.urgencia, analise_ia: parsed,
  }).eq("id", mensagem_id);
  return parsed;
}

export { analisarMensagemInternal };

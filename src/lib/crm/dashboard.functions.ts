import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireSuperAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_super_admin", { _user_id: userId });
  if (!data) throw new Error("Acesso negado");
}

async function callAIQuick(prompt: string) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Você é analista comercial. Responda em PT-BR, máximo 4 frases, tom executivo e acionável." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!resp.ok) return null;
    const j = await resp.json() as any;
    return j.choices?.[0]?.message?.content ?? null;
  } catch { return null; }
}

export const dashboardIA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireSuperAdmin(context.supabase, context.userId);
    const supabase = context.supabase;
    const agora = new Date();
    const hoje = new Date(agora); hoje.setHours(0, 0, 0, 0);
    const semana = new Date(agora); semana.setDate(semana.getDate() - 7);
    const mes = new Date(agora); mes.setDate(mes.getDate() - 30);

    const [leadsHoje, leadsSemana, leadsMes, clientes, oport, transacoes, agenda, alertasNaoLidos, topLeads, funilLeads] = await Promise.all([
      supabase.from("manager_leads").select("id", { count: "exact", head: true }).gte("created_at", hoje.toISOString()),
      supabase.from("manager_leads").select("id", { count: "exact", head: true }).gte("created_at", semana.toISOString()),
      supabase.from("manager_leads").select("id", { count: "exact", head: true }).gte("created_at", mes.toISOString()),
      supabase.from("manager_clientes").select("id", { count: "exact", head: true }),
      supabase.from("manager_oportunidades").select("valor, probabilidade, estagio"),
      supabase.from("manager_transacoes").select("valor, tipo, data").gte("data", mes.toISOString().slice(0, 10)),
      supabase.from("crm_agenda").select("id, titulo, inicio").gte("inicio", agora.toISOString()).order("inicio").limit(5),
      supabase.from("crm_alertas").select("id", { count: "exact", head: true }).eq("lido", false),
      supabase.from("manager_leads").select("id, empresa, nome, score, score_motivo, status").not("score", "is", null).order("score", { ascending: false }).limit(5),
      supabase.from("manager_leads").select("status"),
    ]);

    const oportList = (oport.data ?? []) as Array<{ valor: number; probabilidade: number; estagio: string }>;
    const abertas = oportList.filter((o) => !["ganha", "perdida"].includes(o.estagio));
    const ganhas = oportList.filter((o) => o.estagio === "ganha");
    const receitaMes = (transacoes.data ?? []).filter((t: any) => t.tipo === "receita").reduce((s: number, t: any) => s + Number(t.valor), 0);

    // Funil por status de lead
    const funil: Record<string, number> = {};
    for (const l of (funilLeads.data ?? []) as Array<{ status: string }>) {
      funil[l.status ?? "novo"] = (funil[l.status ?? "novo"] ?? 0) + 1;
    }

    const kpis = {
      leadsHoje: leadsHoje.count ?? 0,
      leadsSemana: leadsSemana.count ?? 0,
      leadsMes: leadsMes.count ?? 0,
      clientes: clientes.count ?? 0,
      pipelineAberto: abertas.reduce((s, o) => s + Number(o.valor), 0),
      pipelinePonderado: abertas.reduce((s, o) => s + Number(o.valor) * o.probabilidade / 100, 0),
      pipelineGanho: ganhas.reduce((s, o) => s + Number(o.valor), 0),
      taxaConversao: oportList.length > 0 ? Math.round((ganhas.length / oportList.length) * 100) : 0,
      receitaMes,
      alertasNaoLidos: alertasNaoLidos.count ?? 0,
    };

    const proximos = (agenda.data ?? []) as any[];
    const top = (topLeads.data ?? []) as any[];

    // Resumo do dia via IA (best-effort — não bloqueia dashboard)
    const resumoIA = await callAIQuick(
      `Resuma o momento comercial: ${kpis.leadsHoje} leads hoje, ${kpis.leadsSemana} na semana, pipeline aberto de R$ ${kpis.pipelineAberto.toFixed(0)}, ${kpis.alertasNaoLidos} alertas pendentes, taxa de conversão ${kpis.taxaConversao}%. Diga em 2-3 frases o que priorizar hoje.`
    );

    return { kpis, funil, proximos, topLeads: top, resumoIA };
  });

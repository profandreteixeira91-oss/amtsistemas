import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { chatComFallback } from "./ai-service.functions";

/**
 * Motor de workflows visuais.
 * Nó = { id, type, data:{...} }. Tipos: gatilho | condicao | acao.
 * Aresta = { id, source, target, sourceHandle?: "true"|"false"|"out" }
 */

type Node = { id: string; type: string; data: any };
type Edge = { id: string; source: string; target: string; sourceHandle?: string };
type Passo = { node_id: string; tipo: string; ok: boolean; detalhe?: string; ts: string };

async function requireAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_super_admin", { _user_id: userId });
  if (!data) throw new Error("Acesso negado");
}

function fillTemplate(tpl: string, ctx: any): string {
  if (!tpl) return "";
  return String(tpl).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    const v = path.split(".").reduce((a: any, k: string) => (a ? a[k] : undefined), ctx);
    return v == null ? "" : String(v);
  });
}

function compare(a: any, op: string, b: any): boolean {
  const na = Number(a), nb = Number(b);
  const numeric = !isNaN(na) && !isNaN(nb);
  switch (op) {
    case "=": return String(a) === String(b);
    case "!=": return String(a) !== String(b);
    case ">": return numeric && na > nb;
    case ">=": return numeric && na >= nb;
    case "<": return numeric && na < nb;
    case "<=": return numeric && na <= nb;
    case "contem": return String(a ?? "").toLowerCase().includes(String(b ?? "").toLowerCase());
    case "vazio": return a == null || a === "";
    case "preenchido": return a != null && a !== "";
    default: return false;
  }
}

async function executarAcao(supabase: any, node: Node, ctx: any): Promise<string> {
  const cfg = node.data ?? {};
  switch (node.data?.acao) {
    case "criar_alerta": {
      await supabase.from("crm_alertas").insert({
        tipo: cfg.tipo ?? "workflow",
        titulo: fillTemplate(cfg.titulo ?? "Alerta workflow", ctx),
        mensagem: fillTemplate(cfg.mensagem ?? "", ctx),
        severidade: cfg.severidade ?? "info",
        lead_id: ctx.lead?.id ?? null,
      });
      return "alerta criado";
    }
    case "criar_tarefa": {
      await supabase.from("crm_agenda").insert({
        titulo: fillTemplate(cfg.titulo ?? "Tarefa workflow", ctx),
        descricao: fillTemplate(cfg.descricao ?? "", ctx),
        tipo: cfg.tipo ?? "tarefa",
        lead_id: ctx.lead?.id ?? null,
        data_agendada: cfg.data ?? new Date(Date.now() + 24 * 3600e3).toISOString(),
        status: "pendente",
      });
      return "tarefa criada";
    }
    case "enfileirar_mensagem": {
      await supabase.from("crm_mensagens").insert({
        canal: cfg.canal ?? "whatsapp",
        direcao: "saida",
        destino: fillTemplate(cfg.destino ?? "{{lead.telefone}}", ctx),
        conteudo: fillTemplate(cfg.conteudo ?? "", ctx),
        status: "pendente",
        lead_id: ctx.lead?.id ?? null,
        agendada_para: cfg.agendar_min
          ? new Date(Date.now() + Number(cfg.agendar_min) * 60000).toISOString()
          : null,
      });
      return `mensagem ${cfg.canal ?? "whatsapp"} enfileirada`;
    }
    case "atualizar_lead": {
      if (!ctx.lead?.id) return "sem lead no contexto";
      const patch: any = {};
      for (const [k, v] of Object.entries(cfg.campos ?? {})) {
        patch[k] = typeof v === "string" ? fillTemplate(v, ctx) : v;
      }
      await supabase.from("manager_leads").update(patch).eq("id", ctx.lead.id);
      return `lead atualizado (${Object.keys(patch).join(",")})`;
    }
    case "chamar_ia": {
      const prompt = fillTemplate(cfg.prompt ?? "Analise: {{lead.nome}}", ctx);
      const r = await chatComFallback(supabase, [
        { role: "system", content: cfg.sistema ?? "Assistente de CRM." },
        { role: "user", content: prompt },
      ]);
      ctx.ia = r.content;
      return `IA (${r.provider_usado}): ${r.content.slice(0, 100)}`;
    }
    case "webhook": {
      const url = fillTemplate(cfg.url ?? "", ctx);
      if (!url) return "sem url";
      const body = fillTemplate(cfg.body ?? JSON.stringify(ctx), ctx);
      const r = await fetch(url, {
        method: cfg.metodo ?? "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      return `webhook ${r.status}`;
    }
    case "aguardar": {
      // no motor síncrono só registramos; um scheduler real usaria filas
      return `aguardar ${cfg.minutos ?? 0} min (registrado)`;
    }
    default:
      return `ação desconhecida: ${cfg.acao}`;
  }
}

async function executarNode(supabase: any, node: Node, edges: Edge[], nodes: Node[], ctx: any, log: Passo[]): Promise<void> {
  const now = () => new Date().toISOString();
  try {
    if (node.type === "gatilho") {
      log.push({ node_id: node.id, tipo: "gatilho", ok: true, detalhe: "iniciado", ts: now() });
      const outs = edges.filter((e) => e.source === node.id);
      for (const e of outs) {
        const alvo = nodes.find((n) => n.id === e.target);
        if (alvo) await executarNode(supabase, alvo, edges, nodes, ctx, log);
      }
    } else if (node.type === "condicao") {
      const { campo, operador, valor } = node.data ?? {};
      const atual = campo?.split(".").reduce((a: any, k: string) => (a ? a[k] : undefined), ctx);
      const ok = compare(atual, operador, valor);
      log.push({ node_id: node.id, tipo: "condicao", ok: true, detalhe: `${campo} ${operador} ${valor} → ${ok}`, ts: now() });
      const handle = ok ? "true" : "false";
      const outs = edges.filter((e) => e.source === node.id && (e.sourceHandle ?? "true") === handle);
      for (const e of outs) {
        const alvo = nodes.find((n) => n.id === e.target);
        if (alvo) await executarNode(supabase, alvo, edges, nodes, ctx, log);
      }
    } else if (node.type === "acao") {
      const det = await executarAcao(supabase, node, ctx);
      log.push({ node_id: node.id, tipo: "acao", ok: true, detalhe: det, ts: now() });
      const outs = edges.filter((e) => e.source === node.id);
      for (const e of outs) {
        const alvo = nodes.find((n) => n.id === e.target);
        if (alvo) await executarNode(supabase, alvo, edges, nodes, ctx, log);
      }
    }
  } catch (e: any) {
    log.push({ node_id: node.id, tipo: node.type, ok: false, detalhe: String(e?.message ?? e).slice(0, 300), ts: now() });
    throw e;
  }
}

export async function runWorkflow(supabase: any, workflow: any, contexto: any, origem = "manual") {
  const iniciou = Date.now();
  const log: Passo[] = [];
  const { data: exec } = await supabase
    .from("crm_workflow_execucoes")
    .insert({ workflow_id: workflow.id, status: "em_execucao", origem, contexto })
    .select("id").single();

  const def = workflow.definicao ?? { nodes: [], edges: [] };
  const nodes: Node[] = def.nodes ?? [];
  const edges: Edge[] = def.edges ?? [];
  const gatilhos = nodes.filter((n) => n.type === "gatilho");

  let status = "ok";
  let erro: string | null = null;
  try {
    for (const g of gatilhos) await executarNode(supabase, g, edges, nodes, contexto, log);
  } catch (e: any) {
    status = "erro";
    erro = String(e?.message ?? e).slice(0, 500);
  }

  const dur = Date.now() - iniciou;
  await supabase.from("crm_workflow_execucoes").update({
    status,
    log_passos: log,
    erro_mensagem: erro,
    finalizado_em: new Date().toISOString(),
    duracao_ms: dur,
  }).eq("id", exec.id);

  await supabase.rpc("noop").catch(() => {}); // no-op
  await supabase.from("crm_workflows").update({
    ultima_execucao: new Date().toISOString(),
    execucoes_total: (workflow.execucoes_total ?? 0) + 1,
    execucoes_ok: (workflow.execucoes_ok ?? 0) + (status === "ok" ? 1 : 0),
    execucoes_erro: (workflow.execucoes_erro ?? 0) + (status === "erro" ? 1 : 0),
  }).eq("id", workflow.id);

  return { exec_id: exec.id, status, log_passos: log, duracao_ms: dur, erro };
}

/* ================= Server functions ================= */

export const salvarWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    nome: z.string().min(1),
    descricao: z.string().optional().nullable(),
    ativo: z.boolean().default(true),
    gatilho_tipo: z.string(),
    gatilho_config: z.record(z.any()).default({}),
    definicao: z.object({ nodes: z.array(z.any()), edges: z.array(z.any()) }),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const payload = {
      nome: data.nome,
      descricao: data.descricao ?? null,
      ativo: data.ativo,
      gatilho_tipo: data.gatilho_tipo,
      gatilho_config: data.gatilho_config,
      definicao: data.definicao,
    };
    if (data.id) {
      const { error } = await (context.supabase as any).from("crm_workflows").update(payload).eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: novo, error } = await (context.supabase as any)
      .from("crm_workflows").insert({ ...payload, created_by: context.userId }).select("id").single();
    if (error) throw error;
    return { ok: true, id: (novo as any)?.id };
  });

export const removerWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { error } = await (context.supabase as any).from("crm_workflows").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const executarWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    lead_id: z.string().uuid().optional(),
    contexto_extra: z.record(z.any()).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { data: wf, error } = await (context.supabase as any)
      .from("crm_workflows").select("*").eq("id", data.id).maybeSingle();
    if (error || !wf) throw new Error("Workflow não encontrado");

    let ctx: any = { ...(data.contexto_extra ?? {}) };
    if (data.lead_id) {
      const { data: lead } = await (context.supabase as any)
        .from("manager_leads").select("*").eq("id", data.lead_id).maybeSingle();
      if (lead) ctx.lead = lead;
    }
    return runWorkflow(context.supabase, wf, ctx, "manual");
  });

export const listarExecucoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ workflow_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { data: rows } = await (context.supabase as any)
      .from("crm_workflow_execucoes")
      .select("*").eq("workflow_id", data.workflow_id)
      .order("iniciado_em", { ascending: false }).limit(50);
    return (rows ?? []) as any[];
  });

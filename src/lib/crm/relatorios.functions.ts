import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Motor de relatórios/BI dinâmico.
 * Fontes são whitelisted; usuário monta filtros/colunas/agrupamento na UI.
 */

async function requireAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_super_admin", { _user_id: userId });
  if (!data) throw new Error("Acesso negado");
}

export type FonteDef = {
  key: string;
  label: string;
  tabela: string;
  colunas: Array<{ key: string; label: string; tipo: "text" | "number" | "date" | "boolean" }>;
};

export const FONTES: FonteDef[] = [
  {
    key: "leads",
    label: "Leads",
    tabela: "manager_leads",
    colunas: [
      { key: "id", label: "ID", tipo: "text" },
      { key: "nome", label: "Nome", tipo: "text" },
      { key: "empresa", label: "Empresa", tipo: "text" },
      { key: "email", label: "Email", tipo: "text" },
      { key: "telefone", label: "Telefone", tipo: "text" },
      { key: "cidade", label: "Cidade", tipo: "text" },
      { key: "estado", label: "UF", tipo: "text" },
      { key: "categoria", label: "Categoria", tipo: "text" },
      { key: "estagio", label: "Estágio", tipo: "text" },
      { key: "temperatura", label: "Temperatura", tipo: "text" },
      { key: "score", label: "Score", tipo: "number" },
      { key: "valor_estimado", label: "Valor estimado", tipo: "number" },
      { key: "origem", label: "Origem", tipo: "text" },
      { key: "criado_em", label: "Criado em", tipo: "date" },
    ],
  },
  {
    key: "propostas",
    label: "Propostas",
    tabela: "crm_propostas",
    colunas: [
      { key: "id", label: "ID", tipo: "text" },
      { key: "numero", label: "Número", tipo: "text" },
      { key: "titulo", label: "Título", tipo: "text" },
      { key: "cliente_nome", label: "Cliente", tipo: "text" },
      { key: "valor_total", label: "Valor", tipo: "number" },
      { key: "status", label: "Status", tipo: "text" },
      { key: "validade", label: "Validade", tipo: "date" },
      { key: "created_at", label: "Criada em", tipo: "date" },
    ],
  },
  {
    key: "contratos",
    label: "Contratos",
    tabela: "crm_contratos",
    colunas: [
      { key: "id", label: "ID", tipo: "text" },
      { key: "titulo", label: "Título", tipo: "text" },
      { key: "cliente_nome", label: "Cliente", tipo: "text" },
      { key: "valor_mensal", label: "Valor mensal", tipo: "number" },
      { key: "status", label: "Status", tipo: "text" },
      { key: "inicio", label: "Início", tipo: "date" },
      { key: "fim", label: "Fim", tipo: "date" },
    ],
  },
  {
    key: "mensagens",
    label: "Mensagens",
    tabela: "crm_mensagens",
    colunas: [
      { key: "id", label: "ID", tipo: "text" },
      { key: "canal", label: "Canal", tipo: "text" },
      { key: "direcao", label: "Direção", tipo: "text" },
      { key: "status", label: "Status", tipo: "text" },
      { key: "sentimento", label: "Sentimento", tipo: "text" },
      { key: "urgencia", label: "Urgência", tipo: "text" },
      { key: "created_at", label: "Data", tipo: "date" },
    ],
  },
  {
    key: "financeiro",
    label: "Financeiro (transações)",
    tabela: "manager_transacoes",
    colunas: [
      { key: "id", label: "ID", tipo: "text" },
      { key: "tipo", label: "Tipo", tipo: "text" },
      { key: "categoria", label: "Categoria", tipo: "text" },
      { key: "descricao", label: "Descrição", tipo: "text" },
      { key: "valor", label: "Valor", tipo: "number" },
      { key: "data", label: "Data", tipo: "date" },
      { key: "forma_pagamento", label: "Forma pagto", tipo: "text" },
    ],
  },
  {
    key: "atividades",
    label: "Atividades",
    tabela: "manager_atividades",
    colunas: [
      { key: "id", label: "ID", tipo: "text" },
      { key: "tipo", label: "Tipo", tipo: "text" },
      { key: "descricao", label: "Descrição", tipo: "text" },
      { key: "status", label: "Status", tipo: "text" },
      { key: "created_at", label: "Data", tipo: "date" },
    ],
  },
];

function findFonte(key: string): FonteDef {
  const f = FONTES.find((x) => x.key === key);
  if (!f) throw new Error(`Fonte inválida: ${key}`);
  return f;
}

function isColunaValida(fonte: FonteDef, col: string) {
  return fonte.colunas.some((c) => c.key === col);
}

async function executarQuery(supabase: any, config: {
  fonte: string;
  colunas: string[];
  filtros: Array<{ campo: string; operador: string; valor?: any }>;
  ordenacao: Array<{ campo: string; direcao: "asc" | "desc" }>;
  limite: number;
}) {
  const fonte = findFonte(config.fonte);
  const cols = (config.colunas ?? []).filter((c) => isColunaValida(fonte, c));
  const select = cols.length ? cols.join(",") : "*";

  let q = supabase.from(fonte.tabela).select(select);

  for (const f of config.filtros ?? []) {
    if (!isColunaValida(fonte, f.campo)) continue;
    const v = f.valor;
    switch (f.operador) {
      case "=": q = q.eq(f.campo, v); break;
      case "!=": q = q.neq(f.campo, v); break;
      case ">": q = q.gt(f.campo, v); break;
      case ">=": q = q.gte(f.campo, v); break;
      case "<": q = q.lt(f.campo, v); break;
      case "<=": q = q.lte(f.campo, v); break;
      case "contem": q = q.ilike(f.campo, `%${v}%`); break;
      case "in": q = q.in(f.campo, Array.isArray(v) ? v : String(v).split(",").map((s) => s.trim())); break;
      case "vazio": q = q.is(f.campo, null); break;
      case "preenchido": q = q.not(f.campo, "is", null); break;
    }
  }
  for (const o of config.ordenacao ?? []) {
    if (isColunaValida(fonte, o.campo)) q = q.order(o.campo, { ascending: o.direcao !== "desc" });
  }
  q = q.limit(Math.min(Math.max(Number(config.limite ?? 500), 1), 5000));

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as any[];
}

function agrupar(rows: any[], groupBy: string, aggCampo: string | null, aggTipo: string) {
  const map = new Map<string, { grupo: string; valor: number; contagem: number }>();
  for (const r of rows) {
    const k = String(r[groupBy] ?? "—");
    const cur = map.get(k) ?? { grupo: k, valor: 0, contagem: 0 };
    cur.contagem += 1;
    if (aggCampo) {
      const n = Number(r[aggCampo]);
      if (!isNaN(n)) cur.valor += n;
    }
    map.set(k, cur);
  }
  const arr = Array.from(map.values()).map((g) => ({
    grupo: g.grupo,
    valor: aggTipo === "avg" ? (g.contagem ? g.valor / g.contagem : 0) : aggTipo === "count" ? g.contagem : g.valor,
  }));
  arr.sort((a, b) => b.valor - a.valor);
  return arr;
}

export const listarFontes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    return FONTES;
  });

export const executarRelatorio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    fonte: z.string(),
    colunas: z.array(z.string()).default([]),
    filtros: z.array(z.object({ campo: z.string(), operador: z.string(), valor: z.any().optional() })).default([]),
    ordenacao: z.array(z.object({ campo: z.string(), direcao: z.enum(["asc", "desc"]) })).default([]),
    limite: z.number().default(500),
    agrupamento: z.object({
      campo: z.string().optional(),
      agregar_campo: z.string().optional().nullable(),
      agregar_tipo: z.enum(["sum", "avg", "count"]).default("count"),
    }).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const linhas = await executarQuery(context.supabase, data);
    let agrupado: Array<{ grupo: string; valor: number }> | null = null;
    if (data.agrupamento?.campo) {
      agrupado = agrupar(
        linhas,
        data.agrupamento.campo,
        data.agrupamento.agregar_campo ?? null,
        data.agrupamento.agregar_tipo,
      );
    }
    return { linhas, agrupado, total: linhas.length };
  });

export const salvarRelatorio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    nome: z.string().min(1),
    descricao: z.string().optional().nullable(),
    fonte: z.string(),
    colunas: z.array(z.any()).default([]),
    filtros: z.array(z.any()).default([]),
    agrupamento: z.record(z.any()).default({}),
    ordenacao: z.array(z.any()).default([]),
    limite: z.number().default(500),
    chart_tipo: z.string().default("tabela"),
    chart_config: z.record(z.any()).default({}),
    favorito: z.boolean().default(false),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const payload = { ...data } as any;
    delete payload.id;
    if (data.id) {
      const { error } = await (context.supabase as any).from("crm_relatorios").update(payload).eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: novo, error } = await (context.supabase as any)
      .from("crm_relatorios").insert({ ...payload, created_by: context.userId }).select("id").single();
    if (error) throw error;
    return { ok: true, id: (novo as any)?.id };
  });

export const removerRelatorio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { error } = await (context.supabase as any).from("crm_relatorios").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const agendarRelatorio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    relatorio_id: z.string().uuid(),
    frequencia: z.enum(["diario", "semanal", "mensal"]),
    hora: z.string().default("08:00"),
    dia_semana: z.number().optional().nullable(),
    dia_mes: z.number().optional().nullable(),
    destinatarios: z.array(z.string()).default([]),
    formato: z.enum(["csv", "resumo"]).default("csv"),
    ativo: z.boolean().default(true),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const payload = { ...data } as any;
    delete payload.id;
    if (data.id) {
      const { error } = await (context.supabase as any).from("crm_relatorios_agendamentos").update(payload).eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: novo, error } = await (context.supabase as any)
      .from("crm_relatorios_agendamentos").insert(payload).select("id").single();
    if (error) throw error;
    return { ok: true, id: (novo as any)?.id };
  });

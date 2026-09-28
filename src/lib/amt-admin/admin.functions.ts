import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertSuper(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_super_admin", { _user_id: userId });
  if (!data) throw new Error("Acesso negado");
}

async function audit(
  supabase: any,
  userId: string,
  acao: string,
  entidade: string,
  entidade_id: string | null,
  antes: unknown,
  depois: unknown,
) {
  await supabase.from("amt_admin_auditoria" as any).insert({
    user_id: userId,
    acao,
    entidade,
    entidade_id,
    antes: antes ?? null,
    depois: depois ?? null,
  });
}

/* ---------------- Dashboard ---------------- */
export const amtDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuper(context.supabase, context.userId);
    const supabase = context.supabase as any;

    const desde30 = new Date(Date.now() - 30 * 86400000);
    const desde90 = new Date(Date.now() - 90 * 86400000);

    const [
      sistemas, clientes, assinaturas, cobrancasPagas, cobrancasPendentes,
      ultimosClientes, ultimosPagamentos, ultimosCancelamentos, leads30,
    ] = await Promise.all([
      supabase.from("manager_sistemas").select("id", { count: "exact", head: true }),
      supabase.from("manager_clientes").select("id, status", { count: "exact" }),
      supabase.from("manager_assinaturas").select("id, valor, ciclo, status, plano, iniciado_em, cancelado_em"),
      supabase.from("manager_cobrancas").select("valor, pago_em").eq("status", "paga").gte("pago_em", desde30.toISOString()),
      supabase.from("manager_cobrancas").select("id", { count: "exact", head: true }).eq("status", "pendente"),
      supabase.from("manager_clientes").select("id, nome, empresa, created_at").order("created_at", { ascending: false }).limit(8),
      supabase.from("manager_cobrancas").select("id, valor, pago_em, cliente_id, descricao").eq("status", "paga").order("pago_em", { ascending: false }).limit(8),
      supabase.from("manager_assinaturas").select("id, plano, valor, cancelado_em, cliente_id").not("cancelado_em", "is", null).order("cancelado_em", { ascending: false }).limit(8),
      supabase.from("manager_leads").select("created_at").gte("created_at", desde30.toISOString()),
    ]);

    const ass = (assinaturas.data ?? []) as Array<any>;
    const totalAtivas = ass.filter((a) => a.status === "ativa").length;
    const totalTrial = ass.filter((a) => a.status === "trial").length;
    const totalSuspensas = ass.filter((a) => a.status === "suspensa").length;
    const totalInad = ass.filter((a) => a.status === "inadimplente").length;
    const totalCanc = ass.filter((a) => a.status === "cancelada").length;
    const mrr = ass
      .filter((a) => a.status === "ativa")
      .reduce((s, a) => {
        const v = Number(a.valor ?? 0);
        return s + (a.ciclo === "anual" ? v / 12 : v);
      }, 0);
    const arr = mrr * 12;
    const ticket = totalAtivas > 0 ? mrr / totalAtivas : 0;

    const trial90 = ass.filter((a) => a.iniciado_em && new Date(a.iniciado_em) > desde90);
    const conversao = trial90.length > 0
      ? Math.round((trial90.filter((a) => a.status === "ativa").length / trial90.length) * 100)
      : 0;
    const churn = ass.length > 0 ? Math.round((totalCanc / ass.length) * 100) : 0;

    const receita30d = (cobrancasPagas.data ?? []).reduce((s: number, c: any) => s + Number(c.valor ?? 0), 0);

    // séries diárias últimos 30 dias
    const dias: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      dias.push(d.toISOString().slice(0, 10));
    }
    const receitaPorDia = new Map(dias.map((d) => [d, 0]));
    for (const c of (cobrancasPagas.data ?? []) as any[]) {
      const dia = String(c.pago_em ?? "").slice(0, 10);
      if (receitaPorDia.has(dia)) receitaPorDia.set(dia, (receitaPorDia.get(dia) ?? 0) + Number(c.valor ?? 0));
    }
    const leadsPorDia = new Map(dias.map((d) => [d, 0]));
    for (const l of (leads30.data ?? []) as any[]) {
      const dia = String(l.created_at ?? "").slice(0, 10);
      if (leadsPorDia.has(dia)) leadsPorDia.set(dia, (leadsPorDia.get(dia) ?? 0) + 1);
    }
    const serie = dias.map((d) => ({
      dia: d.slice(5),
      receita: Number((receitaPorDia.get(d) ?? 0).toFixed(2)),
      leads: leadsPorDia.get(d) ?? 0,
    }));

    // distribuição por status
    const statusChart = [
      { name: "Ativas", value: totalAtivas },
      { name: "Trial", value: totalTrial },
      { name: "Suspensas", value: totalSuspensas },
      { name: "Inadimplentes", value: totalInad },
      { name: "Canceladas", value: totalCanc },
    ];

    return {
      kpis: {
        sistemas: sistemas.count ?? 0,
        clientesTotal: clientes.count ?? 0,
        trial: totalTrial,
        ativos: totalAtivas,
        suspensos: totalSuspensas,
        inadimplentes: totalInad,
        cancelados: totalCanc,
        assinaturas: ass.length,
        mrr, arr, ticket, conversao, churn, receita30d,
        cobrancasPendentes: cobrancasPendentes.count ?? 0,
      },
      serie,
      statusChart,
      ultimosClientes: ultimosClientes.data ?? [],
      ultimosPagamentos: ultimosPagamentos.data ?? [],
      ultimosCancelamentos: ultimosCancelamentos.data ?? [],
    };
  });

/* ---------------- Sistemas ---------------- */
export const amtListarSistemas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuper(context.supabase, context.userId);
    const { data } = await (context.supabase as any)
      .from("manager_sistemas").select("*").order("nome");
    return data ?? [];
  });

export const amtSalvarSistema = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      nome: z.string().min(1),
      slug: z.string().min(1),
      descricao: z.string().nullable().optional(),
      status: z.string().default("ativo"),
      logo_url: z.string().nullable().optional(),
      dominio: z.string().nullable().optional(),
      checkout_url: z.string().nullable().optional(),
      versao: z.string().nullable().optional(),
      trial_dias: z.number().int().min(0).default(14),
      cores: z.record(z.any()).default({}),
      pitch_comercial: z.string().nullable().optional(),
      suporte_whatsapp: z.string().nullable().optional(),
      suporte_email: z.string().nullable().optional(),
      configuracoes: z.record(z.any()).default({}),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuper(context.supabase, context.userId);
    const supabase = context.supabase as any;
    const payload = { ...data, atualizado_em: new Date().toISOString() };
    if (data.id) {
      const { data: antes } = await supabase.from("manager_sistemas").select("*").eq("id", data.id).maybeSingle();
      const { error } = await supabase.from("manager_sistemas").update(payload).eq("id", data.id);
      if (error) throw error;
      await audit(supabase, context.userId, "update", "manager_sistemas", data.id, antes, payload);
      return { ok: true, id: data.id };
    }
    const { data: novo, error } = await supabase.from("manager_sistemas").insert(payload).select("id").single();
    if (error) throw error;
    await audit(supabase, context.userId, "insert", "manager_sistemas", novo.id, null, payload);
    return { ok: true, id: novo.id };
  });

/* ---------------- Planos ---------------- */
export const amtListarPlanos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuper(context.supabase, context.userId);
    const { data } = await (context.supabase as any)
      .from("manager_planos").select("*").order("preco_mensal");
    return data ?? [];
  });

export const amtSalvarPlano = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      sistema_id: z.string().uuid().nullable().optional(),
      nome: z.string().min(1),
      slug: z.string().min(1),
      descricao: z.string().nullable().optional(),
      preco_mensal: z.number().default(0),
      preco_anual: z.number().default(0),
      cor: z.string().nullable().optional(),
      badge: z.string().nullable().optional(),
      recomendado: z.boolean().default(false),
      texto_comercial: z.string().nullable().optional(),
      botao_destaque: z.string().nullable().optional(),
      limites: z.record(z.any()).default({}),
      recursos: z.array(z.string()).default([]),
      ativo: z.boolean().default(true),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuper(context.supabase, context.userId);
    const supabase = context.supabase as any;
    if (data.id) {
      const { data: antes } = await supabase.from("manager_planos").select("*").eq("id", data.id).maybeSingle();
      const { error } = await supabase.from("manager_planos").update(data).eq("id", data.id);
      if (error) throw error;
      await audit(supabase, context.userId, "update", "manager_planos", data.id, antes, data);
      return { ok: true, id: data.id };
    }
    const { data: novo, error } = await supabase.from("manager_planos").insert(data).select("id").single();
    if (error) throw error;
    await audit(supabase, context.userId, "insert", "manager_planos", novo.id, null, data);
    return { ok: true, id: novo.id };
  });

/* ---------------- Módulos ---------------- */
export const amtListarModulos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuper(context.supabase, context.userId);
    const supabase = context.supabase as any;
    const [modulos, planoModulos] = await Promise.all([
      supabase.from("amt_modulos").select("*").order("categoria").order("nome"),
      supabase.from("amt_plano_modulos").select("*"),
    ]);
    return { modulos: modulos.data ?? [], planoModulos: planoModulos.data ?? [] };
  });

export const amtSalvarModulo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      chave: z.string().min(1).regex(/^[a-z0-9_\-]+$/),
      nome: z.string().min(1),
      descricao: z.string().nullable().optional(),
      categoria: z.string().nullable().optional(),
      icone: z.string().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuper(context.supabase, context.userId);
    const supabase = context.supabase as any;
    if (data.id) {
      const { error } = await supabase.from("amt_modulos").update({ ...data, updated_at: new Date().toISOString() }).eq("id", data.id);
      if (error) throw error;
      await audit(supabase, context.userId, "update", "amt_modulos", data.id, null, data);
      return { ok: true, id: data.id };
    }
    const { data: novo, error } = await supabase.from("amt_modulos").insert(data).select("id").single();
    if (error) throw error;
    await audit(supabase, context.userId, "insert", "amt_modulos", novo.id, null, data);
    return { ok: true, id: novo.id };
  });

export const amtSetPlanoModulo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      plano_id: z.string().uuid(),
      modulo_id: z.string().uuid(),
      status: z.enum(["liberado", "bloqueado", "remover"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuper(context.supabase, context.userId);
    const supabase = context.supabase as any;
    if (data.status === "remover") {
      await supabase.from("amt_plano_modulos").delete().eq("plano_id", data.plano_id).eq("modulo_id", data.modulo_id);
    } else {
      await supabase.from("amt_plano_modulos").upsert({
        plano_id: data.plano_id,
        modulo_id: data.modulo_id,
        status: data.status,
        updated_at: new Date().toISOString(),
      });
    }
    await audit(supabase, context.userId, "modulo_plano", "amt_plano_modulos", `${data.plano_id}:${data.modulo_id}`, null, data);
    return { ok: true };
  });

/* ---------------- Overrides por assinatura ---------------- */
export const amtOverridesAssinatura = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ assinatura_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuper(context.supabase, context.userId);
    const { data: rows } = await (context.supabase as any)
      .from("amt_assinatura_modulos").select("*").eq("assinatura_id", data.assinatura_id);
    return rows ?? [];
  });

export const amtSetOverrideModulo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      assinatura_id: z.string().uuid(),
      modulo_id: z.string().uuid(),
      status: z.enum(["liberado", "bloqueado", "remover"]),
      observacao: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuper(context.supabase, context.userId);
    const supabase = context.supabase as any;
    if (data.status === "remover") {
      await supabase.from("amt_assinatura_modulos").delete()
        .eq("assinatura_id", data.assinatura_id).eq("modulo_id", data.modulo_id);
    } else {
      await supabase.from("amt_assinatura_modulos").upsert({
        assinatura_id: data.assinatura_id,
        modulo_id: data.modulo_id,
        status: data.status,
        observacao: data.observacao ?? null,
        updated_at: new Date().toISOString(),
      });
    }
    await audit(supabase, context.userId, "override_modulo", "amt_assinatura_modulos",
      `${data.assinatura_id}:${data.modulo_id}`, null, data);
    return { ok: true };
  });

/* ---------------- Clientes / Assinaturas ---------------- */
export const amtListarClientes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuper(context.supabase, context.userId);
    const supabase = context.supabase as any;
    const [clientes, assinaturas] = await Promise.all([
      supabase.from("manager_clientes").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("manager_assinaturas").select("*"),
    ]);
    const map = new Map<string, any>();
    for (const a of (assinaturas.data ?? [])) map.set(a.cliente_id, a);
    return (clientes.data ?? []).map((c: any) => ({ ...c, assinatura: map.get(c.id) ?? null }));
  });

export const amtSalvarAssinatura = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      plano: z.string().optional(),
      valor: z.number().optional(),
      desconto: z.number().optional(),
      ciclo: z.string().optional(),
      status: z.string().optional(),
      current_period_end: z.string().nullable().optional(),
      trial_ends_at: z.string().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuper(context.supabase, context.userId);
    const supabase = context.supabase as any;
    const { data: antes } = await supabase.from("manager_assinaturas").select("*").eq("id", data.id).maybeSingle();
    const { id, ...rest } = data;
    const { error } = await supabase.from("manager_assinaturas").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    await audit(supabase, context.userId, "update", "manager_assinaturas", id, antes, rest);
    await supabase.from("amt_asaas_fila").insert({
      tipo: "assinatura.update",
      payload: { assinatura_id: id, alteracoes: rest },
      assinatura_id: id,
      status: "pendente",
    });
    return { ok: true };
  });

/* ---------------- Auditoria / Segurança ---------------- */
export const amtAuditoria = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuper(context.supabase, context.userId);
    const { data } = await (context.supabase as any)
      .from("amt_admin_auditoria").select("*").order("criado_em", { ascending: false }).limit(200);
    return data ?? [];
  });

export const amtSeguranca = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuper(context.supabase, context.userId);
    const supabase = context.supabase as any;
    const [logs, tentativas] = await Promise.all([
      supabase.from("amt_admin_access_logs").select("*").order("criado_em", { ascending: false }).limit(100),
      supabase.from("amt_admin_login_attempts").select("*").order("criado_em", { ascending: false }).limit(100),
    ]);
    return { logs: logs.data ?? [], tentativas: tentativas.data ?? [] };
  });

export const amtRegistrarAcesso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ rota: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuper(context.supabase, context.userId);
    await (context.supabase as any).from("amt_admin_access_logs").insert({
      user_id: context.userId,
      rota: data.rota,
    });
    return { ok: true };
  });

/* ---------------- Asaas ---------------- */
export const amtAsaasFila = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuper(context.supabase, context.userId);
    const supabase = context.supabase as any;
    const [fila, logs] = await Promise.all([
      supabase.from("amt_asaas_fila").select("*").order("criado_em", { ascending: false }).limit(100),
      supabase.from("amt_asaas_logs").select("*").order("criado_em", { ascending: false }).limit(50),
    ]);
    return { fila: fila.data ?? [], logs: logs.data ?? [] };
  });

export const amtProcessarFilaAgora = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuper(context.supabase, context.userId);
    const { processarFilaAsaas } = await import("./asaas.server");
    return await processarFilaAsaas();
  });

export const amtReenfileirar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuper(context.supabase, context.userId);
    const { error } = await (context.supabase as any).from("amt_asaas_fila").update({
      status: "pendente", tentativas: 0, proximo_em: new Date().toISOString(), ultimo_erro: null,
    }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const finListarCategorias = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("crm_fin_categorias").select("*").order("nome");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const finCriarCategoria = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { nome: string; tipo: "receita" | "despesa"; cor?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("crm_fin_categorias").insert(data).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const finListarContas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("crm_fin_contas").select("*").order("nome");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const finCriarConta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { nome: string; tipo?: string; banco?: string; saldo_inicial?: number }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("crm_fin_contas")
      .insert({ ...data, saldo_atual: data.saldo_inicial ?? 0 })
      .select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const finListarLancamentos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d?: { tipo?: "receita" | "despesa"; status?: string; de?: string; ate?: string }) => d ?? {})
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("crm_fin_lancamentos").select("*").order("vencimento", { ascending: false }).limit(500);
    if (data.tipo) q = q.eq("tipo", data.tipo);
    if (data.status) q = q.eq("status", data.status);
    if (data.de) q = q.gte("vencimento", data.de);
    if (data.ate) q = q.lte("vencimento", data.ate);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const finCriarLancamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    tipo: "receita" | "despesa"; descricao: string; valor: number; vencimento: string;
    categoria_id?: string | null; conta_id?: string | null; fornecedor?: string;
    forma_pagamento?: string; documento?: string; observacoes?: string;
    status?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("crm_fin_lancamentos").insert(data).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const finBaixarLancamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; conta_id?: string; forma_pagamento?: string; pago_em?: string }) => d)
  .handler(async ({ data, context }) => {
    const pago = data.pago_em ?? new Date().toISOString().slice(0, 10);
    const { data: lanc, error: le } = await context.supabase.from("crm_fin_lancamentos").update({
      status: "pago", pago_em: pago,
      ...(data.conta_id ? { conta_id: data.conta_id } : {}),
      ...(data.forma_pagamento ? { forma_pagamento: data.forma_pagamento } : {}),
    }).eq("id", data.id).select("*").single();
    if (le) throw new Error(le.message);

    if (lanc.conta_id) {
      const delta = lanc.tipo === "receita" ? Number(lanc.valor) : -Number(lanc.valor);
      const { data: conta } = await context.supabase.from("crm_fin_contas").select("saldo_atual").eq("id", lanc.conta_id).maybeSingle();
      if (conta) {
        await context.supabase.from("crm_fin_contas").update({ saldo_atual: Number(conta.saldo_atual) + delta }).eq("id", lanc.conta_id);
      }
    }
    return lanc;
  });

export const finExcluirLancamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("crm_fin_lancamentos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const finDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const hoje = new Date().toISOString().slice(0, 10);
    const em30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const { data: lancs } = await context.supabase.from("crm_fin_lancamentos").select("*");
    const { data: contas } = await context.supabase.from("crm_fin_contas").select("*").eq("ativa", true);

    const arr = lancs ?? [];
    const receber = arr.filter((l) => l.tipo === "receita" && l.status === "pendente").reduce((a, b) => a + Number(b.valor), 0);
    const pagar = arr.filter((l) => l.tipo === "despesa" && l.status === "pendente").reduce((a, b) => a + Number(b.valor), 0);
    const atrasados = arr.filter((l) => l.status === "pendente" && l.vencimento < hoje);
    const proximos = arr.filter((l) => l.status === "pendente" && l.vencimento >= hoje && l.vencimento <= em30);
    const saldoTotal = (contas ?? []).reduce((a, b) => a + Number(b.saldo_atual), 0);

    // Fluxo caixa projetado 30 dias
    const projecao: { data: string; entrada: number; saida: number; saldo: number }[] = [];
    let saldoAcum = saldoTotal;
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const dia = arr.filter((l) => l.vencimento === iso && l.status === "pendente");
      const ent = dia.filter((l) => l.tipo === "receita").reduce((a, b) => a + Number(b.valor), 0);
      const sai = dia.filter((l) => l.tipo === "despesa").reduce((a, b) => a + Number(b.valor), 0);
      saldoAcum += ent - sai;
      projecao.push({ data: iso, entrada: ent, saida: sai, saldo: saldoAcum });
    }

    return { receber, pagar, saldoTotal, atrasados: atrasados.length, atrasadosValor: atrasados.reduce((a, b) => a + Number(b.valor), 0), proximos: proximos.length, projecao };
  });

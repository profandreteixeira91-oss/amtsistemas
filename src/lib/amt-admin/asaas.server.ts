// Executa processamento da fila Asaas — usa service role
// Cada item da fila é traduzido em uma chamada à API do Asaas quando ASAAS_API_KEY existe.
// Sem a chave, o item é marcado como falha com mensagem clara.

const ASAAS_BASE = (process.env.ASAAS_API_URL ?? "https://api.asaas.com").replace(/\/$/, "");

async function callAsaas(path: string, init: RequestInit) {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error("ASAAS_API_KEY não configurada");
  const r = await fetch(`${ASAAS_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: key,
      ...(init.headers ?? {}),
    },
  });
  const text = await r.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
  return { status: r.status, ok: r.ok, body };
}

export async function processarFilaAsaas() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const agora = new Date().toISOString();
  const { data: pendentes } = await (supabaseAdmin as any)
    .from("amt_asaas_fila")
    .select("*")
    .eq("status", "pendente")
    .lte("proximo_em", agora)
    .order("criado_em")
    .limit(20);

  const itens = (pendentes ?? []) as any[];
  let processados = 0;
  let falhas = 0;

  for (const item of itens) {
    await (supabaseAdmin as any).from("amt_asaas_fila")
      .update({ status: "processando", updated_at: new Date().toISOString() })
      .eq("id", item.id);

    try {
      let resp: any = null;
      if (process.env.ASAAS_API_KEY) {
        switch (item.tipo) {
          case "assinatura.update": {
            const p = item.payload ?? {};
            resp = await callAsaas(`/v3/subscriptions/${p.assinatura_id}`, {
              method: "POST",
              body: JSON.stringify(p.alteracoes ?? {}),
            });
            break;
          }
          case "cobranca.create": {
            resp = await callAsaas("/v3/payments", {
              method: "POST",
              body: JSON.stringify(item.payload ?? {}),
            });
            break;
          }
          default:
            resp = { status: 200, ok: true, body: { skipped: true, motivo: `tipo ${item.tipo} sem handler` } };
        }
      } else {
        resp = { status: 0, ok: false, body: { erro: "ASAAS_API_KEY ausente — configure em Integrações" } };
      }

      await (supabaseAdmin as any).from("amt_asaas_logs").insert({
        fila_id: item.id, direcao: "out", tipo: item.tipo,
        status_http: resp.status, request: item.payload, response: resp.body,
        erro: resp.ok ? null : String(resp.body?.errors?.[0]?.description ?? resp.body?.erro ?? "falha"),
      });

      if (resp.ok) {
        await (supabaseAdmin as any).from("amt_asaas_fila").update({
          status: "ok", ultimo_erro: null, updated_at: new Date().toISOString(),
        }).eq("id", item.id);
        processados++;
      } else {
        throw new Error(String(resp.body?.errors?.[0]?.description ?? resp.body?.erro ?? `HTTP ${resp.status}`));
      }
    } catch (e: any) {
      falhas++;
      const tentativas = (item.tentativas ?? 0) + 1;
      const backoffMin = Math.min(60, Math.pow(2, tentativas));
      const proximo = new Date(Date.now() + backoffMin * 60_000).toISOString();
      const novoStatus = tentativas >= 6 ? "falha" : "pendente";
      await (supabaseAdmin as any).from("amt_asaas_fila").update({
        status: novoStatus,
        tentativas,
        proximo_em: proximo,
        ultimo_erro: String(e?.message ?? e).slice(0, 500),
        updated_at: new Date().toISOString(),
      }).eq("id", item.id);
    }
  }

  return { processados, falhas, total: itens.length };
}

export async function registrarWebhookAsaas(payload: any) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await (supabaseAdmin as any).from("amt_asaas_logs").insert({
    direcao: "in",
    tipo: String(payload?.event ?? "webhook"),
    status_http: 200,
    request: payload,
  });

  // Sincroniza status básico de cobrança quando conseguimos correlacionar
  const evento = String(payload?.event ?? "");
  const pagamento = payload?.payment;
  if (pagamento?.externalReference) {
    if (evento.includes("PAYMENT_CONFIRMED") || evento.includes("PAYMENT_RECEIVED")) {
      await (supabaseAdmin as any).from("manager_cobrancas")
        .update({ status: "paga", pago_em: new Date().toISOString() })
        .eq("id", pagamento.externalReference);
    } else if (evento.includes("PAYMENT_OVERDUE")) {
      await (supabaseAdmin as any).from("manager_cobrancas")
        .update({ status: "vencida" })
        .eq("id", pagamento.externalReference);
    } else if (evento.includes("PAYMENT_REFUNDED") || evento.includes("PAYMENT_DELETED")) {
      await (supabaseAdmin as any).from("manager_cobrancas")
        .update({ status: "cancelada" })
        .eq("id", pagamento.externalReference);
    }
  }
  return { ok: true };
}

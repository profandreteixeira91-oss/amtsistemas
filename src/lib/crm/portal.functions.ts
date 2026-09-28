import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function randomToken(len = 32) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const portalCriar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { lead_id?: string | null; proposta_id?: string | null; contrato_id?: string | null; email: string; dias?: number }) => d)
  .handler(async ({ data, context }) => {
    const expires = new Date(Date.now() + (data.dias ?? 30) * 86400000).toISOString();
    const { data: row, error } = await context.supabase
      .from("crm_portal_acessos")
      .insert({
        lead_id: data.lead_id ?? null,
        proposta_id: data.proposta_id ?? null,
        contrato_id: data.contrato_id ?? null,
        email: data.email,
        token: randomToken(24),
        expires_at: expires,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const portalListar = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("crm_portal_acessos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const portalRevogar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("crm_portal_acessos")
      .update({ expires_at: new Date(0).toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Public: fetch portal data by token (no auth)
export const portalObterPorToken = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    const supa = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: acesso } = await supa
      .from("crm_portal_acessos")
      .select("*")
      .eq("token", data.token)
      .maybeSingle();
    if (!acesso) throw new Error("Acesso inválido");
    if (new Date(acesso.expires_at).getTime() < Date.now()) throw new Error("Acesso expirado");

    await supa
      .from("crm_portal_acessos")
      .update({ last_access_at: new Date().toISOString(), access_count: (acesso.access_count ?? 0) + 1 })
      .eq("id", acesso.id);

    let proposta: any = null, contrato: any = null, lead: any = null;
    if (acesso.proposta_id) {
      const { data } = await supa.from("crm_propostas").select("*").eq("id", acesso.proposta_id).maybeSingle();
      proposta = data;
    }
    if (acesso.contrato_id) {
      const { data } = await supa.from("crm_contratos").select("*").eq("id", acesso.contrato_id).maybeSingle();
      contrato = data;
    }
    if (acesso.lead_id) {
      const { data } = await supa.from("manager_leads").select("id, nome, email, empresa, telefone").eq("id", acesso.lead_id).maybeSingle();
      lead = data;
    }
    const { data: assinaturas } = await supa
      .from("crm_assinaturas_digitais")
      .select("*")
      .in("referencia_id", [acesso.proposta_id, acesso.contrato_id].filter(Boolean) as string[]);

    return { acesso, proposta, contrato, lead, assinaturas: assinaturas ?? [] };
  });

// Public: assinar documento
export const portalAssinar = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    tipo: "proposta" | "contrato";
    referencia_id: string;
    signatario_nome: string;
    signatario_email: string;
    signatario_documento?: string;
    ip?: string;
    user_agent?: string;
    geo?: any;
  }) => d)
  .handler(async ({ data }) => {
    const supa = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: acesso } = await supa
      .from("crm_portal_acessos")
      .select("*")
      .eq("token", data.token)
      .maybeSingle();
    if (!acesso) throw new Error("Acesso inválido");
    if (new Date(acesso.expires_at).getTime() < Date.now()) throw new Error("Acesso expirado");

    const payload = `${data.tipo}:${data.referencia_id}:${data.signatario_email}:${Date.now()}`;
    const docBuf = new TextEncoder().encode(payload);
    const docHash = await crypto.subtle.digest("SHA-256", docBuf);
    const documento_hash = Array.from(new Uint8Array(docHash)).map((b) => b.toString(16).padStart(2, "0")).join("");
    const sigPayload = `${documento_hash}|${data.signatario_email}|${data.ip ?? ""}|${data.user_agent ?? ""}`;
    const sigBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sigPayload));
    const assinatura_hash = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");

    const { data: row, error } = await supa
      .from("crm_assinaturas_digitais")
      .insert({
        tipo: data.tipo,
        referencia_id: data.referencia_id,
        signatario_nome: data.signatario_nome,
        signatario_email: data.signatario_email,
        signatario_documento: data.signatario_documento ?? null,
        documento_hash,
        assinatura_hash,
        ip_address: data.ip ?? null,
        user_agent: data.user_agent ?? null,
        geolocalizacao: data.geo ?? null,
        metodo: "click_wrap",
        evidencias: { portal_token_id: acesso.id, payload },
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    if (data.tipo === "proposta") {
      await (supa.from("crm_propostas") as any).update({ status: "aceita", aceite_em: new Date().toISOString() }).eq("id", data.referencia_id);
    } else if (data.tipo === "contrato") {
      await (supa.from("crm_contratos") as any).update({ status: "assinado", assinado_em: new Date().toISOString() }).eq("id", data.referencia_id);
    }

    return row;
  });

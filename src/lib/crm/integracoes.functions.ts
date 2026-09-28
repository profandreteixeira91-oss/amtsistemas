import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_super_admin", { _user_id: userId });
  if (!data) throw new Error("Acesso negado");
}

/** Busca integração ativa por tipo (mais recente). Server-only. */
export async function loadIntegracao(supabaseAdmin: any, tipo: string, nome?: string) {
  const q = supabaseAdmin
    .from("crm_integracoes")
    .select("*")
    .eq("tipo", tipo)
    .eq("ativo", true)
    .order("updated_at", { ascending: false })
    .limit(1);
  const { data } = nome ? await q.eq("nome", nome) : await q;
  return (data?.[0] ?? null) as any;
}

export const salvarIntegracao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      tipo: z.string().min(1),
      nome: z.string().min(1).default("Principal"),
      credenciais: z.record(z.any()).default({}),
      config: z.record(z.any()).default({}),
      ativo: z.boolean().default(true),
      observacoes: z.string().optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const payload = {
      tipo: data.tipo,
      nome: data.nome,
      credenciais: data.credenciais,
      config: data.config,
      ativo: data.ativo,
      observacoes: data.observacoes ?? null,
    };
    if (data.id) {
      const { error } = await (context.supabase as any).from("crm_integracoes").update(payload).eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: novo, error } = await (context.supabase as any)
      .from("crm_integracoes").insert(payload).select("id").single();
    if (error) throw error;
    return { ok: true, id: (novo as any)?.id };
  });

export const removerIntegracao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await (context.supabase as any).from("crm_integracoes").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const testarIntegracao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: row, error } = await (context.supabase as any)
      .from("crm_integracoes").select("*").eq("id", data.id).maybeSingle();
    if (error || !row) throw new Error("Integração não encontrada");

    const creds = (row.credenciais ?? {}) as Record<string, string>;
    let status: "ok" | "falha" = "ok";
    let mensagem = "";

    try {
      switch (row.tipo) {
        case "openai": {
          const r = await fetch("https://api.openai.com/v1/models", {
            headers: { Authorization: `Bearer ${creds.api_key}` },
          });
          if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
          const j = await r.json() as any;
          mensagem = `${j.data?.length ?? 0} modelos disponíveis`;
          break;
        }
        case "claude": {
          const r = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": creds.api_key,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: (row.config as any)?.modelo_default ?? "claude-3-5-haiku-latest",
              max_tokens: 5,
              messages: [{ role: "user", content: "ping" }],
            }),
          });
          if (!r.ok) throw new Error(`Claude ${r.status}: ${await r.text()}`);
          mensagem = "Chave Claude válida";
          break;
        }
        case "gemini": {
          const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${creds.api_key}`);
          if (!r.ok) throw new Error(`Gemini ${r.status}: ${await r.text()}`);
          const j = await r.json() as any;
          mensagem = `${j.models?.length ?? 0} modelos disponíveis`;
          break;
        }
        case "whatsapp_cloud": {
          const v = (row.config as any)?.graph_version ?? "v20.0";
          const r = await fetch(`https://graph.facebook.com/${v}/${creds.phone_number_id}`, {
            headers: { Authorization: `Bearer ${creds.access_token}` },
          });
          if (!r.ok) throw new Error(`Meta ${r.status}: ${await r.text()}`);
          const j = await r.json() as any;
          mensagem = `Número: ${j.display_phone_number ?? j.verified_name ?? "ok"}`;
          break;
        }
        case "evolution_api": {
          const base = String(creds.base_url ?? "").replace(/\/$/, "");
          const r = await fetch(`${base}/instance/connectionState/${encodeURIComponent(creds.instance)}`, {
            headers: { apikey: creds.api_key },
          });
          if (!r.ok) throw new Error(`Evolution ${r.status}: ${await r.text()}`);
          const j = await r.json() as any;
          mensagem = `Estado: ${j?.instance?.state ?? j?.state ?? "ok"}`;
          break;
        }
        case "n8n": {
          const base = String(creds.base_url ?? "").replace(/\/$/, "");
          const r = await fetch(`${base}/rest/workflows?limit=1`, {
            headers: creds.api_key ? { "X-N8N-API-KEY": creds.api_key } : {},
          });
          mensagem = r.ok ? "URL respondeu 200" : `Status ${r.status}`;
          if (!r.ok) throw new Error(mensagem);
          break;
        }
        case "make": {
          const r = await fetch((creds as any).webhook_url, { method: "GET" });
          mensagem = `Webhook respondeu ${r.status}`;
          break;
        }
        case "google_maps": {
          const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=Brasil&key=${creds.api_key}`);
          const j = await r.json() as any;
          if (j.status !== "OK" && j.status !== "ZERO_RESULTS") throw new Error(j.error_message ?? j.status);
          mensagem = `Google Maps: ${j.status}`;
          break;
        }
        case "mcp_server": {
          const r = await fetch(creds.url, { headers: creds.token ? { Authorization: `Bearer ${creds.token}` } : {} });
          mensagem = `MCP respondeu ${r.status}`;
          break;
        }
        default:
          mensagem = "Tipo sem teste automatizado. Marcado como validado manualmente.";
      }
    } catch (e: any) {
      status = "falha";
      mensagem = String(e?.message ?? e).slice(0, 500);
    }

    await (context.supabase as any).from("crm_integracoes").update({
      ultimo_teste_em: new Date().toISOString(),
      ultimo_teste_status: status,
      ultimo_teste_mensagem: mensagem,
    }).eq("id", data.id);

    return { ok: status === "ok", status, mensagem };
  });

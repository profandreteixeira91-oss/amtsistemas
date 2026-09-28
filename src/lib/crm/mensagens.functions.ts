import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_super_admin", { _user_id: userId });
  if (!data) throw new Error("Acesso negado");
}

export const enviarMensagemAgora = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ mensagem_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("crm_mensagens")
      .update({ status: "pendente", erro: null })
      .eq("id", data.mensagem_id);
    if (error) throw error;

    const url = `${process.env.SUPABASE_URL ?? ""}`.trim();
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    const publicBase = url.replace(/\/$/, "");
    // Chama o próprio endpoint público — na plataforma Lovable o host é diferente,
    // então usamos apenas a marcação pendente + a UI dispara /api/public/hooks/crm-mensagens-tick.
    return { ok: true, hint: "chame /api/public/hooks/crm-mensagens-tick", publicBase, hasKey: !!key };
  });

export const criarMensagemManual = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      lead_id: z.string().uuid().optional().nullable(),
      canal: z.enum(["whatsapp", "email", "instagram", "ligacao"]),
      conteudo: z.string().min(1),
      destinatario: z.string().optional().nullable(),
      assunto: z.string().optional().nullable(),
      enviar_agora: z.boolean().default(false),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: msg, error } = await context.supabase
      .from("crm_mensagens")
      .insert({
        lead_id: data.lead_id ?? null,
        canal: data.canal,
        direcao: "saida",
        conteudo: data.conteudo,
        destinatario: data.destinatario ?? null,
        assunto: data.assunto ?? null,
        status: data.enviar_agora ? "pendente" : "rascunho",
      })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: msg.id };
  });

export const salvarCanalConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      canal: z.enum(["whatsapp", "email", "instagram", "ligacao"]),
      provedor: z.enum(["n8n_webhook", "make_webhook", "evolution_api", "whatsapp_cloud", "custom"]),
      webhook_url: z.string().url().nullable(),
      headers_extras: z.record(z.string()).default({}),
      ativo: z.boolean().default(true),
      observacoes: z.string().optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.id) {
      const { error } = await (context.supabase as any)
        .from("crm_canais_config")
        .update({
          provedor: data.provedor,
          webhook_url: data.webhook_url,
          headers_extras: data.headers_extras,
          ativo: data.ativo,
          observacoes: data.observacoes ?? null,
        })
        .eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: novo, error } = await (context.supabase as any)
      .from("crm_canais_config")
      .insert({
        canal: data.canal,
        provedor: data.provedor,
        webhook_url: data.webhook_url,
        headers_extras: data.headers_extras,
        ativo: data.ativo,
        observacoes: data.observacoes ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: (novo as any)?.id };
  });

export const removerCanalConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await (context.supabase as any).from("crm_canais_config").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

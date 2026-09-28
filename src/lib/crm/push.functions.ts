import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const pushInscrever = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { endpoint: string; p256dh: string; auth_key: string; user_agent?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("crm_push_subscriptions")
      .upsert({ ...data, user_id: context.userId, ativa: true }, { onConflict: "endpoint" })
      .select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const pushDesinscrever = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { endpoint: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("crm_push_subscriptions")
      .update({ ativa: false })
      .eq("endpoint", data.endpoint)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const pushListar = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("crm_push_subscriptions")
      .select("*")
      .eq("user_id", context.userId)
      .eq("ativa", true);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

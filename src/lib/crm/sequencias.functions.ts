import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function requireSuperAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_super_admin", { _user_id: userId });
  if (!data) throw new Error("Acesso negado");
}

export const inscreverLeadEmSequencia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    lead_id: z.string().uuid(),
    sequencia_id: z.string().uuid(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.supabase, context.userId);
    const { data: passos, error: pErr } = await context.supabase
      .from("crm_sequencia_passos").select("dia").eq("sequencia_id", data.sequencia_id).order("ordem").limit(1);
    if (pErr) throw pErr;
    if (!passos?.length) throw new Error("Sequência sem passos configurados");
    const proximo = new Date();
    proximo.setDate(proximo.getDate() + Math.max(0, (passos[0].dia ?? 1) - 1));
    const { error } = await context.supabase.from("crm_sequencia_enrollments").insert({
      lead_id: data.lead_id, sequencia_id: data.sequencia_id,
      passo_atual: 0, proximo_disparo_em: proximo.toISOString(), status: "ativa",
    });
    if (error) {
      if (error.code === "23505") throw new Error("Este lead já está inscrito nesta sequência");
      throw error;
    }
    return { ok: true };
  });

export const dispararTickManual = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireSuperAdmin(context.supabase, context.userId);
    const url = `${process.env.SUPABASE_URL}`.replace(/\/?$/, "");
    // Chama o próprio endpoint público de tick usando fetch relativo é frágil no worker.
    // Aqui apenas retornamos um sinal — o disparo real é feito pela UI via chamada direta ao endpoint.
    return { hint: "Chame /api/public/hooks/crm-sequencias-tick" , supabase_url: url };
  });

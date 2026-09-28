import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

async function ensureSuperAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.rpc("is_super_admin", { _user_id: userId });
  if (error) throw new Error("Falha ao verificar permissão");
  if (!data) throw new Error("Forbidden: acesso restrito a super admins");
}

const createInput = z.object({
  email: z.string().email(),
  password: z.string().min(10, "Senha deve ter ao menos 10 caracteres"),
  makeSuperAdmin: z.boolean().default(false),
});

export const criarUsuarioAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createInput.parse(input))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) {
      throw new Error(error?.message ?? "Falha ao criar usuário");
    }

    if (data.makeSuperAdmin) {
      const { error: promErr } = await supabaseAdmin
        .from("super_admins")
        .insert({ user_id: created.user.id, criado_por: context.userId });
      if (promErr && !promErr.message.includes("duplicate")) {
        throw new Error(`Usuário criado, mas falhou ao promover: ${promErr.message}`);
      }
    }

    return { id: created.user.id, email: created.user.email };
  });

export const listarUsuariosAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: users, error: usersErr }, { data: admins, error: admErr }] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
      supabaseAdmin.from("super_admins").select("user_id, criado_em"),
    ]);
    if (usersErr) throw new Error(usersErr.message);
    if (admErr) throw new Error(admErr.message);

    const superSet = new Map((admins ?? []).map((a) => [a.user_id, a.criado_em]));
    return (users.users ?? [])
      .map((u) => ({
        id: u.id,
        email: u.email ?? "",
        criadoEm: u.created_at,
        ultimoLogin: u.last_sign_in_at,
        superAdmin: superSet.has(u.id),
        promovidoEm: superSet.get(u.id) ?? null,
      }))
      .sort((a, b) => (a.superAdmin === b.superAdmin ? 0 : a.superAdmin ? -1 : 1));
  });

export const promoverSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid(), promover: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.promover) {
      const { error } = await supabaseAdmin
        .from("super_admins")
        .insert({ user_id: data.userId, criado_por: context.userId });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      if (data.userId === context.userId) {
        throw new Error("Você não pode remover a si mesmo dos super admins");
      }
      const { error } = await supabaseAdmin.from("super_admins").delete().eq("user_id", data.userId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const excluirUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) {
      throw new Error("Você não pode excluir a própria conta");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

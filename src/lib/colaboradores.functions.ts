import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const FUNCOES = ["admin", "gerencia", "cozinha", "garcom", "caixa"] as const;

const criarSchema = z.object({
  empresa_id: z.string().uuid(),
  nome: z.string().trim().min(2).max(120),
  cpf: z.string().trim().min(11).max(14),
  telefone: z.string().trim().min(8).max(20),
  endereco: z.string().trim().min(3).max(300),
  email: z.string().trim().email().max(255),
  funcao: z.enum(FUNCOES),
  senha: z.string().min(8).max(72),
});

const atualizarSchema = z.object({
  id: z.string().uuid(),
  empresa_id: z.string().uuid(),
  nome: z.string().trim().min(2).max(120),
  cpf: z.string().trim().min(11).max(14),
  telefone: z.string().trim().min(8).max(20),
  endereco: z.string().trim().min(3).max(300),
  email: z.string().trim().email().max(255),
  funcao: z.enum(FUNCOES),
  ativo: z.boolean(),
  nova_senha: z.string().min(8).max(72).nullish(),
});

export const criarColaborador = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => criarSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdm, error: adminErr } = await context.supabase
      .rpc("is_company_admin", { _user_id: context.userId, _empresa_id: data.empresa_id });
    if (adminErr) throw new Error(adminErr.message);
    if (!isAdm) throw new Error("Apenas administradores da empresa podem gerir colaboradores.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
      user_metadata: { nome: data.nome, telefone: data.telefone },
    });
    if (authErr || !created?.user) throw new Error(authErr?.message ?? "Falha ao criar usuário de login");
    const newUserId = created.user.id;

    try {
      const { error: membroErr } = await supabaseAdmin
        .from("membros")
        .insert({ user_id: newUserId, empresa_id: data.empresa_id, role: data.funcao, ativo: true });
      if (membroErr) throw new Error(membroErr.message);

      const { error: colabErr } = await supabaseAdmin.from("colaboradores").insert({
        empresa_id: data.empresa_id,
        user_id: newUserId,
        nome: data.nome,
        cpf: data.cpf,
        telefone: data.telefone,
        endereco: data.endereco,
        email: data.email,
        funcao: data.funcao,
        ativo: true,
      });
      if (colabErr) throw new Error(colabErr.message);
    } catch (e) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId).catch(() => {});
      throw e;
    }

    return { ok: true, user_id: newUserId };
  });

export const atualizarColaborador = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => atualizarSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdm, error: adminErr } = await context.supabase
      .rpc("is_company_admin", { _user_id: context.userId, _empresa_id: data.empresa_id });
    if (adminErr) throw new Error(adminErr.message);
    if (!isAdm) throw new Error("Apenas administradores da empresa podem gerir colaboradores.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: colab, error: getErr } = await supabaseAdmin
      .from("colaboradores").select("user_id")
      .eq("id", data.id).eq("empresa_id", data.empresa_id).maybeSingle();
    if (getErr) throw new Error(getErr.message);
    if (!colab) throw new Error("Colaborador não encontrado");

    const { error: updErr } = await supabaseAdmin.from("colaboradores").update({
      nome: data.nome, cpf: data.cpf, telefone: data.telefone, endereco: data.endereco,
      email: data.email, funcao: data.funcao, ativo: data.ativo,
    }).eq("id", data.id);
    if (updErr) throw new Error(updErr.message);

    if (colab.user_id) {
      await supabaseAdmin.from("membros")
        .update({ role: data.funcao, ativo: data.ativo })
        .eq("user_id", colab.user_id).eq("empresa_id", data.empresa_id);

      const authPatch: { email?: string; password?: string } = { email: data.email };
      if (data.nova_senha) authPatch.password = data.nova_senha;
      await supabaseAdmin.auth.admin.updateUserById(colab.user_id, authPatch).catch(() => {});
    }

    return { ok: true };
  });

export const removerColaborador = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), empresa_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdm, error: adminErr } = await context.supabase
      .rpc("is_company_admin", { _user_id: context.userId, _empresa_id: data.empresa_id });
    if (adminErr) throw new Error(adminErr.message);
    if (!isAdm) throw new Error("Apenas administradores da empresa podem gerir colaboradores.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: colab } = await supabaseAdmin
      .from("colaboradores").select("user_id")
      .eq("id", data.id).eq("empresa_id", data.empresa_id).maybeSingle();

    if (colab?.user_id) {
      await supabaseAdmin.from("membros")
        .update({ ativo: false })
        .eq("user_id", colab.user_id).eq("empresa_id", data.empresa_id);
    }
    const { error } = await supabaseAdmin.from("colaboradores").delete()
      .eq("id", data.id).eq("empresa_id", data.empresa_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

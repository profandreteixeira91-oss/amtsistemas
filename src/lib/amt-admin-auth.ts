import { amtSupabase } from "@/integrations/amt-supabase/client";

export const FIRST_ADMIN_EMAIL = "profandreteixeira91@gmail.com";

export async function getAdminSession() {
  if (!amtSupabase) return null;
  const { data, error } = await amtSupabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getAdminProfile(userId: string) {
  if (!amtSupabase) return null;
  const { data, error } = await amtSupabase
    .from("admin_users")
    .select("user_id, email, role, active")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function signInAdmin(email: string, password: string) {
  if (!amtSupabase) throw new Error("A autenticação administrativa ainda não foi configurada neste ambiente.");
  const { data, error } = await amtSupabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const profile = await getAdminProfile(data.user.id);
  if (!profile) {
    await amtSupabase.auth.signOut();
    throw new Error("Usuário autenticado sem permissão administrativa.");
  }

  return data;
}

export async function requestAdminPasswordReset(email: string) {
  if (!amtSupabase) throw new Error("A autenticação administrativa ainda não foi configurada neste ambiente.");
  const redirectTo = `${window.location.origin}/admin/redefinir-senha`;
  const { error } = await amtSupabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function updateAdminPassword(password: string) {
  if (!amtSupabase) throw new Error("A autenticação administrativa ainda não foi configurada neste ambiente.");
  const { data, error } = await amtSupabase.auth.updateUser({ password });
  if (error) throw error;
  return data;
}

export async function setFirstAdminPassword(password: string) {
  if (!amtSupabase) throw new Error("A autenticação administrativa ainda não foi configurada neste ambiente.");
  const session = await getAdminSession();
  if (session?.user?.email?.toLowerCase() !== FIRST_ADMIN_EMAIL) {
    throw new Error("A configuração de primeiro acesso não está disponível para este usuário.");
  }
  const { data, error } = await amtSupabase.auth.updateUser({ password });
  if (error) throw error;
  return data;
}

export async function signOutAdmin() {
  if (!amtSupabase) return;
  const { error } = await amtSupabase.auth.signOut();
  if (error) throw error;
}

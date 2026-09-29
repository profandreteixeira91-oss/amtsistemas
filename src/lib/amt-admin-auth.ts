import { amtSupabase } from "@/integrations/amt-supabase/client";

export async function getAdminSession() {
  if (!amtSupabase) return null;
  const { data, error } = await amtSupabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signInAdmin(email: string, password: string) {
  if (!amtSupabase) {
    throw new Error("A autenticação administrativa ainda não foi configurada neste ambiente.");
  }

  const { data, error } = await amtSupabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOutAdmin() {
  if (!amtSupabase) return;
  const { error } = await amtSupabase.auth.signOut();
  if (error) throw error;
}

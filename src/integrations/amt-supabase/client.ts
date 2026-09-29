import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_AMT_SUPABASE_URL as string | undefined;
const publishableKey = import.meta.env.VITE_AMT_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !publishableKey) {
  console.warn(
    "[AMT Control Center] Configure VITE_AMT_SUPABASE_URL and VITE_AMT_SUPABASE_PUBLISHABLE_KEY to enable the administrative authentication."
  );
}

export const amtSupabase =
  url && publishableKey
    ? createClient(url, publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

import { createClient } from "@supabase/supabase-js";

const DEFAULT_AMT_SUPABASE_URL = "https://yqxmxevphdumyuwlvppg.supabase.co";
const DEFAULT_AMT_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_jK7lhco6DQLlfjYm8LGS3g_sGBkVtK2";

const url =
  (import.meta.env.VITE_AMT_SUPABASE_URL as string | undefined) ??
  DEFAULT_AMT_SUPABASE_URL;
const publishableKey =
  (import.meta.env.VITE_AMT_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  DEFAULT_AMT_SUPABASE_PUBLISHABLE_KEY;

export const amtSupabase = createClient(url, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

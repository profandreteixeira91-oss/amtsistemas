import { useEffect, useState } from "react";

import { amtSupabase } from "@/integrations/amt-supabase/client";
import { inbox } from "@/lib/support-inbox";

// Contadores do menu do Control Center: WhatsApp (conversas não lidas + chamados com mensagem nova) e Leads
// (leads novos ainda não trabalhados). Atualiza a cada 30 s e mostra o total no título da aba.

export type AdminCounters = { whatsapp: number; leads: number };

const POLL_MS = 30000;

export function useAdminCounters(): AdminCounters {
  const [counters, setCounters] = useState<AdminCounters>({ whatsapp: 0, leads: 0 });

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [support, leads] = await Promise.all([
        inbox<{ chats: number; tickets: number }>("counters").catch(() => ({ chats: 0, tickets: 0 })),
        amtSupabase.from("manager_leads").select("id", { count: "exact", head: true }).eq("status", "novo"),
      ]);
      if (active) setCounters({ whatsapp: support.chats + support.tickets, leads: leads.count ?? 0 });
    };
    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    const total = counters.whatsapp + counters.leads;
    document.title = total ? `(${total}) ${base}` : base;
  }, [counters]);

  return counters;
}

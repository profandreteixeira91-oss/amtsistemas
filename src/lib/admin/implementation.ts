// Implantação assistida do AMT Dojo Manager: Edge Function `implementation` no projeto Supabase do Dojo
// (gudjmkiyprgwgxmzbgji; código no repositório amtdojomanager, supabase/functions/implementation). O navegador manda
// o token do Control Center; a função confere a sessão e `is_control_center_admin` aqui no amt-sistemas.

import { amtSupabase } from "@/integrations/amt-supabase/client";

export const IMPLEMENTATION_URL =
  "https://gudjmkiyprgwgxmzbgji.supabase.co/functions/v1/implementation";

export const IMPLEMENTATION_STATUS: Record<string, { label: string; className: string }> = {
  rascunho: {
    label: "Rascunho do cliente",
    className: "border-slate-200 bg-slate-50 text-slate-600",
  },
  enviada: { label: "Na fila", className: "border-amber-200 bg-amber-50 text-amber-800" },
  em_implantacao: {
    label: "Em implantação",
    className: "border-blue-200 bg-blue-50 text-blue-800",
  },
  concluida: { label: "Concluída", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  cancelada: { label: "Cancelada", className: "border-red-200 bg-red-50 text-red-700" },
};

export type ImplementationSummary = {
  id: string;
  owner_id: string;
  status: string;
  trade_name: string;
  city: string;
  state: string;
  whatsapp: string;
  counts: { plans: number; classes: number; team: number; students: number };
  trial_after_implementation: boolean;
  has_notes: boolean;
  result: Record<string, unknown> | null;
  subscription: { status: string; plan_code: string; trial_ends_at: string | null } | null;
  submitted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
};

export type ImplementationPayload = {
  academy?: Record<string, unknown>;
  plans?: Array<Record<string, unknown>>;
  classes?: Array<
    Record<string, unknown> & {
      schedules?: Array<{ weekday: number; start_time: string; end_time: string }>;
    }
  >;
  team?: Array<Record<string, unknown>>;
  students?: Array<Record<string, string>>;
  billing?: { due_day_default?: number; start_month?: string };
  notes?: string;
};

export type ImplementationDetail = {
  request: {
    id: string;
    owner_id: string;
    status: string;
    payload: ImplementationPayload;
    trial_after_implementation: boolean;
    admin_notes: string | null;
    result: Record<string, unknown> | null;
    submitted_at: string | null;
    started_at: string | null;
    completed_at: string | null;
    updated_at: string;
  };
  academy: {
    trade_name: string | null;
    whatsapp: string | null;
    email: string | null;
    city: string | null;
    state: string | null;
    slug: string | null;
  } | null;
  subscription: { status: string; plan_code: string; trial_ends_at: string | null } | null;
  owner_email: string | null;
  active_students: number;
  plan_limit: number | null;
};

export async function implementationCall<T>(
  action: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const { data } = await amtSupabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Entre novamente.");
  let response: Response;
  try {
    response = await fetch(IMPLEMENTATION_URL, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, ...body }),
    });
  } catch {
    throw new Error("O servidor do Dojo não respondeu. Verifique a conexão e tente de novo.");
  }
  const result = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Não foi possível concluir a operação.");
  return result;
}

export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const PLAN_FREQUENCY: Record<string, string> = {
  monthly: "Mensal",
  bimonthly: "Bimestral",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
};

export const TEAM_ROLE: Record<string, string> = {
  teacher: "Professor(a)",
  instructor: "Instrutor(a)",
  assistant: "Auxiliar",
  receptionist: "Recepção",
  finance: "Financeiro",
  manager: "Gerente",
  admin: "Administrador",
  other: "Outro",
};

export const brl = (v: unknown) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v ?? 0));

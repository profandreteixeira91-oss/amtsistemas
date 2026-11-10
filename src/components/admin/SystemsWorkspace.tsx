import { useEffect, useState } from "react";
import {
  Activity,
  Code2,
  Download,
  ExternalLink,
  Package,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { amtSupabase } from "@/integrations/amt-supabase/client";
import { type IconType, type AmtSystem, systems, type CommercialLead, commercialLeadStatuses, brl, daysAgo, useCommercialData, isOptioneTrial } from "@/lib/admin/systems";

// Sistemas da AMT: clientes e assinaturas (Edge Function platform-overview de cada sistema), catálogo, leads,
// versões, GitHub e acessos operacionais.

type OverviewCustomer = {
  id: string; name: string; code: string | null; owner_name: string | null; owner_email: string | null; phone: string | null; city?: string | null;
  plan: string | null; plan_name: string | null; status: string | null; group: string; amount_monthly: number | null;
  trial_ends_at: string | null; current_period_end: string | null; next_due_date?: string | null; last_payment_status?: string | null;
  cancel_at_period_end?: boolean; payment_method?: string | null; last_payment_error?: string | null; created_at: string | null;
  users?: number; devices?: number; last_seen_at?: string | null;
  students?: number; active_students?: number; apk_downloads?: number; open_tickets?: number;
};
type PlatformOverview = {
  system: string;
  generated_at: string;
  customers: OverviewCustomer[];
  payments?: Array<{ id: string; customer_id: string; customer_name: string | null; amount: number | null; status: string; date: string }>;
  devices?: { active: number; seen_last_7d: number; activated_last_30d: number };
  apk?: { published_versions: number; academies_with_apk: number; downloads: number; downloads_last_30d: number };
  support?: Array<{ id: string; customer_id: string; customer_name: string | null; subject: string; category: string | null; status: string; priority: string | null; unread: boolean; last_message_at: string }>;
  open_tickets?: number;
  amt_fees?: { last_30d: number; transactions_last_30d: number };
};

const customerGroups: Record<string, { label: string; className: string }> = {
  pagante: { label: "Pagante", className: "bg-emerald-50 text-emerald-700" },
  liberado: { label: "Liberado", className: "bg-sky-50 text-sky-700" },
  teste: { label: "Em teste", className: "bg-blue-50 text-blue-700" },
  teste_vencido: { label: "Teste vencido", className: "bg-amber-50 text-amber-700" },
  pendente: { label: "Pendente", className: "bg-red-50 text-red-700" },
  cancelado: { label: "Cancelado", className: "bg-slate-100 text-slate-500" },
  sem_assinatura: { label: "Sem assinatura", className: "bg-slate-100 text-slate-500" },
};

// Relatório da plataforma de cada sistema (Edge Function platform-overview no projeto do sistema).
// A função confere o token do Control Center no projeto amt-sistemas; nada privilegiado passa pelo navegador.
function usePlatformOverview(url: string) {
  const [state, setState] = useState<{ loading: boolean; error: string; data: PlatformOverview | null }>({ loading: true, error: "", data: null });

  async function load() {
    setState((value) => ({ ...value, loading: true, error: "" }));
    try {
      const { data } = await amtSupabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sessão expirada. Entre novamente.");
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json().catch(() => ({})) as PlatformOverview & { error?: string };
      if (!response.ok) throw new Error(body.error ?? (response.status === 404 ? "O relatório ainda não foi publicado neste sistema." : "Não foi possível carregar o relatório."));
      setState({ loading: false, error: "", data: body });
    } catch (error) {
      const message = error instanceof TypeError ? "Relatório indisponível: a função platform-overview não respondeu (ainda não publicada?)." : error instanceof Error ? error.message : "Não foi possível carregar o relatório.";
      setState({ loading: false, error: message, data: null });
    }
  }

  useEffect(() => { void load(); }, [url]);

  return { ...state, reload: load };
}

function summarizeCustomers(customers: OverviewCustomer[]) {
  const byGroup = (group: string) => customers.filter((customer) => customer.group === group).length;
  return {
    total: customers.length,
    paying: byGroup("pagante"),
    trial: byGroup("teste"),
    expiredTrial: byGroup("teste_vencido"),
    pending: byGroup("pendente"),
    mrr: customers.filter((customer) => customer.group === "pagante").reduce((sum, customer) => sum + (customer.amount_monthly ?? 0), 0),
  };
}

const formatDate = (value: string | null | undefined) => (value ? new Date(value.length === 10 ? value + "T12:00:00" : value).toLocaleDateString("pt-BR") : "—");

function customerDeadline(customer: OverviewCustomer) {
  if (customer.group === "teste" || customer.group === "teste_vencido") return customer.trial_ends_at ? `Teste até ${formatDate(customer.trial_ends_at)}` : "Teste sem data";
  if (customer.next_due_date) return `Próxima cobrança ${formatDate(customer.next_due_date)}`;
  if (customer.current_period_end) return new Date(customer.current_period_end).getFullYear() >= 2100 ? "Sem vencimento" : `Válida até ${formatDate(customer.current_period_end)}`;
  return "—";
}

function customerUsage(customer: OverviewCustomer) {
  if (customer.devices !== undefined) {
    const lastSeen = customer.last_seen_at ? ` · visto em ${formatDate(customer.last_seen_at)}` : "";
    return `${customer.devices} ${customer.devices === 1 ? "computador" : "computadores"} · ${customer.users ?? 0} usuários${lastSeen}`;
  }
  const tickets = customer.open_tickets ? ` · ${customer.open_tickets} chamado${customer.open_tickets === 1 ? "" : "s"}` : "";
  return `${customer.active_students ?? 0} alunos ativos · ${customer.apk_downloads ?? 0} downloads do app${tickets}`;
}

export function SystemSubscriptionSummary({ system }: { system: AmtSystem }) {
  const overview = usePlatformOverview(system.overviewUrl);
  if (overview.loading) return <p className="mt-2 text-xs text-slate-400">Carregando assinaturas…</p>;
  if (!overview.data) return <p className="mt-2 text-xs text-slate-400">Assinaturas indisponíveis</p>;
  const summary = summarizeCustomers(overview.data.customers);
  return <p className="mt-2 text-xs text-slate-500">{summary.total} clientes · {summary.paying} pagantes · {summary.trial} em teste · {brl.format(summary.mrr)}/mês</p>;
}

type DeletionPreview = { owner_id: string; name: string | null; email: string | null; subscription_status?: string | null; rows: number; tables: Record<string, number>; logins: number; files: number };
type DeletionSummary = { name: string | null; email: string | null; rows: number; logins_deleted: number; logins_kept: number; files_deleted: number; files_failed: number };

// Ações do relatório da plataforma (POST na mesma Edge Function), com o token do Control Center.
async function platformAction<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const { data } = await amtSupabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Entre novamente.");
  const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Não foi possível concluir a operação.");
  return result;
}

function DeleteDojoAccountModal({ system, customer, onClose, onDeleted }: { system: AmtSystem; customer: OverviewCustomer; onClose: () => void; onDeleted: () => void }) {
  const [preview, setPreview] = useState<DeletionPreview | null>(null);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [summary, setSummary] = useState<DeletionSummary | null>(null);

  useEffect(() => {
    let active = true;
    platformAction<DeletionPreview>(system.overviewUrl, { action: "delete_preview", owner_id: customer.id })
      .then((data) => { if (active) setPreview(data); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Não foi possível carregar a prévia."); });
    return () => { active = false; };
  }, [system.overviewUrl, customer.id]);

  const accepted = [preview?.name, preview?.email].filter(Boolean).map((value) => String(value).trim().toLowerCase());
  const canDelete = Boolean(preview) && accepted.includes(confirm.trim().toLowerCase()) && !deleting;
  const topTables = preview ? Object.entries(preview.tables).sort((a, b) => b[1] - a[1]).slice(0, 8) : [];

  async function remove() {
    if (!canDelete) return;
    setDeleting(true);
    setError("");
    try {
      const result = await platformAction<DeletionSummary>(system.overviewUrl, { action: "delete_account", owner_id: customer.id, confirm });
      setSummary(result);
      const session = await amtSupabase.auth.getSession();
      if (session.data.session) await amtSupabase.from("audit_logs").insert({ actor_user_id: session.data.session.user.id, action: "dojo_account.deleted", resource_type: "dojo_account", resource_id: customer.id, metadata: { sistema: system.catalogSlug, name: result.name, email: result.email, rows: result.rows, logins_deleted: result.logins_deleted, logins_kept: result.logins_kept, files_deleted: result.files_deleted, files_failed: result.files_failed } });
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir a conta.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-account-title" onKeyDown={(e) => { if (e.key === "Escape" && !deleting) onClose(); }}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 text-slate-950 shadow-xl">
        <h3 id="delete-account-title" className="text-lg font-semibold">{summary ? "Conta excluída" : "Excluir conta da academia"}</h3>
        <p className="mt-1 text-sm text-slate-500">{customer.name}{customer.owner_email ? ` · ${customer.owner_email}` : ""}</p>

        {summary ? (
          <div className="mt-5 space-y-2 text-sm text-slate-700">
            <p>{summary.rows} registros removidos do {system.name}.</p>
            <p>{summary.logins_deleted} {summary.logins_deleted === 1 ? "login excluído" : "logins excluídos"}{summary.logins_kept ? ` · ${summary.logins_kept} mantido${summary.logins_kept === 1 ? "" : "s"} por estar em uso em outro lugar (outra academia ou loja Fight Wear)` : ""}.</p>
            <p>{summary.files_deleted} arquivos removidos{summary.files_failed ? ` · ${summary.files_failed} não puderam ser removidos do Storage` : ""}.</p>
            <div className="pt-3"><Button type="button" onClick={onClose} className="bg-black text-white hover:bg-slate-900">Fechar</Button></div>
          </div>
        ) : (
          <>
            {!preview && !error && <p className="mt-5 text-sm text-slate-500">Calculando o que será removido…</p>}
            {preview && (
              <div className="mt-5 space-y-4 text-sm">
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
                  <p className="font-medium">Esta ação é definitiva e não pode ser desfeita.</p>
                  <p className="mt-1 text-xs leading-5">Apaga todos os dados da academia (alunos, turmas, presenças, financeiro, contratos, certificados e demais registros), os arquivos enviados e os logins que não estiverem em uso em outro lugar.</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[["Registros", preview.rows], ["Logins", preview.logins], ["Arquivos", preview.files]].map(([label, value]) => <div key={String(label)} className="rounded-lg border border-slate-200 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold">{String(value)}</p></div>)}
                </div>
                {topTables.length > 0 && <p className="text-xs leading-5 text-slate-500">Maiores volumes: {topTables.map(([table, count]) => `${table.replace(/^(dojo|academy)_/, "").replaceAll("_", " ")} (${count})`).join(", ")}.</p>}
                <label className="block text-sm font-medium text-slate-700">
                  Para confirmar, digite o nome ou o e-mail da academia
                  <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={preview.name ?? preview.email ?? ""} autoFocus className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950 outline-none focus:border-red-400" />
                </label>
              </div>
            )}
            {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={deleting}>Cancelar</Button>
              <Button type="button" onClick={() => void remove()} disabled={!canDelete} className="bg-red-600 text-white hover:bg-red-700">{deleting ? "Excluindo…" : "Excluir definitivamente"}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PlatformSection({ system }: { system: AmtSystem }) {
  const overview = usePlatformOverview(system.overviewUrl);
  const [group, setGroup] = useState("todos");
  const [search, setSearch] = useState("");
  const isDesktop = Boolean(system.releasesRepo);
  const noun = isDesktop ? "Óticas" : "Academias";
  // Exclusão de contas inativas: por enquanto só o Dojo Manager oferece a ação.
  const canDeleteAccounts = system.id === "dojo-manager";
  const [deleting, setDeleting] = useState<OverviewCustomer | null>(null);

  const customers = overview.data?.customers ?? [];
  const summary = summarizeCustomers(customers);
  const filtered = customers.filter((customer) => (group === "todos" || customer.group === group) && [customer.name, customer.code ?? "", customer.owner_name ?? "", customer.owner_email ?? "", customer.phone ?? "", customer.city ?? ""].join(" ").toLowerCase().includes(search.toLowerCase()));
  const groupsPresent = Object.keys(customerGroups).filter((key) => customers.some((customer) => customer.group === key));

  const cards: Array<[string, string, string]> = [
    [noun, String(summary.total), `${summary.pending} com pagamento pendente`],
    ["Pagantes", String(summary.paying), "Assinatura ativa com cobrança"],
    ["Em teste", String(summary.trial), `${summary.expiredTrial} com teste vencido`],
    ["Receita mensal", brl.format(summary.mrr), "Soma das assinaturas pagantes"],
  ];

  return (
    <section className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Clientes e assinaturas</h3>
            <p className="mt-1 text-sm text-slate-500">{noun} cadastradas no {system.name}, direto do banco do sistema.{overview.data ? ` Atualizado às ${new Date(overview.data.generated_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.` : ""}</p>
          </div>
          <div className="flex gap-2">
            <label className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar" className="w-48 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-950 outline-none focus:border-blue-500" /></label>
            <Button type="button" variant="outline" size="sm" onClick={() => void overview.reload()} className="h-9 gap-2"><RefreshCw className="h-4 w-4" /> Atualizar</Button>
          </div>
        </div>

        {overview.loading && !overview.data ? <p className="mt-5 text-sm text-slate-500">Carregando…</p> : overview.error ? (
          <p className="mt-5 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">{overview.error}</p>
        ) : (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map(([label, value, detail]) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-400">{detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {["todos", ...groupsPresent].map((key) => {
                const total = key === "todos" ? customers.length : customers.filter((customer) => customer.group === key).length;
                return <button key={key} type="button" onClick={() => setGroup(key)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${group === key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{key === "todos" ? "Todos" : customerGroups[key].label} · {total}</button>;
              })}
            </div>

            {filtered.length === 0 ? <p className="mt-5 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">{customers.length ? "Nenhum cliente encontrado para o filtro." : "Nenhum cliente cadastrado ainda."}</p> : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500"><th className="py-2 pr-4 font-medium">Cliente</th><th className="py-2 pr-4 font-medium">Situação</th><th className="py-2 pr-4 font-medium">Plano</th><th className="py-2 pr-4 font-medium">Prazo</th><th className="py-2 font-medium">Uso</th>{canDeleteAccounts && <th className="py-2 pl-4 font-medium"><span className="sr-only">Ações</span></th>}</tr></thead>
                  <tbody>
                    {filtered.map((customer) => {
                      const info = customerGroups[customer.group] ?? customerGroups.sem_assinatura;
                      return (
                        <tr key={customer.id} className="border-b border-slate-100 align-top last:border-0">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-slate-950">{customer.name}</p>
                            <p className="mt-1 text-xs text-slate-500">{[customer.code, customer.owner_name, customer.owner_email, customer.phone, customer.city].filter(Boolean).join(" · ") || "Sem contato"}</p>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${info.className}`}>{info.label}</span>
                            {customer.cancel_at_period_end && <p className="mt-2 text-[11px] text-amber-700">Cancela no fim do período</p>}
                            {customer.last_payment_error && <p className="mt-2 max-w-48 text-[11px] text-red-600">{customer.last_payment_error}</p>}
                          </td>
                          <td className="py-3 pr-4 text-slate-700">
                            <p>{customer.plan_name ?? "—"}</p>
                            <p className="mt-1 text-xs text-slate-500">{customer.amount_monthly !== null ? `${brl.format(customer.amount_monthly)}/mês` : ""}{customer.payment_method ? ` · ${customer.payment_method}` : ""}</p>
                          </td>
                          <td className="py-3 pr-4 text-xs text-slate-600">{customerDeadline(customer)}{customer.created_at && <p className="mt-1 text-slate-400">Cliente desde {formatDate(customer.created_at)}</p>}</td>
                          <td className="py-3 text-xs text-slate-600">{customerUsage(customer)}</td>
                          {canDeleteAccounts && (
                            <td className="py-3 pl-4 text-right">
                              <button type="button" onClick={() => setDeleting(customer)} disabled={customer.group === "pagante"} title={customer.group === "pagante" ? "Academia pagante: cancele a assinatura antes de excluir" : "Excluir conta"} className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent">Excluir</button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      {deleting && <DeleteDojoAccountModal system={system} customer={deleting} onClose={() => setDeleting(null)} onDeleted={() => void overview.reload()} />}

      {overview.data && (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          {overview.data.payments !== undefined && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-950">Cobranças recentes</h3>
              <p className="mt-1 text-sm text-slate-500">Mensalidades cobradas pelo Mercado Pago.</p>
              {overview.data.payments.length === 0 ? <p className="mt-5 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">Nenhuma cobrança registrada ainda.</p> : (
                <div className="mt-5 divide-y divide-slate-100">
                  {overview.data.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <div className="min-w-0"><p className="truncate font-medium text-slate-950">{payment.customer_name ?? "Ótica removida"}</p><p className="text-xs text-slate-500">{formatDate(payment.date)} · {payment.status}</p></div>
                      <span className="shrink-0 font-medium text-slate-950">{payment.amount !== null ? brl.format(payment.amount) : "—"}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {overview.data.support !== undefined && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-950">Chamados de suporte abertos</h3>
              <p className="mt-1 text-sm text-slate-500">Respondidos no painel do Dojo Manager.</p>
              {overview.data.support.length === 0 ? <p className="mt-5 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">Nenhum chamado aberto.</p> : (
                <div className="mt-5 divide-y divide-slate-100">
                  {overview.data.support.map((ticket) => (
                    <div key={ticket.id} className="py-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2"><p className="font-medium text-slate-950">{ticket.subject}</p>{ticket.unread && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">Não lido</span>}</div>
                      <p className="mt-1 text-xs text-slate-500">{ticket.customer_name ?? "Academia"} · {ticket.status.replace("_", " ")}{ticket.priority ? ` · prioridade ${ticket.priority}` : ""} · {formatDate(ticket.last_message_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-950">{overview.data.devices ? "Instalações" : "App do aluno"}</h3>
            <p className="mt-1 text-sm text-slate-500">{overview.data.devices ? "Computadores ativados com a chave de acesso." : "APK publicado pelas academias para os alunos."}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {(overview.data.devices
                ? [["Computadores ativos", overview.data.devices.active], ["Vistos em 7 dias", overview.data.devices.seen_last_7d], ["Ativados em 30 dias", overview.data.devices.activated_last_30d]]
                : overview.data.apk
                  ? [["Downloads do APK", overview.data.apk.downloads], ["Downloads em 30 dias", overview.data.apk.downloads_last_30d], ["Academias com APK", overview.data.apk.academies_with_apk], ["Versões publicadas", overview.data.apk.published_versions]]
                  : []
              ).map(([label, value]) => <div key={String(label)} className="rounded-lg border border-slate-200 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold text-slate-950">{String(value)}</p></div>)}
            </div>
            {overview.data.amt_fees && <p className="mt-4 text-xs text-slate-500">Taxa da AMT sobre cobranças das academias (30 dias): {brl.format(overview.data.amt_fees.last_30d)} em {overview.data.amt_fees.transactions_last_30d} transações.</p>}
          </section>
        </div>
      )}
    </section>
  );
}

type GitHubState = { loading: boolean; private: boolean; error: string; commit: { sha: string; message: string; date: string } | null; issues: number; prs: number };
type ReleaseState = { loading: boolean; error: string; tag: string; publishedAt: string; url: string; downloads: number } | null;

export function SystemsWorkspace({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const setSelectedId = onSelect;
  const selected = systems.find((system) => system.id === selectedId) ?? systems[0];
  const commercial = useCommercialData();
  const [github, setGithub] = useState<GitHubState>({ loading: false, private: false, error: "", commit: null, issues: 0, prs: 0 });
  const [release, setRelease] = useState<ReleaseState>(null);
  const [production, setProduction] = useState<{ status: "verificando" | "no ar" | "sem resposta"; ms: number | null }>({ status: "verificando", ms: null });
  const [leadSearch, setLeadSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const base = "https://api.github.com/repos/" + selected.githubRepo;
    setGithub({ loading: true, private: false, error: "", commit: null, issues: 0, prs: 0 });
    (async (): Promise<GitHubState> => {
      const repoResponse = await fetch(base);
      // Repositório privado: a API pública responde 404 sem token.
      if (repoResponse.status === 404) return { loading: false, private: true, error: "", commit: null, issues: 0, prs: 0 };
      if (!repoResponse.ok) throw new Error("Não foi possível consultar o repositório.");
      const [commits, issues] = await Promise.all([
        fetch(base + "/commits?per_page=1").then((r) => r.ok ? r.json() : []),
        fetch(base + "/issues?state=open&per_page=100").then((r) => r.ok ? r.json() : []),
      ]) as [Array<{ sha: string; commit: { message: string; author?: { date?: string } } }>, Array<{ pull_request?: unknown }>];
      const last = commits[0];
      return {
        loading: false, private: false, error: "",
        commit: last ? { sha: last.sha, message: last.commit.message.split("\n")[0], date: last.commit.author?.date ?? "" } : null,
        issues: issues.filter((item) => !item.pull_request).length,
        prs: issues.filter((item) => Boolean(item.pull_request)).length,
      };
    })()
      .then((state) => { if (active) setGithub(state); })
      .catch((error) => { if (active) setGithub({ loading: false, private: false, error: error instanceof Error ? error.message : "Falha ao consultar o GitHub.", commit: null, issues: 0, prs: 0 }); });

    if (selected.releasesRepo) {
      setRelease({ loading: true, error: "", tag: "", publishedAt: "", url: "", downloads: 0 });
      fetch("https://api.github.com/repos/" + selected.releasesRepo + "/releases/latest")
        .then((r) => r.ok ? r.json() : Promise.reject(new Error("Nenhuma versão publicada encontrada.")))
        .then((data: { tag_name: string; published_at: string; html_url: string; assets?: Array<{ name: string; download_count?: number }> }) => {
          // Só os instaladores: o .sha256 é baixado também pela atualização automática para conferir o arquivo.
          const downloads = (data.assets ?? []).filter((asset) => asset.name.toLowerCase().endsWith(".exe")).reduce((sum, asset) => sum + (asset.download_count ?? 0), 0);
          if (active) setRelease({ loading: false, error: "", tag: data.tag_name, publishedAt: data.published_at, url: data.html_url, downloads });
        })
        .catch((error) => { if (active) setRelease({ loading: false, error: error instanceof Error ? error.message : "Falha ao consultar as versões.", tag: "", publishedAt: "", url: "", downloads: 0 }); });
    } else {
      setRelease(null);
    }

    // Sem CORS a resposta é opaca: só dá para saber se o endereço respondeu.
    setProduction({ status: "verificando", ms: null });
    const started = performance.now();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    fetch(selected.href, { mode: "no-cors", cache: "no-store", signal: controller.signal })
      .then(() => { if (active) setProduction({ status: "no ar", ms: Math.round(performance.now() - started) }); })
      .catch(() => { if (active) setProduction({ status: "sem resposta", ms: null }); })
      .finally(() => window.clearTimeout(timeout));

    return () => { active = false; controller.abort(); };
  }, [selected]);

  const catalogItem = commercial.catalog.find((item) => item.slug === selected.catalogSlug);
  const systemPlans = commercial.plans.filter((plan) => plan.sistema_id === catalogItem?.id);
  const activePlans = systemPlans.filter((plan) => plan.ativo);
  const cheapest = activePlans.reduce<number | null>((min, plan) => plan.preco_mensal !== null && (min === null || Number(plan.preco_mensal) < min) ? Number(plan.preco_mensal) : min, null);
  const systemLeads = commercial.leads.filter((lead) => (catalogItem && lead.sistema_interesse_id === catalogItem.id) || (selected.id === "optione" && isOptioneTrial(lead)));
  const leads30 = systemLeads.filter((lead) => new Date(lead.created_at).getTime() >= daysAgo(30)).length;
  const filteredLeads = systemLeads.filter((lead) => [lead.nome, lead.empresa ?? "", lead.email ?? "", lead.telefone ?? "", lead.observacoes ?? ""].join(" ").toLowerCase().includes(leadSearch.toLowerCase()));
  const isDesktop = Boolean(selected.releasesRepo);
  const host = new URL(selected.href).host;

  async function changeLeadStatus(lead: CommercialLead, status: string) {
    const { data, error } = await amtSupabase.from("manager_leads").update({ status, updated_at: new Date().toISOString() }).eq("id", lead.id).select("id,nome,empresa,email,telefone,origem,status,observacoes,sistema_interesse_id,created_at").single();
    if (error || !data) { setMessage("Não foi possível atualizar o status do lead."); return; }
    commercial.setLeads((items) => items.map((item) => item.id === lead.id ? data as CommercialLead : item));
    const session = await amtSupabase.auth.getSession();
    if (session.data.session) await amtSupabase.from("audit_logs").insert({ actor_user_id: session.data.session.user.id, action: "manager_lead.status_changed", resource_type: "manager_lead", resource_id: lead.id, metadata: { sistema: selected.catalogSlug, from: lead.status, to: status } });
    setMessage("Status do lead atualizado.");
  }

  const stats: Array<[string, string, string, IconType]> = [
    ["Planos ativos", commercial.loading ? "…" : String(activePlans.length), cheapest !== null ? `A partir de ${brl.format(cheapest)}/mês` : "Catálogo comercial do site", Package],
    [isDesktop ? "Testes grátis · 30 dias" : "Leads do site · 30 dias", commercial.leadsError ? "—" : commercial.loading ? "…" : String(leads30), commercial.leadsError ? "Acesso aos leads pendente" : `${systemLeads.length} no total`, Users],
    isDesktop
      ? ["Versão publicada", release?.loading ? "…" : release?.tag || "—", release?.error || (release?.publishedAt ? `${new Date(release.publishedAt).toLocaleDateString("pt-BR")} · ${release.downloads} downloads` : "Instalador Windows"), Download]
      : ["Versão no catálogo", catalogItem?.versao || "—", "Cadastro do sistema no catálogo", Code2],
    ["Produção", production.status === "verificando" ? "…" : production.status === "no ar" ? "No ar" : "Sem resposta", production.ms !== null ? `${host} · ${production.ms} ms` : host, Activity],
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-blue-600">Ecossistema AMT</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Sistemas</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Catálogo, leads, versões, código e infraestrutura de cada produto da AMT.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-blue-50 px-3 py-1.5 font-medium text-blue-700">{systems.length} sistemas</span>
            {systems.map((system) => <span key={system.id} className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">{system.name.replace("AMT ", "")} · {system.platform}</span>)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {systems.map((system) => {
          const Icon = system.icon;
          const active = system.id === selected.id;
          return (
            <button key={system.id} type="button" onClick={() => { setSelectedId(system.id); setMessage(""); setLeadSearch(""); }} className={`rounded-xl border bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md ${active ? "border-blue-500 ring-1 ring-blue-500/20" : "border-slate-200"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100"><Icon className="h-5 w-5 text-slate-900" /></div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">{system.platform}</span>
              </div>
              <h3 className="mt-4 font-semibold text-slate-950">{system.name}</h3>
              <p className="mt-1 text-sm leading-5 text-slate-500">{system.description}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">{system.capabilities.map((capability) => <span key={capability} className="rounded-md bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">{capability}</span>)}</div>
            </button>
          );
        })}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-semibold text-slate-950">{selected.name}</h3>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{selected.platform}</span>
              {catalogItem && !catalogItem.ativo && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">Inativo no catálogo</span>}
            </div>
            <p className="mt-1 text-sm text-slate-500">{selected.description}</p>
          </div>
          <a href={selected.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">Abrir sistema <ExternalLink className="h-4 w-4" /></a>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value, detail, Icon]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Icon className="h-4 w-4 text-blue-700" />{label}</div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-400">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <PlatformSection key={selected.id} system={selected} />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-950">Acessos operacionais</h3>
          <p className="mt-1 text-sm text-slate-500">Painéis, páginas e serviços do sistema selecionado.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {selected.links.map(({ label, hint, href, icon: Icon }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/30">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="rounded-lg bg-slate-100 p-2"><Icon className="h-4 w-4 text-blue-700" /></span>
                  <span className="min-w-0"><span className="block text-sm font-medium text-slate-950">{label}</span><span className="block truncate text-[11px] text-slate-400">{hint}</span></span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
              </a>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-950">GitHub</h3>
          <p className="mt-1 text-sm text-slate-500">Repositório do código-fonte.</p>
          <div className="mt-5 space-y-3">
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Repositório</p><p className="mt-1 truncate text-sm font-medium text-slate-950">{selected.githubRepo}</p></div>
            {github.loading ? <p className="text-xs text-slate-500">Consultando o GitHub…</p> : github.private ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-3 text-xs leading-5 text-slate-500">Repositório privado: a API pública do GitHub não mostra commits, issues e pull requests sem token. Abra o repositório para acompanhar.</div>
            ) : github.error ? <p className="text-xs font-medium text-red-600">{github.error}</p> : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-200 p-3"><p className="text-xs text-slate-500">Issues abertas</p><p className="mt-1 text-lg font-semibold text-slate-950">{github.issues}</p></div>
                  <div className="rounded-lg border border-slate-200 p-3"><p className="text-xs text-slate-500">Pull requests</p><p className="mt-1 text-lg font-semibold text-slate-950">{github.prs}</p></div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3"><p className="text-xs text-slate-500">Último commit</p><p className="mt-1 text-sm font-medium text-slate-950">{github.commit?.message ?? "Não disponível"}</p>{github.commit && <p className="mt-1 font-mono text-[10px] text-slate-400">{github.commit.sha.slice(0, 7)} · {new Date(github.commit.date).toLocaleString("pt-BR")}</p>}</div>
              </>
            )}
            {release && !release.loading && !release.error && (
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Última versão do instalador</p>
                <p className="mt-1 text-sm font-medium text-slate-950">{release.tag}</p>
                <p className="mt-1 text-[11px] text-slate-400">Publicada em {new Date(release.publishedAt).toLocaleDateString("pt-BR")} · {release.downloads} downloads</p>
                <a href={release.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700">Ver release <ExternalLink className="h-3 w-3" /></a>
              </div>
            )}
            <a href={"https://github.com/" + selected.githubRepo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-blue-700">Abrir GitHub <ExternalLink className="h-3.5 w-3.5" /></a>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Planos no catálogo</h3>
            <p className="mt-1 text-sm text-slate-500">Planos que o site exibe e vende para o {selected.name}{catalogItem?.trial_dias ? ` · teste grátis de ${catalogItem.trial_dias} dias` : ""}.</p>
          </div>
          {isDesktop && <p className="text-xs text-slate-400">Os códigos dos planos precisam ser os mesmos do sistema.</p>}
        </div>
        {commercial.loading ? <p className="mt-5 text-sm text-slate-500">Carregando…</p> : !catalogItem ? (
          <p className="mt-5 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">Sistema não encontrado no catálogo (manager_sistemas, slug {selected.catalogSlug}).</p>
        ) : systemPlans.length === 0 ? (
          <p className="mt-5 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">Nenhum plano cadastrado para este sistema.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500"><th className="py-2 pr-4 font-medium">Plano</th><th className="py-2 pr-4 font-medium">Código</th><th className="py-2 pr-4 font-medium">Mensal</th><th className="py-2 pr-4 font-medium">Anual</th><th className="py-2 font-medium">Situação</th></tr></thead>
              <tbody>
                {systemPlans.map((plan) => (
                  <tr key={plan.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-medium text-slate-950">{plan.nome}{plan.destaque && <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">Destaque</span>}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-500">{plan.slug}</td>
                    <td className="py-3 pr-4 text-slate-700">{plan.preco_mensal !== null ? brl.format(Number(plan.preco_mensal)) : "—"}</td>
                    <td className="py-3 pr-4 text-slate-700">{plan.preco_anual !== null ? brl.format(Number(plan.preco_anual)) : "—"}</td>
                    <td className="py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${plan.ativo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{plan.ativo ? "Ativo" : "Inativo"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">{isDesktop ? "Testes grátis e leads" : "Leads do site"}</h3>
            <p className="mt-1 text-sm text-slate-500">{isDesktop ? "Cada teste grátis feito pelo site vira um lead com o código da ótica e o fim do teste." : "Contatos comerciais interessados neste sistema."}</p>
          </div>
          <div className="flex gap-2">
            <label className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)} placeholder="Buscar" className="w-48 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-950 outline-none focus:border-blue-500" /></label>
            <Button type="button" variant="outline" size="sm" onClick={() => void commercial.reload()} className="h-9 gap-2"><RefreshCw className="h-4 w-4" /> Atualizar</Button>
          </div>
        </div>
        {message && <p className="mt-4 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">{message}</p>}
        {commercial.leadsError ? <p className="mt-5 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">{commercial.leadsError}</p> : commercial.loading ? <p className="mt-5 text-sm text-slate-500">Carregando…</p> : filteredLeads.length === 0 ? (
          <p className="mt-5 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">{systemLeads.length ? "Nenhum lead encontrado para a busca." : "Nenhum lead registrado para este sistema ainda."}</p>
        ) : (
          <div className="mt-5 divide-y divide-slate-100">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-950">{lead.empresa || lead.nome}</p>
                    {isOptioneTrial(lead) && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">Teste grátis</span>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{[lead.empresa ? lead.nome : null, lead.email, lead.telefone].filter(Boolean).join(" · ") || "Sem contato"} · {new Date(lead.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
                  {lead.observacoes && <p className="mt-2 whitespace-pre-line text-xs leading-5 text-slate-600">{lead.observacoes}</p>}
                </div>
                <select value={lead.status} onChange={(e) => void changeLeadStatus(lead, e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950">
                  {commercialLeadStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  {!commercialLeadStatuses.some(([value]) => value === lead.status) && <option value={lead.status}>{lead.status}</option>}
                </select>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  IMPLEMENTATION_STATUS,
  PLAN_FREQUENCY,
  TEAM_ROLE,
  WEEKDAYS,
  brl,
  implementationCall,
  type ImplementationDetail,
  type ImplementationPayload,
  type ImplementationSummary,
} from "@/lib/admin/implementation";

// Implantações: pedidos de implantação assistida (grátis) das academias do AMT Dojo Manager. O dono preenche no
// painel dele; aqui a AMT revisa, corrige se precisar e aplica no banco do Dojo numa transação só
// (public.dojo_apply_implementation, via Edge Function `implementation`).

const FILTERS = [
  ["fila", "Fila", (s: string) => s === "enviada" || s === "em_implantacao"],
  ["concluida", "Concluídas", (s: string) => s === "concluida"],
  ["rascunho", "Rascunhos", (s: string) => s === "rascunho"],
  ["cancelada", "Canceladas", (s: string) => s === "cancelada"],
  ["todas", "Todas", () => true],
] as const;

const TABS = ["Resumo", "Planos", "Turmas", "Equipe", "Alunos", "Dados (JSON)"] as const;

function StatusBadge({ status }: { status: string }) {
  const meta = IMPLEMENTATION_STATUS[status] ?? IMPLEMENTATION_STATUS.rascunho;
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

const date = (v: string | null | undefined, withTime = false) =>
  v
    ? withTime
      ? new Date(v).toLocaleString("pt-BR")
      : new Date(v).toLocaleDateString("pt-BR")
    : "—";

export function ImplementationWorkspace({
  selectedId,
  onSelect,
}: {
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
}) {
  const [items, setItems] = useState<ImplementationSummary[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("fila");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const data = await implementationCall<{ requests: ImplementationSummary[] }>("list");
      setItems(data.requests);
      setMessage("");
    } catch (error) {
      setItems([]);
      setMessage(error instanceof Error ? error.message : "Não foi possível carregar os pedidos.");
    }
  }
  useEffect(() => {
    void load();
  }, []);

  const all = items ?? [];
  const test = FILTERS.find((f) => f[0] === filter)?.[2] ?? (() => true);
  const filtered = all.filter((r) => test(r.status));

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Implantações</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pedidos de implantação assistida do AMT Dojo Manager. Revise os dados que a academia
            enviou e aplique no banco.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </div>

      {message ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Na fila", all.filter((r) => r.status === "enviada").length],
          ["Em implantação", all.filter((r) => r.status === "em_implantacao").length],
          ["Concluídas", all.filter((r) => r.status === "concluida").length],
          ["Rascunhos", all.filter((r) => r.status === "rascunho").length],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {items === null ? "…" : String(value)}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar pedidos">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            onClick={() => setFilter(key)}
            className={`rounded-full border px-3 py-1.5 text-sm ${filter === key ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {items === null ? (
            <div className="p-10 text-center text-sm text-slate-500">Carregando pedidos…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">Nenhum pedido aqui.</div>
          ) : (
            filtered.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelect(r.id)}
                className={`block w-full border-b border-slate-100 px-4 py-3.5 text-left last:border-0 hover:bg-slate-50 ${selectedId === r.id ? "bg-blue-50/60" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-medium text-slate-950">{r.trade_name}</p>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {[r.city, r.state].filter(Boolean).join("/") || "—"} · {r.counts.students} alunos
                  · {r.counts.plans} planos · {r.counts.classes} turmas
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {r.submitted_at
                    ? `Enviado em ${date(r.submitted_at, true)}`
                    : `Atualizado em ${date(r.updated_at, true)}`}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {selectedId ? (
            <ImplementationDetailPanel
              key={selectedId}
              id={selectedId}
              onChanged={() => void load()}
            />
          ) : (
            <div className="flex min-h-64 items-center justify-center text-center text-sm text-slate-500">
              Selecione um pedido para revisar.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ImplementationDetailPanel({ id, onChanged }: { id: string; onChanged: () => void }) {
  const [detail, setDetail] = useState<ImplementationDetail | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Resumo");
  const [notes, setNotes] = useState("");
  const [json, setJson] = useState("");
  const [busy, setBusy] = useState(false);
  const [notify, setNotify] = useState(true);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function load() {
    try {
      const data = await implementationCall<ImplementationDetail>("get", { id });
      setDetail(data);
      setNotes(data.request.admin_notes ?? "");
      setJson(JSON.stringify(data.request.payload ?? {}, null, 2));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível abrir o pedido.");
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recarrega só quando troca o pedido
  }, [id]);

  async function run(label: string, fn: () => Promise<unknown>, okText: string) {
    setBusy(true);
    setFeedback(null);
    try {
      await fn();
      setFeedback({ kind: "ok", text: okText });
    } catch (e) {
      setFeedback({
        kind: "error",
        text: `${label}: ${e instanceof Error ? e.message : "falhou"}`,
      });
    } finally {
      // Recarrega mesmo com erro: "aplicada, mas o WhatsApp falhou" já mudou o pedido.
      await load();
      onChanged();
      setBusy(false);
    }
  }

  const p: ImplementationPayload = detail?.request.payload ?? {};
  const newActive = useMemo(
    () => (p.students ?? []).filter((s) => !s.status || s.status === "active").length,
    [p.students],
  );

  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!detail) return <p className="text-sm text-slate-500">Carregando…</p>;

  const r = detail.request;
  const editable = r.status !== "concluida";
  const canApply = r.status === "enviada" || r.status === "em_implantacao";
  const overLimit =
    detail.plan_limit !== null && detail.active_students + newActive > detail.plan_limit;
  const result = (r.result ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-5 text-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-950">
              {String(p.academy?.trade_name || detail.academy?.trade_name || "(sem nome)")}
            </h3>
            <StatusBadge status={r.status} />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {detail.owner_email ?? "—"} · WhatsApp{" "}
            {String(p.academy?.whatsapp || detail.academy?.whatsapp || "—")} · Plano{" "}
            {detail.subscription?.plan_code ?? "—"} (
            {detail.subscription?.status ?? "sem assinatura"})
            {detail.subscription?.trial_ends_at
              ? ` · teste até ${date(detail.subscription.trial_ends_at)}`
              : ""}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Enviado {date(r.submitted_at, true)} · Iniciado {date(r.started_at, true)} · Concluído{" "}
            {date(r.completed_at, true)}
            {r.trial_after_implementation ? " · teste de 14 dias começa na conclusão" : ""}
          </p>
        </div>
      </header>

      {overLimit ? (
        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            O plano permite {detail.plan_limit} alunos ativos: a academia já tem{" "}
            {detail.active_students} e a planilha traz {newActive}. A aplicação vai falhar até a
            academia trocar de plano ou parte dos alunos ser marcada como inativa.
          </p>
        </div>
      ) : null}

      {r.status === "concluida" ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
          <p className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4" /> Implantação aplicada em{" "}
            {date(String(result.applied_at ?? r.completed_at), true)}
          </p>
          <p className="mt-1 text-xs">
            {String(result.students_created ?? 0)} alunos novos (
            {String(result.students_existing ?? 0)} já existiam) ·{" "}
            {String(result.plans_created ?? 0)} planos · {String(result.classes_created ?? 0)}{" "}
            turmas · {String(result.team_created ?? 0)} na equipe ·{" "}
            {String(result.enrollments_created ?? 0)} matrículas ·{" "}
            {String(result.class_links_created ?? 0)} vínculos com turmas · cobrança a partir de{" "}
            {String(result.billing_start ?? "—")}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1 border-b border-slate-200" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === t ? "border-blue-600 font-medium text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            {t}
            {t === "Alunos"
              ? ` (${p.students?.length ?? 0})`
              : t === "Planos"
                ? ` (${p.plans?.length ?? 0})`
                : t === "Turmas"
                  ? ` (${p.classes?.length ?? 0})`
                  : t === "Equipe"
                    ? ` (${p.team?.length ?? 0})`
                    : ""}
          </button>
        ))}
      </div>

      {tab === "Resumo" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <dl className="space-y-1.5 text-xs">
            {[
              ["Nome", p.academy?.trade_name],
              ["Razão social", p.academy?.legal_name],
              ["CNPJ/CPF", p.academy?.cnpj],
              ["Responsável", p.academy?.responsible_name],
              ["E-mail", p.academy?.email],
              ["Instagram", p.academy?.instagram],
              [
                "Endereço",
                [
                  p.academy?.address,
                  p.academy?.address_number,
                  p.academy?.address_complement,
                  p.academy?.neighborhood,
                ]
                  .filter(Boolean)
                  .join(", "),
              ],
              ["Cidade", [p.academy?.city, p.academy?.state].filter(Boolean).join("/")],
              ["CEP", p.academy?.zip],
              ["Modalidades", (p.academy?.modalities as string[] | undefined)?.join(", ")],
              ["Vencimento padrão", p.billing?.due_day_default],
              ["Cobrar a partir de", p.billing?.start_month],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="flex justify-between gap-3 border-b border-slate-100 pb-1"
              >
                <dt className="text-slate-500">{String(label)}</dt>
                <dd className="text-right text-slate-950">{value ? String(value) : "—"}</dd>
              </div>
            ))}
          </dl>
          <div className="space-y-3">
            {p.academy?.logo_url ? (
              <img
                src={String(p.academy.logo_url)}
                alt="Logo enviado"
                className="h-16 w-auto rounded border border-slate-200 p-1"
              />
            ) : null}
            <div>
              <p className="text-xs text-slate-500">Observações do cliente</p>
              <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-slate-800">
                {p.notes || "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === "Planos" && (
        <SimpleTable
          head={["Plano", "Valor", "Cobrança", "Matrícula", "Pagamento"]}
          rows={(p.plans ?? []).map((x) => [
            String(x.name ?? ""),
            brl(x.amount),
            PLAN_FREQUENCY[String(x.frequency)] ?? String(x.frequency ?? ""),
            brl(x.enrollment_fee),
            ((x.payment_methods as string[]) ?? []).join(", "),
          ])}
        />
      )}

      {tab === "Turmas" && (
        <SimpleTable
          head={["Turma", "Modalidade", "Professor", "Vagas", "Horários"]}
          rows={(p.classes ?? []).map((x) => [
            String(x.name ?? ""),
            String(x.modality ?? ""),
            String(x.teacher_name ?? ""),
            String(x.max_students ?? ""),
            (x.schedules ?? [])
              .map((s) => `${WEEKDAYS[s.weekday]} ${s.start_time}–${s.end_time}`)
              .join(", "),
          ])}
        />
      )}

      {tab === "Equipe" && (
        <SimpleTable
          head={["Nome", "Função", "E-mail", "WhatsApp"]}
          rows={(p.team ?? []).map((x) => [
            String(x.full_name ?? ""),
            TEAM_ROLE[String(x.role)] ?? String(x.role ?? ""),
            String(x.email ?? ""),
            String(x.phone ?? ""),
          ])}
        />
      )}

      {tab === "Alunos" && (
        <SimpleTable
          head={["Nome", "CPF", "Nasc.", "Telefone", "Plano", "Turmas", "Faixa", "Venc.", "Status"]}
          rows={(p.students ?? []).map((s) => [
            s.full_name,
            s.cpf ?? "",
            s.birth_date ?? "",
            s.phone ?? "",
            s.plan ?? "",
            s.classes ?? "",
            [s.belt, s.degree ? `${s.degree}º` : ""].filter(Boolean).join(" "),
            s.due_day ?? "",
            s.status ?? "active",
          ])}
        />
      )}

      {tab === "Dados (JSON)" && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            Corrija aqui o que a academia enviou (nomes de plano/turma, datas, valores). Salve antes
            de aplicar.
          </p>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            readOnly={!editable}
            spellCheck={false}
            rows={22}
            aria-label="Dados do pedido em JSON"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-900 outline-none focus:border-blue-500"
          />
          {editable ? (
            <Button
              variant="outline"
              disabled={busy}
              className="gap-2"
              onClick={() => {
                let parsed: unknown;
                try {
                  parsed = JSON.parse(json);
                } catch {
                  setFeedback({ kind: "error", text: "JSON inválido: confira vírgulas e aspas." });
                  return;
                }
                void run(
                  "Salvar dados",
                  () => implementationCall("save", { id, payload: parsed }),
                  "Dados salvos.",
                );
              }}
            >
              <Save className="h-4 w-4" /> Salvar dados
            </Button>
          ) : null}
        </div>
      )}

      <div className="space-y-2 border-t border-slate-200 pt-4">
        <label htmlFor="impl-admin-notes" className="text-xs font-medium text-slate-600">
          Notas internas da AMT
        </label>
        <textarea
          id="impl-admin-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          readOnly={!editable}
          className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500"
        />
        {editable ? (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() =>
              void run(
                "Salvar notas",
                () => implementationCall("save", { id, admin_notes: notes }),
                "Notas salvas.",
              )
            }
          >
            Salvar notas
          </Button>
        ) : null}
      </div>

      {feedback ? (
        <p
          role="status"
          className={`rounded-lg border p-3 ${feedback.kind === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}
        >
          {feedback.text}
        </p>
      ) : null}

      {editable ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
          {r.status === "enviada" ? (
            <Button
              variant="outline"
              disabled={busy}
              className="gap-2"
              onClick={() =>
                void run(
                  "Iniciar",
                  () => implementationCall("save", { id, status: "em_implantacao" }),
                  "Implantação iniciada.",
                )
              }
            >
              <Play className="h-4 w-4" /> Iniciar implantação
            </Button>
          ) : null}
          {r.status === "em_implantacao" || r.status === "cancelada" ? (
            <Button
              variant="outline"
              disabled={busy}
              className="gap-2"
              onClick={() =>
                void run(
                  "Voltar para a fila",
                  () => implementationCall("save", { id, status: "enviada" }),
                  "Pedido de volta na fila.",
                )
              }
            >
              <RotateCcw className="h-4 w-4" /> Voltar para a fila
            </Button>
          ) : null}
          {r.status !== "cancelada" && r.status !== "rascunho" ? (
            <Button
              variant="outline"
              disabled={busy}
              className="gap-2 text-red-700"
              onClick={() => {
                if (
                  !window.confirm(
                    "Cancelar este pedido de implantação? A academia verá o pedido como cancelado.",
                  )
                )
                  return;
                void run(
                  "Cancelar",
                  () => implementationCall("save", { id, status: "cancelada" }),
                  "Pedido cancelado.",
                );
              }}
            >
              <XCircle className="h-4 w-4" /> Cancelar
            </Button>
          ) : null}
          {canApply ? (
            <>
              <label className="ml-auto flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={notify}
                  onChange={(e) => setNotify(e.target.checked)}
                />{" "}
                Avisar a academia no WhatsApp
              </label>
              <Button
                disabled={busy}
                className="gap-2 bg-blue-700 text-white hover:bg-blue-800"
                onClick={() => {
                  if (
                    !window.confirm(
                      `Aplicar no banco do Dojo?\n\nGrava academia, ${p.plans?.length ?? 0} planos, ${p.classes?.length ?? 0} turmas, ${p.team?.length ?? 0} pessoas e ${p.students?.length ?? 0} alunos (com matrículas) de uma vez. Salve antes qualquer correção no JSON.`,
                    )
                  )
                    return;
                  void run(
                    "Aplicar",
                    async () => {
                      const out = await implementationCall<{
                        whatsapp: { sent: boolean; error?: string } | null;
                      }>("apply", { id, notify_whatsapp: notify });
                      if (out.whatsapp && !out.whatsapp.sent)
                        throw new Error(
                          `Implantação aplicada, mas o WhatsApp não foi enviado (${out.whatsapp.error ?? "erro"}).`,
                        );
                    },
                    notify
                      ? "Implantação aplicada e academia avisada no WhatsApp."
                      : "Implantação aplicada.",
                  );
                }}
              >
                <Database className="h-4 w-4" /> {busy ? "Aplicando…" : "Aplicar no banco"}
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SimpleTable({ head, rows }: { head: string[]; rows: string[][] }) {
  if (rows.length === 0) return <p className="text-slate-500">Nada informado.</p>;
  return (
    <div className="max-h-[420px] overflow-auto rounded-lg border border-slate-200">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-slate-50 text-slate-500">
          <tr>
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-slate-100">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-1.5 text-slate-800">
                  {cell || "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { iaGerarMensagem } from "@/lib/crm/ai-service.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
  Clock,
  Calendar,
  Syringe,
  Stethoscope,
  RefreshCw,
} from "lucide-react";

/* -------------------- TEMPLATES PRONTOS -------------------- */

type Template = {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  icon: typeof Calendar;
  template: string;
};

const TEMPLATES: Template[] = [
  {
    id: "consulta-24h",
    tipo: "consulta",
    titulo: "Confirmação de consulta (24h antes)",
    descricao: "Envie 1 dia antes para reduzir faltas.",
    icon: Calendar,
    template:
      "Olá {{nome}}! Passando para lembrar da sua consulta amanhã ({{data}}) às {{hora}} com {{profissional}}. Podemos confirmar a presença? 🙂",
  },
  {
    id: "consulta-2h",
    tipo: "consulta",
    titulo: "Lembrete de consulta (2h antes)",
    descricao: "Aviso curto no mesmo dia.",
    icon: Clock,
    template:
      "Oi {{nome}}, sua consulta é hoje às {{hora}}. Endereço: {{endereco}}. Até já!",
  },
  {
    id: "vacina-proxima",
    tipo: "vacina",
    titulo: "Vacinação — próxima dose (Vet)",
    descricao: "Lembrete de reforço vacinal.",
    icon: Syringe,
    template:
      "Olá {{nome}}! Está na hora da próxima dose da vacina {{vacina}} do {{pet}}. Podemos agendar para esta semana?",
  },
  {
    id: "exame-agendado",
    tipo: "exame",
    titulo: "Exame agendado",
    descricao: "Confirma exame + preparo.",
    icon: Stethoscope,
    template:
      "Oi {{nome}}, seu exame de {{exame}} está agendado para {{data}} às {{hora}}. Preparo: {{preparo}}. Qualquer dúvida é só responder.",
  },
  {
    id: "exame-resultado",
    tipo: "exame",
    titulo: "Retorno para resultado de exame",
    descricao: "Convida para retorno após exame.",
    icon: RefreshCw,
    template:
      "Olá {{nome}}, o resultado do seu exame de {{exame}} já está disponível. Podemos agendar um retorno para {{profissional}} avaliar com você?",
  },
  {
    id: "reativacao",
    tipo: "reativacao",
    titulo: "Reativação de cliente inativo",
    descricao: "Cliente sem visita há X dias.",
    icon: MessageCircle,
    template:
      "Oi {{nome}}, faz {{dias}} dias que não nos vemos por aqui. Que tal agendar um check-up? Tenho horários abertos esta semana.",
  },
];

/* -------------------- CONFIG / STATUS -------------------- */

function StatusIntegracao() {
  const [status, setStatus] = useState<
    | { estado: "loading" }
    | { estado: "ok"; tipo: string; nome: string }
    | { estado: "vazio" }
    | { estado: "erro"; msg: string }
  >({ estado: "loading" });

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("crm_integracoes")
        .select("tipo, nome, ativo")
        .in("tipo", ["whatsapp_cloud", "evolution_api", "twilio_whatsapp"])
        .eq("ativo", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) return setStatus({ estado: "erro", msg: error.message });
      if (!data) return setStatus({ estado: "vazio" });
      setStatus({ estado: "ok", tipo: data.tipo, nome: data.nome ?? data.tipo });
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Integração WhatsApp do cliente</CardTitle>
            <CardDescription>
              Credenciais ficam em <strong>/crm/integracoes</strong> — cada cliente configura o
              provedor (Meta Cloud API, Evolution ou webhook).
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/crm/integracoes">Abrir integrações</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {status.estado === "loading" && (
          <p className="text-sm text-muted-foreground">Verificando…</p>
        )}
        {status.estado === "ok" && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>
              Provedor ativo: <strong>{status.nome}</strong>{" "}
              <Badge variant="secondary" className="ml-1">{status.tipo}</Badge>
            </span>
          </div>
        )}
        {status.estado === "vazio" && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              Nenhum provedor WhatsApp ativo. Cadastre em <strong>/crm/integracoes</strong> antes de
              agendar lembretes — o cron vai marcar como falha na hora do envio.
            </div>
          </div>
        )}
        {status.estado === "erro" && (
          <p className="text-sm text-destructive">Erro: {status.msg}</p>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------- AGENDAR LEMBRETE -------------------- */

function toLocalIsoInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function AgendarLembrete({
  onCreated,
  templatePreset,
}: {
  onCreated: () => void;
  templatePreset?: Template | null;
}) {
  const defaultWhen = useMemo(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return toLocalIsoInput(d);
  }, []);

  const [form, setForm] = useState({
    tipo: templatePreset?.tipo ?? "consulta",
    titulo: templatePreset?.titulo ?? "",
    destinatario_nome: "",
    destinatario_telefone: "",
    template: templatePreset?.template ?? "",
    agendado_para: defaultWhen,
    variaveis_json: "{}",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (templatePreset) {
      setForm((f) => ({
        ...f,
        tipo: templatePreset.tipo,
        titulo: templatePreset.titulo,
        template: templatePreset.template,
      }));
    }
  }, [templatePreset]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    let variaveis: Record<string, unknown> = {};
    try {
      variaveis = form.variaveis_json.trim() ? JSON.parse(form.variaveis_json) : {};
    } catch {
      toast.error("Variáveis: JSON inválido");
      return;
    }

    if (!form.destinatario_telefone.trim()) {
      toast.error("Informe o telefone com DDI/DDD (ex: 5511999999999)");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("crm_lembretes" as any).insert({
        tipo: form.tipo,
        titulo: form.titulo || null,
        destinatario_nome: form.destinatario_nome || null,
        destinatario_telefone: form.destinatario_telefone.replace(/\D/g, ""),
        template: form.template,
        variaveis,
        agendado_para: new Date(form.agendado_para).toISOString(),
        status: "pendente",
      });
      if (error) throw error;
      toast.success("Lembrete agendado");
      setForm((f) => ({
        ...f,
        destinatario_nome: "",
        destinatario_telefone: "",
        variaveis_json: "{}",
      }));
      onCreated();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Agendar lembrete</CardTitle>
        <CardDescription>
          Ele será enfileirado automaticamente e disparado via WhatsApp na hora marcada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={salvar} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm({ ...form, tipo: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["consulta", "vacina", "exame", "retorno", "reativacao", "aniversario", "customizado"].map(
                    (t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Título (opcional)</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex: Confirmação de consulta 24h"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Nome do destinatário</Label>
              <Input
                value={form.destinatario_nome}
                onChange={(e) => setForm({ ...form, destinatario_nome: e.target.value })}
                placeholder="Ex: Maria"
              />
            </div>
            <div>
              <Label>Telefone (com DDI+DDD)</Label>
              <Input
                value={form.destinatario_telefone}
                onChange={(e) => setForm({ ...form, destinatario_telefone: e.target.value })}
                placeholder="5511999999999"
              />
            </div>
          </div>

          <div>
            <Label>Data/hora do envio</Label>
            <Input
              type="datetime-local"
              value={form.agendado_para}
              onChange={(e) => setForm({ ...form, agendado_para: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Mensagem (use {"{{variavel}}"} para substituições)</Label>
            <Textarea
              value={form.template}
              onChange={(e) => setForm({ ...form, template: e.target.value })}
              rows={5}
              placeholder="Olá {{nome}}, sua consulta é hoje às {{hora}}."
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Variáveis nativas: <code>{"{{nome}}"}</code>, <code>{"{{telefone}}"}</code>,{" "}
              <code>{"{{titulo}}"}</code>, <code>{"{{tipo}}"}</code>. Outras vêm do JSON abaixo.
            </p>
          </div>

          <div>
            <Label>Variáveis (JSON)</Label>
            <Textarea
              value={form.variaveis_json}
              onChange={(e) => setForm({ ...form, variaveis_json: e.target.value })}
              rows={3}
              placeholder='{"data":"12/07","hora":"14:30","profissional":"Dra. Ana"}'
              className="font-mono text-xs"
            />
          </div>

          <Button type="submit" disabled={saving}>
            <Send className="mr-2 h-4 w-4" />
            {saving ? "Agendando…" : "Agendar lembrete"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* -------------------- FILA -------------------- */

type LembreteRow = {
  id: string;
  tipo: string;
  titulo: string | null;
  destinatario_nome: string | null;
  destinatario_telefone: string;
  agendado_para: string;
  status: string;
  erro: string | null;
  tentativas: number;
  template: string;
};

function FilaLembretes({ refreshKey }: { refreshKey: number }) {
  const [rows, setRows] = useState<LembreteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>("todos");

  async function carregar() {
    setLoading(true);
    let q = supabase
      .from("crm_lembretes" as any)
      .select(
        "id, tipo, titulo, destinatario_nome, destinatario_telefone, agendado_para, status, erro, tentativas, template",
      )
      .order("agendado_para", { ascending: false })
      .limit(100);
    if (filtro !== "todos") q = q.eq("status", filtro);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    else setRows((data ?? []) as unknown as LembreteRow[]);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, filtro]);

  async function cancelar(id: string) {
    const { error } = await supabase
      .from("crm_lembretes" as any)
      .update({ status: "cancelado" })
      .eq("id", id);
    if (error) toast.error(error.message);
    else carregar();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este lembrete?")) return;
    const { error } = await supabase.from("crm_lembretes" as any).delete().eq("id", id);
    if (error) toast.error(error.message);
    else carregar();
  }

  const badgeVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
    if (s === "enviado") return "default";
    if (s === "falha") return "destructive";
    if (s === "cancelado") return "outline";
    return "secondary";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Fila de lembretes</CardTitle>
            <CardDescription>Processada a cada 5 minutos.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filtro} onValueChange={setFiltro}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["todos", "pendente", "enviado", "falha", "cancelado"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={carregar}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum lembrete.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={badgeVariant(r.status)}>{r.status}</Badge>
                    <Badge variant="outline">{r.tipo}</Badge>
                    <span className="text-sm font-medium">
                      {r.destinatario_nome ?? r.destinatario_telefone}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {r.destinatario_telefone}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(r.agendado_para).toLocaleString("pt-BR")}
                    {r.titulo ? ` · ${r.titulo}` : ""}
                    {r.tentativas > 0 ? ` · ${r.tentativas} tentativa(s)` : ""}
                  </div>
                  {r.erro && (
                    <p className="mt-1 line-clamp-2 text-xs text-destructive">Erro: {r.erro}</p>
                  )}
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.template}</p>
                </div>
                <div className="flex gap-2">
                  {r.status === "pendente" && (
                    <Button variant="outline" size="sm" onClick={() => cancelar(r.id)}>
                      Cancelar
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => excluir(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------- TEMPLATES -------------------- */

function TemplatesGrid({ onUsar }: { onUsar: (t: Template) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {TEMPLATES.map((t) => {
        const Icon = t.icon;
        return (
          <Card key={t.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm">{t.titulo}</CardTitle>
                  <CardDescription className="text-xs">{t.descricao}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="line-clamp-4 rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground">
                {t.template}
              </p>
              <Button size="sm" variant="outline" className="w-full" onClick={() => onUsar(t)}>
                Usar este template
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* -------------------- GERADOR IA (mantido) -------------------- */

function GeradorMensagem() {
  const [empresa, setEmpresa] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tom, setTom] = useState("consultivo");
  const [objetivo, setObjetivo] = useState("agendar consulta");
  const [saida, setSaida] = useState("");
  const [loading, setLoading] = useState(false);
  const gerar = useServerFn(iaGerarMensagem);

  async function run() {
    setLoading(true);
    setSaida("");
    try {
      const r = await gerar({
        data: { canal: "whatsapp", empresa, categoria, tom, objetivo, cta: "confirmar agendamento" },
      });
      setSaida(r.content);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gerar mensagem WhatsApp com IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Destinatário / empresa</Label>
            <Input value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
          </div>
          <div>
            <Label>Categoria / segmento</Label>
            <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ex: Clínica veterinária" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tom</Label>
              <Select value={tom} onValueChange={setTom}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["profissional", "consultivo", "formal", "descontraido", "urgencia", "educacional"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Objetivo</Label>
              <Input value={objetivo} onChange={(e) => setObjetivo(e.target.value)} />
            </div>
          </div>
          <Button onClick={run} disabled={loading} className="w-full">
            <Sparkles className="mr-2 h-4 w-4" /> {loading ? "Gerando…" : "Gerar com IA"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resultado</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={saida}
            onChange={(e) => setSaida(e.target.value)}
            className="min-h-64"
            placeholder="A mensagem gerada aparecerá aqui — pode editar antes de copiar."
          />
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- PAGE -------------------- */

function WhatsAppPage() {
  const [preset, setPreset] = useState<Template | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">WhatsApp — Lembretes</h1>
        <p className="text-sm text-muted-foreground">
          Configure o provedor do cliente, escolha um template e agende lembretes de consultas,
          vacinação, exames e retornos.
        </p>
      </div>

      <StatusIntegracao />

      <Tabs defaultValue="agendar">
        <TabsList>
          <TabsTrigger value="agendar">Agendar</TabsTrigger>
          <TabsTrigger value="templates">Templates prontos</TabsTrigger>
          <TabsTrigger value="fila">Fila</TabsTrigger>
          <TabsTrigger value="ia">Gerar com IA</TabsTrigger>
        </TabsList>

        <TabsContent value="agendar" className="mt-4">
          <AgendarLembrete
            templatePreset={preset}
            onCreated={() => setRefreshKey((k) => k + 1)}
          />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <TemplatesGrid
            onUsar={(t) => {
              setPreset(t);
              toast.success(`Template "${t.titulo}" carregado na aba Agendar`);
            }}
          />
        </TabsContent>

        <TabsContent value="fila" className="mt-4">
          <FilaLembretes refreshKey={refreshKey} />
        </TabsContent>

        <TabsContent value="ia" className="mt-4">
          <GeradorMensagem />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const Route = createFileRoute("/crm/whatsapp")({
  head: () => ({
    meta: [
      { title: "WhatsApp · Lembretes · CRM" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: WhatsAppPage,
});

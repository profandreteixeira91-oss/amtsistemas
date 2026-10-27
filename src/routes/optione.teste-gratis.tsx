import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  KeyRound,
  Loader2,
  LogIn,
  MessageCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChaveDeAcesso } from "@/components/optione/access-key";
import { Eyebrow, OPTIONE_WHATSAPP_URL, OptioneShell } from "@/components/optione/shell";
import {
  optioneCriarTeste,
  optioneVerificarCodigo,
  type OptioneCadastroResultado,
} from "@/lib/optione.functions";

const PLANOS = [
  { slug: "essencial", nome: "Essencial" },
  { slug: "profissional", nome: "Profissional" },
  { slug: "rede", nome: "Rede" },
] as const;
type PlanoSlug = (typeof PLANOS)[number]["slug"];

const STORE_CODE_RE = /^[a-z0-9][a-z0-9-]{2,30}[a-z0-9]$/;

export const Route = createFileRoute("/optione/teste-gratis")({
  validateSearch: (search: Record<string, unknown>): { plano?: PlanoSlug } => {
    const plano = String(search.plano ?? "");
    return PLANOS.some((p) => p.slug === plano) ? { plano: plano as PlanoSlug } : {};
  },
  head: () => ({
    meta: [
      { title: "Teste grátis por 14 dias | AMT OptiOne" },
      {
        name: "description",
        content: "Cadastre a sua ótica e use o AMT OptiOne por 14 dias, sem cartão de crédito.",
      },
      { name: "robots", content: "index, follow" },
    ],
    links: [
      { rel: "canonical", href: "https://amtsistemas.com.br/optione/teste-gratis" },
      { rel: "icon", href: "/optione/icone-amt-optione.png" },
    ],
  }),
  component: TesteGratisPage,
});

/** "Ótica São João Ltda." -> "otica-sao-joao-ltda" (mesma regra do sistema). */
function sugerirCodigo(nome: string) {
  const codigo = nome
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
    .replace(/-+$/g, "");
  return STORE_CODE_RE.test(codigo) ? codigo : "";
}

function TesteGratisPage() {
  const { plano } = Route.useSearch();
  const [resultado, setResultado] = useState<Extract<
    OptioneCadastroResultado,
    { ok: true }
  > | null>(null);
  return (
    <OptioneShell showCta={false}>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 45% at 50% 0%, oklch(0.7 0.11 190 / 0.14), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
          {resultado ? (
            <Sucesso resultado={resultado} />
          ) : (
            <Formulario planoInicial={plano} onSucesso={setResultado} />
          )}
        </div>
      </section>
    </OptioneShell>
  );
}

function Formulario({
  planoInicial,
  onSucesso,
}: {
  planoInicial?: PlanoSlug;
  onSucesso: (r: Extract<OptioneCadastroResultado, { ok: true }>) => void;
}) {
  const criar = useServerFn(optioneCriarTeste);
  const verificar = useServerFn(optioneVerificarCodigo);
  const [form, setForm] = useState({
    store_name: "",
    store_code: "",
    owner_name: "",
    email: "",
    password: "",
    confirm: "",
    document: "",
    whatsapp: "",
    plan_id: (planoInicial ?? "profissional") as PlanoSlug,
    website: "",
  });
  const [codigoEditado, setCodigoEditado] = useState(false);
  const [codigoInfo, setCodigoInfo] = useState<{ tone: "ok" | "erro"; texto: string } | null>(null);
  const [aceite, setAceite] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const set = (campo: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  function alterarNome(e: React.ChangeEvent<HTMLInputElement>) {
    const store_name = e.target.value;
    setForm((f) => ({
      ...f,
      store_name,
      store_code: codigoEditado ? f.store_code : sugerirCodigo(store_name),
    }));
    if (!codigoEditado) setCodigoInfo(null);
  }

  function alterarCodigo(e: React.ChangeEvent<HTMLInputElement>) {
    const store_code = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 32);
    setCodigoEditado(Boolean(store_code));
    setForm((f) => ({ ...f, store_code }));
    setCodigoInfo(null);
  }

  async function conferirCodigo() {
    const codigo = form.store_code;
    if (!codigo) return;
    if (!STORE_CODE_RE.test(codigo)) {
      setCodigoInfo({
        tone: "erro",
        texto: "Use 4 a 32 letras minúsculas, números ou hífen (sem hífen no início ou no fim).",
      });
      return;
    }
    const r = await verificar({ data: { store_code: codigo } });
    if (r.available) setCodigoInfo({ tone: "ok", texto: "Código disponível." });
    else
      setCodigoInfo({
        tone: "erro",
        texto: r.suggestion
          ? `Já está em uso. Sugestão: ${r.suggestion}`
          : "Já está em uso. Escolha outro.",
      });
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;
    setErro("");
    if (form.password.length < 8) return setErro("A senha precisa ter pelo menos 8 caracteres.");
    if (form.password !== form.confirm) return setErro("As senhas digitadas não são iguais.");
    if (form.store_code && !STORE_CODE_RE.test(form.store_code))
      return setErro("Código da ótica inválido: use 4 a 32 letras minúsculas, números ou hífen.");
    if (!aceite)
      return setErro("Para continuar, aceite os termos de uso e a política de privacidade.");
    setEnviando(true);
    try {
      const { confirm: _confirm, ...dados } = form;
      const r = await criar({ data: dados });
      if (!r.ok) {
        setErro(r.error);
        return;
      }
      onSucesso(r);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setErro(
        message.includes("[")
          ? "Confira os dados do formulário."
          : "Não foi possível concluir agora. Tente de novo em instantes.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <div>
        <Eyebrow>Teste grátis por 14 dias</Eyebrow>
        <h1 className="text-pretty text-3xl font-semibold tracking-tight sm:text-4xl">
          Cadastre a sua ótica.
        </h1>
        <p className="mt-4 text-muted-foreground">
          Em cerca de 2 minutos você cria o acesso da ótica e recebe a chave para ativar o sistema
          nos seus computadores.
        </p>
        <ul className="mt-6 space-y-3 text-sm">
          {[
            "Todos os recursos do plano escolhido",
            "Sem cartão de crédito e sem compromisso",
            "Seus dados continuam guardados ao contratar",
            "Suporte da AMT pelo WhatsApp",
          ].map((t) => (
            <li key={t} className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-muted-foreground">{t}</span>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-muted-foreground">
          Já tem cadastro e perdeu a chave?{" "}
          <Link to="/optione/nova-chave" className="font-medium text-primary hover:underline">
            Gere uma nova chave de acesso
          </Link>
          .
        </p>
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-5 sm:p-8">
          <form onSubmit={enviar} className="grid gap-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="store_name" label="Nome da ótica *">
                <Input
                  id="store_name"
                  value={form.store_name}
                  onChange={alterarNome}
                  maxLength={120}
                  required
                  autoComplete="organization"
                />
              </Campo>
              <Campo id="store_code" label="Código da ótica">
                <Input
                  id="store_code"
                  value={form.store_code}
                  onChange={alterarCodigo}
                  onBlur={conferirCodigo}
                  placeholder="ex.: otica-central"
                  maxLength={32}
                  autoComplete="off"
                />
              </Campo>
            </div>
            <p
              className={`-mt-2 text-xs ${codigoInfo?.tone === "erro" ? "text-destructive" : "text-muted-foreground"}`}
            >
              {codigoInfo?.texto ??
                "A equipe digita este código com o nome de usuário para entrar no sistema. Não pode ser alterado depois."}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="owner_name" label="Seu nome *">
                <Input
                  id="owner_name"
                  value={form.owner_name}
                  onChange={set("owner_name")}
                  maxLength={80}
                  required
                  autoComplete="name"
                />
              </Campo>
              <Campo id="whatsapp" label="WhatsApp">
                <Input
                  id="whatsapp"
                  value={form.whatsapp}
                  onChange={set("whatsapp")}
                  placeholder="(11) 99999-9999"
                  maxLength={30}
                  autoComplete="tel"
                  inputMode="tel"
                />
              </Campo>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="document" label="CNPJ (opcional)">
                <Input
                  id="document"
                  value={form.document}
                  onChange={set("document")}
                  placeholder="00.000.000/0001-00"
                  maxLength={30}
                  inputMode="numeric"
                />
              </Campo>
              <Campo id="plan_id" label="Plano para testar">
                <Select
                  value={form.plan_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, plan_id: v as PlanoSlug }))}
                >
                  <SelectTrigger id="plan_id">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANOS.map((p) => (
                      <SelectItem key={p.slug} value={p.slug}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>
            </div>

            <div className="mt-2 border-t border-border/70 pt-4">
              <p className="text-sm font-medium">Seu acesso ao sistema</p>
              <p className="text-xs text-muted-foreground">
                Você entra no AMT OptiOne com este e-mail e esta senha.
              </p>
            </div>
            <Campo id="email" label="E-mail *">
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={set("email")}
                maxLength={160}
                required
                autoComplete="email"
              />
            </Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="password" label="Senha *">
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={set("password")}
                  minLength={8}
                  maxLength={72}
                  required
                  autoComplete="new-password"
                  placeholder="Pelo menos 8 caracteres"
                />
              </Campo>
              <Campo id="confirm" label="Confirmar senha *">
                <Input
                  id="confirm"
                  type="password"
                  value={form.confirm}
                  onChange={set("confirm")}
                  maxLength={72}
                  required
                  autoComplete="new-password"
                />
              </Campo>
            </div>

            {/* Campo-isca: escondido de pessoas e de leitores de tela. */}
            <div aria-hidden className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
              <label htmlFor="website">Site</label>
              <input
                id="website"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={set("website")}
              />
            </div>

            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <Checkbox
                checked={aceite}
                onCheckedChange={(v) => setAceite(v === true)}
                className="mt-0.5"
              />
              <span>
                Li e aceito os{" "}
                <a
                  href="/termos"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  termos de uso
                </a>{" "}
                e a{" "}
                <a
                  href="/privacidade"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  política de privacidade
                </a>
                .
              </span>
            </label>

            {erro && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {erro}
              </p>
            )}

            <Button type="submit" size="lg" disabled={enviando} className="mt-1 gap-2">
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {enviando ? "Criando o acesso da ótica…" : "Começar o teste grátis"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Campo({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function Sucesso({ resultado }: { resultado: Extract<OptioneCadastroResultado, { ok: true }> }) {
  const fimDoTeste = new Date(resultado.trial_ends_at).toLocaleDateString("pt-BR");
  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-pretty text-3xl font-semibold tracking-tight">
          Sua ótica está pronta!
        </h1>
        <p className="mt-3 text-muted-foreground">
          O teste grátis vai até <strong className="text-foreground">{fimDoTeste}</strong>. Siga os
          passos abaixo para começar.
        </p>
      </div>

      <div className="mt-8">
        <ChaveDeAcesso chave={resultado.access_key} />
      </div>

      <Card className="mt-6 border-border bg-card shadow-sm">
        <CardContent className="grid gap-3 p-5 text-sm sm:grid-cols-2 sm:p-6">
          <Dado rotulo="Login do dono" valor={resultado.login} />
          <Dado rotulo="Código da ótica" valor={resultado.store_code} />
        </CardContent>
      </Card>

      <ol className="mt-8 space-y-4">
        <Passo n={1} icone={Download} titulo="Instale o AMT OptiOne no Windows">
          {resultado.download_url ? (
            <Button asChild size="sm" className="mt-2 gap-2">
              <a href={resultado.download_url}>
                <Download className="h-4 w-4" /> Baixar o instalador
              </a>
            </Button>
          ) : (
            <span>
              Fale com a nossa equipe para receber o instalador:{" "}
              <a
                href={OPTIONE_WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary hover:underline"
              >
                WhatsApp da AMT
              </a>
              .
            </span>
          )}
        </Passo>
        <Passo n={2} icone={LogIn} titulo="Entre com o seu e-mail e a sua senha">
          Use o login do dono mostrado acima.
        </Passo>
        <Passo n={3} icone={KeyRound} titulo="Informe a chave de acesso">
          No primeiro login em cada computador, o sistema pede a chave uma única vez.
        </Passo>
        <Passo n={4} icone={MessageCircle} titulo="Cadastre a sua equipe">
          Em Configurações → Usuários e acessos. A equipe entra com o código da ótica{" "}
          <strong className="text-foreground">{resultado.store_code}</strong>, o nome de usuário e a
          senha.
        </Passo>
      </ol>
    </div>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{rotulo}</p>
      <p className="mt-1 select-all break-all font-medium">{valor}</p>
    </div>
  );
}

function Passo({
  n,
  icone: Icone,
  titulo,
  children,
}: {
  n: number;
  icone: React.ComponentType<{ className?: string }>;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground"
        style={{ background: "var(--gradient-primary)" }}
      >
        {n}
      </span>
      <div>
        <p className="flex items-center gap-2 font-medium">
          <Icone className="h-4 w-4 text-primary" /> {titulo}
        </p>
        <div className="mt-1 text-sm text-muted-foreground">{children}</div>
      </div>
    </li>
  );
}

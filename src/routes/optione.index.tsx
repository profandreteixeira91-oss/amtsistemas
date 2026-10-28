import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  FlaskConical,
  Heart,
  KeyRound,
  MessageCircle,
  Package,
  ScanBarcode,
  Store,
  Users2,
  Wallet,
} from "lucide-react";
import type { ComponentType } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Eyebrow,
  H2,
  OPTIONE_WHATSAPP_URL,
  OptioneShell,
  Section,
} from "@/components/optione/shell";
import { Reveal } from "@/components/site/primitives";
import { optionePlanos, type OptionePlano } from "@/lib/optione.functions";

const TITLE = "AMT OptiOne | Sistema de gestão para óticas — teste grátis por 14 dias";
const DESCRIPTION =
  "Vendas e PDV, receitas, pedidos de laboratório, estoque, financeiro e relacionamento com o cliente em um só sistema para a sua ótica. Teste grátis por 14 dias, sem cartão.";
const URL = "https://amtsistemas.com.br/optione";

export const Route = createFileRoute("/optione/")({
  loader: () => optionePlanos(),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      {
        property: "og:image",
        content: "https://amtsistemas.com.br/optione/sistema-visao-geral.webp",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [
      { rel: "canonical", href: URL },
      { rel: "icon", href: "/optione/icone-amt-optione.png" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "AMT OptiOne",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Windows 10, Windows 11",
          description: DESCRIPTION,
          url: URL,
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "BRL",
            description: "Teste grátis por 14 dias",
          },
          publisher: {
            "@type": "Organization",
            name: "AMT Sistemas e Soluções",
            url: "https://amtsistemas.com.br/",
          },
        }),
      },
    ],
  }),
  component: OptioneLanding,
});

type Item = { icon: ComponentType<{ className?: string }>; titulo: string; texto: string };

const recursos: Item[] = [
  {
    icon: ScanBarcode,
    titulo: "Vendas e PDV",
    texto:
      "Leitor de código de barras, pagamentos múltiplos com troco, sinal, crediário e orçamentos que viram venda.",
  },
  {
    icon: ClipboardList,
    titulo: "Receitas OD/OE",
    texto:
      "Esférico, cilíndrico, eixo, adição, DNP e altura, com alertas de digitação e histórico por cliente.",
  },
  {
    icon: FlaskConical,
    titulo: "Pedidos e laboratório",
    texto:
      "Quadro por etapa, do envio à entrega, com prazos, custos, ocorrências e alerta de atraso.",
  },
  {
    icon: Package,
    titulo: "Estoque e compras",
    texto:
      "Armações, lentes, lentes de contato e acessórios, com estoque mínimo, histórico e pedidos de compra.",
  },
  {
    icon: Wallet,
    titulo: "Financeiro",
    texto:
      "Contas a pagar e a receber, parcelas do crediário e relatórios em PDF com a identidade da ótica.",
  },
  {
    icon: Heart,
    titulo: "Relacionamento",
    texto:
      "Pós-venda, revisão de receita, aniversariantes e clientes inativos, com mensagem pronta para WhatsApp.",
  },
  {
    icon: FileText,
    titulo: "Documentos com a sua marca",
    texto:
      "Ordem de serviço, orçamento e comprovante em PDF com a logo da ótica, prontos para imprimir ou enviar.",
  },
  {
    icon: Users2,
    titulo: "Equipe e acessos",
    texto:
      "Um login para cada pessoa e só os módulos que ela precisa. Vendas registradas por vendedor.",
  },
  {
    icon: BarChart3,
    titulo: "Indicadores",
    texto:
      "Faturamento, lucro efetivo, ticket médio, conversão de orçamentos e produtos mais rentáveis.",
  },
];

const passos = [
  {
    icon: Store,
    titulo: "Cadastre a ótica",
    texto:
      "Preencha os dados da ótica e crie o seu login. Leva cerca de 2 minutos e não pede cartão.",
  },
  {
    icon: KeyRound,
    titulo: "Receba a chave de acesso",
    texto:
      "Ao concluir, mostramos a chave de acesso da ótica. Ela ativa cada computador uma única vez.",
  },
  {
    icon: Download,
    titulo: "Instale e comece a usar",
    texto:
      "Instale no Windows, entre com seu e-mail e senha, informe a chave e pronto: 14 dias de uso completo.",
  },
];

const faq = [
  {
    q: "O teste grátis tem algum custo ou pede cartão?",
    a: "Não. São 14 dias com todos os recursos do plano escolhido, sem cartão de crédito e sem compromisso.",
  },
  {
    q: "O que acontece quando o teste termina?",
    a: "Os seus dados continuam guardados. Para seguir registrando vendas e cadastros, basta contratar um plano com a nossa equipe. Enquanto isso, o sistema fica disponível para consulta.",
  },
  {
    q: "O que é a chave de acesso?",
    a: "É um código no formato AMT-XXXX-XXXX-XXXX-XXXX, exibido ao concluir o cadastro. Cada computador da ótica pede a chave uma única vez; depois, a equipe entra só com usuário e senha. Se perder a chave, o dono gera uma nova em amtsistemas.com.br/optione/nova-chave.",
  },
  {
    q: "Em quais computadores o AMT OptiOne funciona?",
    a: "Em Windows 10 ou 11, com conexão à internet. Os dados ficam na nuvem, com cópia de segurança, e cada ótica enxerga apenas os próprios dados.",
  },
  {
    q: "Posso cadastrar a minha equipe?",
    a: "Sim. O dono cria um login para cada pessoa, escolhe os módulos que ela pode usar e a equipe entra com o código da ótica, o nome de usuário e a senha.",
  },
  {
    q: "Funciona com leitor de código de barras e impressora?",
    a: "Sim. Leitores USB ou sem fio que funcionam como teclado são compatíveis sem driver, e os documentos saem em PDF prontos para qualquer impressora.",
  },
];

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function OptioneLanding() {
  const planos = Route.useLoaderData();
  return (
    <OptioneShell
      navItems={[
        { label: "Recursos", href: "#recursos" },
        { label: "Como funciona", href: "#como-funciona" },
        { label: "Planos", href: "#planos" },
        { label: "Dúvidas", href: "#faq" },
      ]}
    >
      <Hero />
      <Recursos />
      <ComoFunciona />
      <Planos planos={planos} />
      <Faq />
      <CtaFinal />
    </OptioneShell>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, oklch(0.7 0.11 190 / 0.16), transparent 70%), radial-gradient(45% 45% at 90% 85%, oklch(0.6 0.11 185 / 0.10), transparent 75%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <img
            src="/optione/logo-amt-optione-vertical.png"
            alt="AMT OptiOne — sistema de gestão para óticas"
            width={560}
            height={347}
            className="mx-auto w-[190px] sm:w-[240px]"
            fetchPriority="high"
          />
          <h1 className="mt-8 text-pretty text-3xl font-semibold tracking-tight sm:text-5xl">
            Sua ótica organizada{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              do balcão ao laboratório.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Vendas e PDV, receitas, pedidos de laboratório, estoque, financeiro e relacionamento com
            o cliente em um só sistema, feito para a rotina da ótica.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="gap-2 shadow-md shadow-primary/15">
              <Link to="/optione/teste-gratis">
                Teste grátis por 14 dias <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={OPTIONE_WHATSAPP_URL} target="_blank" rel="noreferrer">
                Falar com a AMT <MessageCircle className="h-4 w-4 shrink-0" />
              </a>
            </Button>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground sm:text-sm">
            {[
              "14 dias grátis",
              "Sem cartão de crédito",
              "Pronto em minutos",
              "Seus dados na nuvem",
            ].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <Reveal delay={0.15}>
          <div className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-primary/10">
            <div
              className="flex items-center gap-1.5 border-b border-border/70 bg-muted px-4 py-2.5"
              aria-hidden
            >
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="ml-3 text-xs text-muted-foreground">AMT OptiOne — Visão geral</span>
            </div>
            <img
              src="/optione/sistema-visao-geral.webp"
              alt="Tela de visão geral do AMT OptiOne com vendas do mês, ações rápidas e atividades recentes"
              className="block h-auto w-full"
              width={1600}
              height={853}
              loading="eager"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Recursos() {
  return (
    <Section id="recursos" tone="blue">
      <Reveal>
        <Eyebrow>Recursos</Eyebrow>
        <H2>Tudo o que a rotina da ótica pede, num só lugar.</H2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Do atendimento no balcão à entrega dos óculos, cada etapa fica registrada, sem planilhas
          paralelas.
        </p>
      </Reveal>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recursos.map((r, i) => (
          <Reveal key={r.titulo} delay={(i % 3) * 0.05}>
            <Card className="h-full border-border bg-card shadow-sm">
              <CardContent className="p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <r.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{r.titulo}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{r.texto}</p>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function ComoFunciona() {
  return (
    <Section id="como-funciona">
      <Reveal>
        <Eyebrow>Como funciona</Eyebrow>
        <H2>Do cadastro ao primeiro atendimento em poucos minutos.</H2>
      </Reveal>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {passos.map((p, i) => (
          <Reveal key={p.titulo} delay={i * 0.06}>
            <div className="relative h-full rounded-2xl border border-border bg-card p-6 shadow-sm">
              <span className="text-xs font-semibold text-primary">Passo {i + 1}</span>
              <div className="mt-3 flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <p.icon className="h-5 w-5" />
                </span>
                <h3 className="font-semibold">{p.titulo}</h3>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{p.texto}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function Planos({ planos }: { planos: OptionePlano[] }) {
  return (
    <Section id="planos" tone="blue">
      <Reveal>
        <Eyebrow>Planos</Eyebrow>
        <H2>Comece grátis e escolha o plano quando quiser.</H2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          O teste de 14 dias libera todos os recursos do plano escolhido. A contratação é feita
          depois, com a nossa equipe.
        </p>
      </Reveal>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {planos.map((plano, i) => (
          <Reveal key={plano.slug} delay={i * 0.05}>
            <Card
              className={`relative flex h-full flex-col bg-card shadow-sm ${
                plano.destaque ? "border-primary/50 shadow-lg shadow-primary/10" : "border-border"
              }`}
            >
              {plano.badge && (
                <span
                  className="absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-semibold text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {plano.badge}
                </span>
              )}
              <CardContent className="flex flex-1 flex-col p-6">
                <h3 className="text-lg font-semibold">{plano.nome}</h3>
                {plano.descricao && (
                  <p className="mt-1 text-sm text-muted-foreground">{plano.descricao}</p>
                )}
                <p className="mt-5">
                  <span className="text-3xl font-semibold tracking-tight">
                    {brl(plano.preco_mensal)}
                  </span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </p>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                  {plano.recursos.map((r) => (
                    <li key={r} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{r}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6" variant={plano.destaque ? "default" : "outline"}>
                  <Link
                    to="/optione/teste-gratis"
                    search={{ plano: plano.slug as "essencial" | "profissional" | "rede" }}
                  >
                    Testar o {plano.nome} grátis
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function Faq() {
  return (
    <Section id="faq">
      <Reveal>
        <Eyebrow>Dúvidas frequentes</Eyebrow>
        <H2>Perguntas sobre o teste e o sistema.</H2>
      </Reveal>
      <Accordion type="single" collapsible className="mt-8 max-w-3xl">
        {faq.map((item) => (
          <AccordionItem key={item.q} value={item.q}>
            <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}

function CtaFinal() {
  return (
    <section
      className="border-t border-border/60"
      style={{ background: "var(--gradient-primary)" }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-14 text-center sm:px-6">
        <h2 className="max-w-2xl text-pretty text-2xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
          Teste o AMT OptiOne na sua ótica por 14 dias.
        </h2>
        <p className="max-w-xl text-primary-foreground/85">
          Sem cartão de crédito. Seus dados ficam guardados quando você decidir contratar.
        </p>
        <Button asChild size="lg" variant="secondary" className="gap-2">
          <Link to="/optione/teste-gratis">
            Começar o teste grátis <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

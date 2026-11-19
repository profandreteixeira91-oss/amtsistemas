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
import { ORGANIZATION_ID, absoluteUrl, faqLd, jsonLd, organizationLd, pageHead } from "@/lib/seo";
import { OPTIONE_FAQ, OPTIONE_RECURSOS } from "@/lib/site-content";

const TITLE = "AMT OptiOne | Sistema de gestão para óticas — teste grátis por 14 dias";
const DESCRIPTION =
  "Vendas e PDV, receitas, pedidos de laboratório, estoque, financeiro e relacionamento com o cliente em um só sistema para a sua ótica. Teste grátis por 14 dias, sem cartão.";
const PATH = "/optione";
const URL = absoluteUrl(PATH);

/** Print do sistema: versões por largura de tela (até 1024 px de largura na página). */
const SCREENSHOT = {
  src: "/optione/sistema-visao-geral-960.webp",
  srcSet:
    "/optione/sistema-visao-geral-640.webp 640w, /optione/sistema-visao-geral-960.webp 960w, /optione/sistema-visao-geral-1280.webp 1280w, /optione/sistema-visao-geral.webp 1600w",
  sizes: "(min-width: 1088px) 1024px, calc(100vw - 2.5rem)",
};

export const Route = createFileRoute("/optione/")({
  loader: () => optionePlanos(),
  head: ({ loaderData }) => {
    const head = pageHead({
      title: TITLE,
      description: DESCRIPTION,
      path: PATH,
      image: "/optione/og-amt-optione.jpg",
      imageAlt: "Tela de visão geral do AMT OptiOne, sistema de gestão para óticas",
    });
    const planos = loaderData ?? [];
    return {
      meta: head.meta,
      links: [...head.links, { rel: "icon", href: "/optione/icone-amt-optione.png" }],
      scripts: [
        jsonLd([
          organizationLd(),
          {
            "@type": "SoftwareApplication",
            "@id": `${URL}#software`,
            name: "AMT OptiOne",
            alternateName: "OptiOne",
            applicationCategory: "BusinessApplication",
            applicationSubCategory: "Sistema de gestão para óticas",
            operatingSystem: "Windows 10, Windows 11",
            inLanguage: "pt-BR",
            description: DESCRIPTION,
            url: URL,
            image: absoluteUrl("/optione/og-amt-optione.jpg"),
            screenshot: absoluteUrl("/optione/sistema-visao-geral.webp"),
            featureList: recursos.map((r) => `${r.titulo}: ${r.texto}`),
            publisher: { "@id": ORGANIZATION_ID },
            offers: [
              {
                "@type": "Offer",
                name: "Teste grátis de 14 dias",
                price: "0",
                priceCurrency: "BRL",
                url: absoluteUrl("/optione/teste-gratis"),
                description:
                  "14 dias com todos os recursos do plano escolhido, sem cartão de crédito.",
              },
              ...planos
                .filter((p) => p.preco_mensal > 0)
                .map((p) => ({
                  "@type": "Offer",
                  name: `Plano ${p.nome}`,
                  description: p.descricao || undefined,
                  price: p.preco_mensal.toFixed(2),
                  priceCurrency: "BRL",
                  url: absoluteUrl(`/optione/teste-gratis?plano=${p.slug}`),
                  priceSpecification: {
                    "@type": "UnitPriceSpecification",
                    price: p.preco_mensal.toFixed(2),
                    priceCurrency: "BRL",
                    unitText: "mês",
                    referenceQuantity: {
                      "@type": "QuantitativeValue",
                      value: 1,
                      unitCode: "MON",
                    },
                  },
                })),
            ],
          },
          faqLd(PATH, faq),
        ]),
      ],
    };
  },
  component: OptioneLanding,
});

type Item = { icon: ComponentType<{ className?: string }>; titulo: string; texto: string };

// Textos dos recursos e do FAQ em src/lib/site-content.ts (também usados no llms.txt e no JSON-LD).
const RECURSO_ICONES: Item["icon"][] = [
  ScanBarcode,
  ClipboardList,
  FlaskConical,
  Package,
  Wallet,
  Heart,
  FileText,
  Users2,
  BarChart3,
];
const recursos: Item[] = OPTIONE_RECURSOS.map((r, i) => ({
  ...r,
  icon: RECURSO_ICONES[i] ?? FileText,
}));
const faq = OPTIONE_FAQ;

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
            src="/optione/logo-amt-optione-vertical.webp"
            alt="AMT OptiOne — sistema de gestão para óticas"
            width={480}
            height={297}
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
              src={SCREENSHOT.src}
              srcSet={SCREENSHOT.srcSet}
              sizes={SCREENSHOT.sizes}
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

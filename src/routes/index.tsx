import { useEffect, useId, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Globe,
  Info,
  Layers,
  Mail,
  MessageCircle,
  Monitor,
  Palette,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteShell } from "@/components/site/layout";
import {
  CONTACT_EMAIL,
  CTA_LG,
  WHATSAPP_NUMBER,
  WHATSAPP_URL,
  openSiteChat,
} from "@/components/site/site-config";
import { Container, IconBadge, Reveal, Section, SectionHeader } from "@/components/site/primitives";
import { supabase } from "@/integrations/supabase/client";
import { HOME_FAQ, SERVICOS } from "@/lib/site-content";
import {
  ORGANIZATION_ID,
  SITE_DESCRIPTION,
  SITE_URL,
  WEBSITE_ID,
  absoluteUrl,
  faqLd,
  jsonLd,
  organizationLd,
  pageHead,
  websiteLd,
} from "@/lib/seo";

/** Print do sistema no topo: versões por largura de tela (até 1024 px de largura na página). */
const HERO_IMG = {
  src: "/optione/sistema-visao-geral-960.webp",
  srcSet:
    "/optione/sistema-visao-geral-640.webp 640w, /optione/sistema-visao-geral-960.webp 960w, /optione/sistema-visao-geral-1280.webp 1280w, /optione/sistema-visao-geral.webp 1600w",
  sizes: "(min-width: 1088px) 1024px, calc(100vw - 2.5rem)",
};

const TITLE = "AMT Sistemas | Sistemas White Label, sites e aplicativos sob medida";

export const Route = createFileRoute("/")({
  head: () => {
    const head = pageHead({
      title: TITLE,
      description: SITE_DESCRIPTION,
      path: "/",
      imageAlt: "AMT Sistemas e Soluções: sistemas White Label, sites e aplicativos sob medida",
    });
    return {
      meta: [...head.meta, { name: "theme-color", content: "#0A2D5E" }],
      links: [...head.links, { rel: "icon", type: "image/png", href: "/brand/amt-icone.png" }],
      scripts: [
        jsonLd([
          {
            ...organizationLd(),
            makesOffer: servicos.map((s) => ({
              "@type": "Offer",
              itemOffered: { "@type": "Service", name: s.titulo, description: s.texto },
            })),
            owns: sistemas
              .filter((s) => !s.cliente && !s.loja && s.url)
              .map((s) => ({
                "@type": "SoftwareApplication",
                name: s.nome,
                url: absoluteUrl(s.url!),
                description: s.descricao,
              })),
          },
          websiteLd(),
          {
            "@type": "WebPage",
            "@id": `${SITE_URL}/#webpage`,
            url: `${SITE_URL}/`,
            name: TITLE,
            description: SITE_DESCRIPTION,
            inLanguage: "pt-BR",
            isPartOf: { "@id": WEBSITE_ID },
            about: { "@id": ORGANIZATION_ID },
          },
          faqLd("/", faq),
        ]),
      ],
    };
  },
  component: AmtLanding,
});

/* -------------------- DADOS -------------------- */

// Textos dos serviços e do FAQ em src/lib/site-content.ts (também usados no llms.txt e no JSON-LD).
const SERVICO_ICONES: Icone[] = [Layers, Globe, Monitor, Smartphone, ShoppingCart, Workflow];
const servicos = SERVICOS.map((s, i) => ({ ...s, icon: SERVICO_ICONES[i] ?? Layers }));
const faq = HOME_FAQ;

type Icone = React.ComponentType<{ className?: string }>;

const pilaresWhiteLabel: Array<{ icon: Icone; titulo: string; texto: string }> = [
  {
    icon: Palette,
    titulo: "Identidade da sua empresa",
    texto: "Nome, logotipo, cores e domínio próprios. Para o mercado, o sistema é seu.",
  },
  {
    icon: Layers,
    titulo: "Feito para o seu processo",
    texto: "Módulos, regras e permissões definidos a partir da sua operação.",
  },
  {
    icon: ShieldCheck,
    titulo: "Tecnologia por nossa conta",
    texto: "Desenvolvimento, hospedagem, atualizações e suporte ficam com a AMT.",
  },
];

type Sistema = {
  nome: string;
  segmento: string;
  descricao: string;
  /** O que o sistema faz, mostrado nos detalhes do card (passar o mouse ou tocar). */
  destaques: string[];
  logo: string;
  screenshot: string;
  screenshotSrcSet: string;
  /** Sem url: projeto de cliente sem página pública (os detalhes não têm link). */
  url?: string;
  /** Texto do link nos detalhes. */
  cta?: string;
  interno?: boolean;
  /** Sistema feito sob medida para um cliente (portfólio), não um produto da AMT. */
  cliente?: boolean;
  /** Loja virtual (não entra como software nos dados estruturados). */
  loja?: boolean;
  /** Etiqueta mostrada nos detalhes. */
  selo?: string;
};

const sistemas: Sistema[] = [
  {
    nome: "AMT OptiOne",
    segmento: "Óticas · Windows",
    descricao: "Vendas, receitas, laboratório, estoque e financeiro da ótica em um só sistema.",
    destaques: [
      "Vendas e PDV com receitas OD/OE",
      "Pedidos e acompanhamento do laboratório",
      "Estoque, compras e financeiro",
      "Documentos com a marca da ótica",
    ],
    logo: "/optione/icone-amt-optione-96.webp",
    screenshot: "/optione/sistema-visao-geral-960.webp",
    screenshotSrcSet:
      "/optione/sistema-visao-geral-640.webp 640w, /optione/sistema-visao-geral-960.webp 960w, /optione/sistema-visao-geral-1280.webp 1280w",
    url: "/optione",
    cta: "Conhecer o OptiOne",
    interno: true,
    selo: "Teste grátis de 14 dias",
  },
  {
    nome: "AMT Dojo Manager",
    segmento: "Academias · Web e app",
    descricao: "Gestão de academias de artes marciais, com aplicativo para os alunos.",
    destaques: [
      "Alunos, planos, turmas e check-in",
      "Graduações, avaliações e certificados",
      "Financeiro, contratos e equipe",
      "Aplicativo do aluno com a marca da academia",
    ],
    logo: "/brand/logo-dojo-manager.png",
    screenshot: "/assets/screenshot-dojo-manager-painel.webp",
    screenshotSrcSet:
      "/assets/screenshot-dojo-manager-painel-640.webp 640w, /assets/screenshot-dojo-manager-painel.webp 1284w",
    url: "https://amtdojomanager.com.br/dojo",
    cta: "Conhecer o Dojo Manager",
  },
  {
    nome: "AMT Fight Wear",
    segmento: "Loja virtual · Web",
    descricao:
      "Loja de kimonos, faixas e rashguards com fabricação própria e envio para todo o Brasil.",
    destaques: [
      "Catálogo com tamanhos, cores e faixas personalizadas",
      "Pagamento por PIX e cartão, com parcelamento",
      "Frete calculado na hora e acompanhamento do pedido",
      "Área do cliente, atacado e painel de pedidos",
    ],
    logo: "/brand/logo-amt-fightwear-96.webp",
    screenshot: "/assets/screenshot-amt-fightwear-loja-640.webp",
    screenshotSrcSet:
      "/assets/screenshot-amt-fightwear-loja-640.webp 640w, /assets/screenshot-amt-fightwear-loja-1280.webp 1280w",
    url: "https://amtfightwear.com.br/",
    cta: "Visitar a loja",
    loja: true,
    selo: "Loja virtual",
  },
  {
    nome: "Kelly Fernandes Nutrição",
    segmento: "Nutrição · Desktop",
    descricao:
      "Consultório de nutrição: pacientes, agenda, anamnese, avaliações, plano alimentar, financeiro e WhatsApp.",
    destaques: [
      "Agenda de consultas e cadastro de pacientes",
      "Anamnese, avaliações e plano alimentar",
      "Financeiro do consultório",
      "Lembretes e conversas pelo WhatsApp",
    ],
    logo: "/brand/logo-kelly-nutri-96.webp",
    screenshot: "/assets/screenshot-kelly-nutri-agenda-640.webp",
    screenshotSrcSet:
      "/assets/screenshot-kelly-nutri-agenda-640.webp 640w, /assets/screenshot-kelly-nutri-agenda-1280.webp 1280w",
    cliente: true,
    selo: "Sistema sob medida para cliente",
  },
];

const etapas = [
  { titulo: "Diagnóstico", texto: "Entendemos o negócio, os processos e o objetivo do projeto." },
  { titulo: "Proposta", texto: "Definimos escopo, módulos, prazo e investimento." },
  { titulo: "Desenvolvimento", texto: "Construímos e validamos com você a cada etapa." },
  { titulo: "Entrega e evolução", texto: "Publicamos, treinamos a equipe e seguimos evoluindo." },
];

/* -------------------- PÁGINA -------------------- */

function AmtLanding() {
  return (
    <SiteShell>
      <Hero />
      <WhiteLabel />
      <Servicos />
      <Sistemas />
      <ComoTrabalhamos />
      <Faq />
      <Contato />
    </SiteShell>
  );
}

/* -------------------- HERO -------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-titulo">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, oklch(0.6 0.105 194 / 0.12), transparent 70%), linear-gradient(180deg, oklch(0.985 0.008 230), oklch(1 0 0) 70%)",
        }}
      />
      <Container className="relative pt-16 text-center sm:pt-24 lg:pt-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--brand-navy)] shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-[var(--brand-teal)]" />
          Sistemas White Label sob medida
        </span>
        <h1
          id="hero-titulo"
          className="mx-auto mt-7 max-w-4xl text-[2.4rem] font-bold leading-[1.06] text-[var(--brand-navy)] sm:text-6xl sm:leading-[1.04] lg:text-[4.1rem]"
        >
          Tecnologia sob medida com a{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            marca da sua empresa.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
          Desenvolvemos sistemas White Label, sites, softwares e aplicativos. Você apresenta a
          solução com o seu nome; nós cuidamos de toda a tecnologia.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className={`${CTA_LG} shadow-lg shadow-[oklch(0.31_0.09_259/0.22)]`}>
            <a href="#contato">
              Solicitar orçamento <ArrowRight />
            </a>
          </Button>
          <Button asChild variant="outline" className={`${CTA_LG} bg-white`}>
            <a href="#servicos">Conhecer os serviços</a>
          </Button>
        </div>
      </Container>

      <Container className="relative mt-14 sm:mt-20">
        <div className="relative mx-auto max-w-5xl">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-6 top-8 -bottom-6 rounded-[2rem] opacity-30 blur-3xl sm:-inset-x-16"
            style={{ background: "var(--gradient-primary)" }}
          />
          <figure className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-lift)] ring-1 ring-black/[0.03]">
            <div
              aria-hidden
              className="flex items-center gap-1.5 border-b border-[var(--border)] bg-[var(--section-alt)] px-4 py-2.5"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.82_0.02_250)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.82_0.02_250)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.82_0.02_250)]" />
            </div>
            <img
              src={HERO_IMG.src}
              srcSet={HERO_IMG.srcSet}
              sizes={HERO_IMG.sizes}
              alt="Tela de um sistema desenvolvido pela AMT Sistemas"
              width={1600}
              height={853}
              fetchPriority="high"
              className="block h-auto w-full"
            />
          </figure>
          {/* A imagem se dissolve no fundo: o topo da página fica leve. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -bottom-px h-1/3 bg-gradient-to-t from-white via-white/70 to-transparent"
          />
        </div>
      </Container>
    </section>
  );
}

/* -------------------- WHITE LABEL -------------------- */

function WhiteLabel() {
  return (
    <Section id="white-label" labelledBy="white-label-titulo" className="sm:py-28">
      <div className="grid gap-14 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-20">
        <Reveal>
          <SectionHeader
            id="white-label-titulo"
            eyebrow="White Label"
            title="Sua marca na frente. Nossa tecnologia por trás."
            description="Sistemas prontos obrigam a empresa a se adaptar ao software. Aqui é o contrário: o sistema nasce dos seus processos e chega aos seus clientes com o seu nome."
          />
          <ul className="mt-10 space-y-6">
            {pilaresWhiteLabel.map((p) => (
              <li key={p.titulo} className="flex gap-4">
                <IconBadge icon={p.icon} />
                <div>
                  <h3 className="font-semibold text-[var(--brand-navy)]">{p.titulo}</h3>
                  <p className="mt-1 text-[15px] leading-6 text-muted-foreground">{p.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.08}>
          <CamadasWhiteLabel />
        </Reveal>
      </div>
    </Section>
  );
}

function CamadasWhiteLabel() {
  const camadas = [
    { titulo: "Seus clientes", texto: "Usam a solução como sua" },
    { titulo: "Sua marca", texto: "Nome, logotipo, cores e domínio" },
    { titulo: "Tecnologia AMT", texto: "Desenvolvimento, hospedagem e suporte" },
  ];
  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 text-white shadow-[var(--shadow-lift)] sm:p-9"
      style={{ background: "var(--gradient-dark)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(60% 50% at 100% 0%, oklch(0.6 0.105 194 / 0.45), transparent 70%)",
        }}
      />
      <ol className="relative space-y-3">
        {camadas.map((c, i) => (
          <li
            key={c.titulo}
            className={`flex items-center justify-between gap-4 rounded-2xl px-5 py-4 ring-1 ${
              i === 1
                ? "bg-white text-[var(--brand-navy)] ring-white"
                : "bg-white/[0.06] ring-white/15"
            }`}
          >
            <div>
              <p className="font-display text-base font-semibold">{c.titulo}</p>
              <p
                className={`mt-0.5 text-sm ${i === 1 ? "text-muted-foreground" : "text-white/65"}`}
              >
                {c.texto}
              </p>
            </div>
            <span
              className={`font-display text-sm font-semibold tabular-nums ${i === 1 ? "text-[var(--brand-teal)]" : "text-white/40"}`}
            >
              0{3 - i}
            </span>
          </li>
        ))}
      </ol>
      <p className="relative mt-6 text-sm leading-6 text-white/70">
        Você vende e se relaciona com os clientes. A AMT mantém a tecnologia funcionando e
        evoluindo.
      </p>
    </div>
  );
}

/* -------------------- SERVIÇOS -------------------- */

function Servicos() {
  return (
    <Section id="servicos" tone="alt" labelledBy="servicos-titulo" className="sm:py-28">
      <Reveal>
        <SectionHeader
          id="servicos-titulo"
          align="center"
          eyebrow="Serviços"
          title="Tudo o que sua empresa precisa, desenvolvido sob medida."
          description="Do site ao aplicativo, com a mesma equipe do planejamento ao suporte."
        />
      </Reveal>

      <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {servicos.map((s, i) => {
          const destaque = i === 0;
          return (
            <Reveal key={s.titulo} as="li" delay={(i % 3) * 0.05} className="h-full">
              <article
                className={`h-full rounded-2xl p-7 transition-all duration-300 hover:-translate-y-0.5 sm:p-8 ${
                  destaque
                    ? "text-white shadow-[var(--shadow-lift)]"
                    : "border border-[var(--border)] bg-white shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lift)]"
                }`}
                style={destaque ? { background: "var(--gradient-dark)" } : undefined}
              >
                <IconBadge icon={s.icon} dark={destaque} />
                <h3
                  className={`mt-6 text-lg font-semibold ${destaque ? "text-white" : "text-[var(--brand-navy)]"}`}
                >
                  {s.titulo}
                </h3>
                <p
                  className={`mt-2 text-[15px] leading-7 ${destaque ? "text-white/75" : "text-muted-foreground"}`}
                >
                  {s.texto}
                </p>
              </article>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}

/* -------------------- SISTEMAS EM OPERAÇÃO -------------------- */

function Sistemas() {
  // Detalhes abertos por toque ou teclado (no computador, o mouse mostra pelo hover). Um por vez; tocar fora fecha.
  const [aberto, setAberto] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.("[data-sistema-card]")) setAberto(null);
    };
    document.addEventListener("pointerdown", fechar);
    return () => document.removeEventListener("pointerdown", fechar);
  }, [aberto]);

  return (
    <Section id="sistemas" labelledBy="sistemas-titulo" className="sm:py-28">
      {/* Âncora antiga, mantida para links já divulgados. */}
      <span id="solucoes" aria-hidden className="absolute -top-20" />
      <Reveal>
        <SectionHeader
          id="sistemas-titulo"
          eyebrow="Sistemas em operação"
          title="Produtos próprios e de clientes, usados todos os dias."
          description="A melhor referência do que podemos construir para você."
        />
      </Reveal>
      <div className="mt-12 grid items-start gap-6 md:grid-cols-2">
        {sistemas.map((s, i) => (
          <Reveal key={s.nome} delay={i * 0.06} className="h-full">
            <SistemaCard
              sistema={s}
              aberto={aberto === s.nome}
              onToggle={() => setAberto((atual) => (atual === s.nome ? null : s.nome))}
            />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function SistemaCard({
  sistema: s,
  aberto,
  onToggle,
}: {
  sistema: Sistema;
  aberto: boolean;
  onToggle: () => void;
}) {
  const detalhesId = useId();
  // Clique de mouse não alterna: no computador os detalhes já aparecem ao passar o mouse.
  const ponteiro = useRef("");
  const alternar = () => {
    if (ponteiro.current !== "mouse") onToggle();
  };

  const linkClasse =
    "inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-navy)] transition-colors hover:bg-[var(--brand-teal-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-navy)]";

  return (
    <article
      data-sistema-card
      data-aberto={aberto ? "" : undefined}
      onPointerDown={(e) => {
        ponteiro.current = e.pointerType;
      }}
      className="group relative h-full overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-[var(--border)] bg-[var(--section-alt)]">
        <img
          src={s.screenshot}
          srcSet={s.screenshotSrcSet}
          sizes="(min-width: 1280px) 590px, (min-width: 768px) 50vw, calc(100vw - 2.5rem)"
          alt={`Tela do ${s.nome}`}
          loading="lazy"
          className="h-full w-full object-cover object-left-top"
        />
        <span
          aria-hidden
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-navy)]/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur"
        >
          <Info className="h-3.5 w-3.5" />
          {aberto ? "Ocultar detalhes" : "Ver detalhes"}
        </span>
      </div>
      <div className="flex items-center gap-4 p-5 sm:p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-white">
          <img src={s.logo} alt="" className="h-8 w-8 object-contain" loading="lazy" />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-[var(--brand-navy)]">{s.nome}</h3>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-teal)]">
            {s.segmento}
          </p>
        </div>
      </div>

      {/* Botão do card inteiro: toque (celular) e teclado abrem e fecham os detalhes. */}
      <button
        type="button"
        onClick={alternar}
        onKeyDown={(e) => {
          if (e.key === "Escape" && aberto) onToggle();
        }}
        aria-expanded={aberto}
        aria-controls={detalhesId}
        aria-label={`${aberto ? "Fechar" : "Ver"} detalhes do ${s.nome}`}
        className="absolute inset-0 z-10 cursor-default rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] focus-visible:ring-offset-2"
      />

      <div
        id={detalhesId}
        onClick={(e) => {
          if (!(e.target as Element).closest("a")) alternar();
        }}
        className={[
          // Toque (celular e tablet): os detalhes abrem embaixo do card, que cresce; nada fica cortado.
          "relative z-20 grid grid-rows-[0fr] bg-[var(--brand-navy)] text-white transition-[grid-template-rows,opacity,translate] duration-300 ease-out group-data-[aberto]:grid-rows-[1fr] motion-reduce:transition-none",
          // Mouse (computador): os detalhes cobrem o card ao passar o mouse (ou com o foco do teclado).
          "[@media(hover:hover)]:pointer-events-none [@media(hover:hover)]:absolute [@media(hover:hover)]:inset-0 [@media(hover:hover)]:translate-y-3 [@media(hover:hover)]:grid-rows-[1fr] [@media(hover:hover)]:opacity-0",
          "group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100",
          "[@media(hover:hover)]:group-has-[:focus-visible]:pointer-events-auto [@media(hover:hover)]:group-has-[:focus-visible]:translate-y-0 [@media(hover:hover)]:group-has-[:focus-visible]:opacity-100",
          "[@media(hover:hover)]:group-data-[aberto]:pointer-events-auto [@media(hover:hover)]:group-data-[aberto]:translate-y-0 [@media(hover:hover)]:group-data-[aberto]:opacity-100",
        ].join(" ")}
      >
        <div className="min-h-0 overflow-hidden [@media(hover:hover)]:overflow-y-auto">
          <div className="flex h-full flex-col p-6 sm:p-7">
            <p className="hidden text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-teal-soft)] [@media(hover:hover)]:block">
              {s.nome} · {s.segmento}
            </p>
            <p className="text-[15px] leading-6 text-white/90 [@media(hover:hover)]:mt-3">
              {s.descricao}
            </p>
            <ul className="mt-4 space-y-2">
              {s.destaques.map((d) => (
                <li key={d} className="flex gap-2.5 text-sm leading-5 text-white/85">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-teal)]" />
                  {d}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
              {s.selo ? (
                <span className="rounded-full border border-white/25 px-2.5 py-1 text-xs font-semibold text-white/90">
                  {s.selo}
                </span>
              ) : (
                <span />
              )}
              {s.url &&
                (s.interno ? (
                  <Link to="/optione" className={linkClasse}>
                    {s.cta ?? "Conhecer"} <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className={linkClasse}
                    aria-label={`${s.cta ?? "Conhecer"} (abre em nova aba)`}
                  >
                    {s.cta ?? "Conhecer"} <ArrowUpRight className="h-4 w-4" />
                  </a>
                ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/* -------------------- COMO TRABALHAMOS -------------------- */

function ComoTrabalhamos() {
  return (
    <Section id="como-funciona" tone="alt" labelledBy="como-funciona-titulo" className="sm:py-28">
      <Reveal>
        <SectionHeader
          id="como-funciona-titulo"
          align="center"
          eyebrow="Como trabalhamos"
          title="Do primeiro contato ao sistema no ar."
        />
      </Reveal>
      <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {etapas.map((e, i) => (
          <Reveal key={e.titulo} as="li" delay={i * 0.05} className="h-full">
            <div className="h-full rounded-2xl border border-[var(--border)] bg-white p-7">
              <span className="font-display text-sm font-semibold tabular-nums text-[var(--brand-teal)]">
                0{i + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-[var(--brand-navy)]">{e.titulo}</h3>
              <p className="mt-2 text-[15px] leading-6 text-muted-foreground">{e.texto}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}

/* -------------------- DÚVIDAS -------------------- */

function Faq() {
  return (
    <Section id="faq" labelledBy="faq-titulo" className="sm:py-28">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal>
          <SectionHeader
            id="faq-titulo"
            eyebrow="Dúvidas frequentes"
            title="Antes de começar"
            description="Não encontrou a sua dúvida? Fale direto com a nossa equipe."
          />
          <Button asChild variant="outline" className={`${CTA_LG} mt-8`}>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" onClick={openSiteChat}>
              <MessageCircle /> Perguntar pelo WhatsApp
            </a>
          </Button>
        </Reveal>
        <Reveal delay={0.06}>
          <Accordion type="single" collapsible className="w-full border-t border-[var(--border)]">
            {faq.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`} className="border-[var(--border)]">
                <AccordionTrigger className="py-6 text-left text-base font-semibold text-[var(--brand-navy)] hover:no-underline sm:text-lg">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-[15px] leading-7 text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </Section>
  );
}

/* -------------------- CONTATO -------------------- */

const TIPOS_PROJETO = [
  "Sistema White Label",
  "Website",
  "Software para Windows",
  "Aplicativo Android / iOS",
  "Loja virtual",
  "Automação / IA",
  "Outro",
];

const FORM_VAZIO = {
  nome: "",
  empresa: "",
  telefone: "",
  email: "",
  tipo: "",
  necessidade: "",
};

function Contato() {
  return (
    <Section
      id="contato"
      tone="dark"
      labelledBy="contato-titulo"
      className="overflow-hidden sm:py-28"
    >
      {/* Âncora antiga, mantida para links já divulgados. */}
      <span id="formulario" aria-hidden className="absolute -top-20" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(50% 60% at 0% 100%, oklch(0.6 0.105 194 / 0.4), transparent 70%)",
        }}
      />
      <div className="relative grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16">
        <Reveal>
          <SectionHeader
            dark
            id="contato-titulo"
            eyebrow="Contato"
            title="Vamos conversar sobre o seu projeto?"
            description="Conte o que você precisa. Respondemos em até 1 dia útil com os próximos passos."
          />
          <div className="mt-10 grid gap-3 sm:max-w-sm">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              onClick={openSiteChat}
              className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.12]"
            >
              <MessageCircle className="h-5 w-5 text-[oklch(0.82_0.09_195)]" /> Falar pelo WhatsApp
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.12]"
            >
              <Mail className="h-5 w-5 text-[oklch(0.82_0.09_195)]" /> {CONTACT_EMAIL}
            </a>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <FormularioContato />
        </Reveal>
      </div>
    </Section>
  );
}

function FormularioContato() {
  const [form, setForm] = useState(FORM_VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  // Se a gravação falhar, a mesma solicitação segue pelo WhatsApp (nenhum contato se perde).
  const [whatsappReserva, setWhatsappReserva] = useState<string | null>(null);

  const campo = (nome: keyof typeof FORM_VAZIO) => ({
    value: form[nome],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [nome]: e.target.value })),
  });

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setWhatsappReserva(null);
    const mensagem = [form.tipo ? `Tipo de projeto: ${form.tipo}` : null, form.necessidade.trim()]
      .filter(Boolean)
      .join("\n\n");
    try {
      const { error } = await supabase.from("contatos_leads").insert({
        nome: form.nome.trim(),
        empresa: form.empresa.trim() || null,
        email: form.email.trim(),
        telefone: form.telefone.trim() || null,
        mensagem,
      });
      if (error) throw error;
      setEnviado(true);
      setForm(FORM_VAZIO);
      toast.success("Solicitação enviada! Vamos analisar seu projeto e entrar em contato.");
    } catch (err) {
      console.error("Erro ao enviar contato", err);
      const texto = [
        "Olá! Quero solicitar um orçamento à AMT Sistemas.",
        `Nome: ${form.nome.trim()}`,
        form.empresa.trim() ? `Empresa: ${form.empresa.trim()}` : null,
        `E-mail: ${form.email.trim()}`,
        form.telefone.trim() ? `WhatsApp: ${form.telefone.trim()}` : null,
        "",
        mensagem,
      ]
        .filter((linha) => linha !== null)
        .join("\n");
      setWhatsappReserva(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div
        className="rounded-3xl bg-white p-8 text-center text-foreground shadow-[var(--shadow-lift)] sm:p-10"
        role="status"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-teal-soft)]">
          <CheckCircle2 className="h-7 w-7 text-[var(--brand-teal)]" />
        </span>
        <h3 className="mt-5 text-2xl font-bold text-[var(--brand-navy)]">Solicitação enviada!</h3>
        <p className="mt-3 text-muted-foreground">
          Recebemos as informações do seu projeto. Nossa equipe entra em contato em até 1 dia útil.
        </p>
        <Button variant="outline" className={`${CTA_LG} mt-7`} onClick={() => setEnviado(false)}>
          Enviar outra solicitação
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-6 text-foreground shadow-[var(--shadow-lift)] sm:p-9">
      <form onSubmit={enviar} className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo id="nome" label="Nome" obrigatorio>
            <Input
              id="nome"
              required
              maxLength={100}
              autoComplete="name"
              className="h-11"
              {...campo("nome")}
            />
          </Campo>
          <Campo id="empresa" label="Empresa">
            <Input
              id="empresa"
              maxLength={120}
              autoComplete="organization"
              className="h-11"
              {...campo("empresa")}
            />
          </Campo>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo id="telefone" label="WhatsApp">
            <Input
              id="telefone"
              inputMode="tel"
              maxLength={40}
              autoComplete="tel"
              placeholder="(11) 99999-9999"
              className="h-11"
              {...campo("telefone")}
            />
          </Campo>
          <Campo id="email" label="E-mail" obrigatorio>
            <Input
              id="email"
              type="email"
              required
              maxLength={200}
              autoComplete="email"
              className="h-11"
              {...campo("email")}
            />
          </Campo>
        </div>
        <Campo id="tipo" label="Tipo de projeto">
          <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
            <SelectTrigger id="tipo" className="h-11">
              <SelectValue placeholder="Selecione…" />
            </SelectTrigger>
            <SelectContent className="amt-site">
              {TIPOS_PROJETO.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
        <Campo id="necessidade" label="Conte sobre o projeto" obrigatorio>
          <Textarea
            id="necessidade"
            required
            rows={4}
            maxLength={1500}
            placeholder="O que você precisa e qual problema quer resolver."
            {...campo("necessidade")}
          />
        </Campo>
        {whatsappReserva && (
          <div
            role="alert"
            className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
          >
            <p className="font-semibold">Não conseguimos registrar sua solicitação agora.</p>
            <p className="mt-1">
              Envie as mesmas informações pelo WhatsApp — a mensagem já vai preenchida.
            </p>
            <Button
              asChild
              className={`${CTA_LG} mt-3 w-full bg-[#1FAF5A] text-white hover:bg-[#1a964d]`}
            >
              <a href={whatsappReserva} target="_blank" rel="noreferrer">
                <MessageCircle /> Enviar pelo WhatsApp
              </a>
            </Button>
          </div>
        )}
        <Button type="submit" disabled={enviando} className={`${CTA_LG} mt-1 w-full`}>
          {enviando ? "Enviando…" : "Solicitar orçamento"} <ArrowRight />
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Usamos seus dados apenas para responder a esta solicitação. Veja a{" "}
          <a href="/privacidade" className="underline underline-offset-2 hover:text-foreground">
            política de privacidade
          </a>
          .
        </p>
      </form>
    </div>
  );
}

function Campo({
  id,
  label,
  obrigatorio = false,
  children,
}: {
  id: string;
  label: string;
  obrigatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-sm font-semibold text-[var(--brand-navy)]">
        {label}
        {obrigatorio && (
          <span className="text-[var(--brand-teal)]" aria-hidden>
            {" "}
            *
          </span>
        )}
      </Label>
      {children}
    </div>
  );
}

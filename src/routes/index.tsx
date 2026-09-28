import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowDown,
  Sparkles,
  Mail,
  MessageCircle,
  Instagram,
  Linkedin,
  ShieldCheck,
  Zap,
  Cpu,
  Plug,
  Layers,
  CheckCircle2,
  GraduationCap,
  Dumbbell,
  ShoppingBag,
  CalendarClock,
  Stethoscope,
  Building2,
  LayoutDashboard,
  Users2,
  Wallet,
  Package,
  Boxes,
  BarChart3,
  Bell,
  Workflow,
  Palette,
  Rocket,
  Repeat,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react";
import type { ComponentType } from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import amtSistemas from "@/assets/amt-sistemas-logo.png.asset.json";
import amtFightWearLogoAsset from "@/assets/amt-fight-wear-logo.png.asset.json";
import amtDojoManagerLogoAsset from "@/assets/amt-dojo-manager-logo.png.asset.json";
import amtCustomAsset from "@/assets/amt-custom-product.png.asset.json";

const amtFightWearLogoUrl = amtFightWearLogoAsset.url;
const amtDojoManagerLogoUrl = amtDojoManagerLogoAsset.url;

const amtCustomLogoUrl = amtCustomAsset.url;

const TITLE = "AMT Sistemas | Sistemas White Label Personalizados";
const DESCRIPTION =
  "Desenvolvemos sistemas personalizados, plataformas White Label, automações e soluções com Inteligência Artificial para empresas.";
const WHATSAPP_NUMBER = "5511999738440";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Gostaria de falar com a AMT Sistemas sobre um projeto.")}`;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://amtsistemas.com.br/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "https://amtsistemas.com.br/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "AMT Sistemas e Soluções",
          url: "https://amtsistemas.com.br/",
          description:
            "Empresa de tecnologia especializada no desenvolvimento de sistemas White Label personalizados para diferentes segmentos e modelos de negócio.",
          areaServed: "BR",
        }),
      },
    ],
  }),
  component: AmtLanding,
});

/* -------------------- DATA -------------------- */

type Item = { icon: ComponentType<{ className?: string }>; titulo: string; texto: string };

const segmentos: Item[] = [
  {
    icon: GraduationCap,
    titulo: "Educação",
    texto: "Gestão de alunos, professores, turmas, frequência, avaliações e processos acadêmicos.",
  },
  {
    icon: Dumbbell,
    titulo: "Esportes",
    texto: "Academias, equipes, atletas, professores, treinos, graduações e competições.",
  },
  {
    icon: ShoppingBag,
    titulo: "Comércio",
    texto: "Produtos, vendas, estoque, clientes, pedidos e operações do dia a dia.",
  },
  {
    icon: CalendarClock,
    titulo: "Serviços",
    texto: "Agendamento, clientes, profissionais, processos, pagamentos e gestão operacional.",
  },
  {
    icon: Stethoscope,
    titulo: "Saúde",
    texto:
      "Profissionais, clientes, agendas e processos administrativos, respeitando os requisitos do segmento.",
  },
  {
    icon: Building2,
    titulo: "Empresas",
    texto: "Soluções internas para automatização, gestão e organização de processos.",
  },
];

const modulos = [
  { icon: LayoutDashboard, nome: "Dashboard" },
  { icon: Users2, nome: "Gestão de clientes" },
  { icon: Wallet, nome: "Financeiro" },
  { icon: Package, nome: "Estoque" },
  { icon: ShoppingBag, nome: "Vendas" },
  { icon: CalendarClock, nome: "Agenda" },
  { icon: Users2, nome: "Equipe" },
  { icon: BarChart3, nome: "Relatórios" },
  { icon: MessageCircle, nome: "Comunicação" },
  { icon: Workflow, nome: "Automação" },
  { icon: Plug, nome: "Integrações" },
  { icon: Sparkles, nome: "IA" },
];

const fluxo = [
  "Entendemos seu negócio",
  "Identificamos seus processos",
  "Mapeamos suas necessidades",
  "Desenhamos a solução",
  "Desenvolvemos o sistema",
  "Personalizamos sua marca",
  "Colocamos a solução em operação",
];

const diferenciais: Item[] = [
  { icon: Palette, titulo: "Sob medida", texto: "O sistema é desenvolvido considerando a realidade do negócio." },
  { icon: ShieldCheck, titulo: "White Label", texto: "A solução pode assumir a identidade da empresa." },
  { icon: Layers, titulo: "Modular", texto: "A plataforma pode crescer conforme as necessidades." },
  { icon: Zap, titulo: "Escalável", texto: "A estrutura pode acompanhar a evolução do negócio." },
  { icon: Workflow, titulo: "Automação", texto: "Processos repetitivos podem ser automatizados." },
  { icon: Cpu, titulo: "Inteligência Artificial", texto: "IA pode ser incorporada para tornar operações mais inteligentes." },
  { icon: Users2, titulo: "Experiência personalizada", texto: "Interface e fluxos adaptados ao público da empresa." },
  { icon: Repeat, titulo: "Evolução contínua", texto: "O sistema pode continuar evoluindo após o lançamento." },
];

const etapas = [
  { n: "01", titulo: "Diagnóstico", texto: "Entendemos seu negócio e seus objetivos." },
  { n: "02", titulo: "Planejamento", texto: "Definimos funcionalidades, módulos e estrutura." },
  { n: "03", titulo: "Desenvolvimento", texto: "Construímos a solução." },
  { n: "04", titulo: "Personalização", texto: "Aplicamos identidade visual e regras do negócio." },
  { n: "05", titulo: "Testes", texto: "Validamos funcionamento, segurança e experiência." },
  { n: "06", titulo: "Implantação", texto: "Colocamos o sistema em operação." },
  { n: "07", titulo: "Evolução", texto: "Continuamos aprimorando a solução conforme a necessidade." },
];

type Solucao = {
  nome: string;
  descricao: string;
  logo?: string;
  screenshot?: string;
  status: "Em operação" | "Em desenvolvimento";
  url?: string;
};

const solucoes: Solucao[] = [
  {
    nome: "AMT Fight Wear",
    descricao: "E-commerce e gestão para o mercado de fight wear, artes marciais e equipamentos de combate.",
    logo: amtFightWearLogoUrl,
    screenshot: "/assets/screenshot-fight-wear.png",
    status: "Em operação",
    url: "https://www.amtfightwear.com.br",
  },
  {
    nome: "AMT Dojo Manager",
    descricao: "Gestão para academias de artes marciais, dojos e estúdios de treino.",
    logo: amtDojoManagerLogoUrl,
    screenshot: "/assets/screenshot-dojo-manager.png",
    status: "Em operação",
    url: "https://dojomanager.amtfightwear.com.br",
  },
  {
    nome: "AB Academy",
    descricao: "Plataforma de gestão acadêmica para escola de idiomas, com portal do aluno, professores, aulas e atividades.",
    screenshot: "/assets/screenshot-ab-academy.png",
    status: "Em operação",
    url: "https://abacademyidiomas.com.br",
  },
];

const faq = [
  {
    q: "O que é um sistema White Label?",
    a: "É um sistema desenvolvido pela AMT Sistemas e entregue com a identidade da empresa contratante: marca, nome, cores, domínio e experiência do usuário. Para o mercado, a solução é da sua empresa.",
  },
  {
    q: "Posso colocar minha própria marca no sistema?",
    a: "Sim. Logo, cores, nome, domínio e nomenclaturas das telas podem ser adaptados à identidade da sua empresa.",
  },
  {
    q: "O sistema pode ser criado especificamente para o meu segmento?",
    a: "Sim. O desenvolvimento parte dos processos e regras do seu negócio, não de um modelo fechado.",
  },
  {
    q: "Posso escolher quais funcionalidades estarão disponíveis?",
    a: "Sim. Os módulos e permissões são definidos no planejamento do projeto.",
  },
  {
    q: "Posso começar pequeno e adicionar módulos depois?",
    a: "Sim, quando a arquitetura do projeto permitir. Essa possibilidade é avaliada no diagnóstico.",
  },
  {
    q: "A AMT desenvolve sistemas do zero?",
    a: "Sim, de acordo com as necessidades do projeto.",
  },
  {
    q: "Posso integrar o sistema com outras ferramentas?",
    a: "Quando tecnicamente viável, sim. Integrações são avaliadas caso a caso.",
  },
  {
    q: "O sistema pode utilizar Inteligência Artificial?",
    a: "Sim, quando houver uma aplicação prática para o negócio.",
  },
  {
    q: "A AMT também faz manutenção e evolução?",
    a: "Sim. A continuidade do projeto — manutenção, suporte e evolução — é definida junto com o escopo, de acordo com a necessidade de cada cliente.",
  },
];

/* -------------------- PAGE -------------------- */

function AmtLanding() {
  return (
    <div
      className="amt-corp flex min-h-screen flex-col"
      style={
        {
          "--background": "oklch(1 0 0)",
          "--foreground": "oklch(0.22 0.05 255)",
          "--card": "oklch(1 0 0)",
          "--card-foreground": "oklch(0.22 0.05 255)",
          "--popover": "oklch(1 0 0)",
          "--popover-foreground": "oklch(0.22 0.05 255)",
          "--muted": "oklch(0.96 0.01 240)",
          "--muted-foreground": "oklch(0.48 0.03 250)",
          "--border": "oklch(0.9 0.02 240)",
          "--input": "oklch(0.9 0.02 240)",
          "--primary": "oklch(0.32 0.09 255)",
          "--primary-foreground": "oklch(0.98 0.01 200)",
          "--primary-glow": "oklch(0.62 0.11 200)",
          "--gradient-primary":
            "linear-gradient(135deg, oklch(0.32 0.09 255), oklch(0.62 0.11 200))",
          "--ring": "oklch(0.62 0.11 200)",
          "--accent": "oklch(0.94 0.03 220)",
          "--accent-foreground": "oklch(0.32 0.09 255)",
          "--section-blue": "oklch(0.97 0.02 235)",
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
        } as React.CSSProperties
      }
    >
      <Nav />
      <main className="flex-1">
        <Hero />
        <Solucoes />
        <QuemSomos />
        <WhiteLabel />
        <Segmentos />
        <DoProblemaASolucao />
        <Modulos />
        <Tecnologia />
        <Diferenciais />
        <ComoFunciona />
        <Investimento />
        <Faq />
        <CtaFinal />
        <Formulario />
      </main>
      <Footer />
    </div>
  );
}

/* -------------------- PRIMITIVES -------------------- */

function Section({
  id,
  tone = "white",
  children,
  className = "",
}: {
  id?: string;
  tone?: "white" | "blue";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`border-t border-border/60 ${className}`}
      style={{
        backgroundColor: tone === "blue" ? "var(--section-blue)" : "var(--background)",
      }}
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24">{children}</div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Badge className="mb-4 border-primary/20 bg-primary/10 text-primary hover:bg-primary/15">
      {children}
    </Badge>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="max-w-3xl text-pretty text-2xl font-semibold tracking-tight sm:text-4xl">
      {children}
    </h2>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

function FlowChain({ steps }: { steps: string[] }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-stretch gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex flex-col items-center gap-2">
          <div
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-center text-sm font-medium shadow-sm"
            style={i === steps.length - 1 ? { background: "var(--gradient-primary)", color: "var(--primary-foreground)", border: "none" } : undefined}
          >
            {s}
          </div>
          {i < steps.length - 1 && <ArrowDown className="h-4 w-4 text-primary/60" aria-hidden />}
        </div>
      ))}
    </div>
  );
}

/* -------------------- NAV -------------------- */

function Nav() {
  const [open, setOpen] = useState(false);
  const items = [
    { label: "Portfólio", href: "#solucoes" },
    { label: "Como funciona", href: "#como-funciona" },
    { label: "White Label", href: "#white-label" },
    { label: "Segmentos", href: "#segmentos" },
    { label: "Contato", href: "#formulario" },
  ];

  return (
    <header
      className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-xl"
      style={{ backgroundColor: "color-mix(in oklab, var(--background) 88%, transparent)" }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-border">
            <img src={amtSistemas.url} alt="AMT Sistemas" className="h-9 w-9 object-contain" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">AMT Sistemas</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Sistemas White Label
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {items.map((it) => (
            <a
              key={it.label}
              href={it.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
            >
              {it.label}
            </a>
          ))}
          <Button asChild size="sm" className="ml-2 gap-2">
            <a href="#formulario">Quero criar meu sistema</a>
          </Button>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <Button asChild size="sm">
            <a href="#formulario">Criar meu sistema</a>
          </Button>
          <button
            type="button"
            aria-label="Abrir menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="rounded-md border border-border p-2 text-muted-foreground"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border/60 md:hidden" style={{ backgroundColor: "var(--background)" }}>
          <div className="mx-auto grid max-w-6xl gap-1 px-5 py-3">
            {items.map((it) => (
              <a
                key={it.label}
                href={it.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-primary"
              >
                {it.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

/* -------------------- HERO -------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, oklch(0.72 0.13 205 / 0.16), transparent 70%), radial-gradient(45% 45% at 85% 90%, oklch(0.62 0.11 200 / 0.10), transparent 75%)",
        }}
      />
      <div className="relative mx-auto max-w-5xl px-5 pb-16 pt-16 text-center sm:px-6 sm:pb-24 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Tecnologia sob medida para o seu negócio
          </span>

          <h1 className="mx-auto mt-6 max-w-4xl text-balance text-3xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Sistemas sob medida para o seu negócio.{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              Tecnologia que se adapta à sua operação.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Sistemas personalizados, White Label, automações e IA para transformar processos em uma operação mais simples, integrada e eficiente.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="gap-2">
              <a href="#formulario">
                Quero desenvolver meu sistema <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                Falar com a AMT pelo WhatsApp <MessageCircle className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </motion.div>

        <Reveal delay={0.15}>
          <div className="mt-14">
            <HeroFlow />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function HeroFlow() {
  const nodes = [
    { label: "Necessidade do cliente", icon: FileSpreadsheet },
    { label: "AMT Sistemas", icon: Cpu },
    { label: "Solução digital", icon: LayoutDashboard },
    { label: "Sistema White Label", icon: Layers },
    { label: "Marca do cliente", icon: ShieldCheck },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="grid gap-3 sm:grid-cols-5 sm:items-stretch">
        {nodes.map((n, i) => (
          <div key={n.label} className="flex items-center gap-3 sm:flex-col sm:gap-2">
            <div
              className="flex flex-1 items-center gap-3 rounded-xl border border-border/80 px-3 py-3 sm:w-full sm:flex-col sm:gap-2 sm:text-center"
              style={
                i === nodes.length - 1
                  ? { background: "var(--gradient-primary)", color: "var(--primary-foreground)", border: "none" }
                  : { backgroundColor: "var(--muted)" }
              }
            >
              <n.icon className={`h-5 w-5 ${i === nodes.length - 1 ? "" : "text-primary"}`} />
              <span className="text-xs font-medium sm:text-[13px]">{n.label}</span>
            </div>
            {i < nodes.length - 1 && (
              <>
                <ArrowDown className="h-4 w-4 shrink-0 text-primary/50 sm:hidden" aria-hidden />
                <ArrowRight className="hidden h-4 w-4 text-primary/50 sm:block" aria-hidden />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------- SECTIONS -------------------- */

function QuemSomos() {
  return (
    <Section id="amt" tone="blue">
      <Reveal>
        <Eyebrow>O que é a AMT Sistemas</Eyebrow>
        <H2>Não entregamos apenas um sistema. Desenvolvemos a solução que o seu negócio precisa.</H2>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <p className="text-muted-foreground">
            A AMT Sistemas é uma empresa de tecnologia especializada no desenvolvimento de sistemas
            White Label personalizados. Trabalhamos com diferentes segmentos, modelos de negócio e
            necessidades operacionais — sempre partindo da realidade de cada empresa.
          </p>
          <p className="text-muted-foreground">
            Entendemos negócios e usamos tecnologia para resolver problemas reais. Um sistema
            desenvolvido pela AMT pode ser personalizado para receber a identidade, a marca, os
            processos e as necessidades específicas de cada empresa.
          </p>
        </div>
      </Reveal>
    </Section>
  );
}

function Adapta() {
  return (
    <Section>
      <Reveal>
        <Eyebrow>Diferencial</Eyebrow>
        <H2>Seu negócio não é igual aos outros. Seu sistema também não deveria ser.</H2>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="space-y-4 text-muted-foreground">
            <p>
              Sistemas prontos funcionam bem quando o seu negócio se encaixa no modelo definido pelo
              software. Nós trabalhamos de outra forma.
            </p>
            <p>
              A AMT Sistemas desenvolve soluções White Label personalizadas para adaptar tecnologia,
              processos e experiência à realidade de cada empresa.
            </p>
            <p className="font-medium text-foreground">
              Você define o que precisa. Nós transformamos essa necessidade em uma solução digital.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {[
              "Processos do seu negócio, não do software",
              "Módulos definidos por você",
              "Regras específicas do seu segmento",
              "Interface pensada para o seu público",
            ].map((t) => (
              <div
                key={t}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm shadow-sm"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

function WhiteLabel() {
  const aspectos = [
    "identidade visual",
    "nome",
    "domínio",
    "funcionalidades",
    "módulos",
    "processos",
    "permissões",
    "experiência do usuário",
    "regras específicas do negócio",
  ];
  return (
    <Section id="white-label" tone="blue">
      <Reveal>
        <Eyebrow>O que é White Label</Eyebrow>
        <H2>Sua empresa. Sua marca. Seu sistema.</H2>
        <p className="mt-5 max-w-3xl text-muted-foreground">
          White Label significa que a tecnologia pode ser desenvolvida pela AMT Sistemas, mas
          apresentada ao mercado com a identidade da empresa contratante.
        </p>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <FlowChain
            steps={[
              "AMT Sistemas — desenvolvimento",
              "Sistema personalizado",
              "Marca do cliente",
              "Clientes do cliente",
            ]}
          />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              A solução pode ser adaptada em
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {aspectos.map((a) => (
                <span
                  key={a}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-sm capitalize shadow-sm"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

function Segmentos() {
  return (
    <Section id="segmentos">
      <Reveal>
        <Eyebrow>Para quem desenvolvemos</Eyebrow>
        <H2>Uma tecnologia. Diferentes possibilidades.</H2>
      </Reveal>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {segmentos.map((s, i) => (
          <Reveal key={s.titulo} delay={i * 0.04}>
            <Card className="h-full border-border bg-card shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <s.icon className="h-5 w-5 text-primary" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{s.titulo}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.texto}</p>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
      <Reveal>
        <p className="mt-8 rounded-xl border border-dashed border-primary/30 bg-accent/40 p-5 text-center text-sm font-medium">
          Seu segmento pode ser diferente. A solução pode ser desenvolvida para ele.
        </p>
      </Reveal>
    </Section>
  );
}

function DoProblemaASolucao() {
  return (
    <Section id="metodologia" tone="blue">
      <Reveal>
        <Eyebrow>Metodologia</Eyebrow>
        <H2>Começamos pelo problema. Terminamos com uma solução.</H2>
      </Reveal>
      <div className="mt-10">
        <Reveal>
          <div className="mx-auto max-w-4xl">
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {fluxo.map((f, i) => (
                <li
                  key={f}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <span className="text-xs font-semibold text-primary">{i + 1}</span>
                  <p className="mt-1 text-sm font-medium">{f}</p>
                </li>
              ))}
              <li
                className="flex items-center gap-3 rounded-xl p-4 text-sm font-medium"
                style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
              >
                <Rocket className="h-4 w-4" /> Sistema em operação
              </li>
            </ol>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

function Modulos() {
  return (
    <Section id="modulos">
      <Reveal>
        <Eyebrow>Sistemas modulares</Eyebrow>
        <H2>Construa apenas o que seu negócio precisa.</H2>
        <p className="mt-5 max-w-3xl text-muted-foreground">
          A solução pode ser estruturada em módulos, permitindo começar com os recursos essenciais e
          evoluir conforme o negócio cresce. Os módulos abaixo são exemplos de aplicação — não uma
          lista fechada.
        </p>
      </Reveal>
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {modulos.map((m, i) => (
          <Reveal key={m.nome} delay={i * 0.03}>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-colors hover:border-primary/40">
              <m.icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm font-medium">{m.nome}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function Personalizacao() {
  const itens = ["logo", "cores", "domínio", "telas", "menus", "módulos", "nomenclaturas", "experiência do usuário"];
  return (
    <Section tone="blue">
      <Reveal>
        <Eyebrow>Personalização White Label</Eyebrow>
        <H2>O sistema passa a fazer parte da sua marca.</H2>
      </Reveal>
      <div className="mt-10 grid gap-4 lg:grid-cols-3 lg:items-center">
        <Reveal>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sistema padrão
            </p>
            <div className="mt-4 space-y-2">
              {["Interface neutra", "Nomes genéricos", "Marca do fornecedor"].map((t) => (
                <div key={t} className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {t}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="flex flex-col items-center gap-2 py-2">
            <Palette className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Personalização</span>
            <div className="flex flex-wrap justify-center gap-1.5">
              {itens.map((i) => (
                <span key={i} className="rounded-full border border-border bg-card px-2.5 py-1 text-xs">
                  {i}
                </span>
              ))}
            </div>
            <ArrowDown className="h-4 w-4 text-primary/60 lg:hidden" aria-hidden />
            <ArrowRight className="hidden h-4 w-4 text-primary/60 lg:block" aria-hidden />
          </div>
        </Reveal>
        <Reveal delay={0.16}>
          <div
            className="rounded-2xl p-6 shadow-sm"
            style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
              Identidade da empresa
            </p>
            <div className="mt-4 space-y-2">
              {["Sua marca e suas cores", "Seu domínio", "Seus fluxos e nomenclaturas"].map((t) => (
                <div key={t} className="rounded-lg bg-white/15 px-3 py-2 text-sm">
                  {t}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

function Tecnologia() {
  const recursos = [
    { icon: Cpu, nome: "Inteligência Artificial" },
    { icon: Workflow, nome: "Automação de processos" },
    { icon: LayoutDashboard, nome: "Dashboards" },
    { icon: Plug, nome: "Integrações e APIs" },
    { icon: Bell, nome: "Notificações" },
    { icon: BarChart3, nome: "Relatórios" },
    { icon: Boxes, nome: "Gestão de dados" },
    { icon: ShieldCheck, nome: "Segurança e permissões" },
  ];
  return (
    <Section>
      <Reveal>
        <Eyebrow>Tecnologia</Eyebrow>
        <H2>Tecnologia para simplificar operações.</H2>
        <p className="mt-5 max-w-2xl text-lg font-medium">
          Menos tarefas manuais. Mais controle. Mais produtividade.
        </p>
      </Reveal>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {recursos.map((r, i) => (
          <Reveal key={r.nome} delay={i * 0.03}>
            <div className="h-full rounded-xl border border-border bg-card p-4 shadow-sm">
              <r.icon className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-medium">{r.nome}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="mt-12 grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold">
              Transforme processos espalhados em uma operação inteligente.
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Informação fragmentada gera retrabalho e decisão sem dado. Um sistema próprio
              centraliza a operação.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-muted p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Antes
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {["Planilhas", "WhatsApp", "Anotações", "Processos manuais", "Informações espalhadas"].map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div
              className="rounded-xl p-4"
              style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Depois</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {["Dashboard", "Automação", "Gestão", "Dados centralizados", "Relatórios", "Processos integrados"].map(
                  (t) => (
                    <li key={t}>{t}</li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

function Diferenciais() {
  return (
    <Section id="diferenciais" tone="blue">
      <Reveal>
        <Eyebrow>Diferenciais</Eyebrow>
        <H2>Por que desenvolver com a AMT Sistemas?</H2>
      </Reveal>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {diferenciais.map((d, i) => (
          <Reveal key={d.titulo} delay={i * 0.03}>
            <Card className="h-full border-border bg-card shadow-sm">
              <CardContent className="p-5">
                <d.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 text-sm font-semibold">{d.titulo}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{d.texto}</p>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function Solucoes() {
  return (
    <Section id="solucoes" tone="blue">
      <Reveal>
        <Eyebrow>Portfólio</Eyebrow>
        <H2>Sistemas que já saíram do projeto e estão em operação.</H2>
        <p className="mt-5 max-w-3xl text-muted-foreground">
          Conheça produtos desenvolvidos pela AMT Sistemas. Cada plataforma foi construída para uma
          operação real e pode servir de referência para o que podemos desenvolver para sua empresa.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {solucoes.map((s, i) => (
          <Reveal key={s.nome} delay={i * 0.04}>
            <Card className="group flex h-full flex-col overflow-hidden border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              {s.screenshot && (
                <div className="relative aspect-[16/9] overflow-hidden border-b border-border/60 bg-muted">
                  <img
                    src={s.screenshot}
                    alt={`Screenshot da plataforma ${s.nome}`}
                    loading="lazy"
                    className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-primary shadow-sm">
                    {s.status}
                  </span>
                </div>
              )}
              <CardContent className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-3">
                  {s.logo ? (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-border">
                      <img src={s.logo} alt={`Logo ${s.nome}`} loading="lazy" className="h-9 w-9 object-contain" />
                    </span>
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                      AB
                    </span>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">{s.nome}</h3>
                    {!s.screenshot && <span className="text-xs text-muted-foreground">{s.status}</span>}
                  </div>
                </div>
                <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">{s.descricao}</p>
                <Button asChild variant="outline" size="sm" className="mt-6 w-full justify-between gap-2">
                  <a href={s.url} target="_blank" rel="noreferrer">
                    Conhecer plataforma <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </Button>
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
    <Section id="como-funciona" tone="blue">
      <Reveal>
        <Eyebrow>Como funciona o projeto</Eyebrow>
        <H2>Do primeiro briefing ao sistema funcionando.</H2>
      </Reveal>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {etapas.map((e, i) => (
          <Reveal key={e.n} delay={i * 0.03}>
            <div className="h-full rounded-xl border border-border bg-card p-5 shadow-sm">
              <span className="text-sm font-semibold text-primary">{e.n}</span>
              <h3 className="mt-2 text-sm font-semibold">{e.titulo}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{e.texto}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function Investimento() {
  const fatores = [
    "complexidade",
    "número de módulos",
    "integrações",
    "quantidade de usuários",
    "nível de personalização",
    "automações",
    "infraestrutura",
    "manutenção",
  ];
  return (
    <Section id="projeto">
      <Reveal>
        <Eyebrow>Modelos de projeto</Eyebrow>
        <H2>Cada projeto tem um escopo — e um investimento próprio.</H2>
        <p className="mt-5 max-w-3xl text-muted-foreground">
          Não trabalhamos com preços genéricos. O investimento de cada solução depende de fatores
          definidos no diagnóstico:
        </p>
      </Reveal>
      <div className="mt-8 flex flex-wrap gap-2">
        {fatores.map((f) => (
          <span
            key={f}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-sm capitalize shadow-sm"
          >
            {f}
          </span>
        ))}
      </div>
      <Reveal>
        <Button asChild size="lg" className="mt-8 gap-2">
          <a href="#formulario">
            Solicite uma análise do seu projeto <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </Reveal>
    </Section>
  );
}

function Faq() {
  return (
    <Section id="faq" tone="blue">
      <Reveal>
        <Eyebrow>Dúvidas frequentes</Eyebrow>
        <H2>Perguntas sobre sistemas White Label</H2>
      </Reveal>
      <div className="mt-8 max-w-3xl">
        <Accordion type="single" collapsible className="w-full">
          {faq.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-sm font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}

function CtaFinal() {
  return (
    <Section>
      <Reveal>
        <div
          className="rounded-3xl p-8 text-center shadow-sm sm:p-14"
          style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
        >
          <h2 className="mx-auto max-w-3xl text-balance text-2xl font-semibold tracking-tight sm:text-4xl">
            Vamos transformar sua necessidade em um sistema?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-sm opacity-90 sm:text-base">
            Conte para nós como sua empresa funciona, quais problemas você enfrenta e o que gostaria
            de automatizar. A AMT Sistemas pode transformar essa necessidade em uma solução digital
            personalizada para o seu negócio.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary" className="gap-2">
              <a href="#formulario">
                Quero desenvolver meu sistema <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-current hover:bg-white/10"
            >
              <a href="#formulario">Falar com a AMT Sistemas</a>
            </Button>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

/* -------------------- FORM -------------------- */

const SEGMENTOS_FORM = [
  "Educação",
  "Esportes",
  "Comércio",
  "Serviços",
  "Saúde",
  "Empresas / uso interno",
  "Outro segmento",
];

function Formulario() {
  const [form, setForm] = useState({
    nome: "",
    empresa: "",
    telefone: "",
    email: "",
    segmento: "",
    necessidade: "",
    sistemaAtual: "",
    problema: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    try {
      const mensagem = [
        `O que a empresa precisa: ${form.necessidade.trim()}`,
        form.sistemaAtual.trim() ? `Sistema atual: ${form.sistemaAtual.trim()}` : null,
        form.problema.trim() ? `Problema a resolver: ${form.problema.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n\n");

      const { error } = await supabase.from("contatos_leads").insert({
        nome: form.nome.trim(),
        empresa: form.empresa.trim() || null,
        email: form.email.trim(),
        telefone: form.telefone.trim() || null,
        segmento: form.segmento.trim() || null,
        mensagem,
      });
      if (error) throw error;
      setEnviado(true);
      setForm({
        nome: "",
        empresa: "",
        telefone: "",
        email: "",
        segmento: "",
        necessidade: "",
        sistemaAtual: "",
        problema: "",
      });
      toast.success("Solicitação enviada! Vamos analisar seu projeto e entrar em contato.");
    } catch (err) {
      console.error("Erro ao enviar contato", err);
      toast.error("Não foi possível enviar. Tente novamente em instantes.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Section id="formulario" tone="blue">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        <div>
          <Eyebrow>Solicite uma análise</Eyebrow>
          <H2>Conte como sua empresa funciona.</H2>
          <p className="mt-4 text-muted-foreground">
            Com essas informações conseguimos avaliar escopo, módulos e o melhor caminho para
            desenvolver a sua solução White Label.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Análise do projeto sem compromisso",
              "Atendimento comercial direto",
              "Resposta em até 1 dia útil",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-5 sm:p-8">
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    required
                    maxLength={100}
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input
                    id="empresa"
                    maxLength={120}
                    value={form.empresa}
                    onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="telefone">WhatsApp</Label>
                  <Input
                    id="telefone"
                    inputMode="tel"
                    maxLength={40}
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    maxLength={200}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="segmento">Segmento</Label>
                <Select value={form.segmento} onValueChange={(v) => setForm({ ...form, segmento: v })}>
                  <SelectTrigger id="segmento">
                    <SelectValue placeholder="Selecione o segmento…" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEGMENTOS_FORM.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="necessidade">O que sua empresa precisa? *</Label>
                <Textarea
                  id="necessidade"
                  required
                  rows={3}
                  maxLength={1200}
                  value={form.necessidade}
                  onChange={(e) => setForm({ ...form, necessidade: e.target.value })}
                  placeholder="Descreva a operação e o que o sistema deveria fazer."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="sistemaAtual">Já utiliza algum sistema?</Label>
                  <Input
                    id="sistemaAtual"
                    maxLength={120}
                    placeholder="Qual? Ou planilhas / nenhum"
                    value={form.sistemaAtual}
                    onChange={(e) => setForm({ ...form, sistemaAtual: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="problema">Qual problema quer resolver?</Label>
                  <Input
                    id="problema"
                    maxLength={200}
                    value={form.problema}
                    onChange={(e) => setForm({ ...form, problema: e.target.value })}
                  />
                </div>
              </div>

              <Button type="submit" size="lg" disabled={enviando} className="mt-2 gap-2">
                {enviando ? "Enviando..." : "Solicitar análise do projeto"}
                <ArrowRight className="h-4 w-4" />
              </Button>

              {enviado && (
                <p className="text-xs text-emerald-600">
                  Solicitação enviada com sucesso. Em breve entraremos em contato.
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}

/* -------------------- FOOTER -------------------- */

function Footer() {
  return (
    <footer className="border-t border-border/60" style={{ backgroundColor: "var(--background)" }}>
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-border">
                <img
                  src={amtSistemas.url}
                  alt="AMT Sistemas e Soluções"
                  className="h-10 w-10 object-contain"
                />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-base font-semibold">AMT Sistemas</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Sistemas White Label
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Empresa de tecnologia especializada no desenvolvimento de sistemas White Label
              personalizados. Tecnologia que se adapta ao seu negócio.
            </p>
            <div className="mt-5 flex gap-2">
              <SocialLink href="#formulario" label="WhatsApp">
                <MessageCircle className="h-4 w-4" />
              </SocialLink>
              <SocialLink href="#formulario" label="Instagram">
                <Instagram className="h-4 w-4" />
              </SocialLink>
              <SocialLink href="#formulario" label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </SocialLink>
              <SocialLink href="mailto:contato@amtsistemas.com.br" label="E-mail">
                <Mail className="h-4 w-4" />
              </SocialLink>
            </div>
          </div>

          <FooterCol
            title="Soluções"
            items={[
              { label: "Soluções desenvolvidas", href: "#solucoes" },
              { label: "Sistemas modulares", href: "#modulos" },
              { label: "White Label", href: "#white-label" },
            ]}
          />
          <FooterCol
            title="Empresa"
            items={[
              { label: "Sobre a AMT", href: "#amt" },
              { label: "Como funciona", href: "#como-funciona" },
              { label: "Segmentos", href: "#segmentos" },
              { label: "FAQ", href: "#faq" },
            ]}
          />
          <FooterCol
            title="Legal"
            items={[
              { label: "Privacidade", href: "/privacidade" },
              { label: "Termos", href: "/termos" },
            ]}
          />
        </div>

        <div className="mt-12 border-t border-border/60 pt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} AMT Sistemas e Soluções. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider">{title}</h4>
      <ul className="mt-4 space-y-2 text-sm">
        {items.map((l) => (
          <li key={l.label}>
            <a href={l.href} className="text-muted-foreground hover:text-foreground">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
    >
      {children}
    </a>
  );
}

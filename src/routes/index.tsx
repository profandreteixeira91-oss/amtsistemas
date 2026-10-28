import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Cpu,
  Dumbbell,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Package,
  Palette,
  Plug,
  Repeat,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Users2,
  Wallet,
  Workflow,
  Zap,
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
} from "@/components/site/site-config";
import {
  CheckList,
  Container,
  IconBadge,
  Reveal,
  Section,
  SectionHeader,
} from "@/components/site/primitives";
import { supabase } from "@/integrations/supabase/client";

const TITLE = "AMT Sistemas | Sistemas White Label Personalizados";
const DESCRIPTION =
  "Desenvolvemos sistemas personalizados, plataformas White Label, automações e soluções com Inteligência Artificial para empresas.";

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
      { name: "theme-color", content: "#0A2D5E" },
    ],
    links: [
      { rel: "canonical", href: "https://amtsistemas.com.br/" },
      { rel: "icon", type: "image/png", href: "/brand/amt-icone.png" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "AMT Sistemas e Soluções",
          url: "https://amtsistemas.com.br/",
          logo: "https://amtsistemas.com.br/brand/amt-logo.png",
          description:
            "Empresa de tecnologia especializada no desenvolvimento de sistemas White Label personalizados para diferentes segmentos e modelos de negócio.",
          areaServed: "BR",
        }),
      },
    ],
  }),
  component: AmtLanding,
});

/* -------------------- DADOS -------------------- */

type Item = { icon: React.ComponentType<{ className?: string }>; titulo: string; texto: string };

type Solucao = {
  nome: string;
  segmento: string;
  descricao: string;
  logo?: string;
  screenshot: string;
  url: string;
  interno?: boolean;
  destaque?: string;
};

const solucoes: Solucao[] = [
  {
    nome: "AMT OptiOne",
    segmento: "Óticas",
    descricao:
      "Vendas e PDV, receitas, pedidos de laboratório, estoque, financeiro e relacionamento com o cliente em um só sistema.",
    logo: "/optione/icone-amt-optione.png",
    screenshot: "/optione/sistema-visao-geral.webp",
    url: "/optione",
    interno: true,
    destaque: "Teste grátis por 14 dias",
  },
  {
    nome: "AMT Dojo Manager",
    segmento: "Academias e dojos",
    descricao: "Gestão para academias de artes marciais, dojos e estúdios de treino.",
    logo: "/brand/logo-dojo-manager.png",
    screenshot: "/assets/screenshot-dojo-manager.webp",
    url: "https://dojomanager.amtfightwear.com.br",
  },
  {
    nome: "AMT Fight Wear",
    segmento: "E-commerce",
    descricao:
      "E-commerce e gestão para o mercado de fight wear, artes marciais e equipamentos de combate.",
    logo: "/brand/logo-fight-wear.png",
    screenshot: "/assets/screenshot-fight-wear.webp",
    url: "https://amtfightwear.com.br",
  },
];

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

const beneficios: Item[] = [
  {
    icon: Clock3,
    titulo: "Menos trabalho manual",
    texto: "Automatize tarefas repetitivas e reduza etapas que consomem tempo da equipe.",
  },
  {
    icon: LayoutDashboard,
    titulo: "Mais controle da operação",
    texto: "Centralize informações e transforme dados espalhados em uma visão clara do negócio.",
  },
  {
    icon: TrendingUp,
    titulo: "Uma solução que evolui",
    texto: "Comece pelo essencial e amplie o sistema conforme novas necessidades surgirem.",
  },
];

const recursos = [
  { icon: LayoutDashboard, nome: "Dashboards" },
  { icon: Users2, nome: "Gestão de clientes" },
  { icon: Wallet, nome: "Financeiro" },
  { icon: Package, nome: "Estoque" },
  { icon: ShoppingBag, nome: "Vendas" },
  { icon: CalendarClock, nome: "Agenda" },
  { icon: Users2, nome: "Equipe e permissões" },
  { icon: BarChart3, nome: "Relatórios" },
  { icon: MessageCircle, nome: "Comunicação" },
  { icon: Bell, nome: "Notificações" },
  { icon: Workflow, nome: "Automação de processos" },
  { icon: Plug, nome: "Integrações e APIs" },
  { icon: Cpu, nome: "Inteligência Artificial" },
  { icon: Boxes, nome: "Gestão de dados" },
  { icon: ShieldCheck, nome: "Segurança" },
];

const etapas = [
  { titulo: "Diagnóstico", texto: "Entendemos seu negócio, seus processos e seus objetivos." },
  { titulo: "Planejamento", texto: "Definimos funcionalidades, módulos e estrutura da solução." },
  { titulo: "Desenvolvimento", texto: "Construímos o sistema a partir das necessidades mapeadas." },
  { titulo: "Personalização", texto: "Aplicamos a identidade visual e as regras do seu negócio." },
  { titulo: "Testes", texto: "Validamos funcionamento, segurança e experiência de uso." },
  { titulo: "Implantação", texto: "Colocamos o sistema em operação com a sua equipe." },
  { titulo: "Evolução", texto: "Continuamos aprimorando a solução conforme a necessidade." },
];

const diferenciais: Item[] = [
  {
    icon: Palette,
    titulo: "Sob medida",
    texto: "O sistema é desenvolvido considerando a realidade do negócio.",
  },
  {
    icon: ShieldCheck,
    titulo: "White Label",
    texto: "A solução assume a identidade da sua empresa.",
  },
  { icon: Layers, titulo: "Modular", texto: "A plataforma cresce conforme as necessidades." },
  { icon: Zap, titulo: "Escalável", texto: "A estrutura acompanha a evolução do negócio." },
  { icon: Workflow, titulo: "Automação", texto: "Processos repetitivos podem ser automatizados." },
  {
    icon: Cpu,
    titulo: "Inteligência Artificial",
    texto: "IA aplicada onde torna a operação mais inteligente.",
  },
  {
    icon: Users2,
    titulo: "Experiência personalizada",
    texto: "Interface e fluxos pensados para o seu público.",
  },
  {
    icon: Repeat,
    titulo: "Evolução contínua",
    texto: "O sistema continua evoluindo após o lançamento.",
  },
];

const camadasWhiteLabel = [
  "Identidade visual",
  "Nome",
  "Domínio",
  "Funcionalidades",
  "Módulos",
  "Processos",
  "Permissões",
  "Experiência do usuário",
  "Regras do negócio",
];

const fatoresInvestimento = [
  "Complexidade",
  "Número de módulos",
  "Integrações",
  "Quantidade de usuários",
  "Nível de personalização",
  "Automações",
  "Infraestrutura",
  "Manutenção",
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
  { q: "A AMT desenvolve sistemas do zero?", a: "Sim, de acordo com as necessidades do projeto." },
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

/* -------------------- PÁGINA -------------------- */

function AmtLanding() {
  return (
    <SiteShell>
      <Hero />
      <Solucoes />
      <WhiteLabel />
      <Segmentos />
      <Recursos />
      <ComoTrabalhamos />
      <Diferenciais />
      <Investimento />
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
            "radial-gradient(55% 60% at 85% 10%, oklch(0.6 0.105 194 / 0.16), transparent 70%), radial-gradient(40% 50% at 0% 100%, oklch(0.31 0.09 259 / 0.08), transparent 70%), linear-gradient(180deg, oklch(0.985 0.008 230), oklch(1 0 0))",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.31 0.09 259 / 0.06) 1px, transparent 1px), linear-gradient(90deg, oklch(0.31 0.09 259 / 0.06) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <Container className="relative grid items-center gap-12 pb-16 pt-12 sm:pb-20 sm:pt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:pb-24 lg:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--brand-navy)] shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[var(--brand-teal)]" />
            Sistemas White Label sob medida
          </span>
          <h1
            id="hero-titulo"
            className="mt-6 text-[2.15rem] font-extrabold leading-[1.08] text-[var(--brand-navy)] sm:text-5xl lg:text-[3.4rem]"
          >
            Sistemas sob medida para o seu negócio.{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              Tecnologia que se adapta à sua operação.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Sistemas personalizados, plataformas White Label, automações e Inteligência Artificial
            para transformar processos em uma operação mais simples, integrada e eficiente.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className={`${CTA_LG} shadow-lg shadow-[oklch(0.31_0.09_259/0.25)]`}>
              <a href="#contato">
                Solicitar análise do projeto <ArrowRight />
              </a>
            </Button>
            <Button asChild variant="outline" className={`${CTA_LG} bg-white`}>
              <a href="#solucoes">Ver sistemas em operação</a>
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-[var(--brand-navy)]">
            {["Sua marca", "Seus processos", "Evolução contínua"].map((item) => (
              <li key={item} className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[var(--brand-teal)]" /> {item}
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </Container>

      <Container className="relative pb-14 sm:pb-16">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] shadow-[var(--shadow-card)] lg:grid-cols-4">
          {[
            { valor: `${solucoes.length}`, rotulo: "plataformas próprias em operação" },
            { valor: "100%", rotulo: "desenvolvido para o seu processo" },
            { valor: "Sua marca", rotulo: "nome, cores e domínio da empresa" },
            { valor: "Direto", rotulo: "com quem desenvolve o sistema" },
          ].map((fato) => (
            <div key={fato.rotulo} className="bg-white px-5 py-5 sm:px-6">
              <dt className="sr-only">{fato.rotulo}</dt>
              <dd>
                <span className="block text-xl font-extrabold text-[var(--brand-navy)] sm:text-2xl">
                  {fato.valor}
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground sm:text-sm">
                  {fato.rotulo}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <BrowserFrame
        src="/optione/sistema-visao-geral.webp"
        alt="Tela de visão geral do AMT OptiOne, sistema de gestão para óticas"
        label="AMT OptiOne"
        width={1600}
        height={853}
        priority
        className="relative z-10"
      />
      <BrowserFrame
        src="/assets/screenshot-dojo-manager.webp"
        alt="Tela do AMT Dojo Manager, gestão para academias"
        label="AMT Dojo Manager"
        width={1200}
        height={520}
        className="absolute -bottom-10 -left-4 z-20 hidden w-[52%] sm:block lg:-left-10"
      />
      <BrowserFrame
        src="/assets/screenshot-fight-wear.webp"
        alt="Loja AMT Fight Wear"
        label="AMT Fight Wear"
        width={1200}
        height={505}
        className="absolute -right-3 -top-8 z-0 hidden w-[46%] sm:block lg:-right-6"
      />
      <div className="absolute -bottom-5 right-4 z-30 hidden items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--brand-navy)] shadow-[var(--shadow-lift)] sm:inline-flex">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        Sistemas em operação
      </div>
    </div>
  );
}

function BrowserFrame({
  src,
  alt,
  label,
  width,
  height,
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  label: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure
      className={`overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-[var(--shadow-lift)] ${className}`}
    >
      <div
        aria-hidden
        className="flex items-center gap-1.5 border-b border-[var(--border)] bg-[var(--section-alt)] px-3 py-2"
      >
        <span className="h-2 w-2 rounded-full bg-[oklch(0.8_0.02_250)]" />
        <span className="h-2 w-2 rounded-full bg-[oklch(0.8_0.02_250)]" />
        <span className="h-2 w-2 rounded-full bg-[oklch(0.8_0.02_250)]" />
        <span className="ml-2 truncate text-[10px] font-medium text-muted-foreground">{label}</span>
      </div>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        className="block h-auto w-full"
      />
    </figure>
  );
}

/* -------------------- SEÇÕES -------------------- */

function Solucoes() {
  return (
    <Section id="solucoes" tone="alt" labelledBy="solucoes-titulo">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <Reveal>
          <SectionHeader
            id="solucoes-titulo"
            eyebrow="Sistemas em operação"
            title="Plataformas que já saíram do projeto e rodam no dia a dia."
            description="Produtos desenvolvidos pela AMT Sistemas para operações reais — e referência do que podemos construir para a sua empresa."
          />
        </Reveal>
      </div>

      {/* Celular: carrossel de deslizar (o próximo card aparece na borda); tablet em diante: grade. */}
      <div
        className="-mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 [scrollbar-width:thin] sm:-mx-6 sm:px-6 md:mx-0 md:mt-12 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3"
        aria-label="Sistemas em operação"
        role="list"
      >
        {solucoes.map((s, i) => (
          <Reveal
            key={s.nome}
            delay={i * 0.06}
            className="h-auto w-[84%] shrink-0 snap-start sm:w-[60%] md:h-full md:w-auto"
          >
            <div role="listitem" className="h-full">
              <SolucaoCard solucao={s} />
            </div>
          </Reveal>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground md:hidden" aria-hidden>
        Deslize para ver os outros sistemas →
      </p>

      <Reveal>
        <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:p-7">
          <div>
            <p className="text-lg font-bold text-[var(--brand-navy)]">
              Sua empresa precisa de algo diferente?
            </p>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Partimos de um processo específico e transformamos a necessidade em uma solução
              digital.
            </p>
          </div>
          <Button asChild className={`${CTA_LG} w-full shrink-0 sm:w-auto`}>
            <a href="#contato">
              Falar sobre meu projeto <ArrowRight />
            </a>
          </Button>
        </div>
      </Reveal>
    </Section>
  );
}

function SolucaoCard({ solucao: s }: { solucao: Solucao }) {
  const conteudo = (
    <>
      <div className="relative aspect-[16/10] overflow-hidden border-b border-[var(--border)] bg-[var(--section-alt)]">
        <img
          src={s.screenshot}
          alt={`Tela da plataforma ${s.nome}`}
          loading="lazy"
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[var(--brand-navy)] shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Em operação
        </span>
        {s.destaque && (
          <span
            className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm"
            style={{ background: "var(--gradient-primary)" }}
          >
            {s.destaque}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-3">
          {s.logo && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-white">
              <img src={s.logo} alt="" className="h-8 w-8 object-contain" loading="lazy" />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-[var(--brand-navy)]">{s.nome}</h3>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-teal)]">
              {s.segmento}
            </p>
          </div>
        </div>
        <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">{s.descricao}</p>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-navy)]">
          {s.interno ? "Conhecer e testar" : "Conhecer plataforma"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </>
  );
  const classe =
    "group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]";
  return s.interno ? (
    <Link to="/optione" className={classe}>
      {conteudo}
    </Link>
  ) : (
    <a
      href={s.url}
      target="_blank"
      rel="noreferrer"
      className={classe}
      aria-label={`${s.nome} (abre em nova aba)`}
    >
      {conteudo}
    </a>
  );
}

function WhiteLabel() {
  return (
    <Section id="white-label" labelledBy="white-label-titulo">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16">
        <Reveal>
          <SectionHeader
            id="white-label-titulo"
            eyebrow="White Label"
            title="Sua empresa. Sua marca. Seu sistema."
            description="A AMT Sistemas é uma empresa de tecnologia especializada em sistemas White Label personalizados: a tecnologia é desenvolvida por nós e chega ao mercado com a identidade da sua empresa."
          />
          <p className="mt-4 leading-7 text-muted-foreground">
            Sistemas prontos funcionam quando o negócio se encaixa no modelo do software. Nós
            trabalhamos de outra forma: você define o que precisa e transformamos essa necessidade
            em uma solução digital.
          </p>
          <CheckList
            className="mt-7"
            items={[
              "Processos do seu negócio, não do software",
              "Módulos definidos por você",
              "Regras específicas do seu segmento",
              "Interface pensada para o seu público",
            ]}
          />
        </Reveal>

        <Reveal delay={0.08}>
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--section-alt)] p-5 sm:p-7">
            <ol className="space-y-3">
              {[
                { titulo: "AMT Sistemas", texto: "Desenvolvimento, infraestrutura e evolução" },
                {
                  titulo: "Sistema personalizado",
                  texto: "Módulos, regras e fluxos do seu negócio",
                },
                { titulo: "Sua marca", texto: "Nome, cores, domínio e identidade" },
              ].map((camada, i) => (
                <li
                  key={camada.titulo}
                  className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm"
                  style={{ marginLeft: `${i * 0.75}rem` }}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-teal-soft)] text-sm font-bold text-[var(--brand-navy)]">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--brand-navy)]">{camada.titulo}</p>
                    <p className="text-sm text-muted-foreground">{camada.texto}</p>
                  </div>
                </li>
              ))}
              <li
                className="flex items-center gap-4 rounded-2xl p-4 text-white shadow-[var(--shadow-lift)]"
                style={{ marginLeft: "2.25rem", background: "var(--gradient-primary)" }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-sm font-bold">
                  4
                </span>
                <div>
                  <p className="font-semibold">Seus clientes</p>
                  <p className="text-sm text-white/80">Usam a solução como sua</p>
                </div>
              </li>
            </ol>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              A solução pode ser adaptada em
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {camadasWhiteLabel.map((c) => (
                <li
                  key={c}
                  className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-sm text-[var(--brand-navy)]"
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

function Segmentos() {
  return (
    <Section id="segmentos" tone="alt" labelledBy="segmentos-titulo">
      <Reveal>
        <SectionHeader
          id="segmentos-titulo"
          eyebrow="Para quem desenvolvemos"
          title="Uma tecnologia. Diferentes possibilidades."
          description="A mesma base técnica, adaptada às regras de cada segmento."
        />
      </Reveal>
      <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 lg:grid-cols-3">
        {segmentos.map((s, i) => (
          <Reveal key={s.titulo} delay={(i % 3) * 0.05} className="h-full">
            <article className="h-full rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)] sm:p-6">
              <IconBadge icon={s.icon} />
              <h3 className="mt-4 text-base font-bold text-[var(--brand-navy)] sm:mt-5 sm:text-lg">
                {s.titulo}
              </h3>
              <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground sm:mt-2 sm:text-sm sm:leading-6">
                {s.texto}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
      <Reveal>
        <p className="mt-8 rounded-2xl border border-dashed border-[oklch(0.6_0.105_194/0.45)] bg-white/60 px-5 py-4 text-center text-sm font-medium text-[var(--brand-navy)]">
          Seu segmento é diferente? A solução pode ser desenvolvida para ele.{" "}
          <a
            href="#contato"
            className="font-semibold text-[var(--brand-teal)] underline underline-offset-4"
          >
            Conte para nós
          </a>
        </p>
      </Reveal>
    </Section>
  );
}

function Recursos() {
  return (
    <Section id="recursos" labelledBy="recursos-titulo">
      <Reveal>
        <SectionHeader
          id="recursos-titulo"
          eyebrow="Recursos"
          title="Tecnologia que trabalha a favor da sua operação."
          description="Menos tarefas manuais. Mais controle. Mais produtividade. Comece com os módulos essenciais e evolua conforme o negócio cresce."
        />
      </Reveal>

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {beneficios.map((b, i) => (
          <Reveal key={b.titulo} delay={i * 0.06} className="h-full">
            <article className="h-full rounded-2xl border border-[var(--border)] bg-white p-7 shadow-[var(--shadow-card)]">
              <IconBadge icon={b.icon} />
              <h3 className="mt-5 text-lg font-bold text-[var(--brand-navy)]">{b.titulo}</h3>
              <p className="mt-2 leading-7 text-muted-foreground">{b.texto}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <Reveal className="h-full">
          <div className="h-full rounded-2xl border border-[var(--border)] bg-[var(--section-alt)] p-6 sm:p-7">
            <h3 className="font-bold text-[var(--brand-navy)]">Módulos e recursos</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Exemplos de aplicação — não uma lista fechada.
            </p>
            <ul className="mt-5 grid grid-cols-2 gap-2 xl:grid-cols-3">
              {recursos.map((r) => (
                <li
                  key={r.nome}
                  className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-2.5 py-2 text-[13px] font-medium leading-tight text-[var(--brand-navy)] sm:gap-2.5 sm:px-3 sm:py-2.5 sm:text-sm"
                >
                  <r.icon className="h-4 w-4 shrink-0 text-[var(--brand-teal)]" />
                  {r.nome}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.08} className="h-full">
          <div className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)] sm:p-7">
            <h3 className="font-bold text-[var(--brand-navy)]">
              De processos espalhados a uma operação integrada
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Informação fragmentada gera retrabalho e decisão sem dado. Um sistema próprio
              centraliza a operação.
            </p>
            <div className="mt-5 grid flex-1 grid-cols-2 gap-3">
              <div className="rounded-xl bg-[var(--section-alt)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Antes
                </p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {[
                    "Planilhas",
                    "WhatsApp",
                    "Anotações",
                    "Processos manuais",
                    "Dados espalhados",
                  ].map((t) => (
                    <li key={t} className="line-through decoration-[oklch(0.6_0.02_250/0.5)]">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="rounded-xl p-4 text-white"
                style={{ background: "var(--gradient-primary)" }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
                  Depois
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {[
                    "Dashboard",
                    "Automação",
                    "Dados centralizados",
                    "Relatórios",
                    "Processos integrados",
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

function ComoTrabalhamos() {
  return (
    <Section
      id="como-funciona"
      tone="dark"
      labelledBy="como-funciona-titulo"
      className="overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(45% 60% at 90% 0%, oklch(0.6 0.105 194 / 0.45), transparent 70%)",
        }}
      />
      <div className="relative">
        <Reveal>
          <SectionHeader
            dark
            id="como-funciona-titulo"
            eyebrow="Como trabalhamos"
            title="Começamos pelo problema. Terminamos com o sistema funcionando."
            description="Um processo claro, do primeiro briefing à evolução contínua da solução."
          />
        </Reveal>
        <ol className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 lg:grid-cols-4">
          {etapas.map((e, i) => (
            <Reveal
              as="li"
              key={e.titulo}
              delay={(i % 4) * 0.05}
              className="h-full rounded-2xl border border-white/12 bg-white/[0.06] p-4 backdrop-blur-sm sm:p-6"
            >
              <span className="text-sm font-bold text-[oklch(0.82_0.09_195)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-base font-bold text-white sm:mt-3 sm:text-lg">{e.titulo}</h3>
              <p className="mt-1.5 text-[13px] leading-5 text-white/70 sm:mt-2 sm:text-sm sm:leading-6">
                {e.texto}
              </p>
            </Reveal>
          ))}
          <Reveal
            as="li"
            delay={0.15}
            className="flex h-full flex-col justify-between rounded-2xl bg-white p-4 text-[var(--brand-navy)] sm:p-6"
          >
            <p className="text-base font-bold leading-snug sm:text-lg">
              Pronto para começar pelo diagnóstico?
            </p>
            <Button asChild className={`${CTA_LG} mt-6 w-full`}>
              <a href="#contato">
                Solicitar análise <ArrowRight />
              </a>
            </Button>
          </Reveal>
        </ol>
      </div>
    </Section>
  );
}

function Diferenciais() {
  return (
    <Section id="diferenciais" labelledBy="diferenciais-titulo">
      <Reveal>
        <SectionHeader
          id="diferenciais-titulo"
          eyebrow="Diferenciais"
          title="Por que desenvolver com a AMT Sistemas?"
          align="center"
        />
      </Reveal>
      <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-8 sm:mt-12 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-4">
        {diferenciais.map((d, i) => (
          <Reveal key={d.titulo} delay={(i % 4) * 0.05}>
            <div>
              <IconBadge icon={d.icon} />
              <h3 className="mt-4 font-bold text-[var(--brand-navy)]">{d.titulo}</h3>
              <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                {d.texto}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function Investimento() {
  return (
    <Section id="investimento" tone="alt" labelledBy="investimento-titulo">
      <Reveal>
        <div className="grid gap-8 rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)] sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <SectionHeader
              id="investimento-titulo"
              eyebrow="Investimento"
              title="Cada projeto tem um escopo — e um investimento próprio."
              description="Não trabalhamos com preços genéricos. O valor de cada solução é definido no diagnóstico, a partir de fatores como:"
            />
            <Button asChild className={`${CTA_LG} mt-8 w-full sm:w-auto`}>
              <a href="#contato">
                Solicitar análise do projeto <ArrowRight />
              </a>
            </Button>
          </div>
          <ul className="flex flex-wrap gap-2 lg:justify-end">
            {fatoresInvestimento.map((f) => (
              <li
                key={f}
                className="rounded-full border border-[var(--border)] bg-[var(--section-alt)] px-4 py-2 text-sm font-medium text-[var(--brand-navy)]"
              >
                {f}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </Section>
  );
}

function Faq() {
  return (
    <Section id="faq" labelledBy="faq-titulo">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal>
          <SectionHeader
            id="faq-titulo"
            eyebrow="Dúvidas frequentes"
            title="Perguntas sobre sistemas White Label"
            description="Não encontrou a sua dúvida? Fale direto com a nossa equipe."
          />
          <Button asChild variant="outline" className={`${CTA_LG} mt-7`}>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              <MessageCircle /> Perguntar pelo WhatsApp
            </a>
          </Button>
        </Reveal>
        <Reveal delay={0.06}>
          <Accordion
            type="single"
            collapsible
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-5 shadow-[var(--shadow-card)] sm:px-7"
          >
            {faq.map((f, i) => (
              <AccordionItem
                key={f.q}
                value={`item-${i}`}
                className="border-[var(--border)] last:border-b-0"
              >
                <AccordionTrigger className="py-5 text-left text-base font-semibold text-[var(--brand-navy)] hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[15px] leading-7 text-muted-foreground">
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

const SEGMENTOS_FORM = [
  "Educação",
  "Esportes",
  "Comércio",
  "Serviços",
  "Saúde",
  "Empresas / uso interno",
  "Outro segmento",
];

const FORM_VAZIO = {
  nome: "",
  empresa: "",
  telefone: "",
  email: "",
  segmento: "",
  necessidade: "",
  sistemaAtual: "",
  problema: "",
};

function Contato() {
  return (
    <Section id="contato" tone="dark" labelledBy="contato-titulo" className="overflow-hidden">
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
            eyebrow="Solicite uma análise"
            title="Vamos transformar sua necessidade em um sistema?"
            description="Conte como sua empresa funciona, quais problemas enfrenta e o que gostaria de automatizar. Avaliamos escopo, módulos e o melhor caminho para a sua solução."
          />
          <CheckList
            dark
            className="mt-8"
            items={[
              "Análise do projeto sem compromisso",
              "Atendimento comercial direto",
              "Resposta em até 1 dia útil",
            ]}
          />
          <div className="mt-10 grid gap-3 sm:max-w-sm">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.12]"
            >
              <MessageCircle className="h-5 w-5 text-[oklch(0.82_0.09_195)]" /> Prefere conversar?
              Fale pelo WhatsApp
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
    const mensagem = [
      `O que a empresa precisa: ${form.necessidade.trim()}`,
      form.sistemaAtual.trim() ? `Sistema atual: ${form.sistemaAtual.trim()}` : null,
      form.problema.trim() ? `Problema a resolver: ${form.problema.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");
    try {
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
      setForm(FORM_VAZIO);
      toast.success("Solicitação enviada! Vamos analisar seu projeto e entrar em contato.");
    } catch (err) {
      console.error("Erro ao enviar contato", err);
      const texto = [
        "Olá! Quero solicitar uma análise de projeto à AMT Sistemas.",
        `Nome: ${form.nome.trim()}`,
        form.empresa.trim() ? `Empresa: ${form.empresa.trim()}` : null,
        `E-mail: ${form.email.trim()}`,
        form.telefone.trim() ? `WhatsApp: ${form.telefone.trim()}` : null,
        form.segmento.trim() ? `Segmento: ${form.segmento.trim()}` : null,
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
        <Campo id="segmento" label="Segmento">
          <Select
            value={form.segmento}
            onValueChange={(v) => setForm((f) => ({ ...f, segmento: v }))}
          >
            <SelectTrigger id="segmento" className="h-11">
              <SelectValue placeholder="Selecione o segmento…" />
            </SelectTrigger>
            <SelectContent className="amt-site">
              {SEGMENTOS_FORM.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
        <Campo id="necessidade" label="O que sua empresa precisa?" obrigatorio>
          <Textarea
            id="necessidade"
            required
            rows={4}
            maxLength={1200}
            placeholder="Descreva a operação e o que o sistema deveria fazer."
            {...campo("necessidade")}
          />
        </Campo>
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo id="sistemaAtual" label="Já utiliza algum sistema?">
            <Input
              id="sistemaAtual"
              maxLength={120}
              placeholder="Qual? Ou planilhas / nenhum"
              className="h-11"
              {...campo("sistemaAtual")}
            />
          </Campo>
          <Campo id="problema" label="Qual problema quer resolver?">
            <Input id="problema" maxLength={200} className="h-11" {...campo("problema")} />
          </Campo>
        </div>
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
          {enviando ? "Enviando…" : "Solicitar análise do projeto"} <ArrowRight />
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

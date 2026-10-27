import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Mail, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Páginas do AMT OptiOne (sistema de gestão para óticas) dentro do site da AMT Sistemas:
// mesmo tema corporativo da home, com a marca e o acento azul-petróleo do produto.

export const OPTIONE_NAME = "AMT OptiOne";
export const OPTIONE_WHATSAPP_URL = `https://wa.me/5511999738440?text=${encodeURIComponent(
  "Olá! Quero saber mais sobre o AMT OptiOne, o sistema de gestão para óticas.",
)}`;
export const OPTIONE_TEAL = "oklch(0.6 0.11 185)";

const THEME = {
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
  "--primary-glow": OPTIONE_TEAL,
  "--gradient-primary": `linear-gradient(135deg, oklch(0.32 0.09 255), ${OPTIONE_TEAL})`,
  "--ring": OPTIONE_TEAL,
  "--accent": "oklch(0.94 0.03 200)",
  "--accent-foreground": "oklch(0.32 0.09 255)",
  "--section-blue": "oklch(0.97 0.02 220)",
  backgroundColor: "var(--background)",
  color: "var(--foreground)",
} as React.CSSProperties;

export function OptioneShell({
  children,
  navItems = [],
  showCta = true,
}: {
  children: React.ReactNode;
  navItems?: { label: string; href: string }[];
  showCta?: boolean;
}) {
  return (
    <div className="amt-corp flex min-h-screen flex-col" style={THEME}>
      <OptioneNav items={navItems} showCta={showCta} />
      <main className="flex-1">{children}</main>
      <OptioneFooter />
    </div>
  );
}

export function Section({
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
      style={{ backgroundColor: tone === "blue" ? "var(--section-blue)" : "var(--background)" }}
    >
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-16">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Badge className="mb-4 border-primary/20 bg-primary/10 text-primary hover:bg-primary/15">
      {children}
    </Badge>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="max-w-3xl text-pretty text-2xl font-semibold tracking-tight sm:text-4xl">
      {children}
    </h2>
  );
}

function OptioneNav({
  items,
  showCta,
}: {
  items: { label: string; href: string }[];
  showCta: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header
      className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-xl"
      style={{ backgroundColor: "color-mix(in oklab, var(--background) 88%, transparent)" }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 sm:px-6">
        <Link
          to="/optione"
          className="flex shrink-0 items-center"
          aria-label="AMT OptiOne — página inicial"
        >
          {/* Sized by width: the site's .amt-corp img rule forces height: auto. */}
          <img
            src="/optione/logo-amt-optione.png"
            alt="AMT OptiOne"
            width={720}
            height={122}
            className="w-[150px] sm:w-[190px]"
          />
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {items.map((it) => (
            <a
              key={it.label}
              href={it.href}
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-primary [overflow-wrap:normal]"
            >
              {it.label}
            </a>
          ))}
          {showCta && (
            <Button
              asChild
              size="sm"
              className="ml-2 shrink-0 whitespace-nowrap [overflow-wrap:normal]"
            >
              <Link to="/optione/teste-gratis">Teste grátis por 14 dias</Link>
            </Button>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          {showCta && (
            <Button asChild size="sm" className="shrink-0 whitespace-nowrap [overflow-wrap:normal]">
              <Link to="/optione/teste-gratis">Teste grátis</Link>
            </Button>
          )}
          {items.length > 0 && (
            <button
              type="button"
              aria-label="Abrir menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="rounded-md border border-border p-2 text-muted-foreground"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {open && items.length > 0 && (
        <nav
          className="border-t border-border/60 md:hidden"
          style={{ backgroundColor: "var(--background)" }}
        >
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

function OptioneFooter() {
  return (
    <footer className="border-t border-border/60" style={{ backgroundColor: "var(--background)" }}>
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <img
              src="/optione/logo-amt-optione.png"
              alt="AMT OptiOne"
              width={720}
              height={122}
              className="w-[210px]"
            />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Sistema de gestão para óticas: vendas e PDV, receitas, laboratório, estoque,
              financeiro e relacionamento com o cliente. Um produto da AMT Sistemas e Soluções.
            </p>
            <div className="mt-5 flex gap-2">
              <a
                href={OPTIONE_WHATSAPP_URL}
                aria-label="WhatsApp"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href="mailto:contato@amtsistemas.com.br"
                aria-label="E-mail"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>
          <FooterCol
            title="AMT OptiOne"
            items={[
              { label: "Recursos", href: "/optione#recursos" },
              { label: "Planos", href: "/optione#planos" },
              { label: "Teste grátis", href: "/optione/teste-gratis" },
              { label: "Nova chave de acesso", href: "/optione/nova-chave" },
            ]}
          />
          <FooterCol
            title="AMT Sistemas"
            items={[
              { label: "Sobre a AMT", href: "/" },
              { label: "Privacidade", href: "/privacidade" },
              { label: "Termos", href: "/termos" },
            ]}
          />
        </div>
        <div className="mt-10 border-t border-border/60 pt-8 text-center text-xs text-muted-foreground">
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

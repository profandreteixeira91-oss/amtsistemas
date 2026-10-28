import { Link } from "@tanstack/react-router";
import { MotionConfig } from "framer-motion";
import { ArrowRight, Mail, Menu, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Container } from "./primitives";
import {
  CONTACT_EMAIL,
  CTA_MD,
  HOME_NAV,
  SISTEMAS,
  WHATSAPP_URL,
  type NavItem,
} from "./site-config";

// Casca do site público: cabeçalho, rodapé e tema .amt-site (styles.css).

export function SiteShell({
  children,
  nav = HOME_NAV,
  header,
  className,
}: {
  children: React.ReactNode;
  nav?: NavItem[];
  /** Cabeçalho próprio (ex.: páginas de produto); sem ele, o cabeçalho da AMT. */
  header?: React.ReactNode;
  className?: string;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("amt-site flex min-h-screen flex-col", className)}>
        <a
          href="#conteudo"
          className="sr-only z-[60] rounded-lg bg-[var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
        >
          Pular para o conteúdo
        </a>
        {header ?? <SiteHeader nav={nav} />}
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </div>
    </MotionConfig>
  );
}

export function AmtBrand({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <img src="/brand/amt-simbolo.png" alt="" width={512} height={400} className="w-11 shrink-0" />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[15px] font-extrabold tracking-tight",
            inverted ? "text-white" : "text-[var(--brand-navy)]",
          )}
        >
          AMT Sistemas
        </span>
        <span
          className={cn(
            "mt-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
            inverted ? "text-white/60" : "text-[var(--brand-teal)]",
          )}
        >
          Sistemas &amp; Soluções
        </span>
      </span>
    </span>
  );
}

function SiteHeader({ nav }: { nav: NavItem[] }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
      <Container className="flex h-[4.5rem] items-center gap-6">
        <Link to="/" aria-label="AMT Sistemas — página inicial" className="shrink-0">
          <AmtBrand />
        </Link>

        <nav aria-label="Principal" className="ml-auto hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-[var(--section-alt)] hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          <Button
            asChild
            variant="ghost"
            className="hidden h-10 rounded-lg px-3 text-sm font-semibold sm:inline-flex"
          >
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              <MessageCircle /> WhatsApp
            </a>
          </Button>
          <Button asChild className={cn(CTA_MD, "hidden sm:inline-flex")}>
            <a href="/#contato">
              Solicitar análise <ArrowRight />
            </a>
          </Button>
          <MobileMenu nav={nav} />
        </div>
      </Container>
    </header>
  );
}

function MobileMenu({ nav }: { nav: NavItem[] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-lg lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="amt-site w-[86vw] max-w-sm border-l border-[var(--border)] p-0"
      >
        <SheetHeader className="border-b border-[var(--border)] px-6 py-5 text-left">
          <SheetTitle asChild>
            <div>
              <AmtBrand />
            </div>
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="Menu" className="grid gap-1 px-4 py-4">
          {nav.map((item) => (
            <SheetClose asChild key={item.href}>
              <a
                href={item.href}
                className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-[var(--section-alt)]"
              >
                {item.label}
              </a>
            </SheetClose>
          ))}
          <p className="mt-4 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Sistemas
          </p>
          {SISTEMAS.map((item) => (
            <SheetClose asChild key={item.href}>
              <a
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-[var(--section-alt)] hover:text-foreground"
              >
                {item.label}
              </a>
            </SheetClose>
          ))}
        </nav>
        <div className="grid gap-2 border-t border-[var(--border)] px-6 py-5">
          <SheetClose asChild>
            <Button asChild className={CTA_MD}>
              <a href="/#contato">
                Solicitar análise do projeto <ArrowRight />
              </a>
            </Button>
          </SheetClose>
          <Button asChild variant="outline" className={CTA_MD}>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              <MessageCircle /> Falar pelo WhatsApp
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SiteFooter() {
  return (
    <footer className="text-white" style={{ background: "var(--gradient-dark)" }}>
      <Container className="py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" aria-label="AMT Sistemas — página inicial" className="inline-block">
              <AmtBrand inverted />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/70">
              Sistemas White Label personalizados, automações e Inteligência Artificial para
              empresas. Tecnologia que conecta. Soluções que transformam.
            </p>
          </div>
          <FooterCol title="Sistemas" items={SISTEMAS} />
          <FooterCol
            title="Empresa"
            items={[
              { label: "Soluções", href: "/#solucoes" },
              { label: "White Label", href: "/#white-label" },
              { label: "Como trabalhamos", href: "/#como-funciona" },
              { label: "Dúvidas frequentes", href: "/#faq" },
            ]}
          />
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              Contato
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-white/85 hover:text-white"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex items-center gap-2 text-white/85 hover:text-white"
                >
                  <Mail className="h-4 w-4" /> {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href="/#contato"
                  className="inline-flex items-center gap-2 text-white/85 hover:text-white"
                >
                  <ArrowRight className="h-4 w-4" /> Solicitar análise
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AMT Sistemas e Soluções. Todos os direitos reservados.</p>
          <div className="flex gap-5">
            <a href="/privacidade" className="hover:text-white">
              Privacidade
            </a>
            <a href="/termos" className="hover:text-white">
              Termos de uso
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm">
        {items.map((item) => (
          <li key={item.href}>
            <a href={item.href} className="text-white/85 hover:text-white">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

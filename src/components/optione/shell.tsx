import { Link } from "@tanstack/react-router";
import { ArrowRight, KeyRound, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SiteShell } from "@/components/site/layout";
import {
  Container,
  Eyebrow as SiteEyebrow,
  Section as SiteSection,
} from "@/components/site/primitives";
import { CTA_MD } from "@/components/site/site-config";

// Páginas do AMT OptiOne (sistema de gestão para óticas) dentro do site da AMT Sistemas:
// mesma casca, tema e rodapé do site, com o cabeçalho e a marca do produto.

export const OPTIONE_NAME = "AMT OptiOne";
export const OPTIONE_WHATSAPP_URL = `https://wa.me/5511999738440?text=${encodeURIComponent(
  "Olá! Quero saber mais sobre o AMT OptiOne, o sistema de gestão para óticas.",
)}`;

type NavItem = { label: string; href: string };

export function OptioneShell({
  children,
  navItems = [],
  showCta = true,
}: {
  children: React.ReactNode;
  navItems?: NavItem[];
  showCta?: boolean;
}) {
  return (
    <SiteShell header={<OptioneHeader items={navItems} showCta={showCta} />}>{children}</SiteShell>
  );
}

export function Section({
  id,
  tone = "white",
  children,
  className,
}: {
  id?: string;
  tone?: "white" | "blue";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <SiteSection id={id} tone={tone === "blue" ? "alt" : "white"} className={className}>
      {children}
    </SiteSection>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <SiteEyebrow>{children}</SiteEyebrow>
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="max-w-3xl text-[1.75rem] font-bold leading-[1.15] text-[var(--brand-navy)] sm:text-4xl">
      {children}
    </h2>
  );
}

function OptioneLogo({ width = 190 }: { width?: number }) {
  // Dimensionada pela largura (a altura acompanha a proporção da imagem).
  return (
    <img
      src="/optione/logo-amt-optione.png"
      alt="AMT OptiOne"
      width={720}
      height={122}
      style={{ width }}
      className="h-auto max-w-none"
    />
  );
}

function OptioneHeader({ items, showCta }: { items: NavItem[]; showCta: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
      <Container className="flex h-[4.5rem] items-center gap-6">
        <Link to="/optione" aria-label="AMT OptiOne — página inicial" className="shrink-0">
          <span className="sm:hidden">
            <OptioneLogo width={150} />
          </span>
          <span className="hidden sm:inline">
            <OptioneLogo />
          </span>
        </Link>

        <nav aria-label="AMT OptiOne" className="ml-auto hidden items-center gap-1 lg:flex">
          {items.map((it) => (
            <a
              key={it.href}
              href={it.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-[var(--section-alt)] hover:text-foreground"
            >
              {it.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          {showCta && (
            <Button asChild className={`${CTA_MD} hidden sm:inline-flex`}>
              <Link to="/optione/teste-gratis">
                Teste grátis por 14 dias <ArrowRight />
              </Link>
            </Button>
          )}
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
                    <OptioneLogo width={170} />
                  </div>
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Menu do AMT OptiOne" className="grid gap-1 px-4 py-4">
                {items.map((it) => (
                  <SheetClose asChild key={it.href}>
                    <a
                      href={it.href}
                      className="rounded-lg px-3 py-3 text-base font-medium hover:bg-[var(--section-alt)]"
                    >
                      {it.label}
                    </a>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link
                    to="/optione/nova-chave"
                    className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-medium hover:bg-[var(--section-alt)]"
                  >
                    <KeyRound className="h-4 w-4 text-[var(--brand-teal)]" /> Nova chave de acesso
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/"
                    className="rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-[var(--section-alt)]"
                  >
                    Site da AMT Sistemas
                  </Link>
                </SheetClose>
              </nav>
              <div className="border-t border-[var(--border)] px-6 py-5">
                <SheetClose asChild>
                  <Button asChild className={`${CTA_MD} w-full`}>
                    <Link to="/optione/teste-gratis">
                      Teste grátis por 14 dias <ArrowRight />
                    </Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  );
}

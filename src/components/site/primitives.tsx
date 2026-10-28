import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls, useInView } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

// Blocos de layout do site público (tema .amt-site em styles.css).

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8", className)}>{children}</div>
  );
}

type Tone = "white" | "alt" | "dark";

export function Section({
  id,
  tone = "white",
  className,
  containerClassName,
  children,
  labelledBy,
}: {
  id?: string;
  tone?: Tone;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("relative py-14 sm:py-24", tone === "dark" && "text-white", className)}
      style={{
        background:
          tone === "dark"
            ? "var(--gradient-dark)"
            : tone === "alt"
              ? "var(--section-alt)"
              : "var(--background)",
      }}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

export function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]",
        dark ? "text-[oklch(0.82_0.09_195)]" : "text-[var(--brand-teal)]",
      )}
    >
      <span
        aria-hidden
        className={cn("h-px w-6", dark ? "bg-[oklch(0.82_0.09_195)]" : "bg-[var(--brand-teal)]")}
      />
      {children}
    </span>
  );
}

export function SectionHeader({
  id,
  eyebrow,
  title,
  description,
  align = "left",
  dark = false,
  className,
}: {
  id?: string;
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      <Eyebrow dark={dark}>{eyebrow}</Eyebrow>
      <h2
        id={id}
        className={cn(
          "mt-4 text-[1.75rem] font-bold leading-[1.15] sm:text-4xl lg:text-[2.6rem]",
          dark ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 text-base leading-7 sm:text-lg",
            dark ? "text-white/75" : "text-muted-foreground",
            align === "center" && "mx-auto max-w-2xl",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  /** "li" quando o item fica dentro de <ul>/<ol> (HTML válido para leitores de tela). */
  as?: "div" | "li";
}) {
  // O HTML do servidor já vem visível (sem depender de JavaScript para aparecer). Depois de
  // montar, só o que está abaixo da tela é escondido e entra com animação ao ser rolado.
  const ref = useRef<HTMLDivElement & HTMLLIElement>(null);
  const controls = useAnimationControls();
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el && el.getBoundingClientRect().top > window.innerHeight) {
      controls.set({ opacity: 0, y: 16 });
      setArmed(true);
    }
  }, [controls]);

  useEffect(() => {
    if (armed && inView) {
      void controls.start({
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay },
      });
    }
  }, [armed, inView, controls, delay]);

  const Comp = as === "li" ? motion.li : motion.div;
  return (
    <Comp ref={ref} className={className} initial={false} animate={controls}>
      {children}
    </Comp>
  );
}

export function CheckList({
  items,
  dark = false,
  className,
}: {
  items: string[];
  dark?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <CheckCircle2
            aria-hidden
            className={cn(
              "mt-0.5 h-5 w-5 shrink-0",
              dark ? "text-[oklch(0.82_0.09_195)]" : "text-[var(--brand-teal)]",
            )}
          />
          <span className={dark ? "text-white/85" : "text-muted-foreground"}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Ícone em "pílula" usada nos cards do site. */
export function IconBadge({
  icon: Icon,
  dark = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  dark?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-xl",
        dark
          ? "bg-white/10 text-[oklch(0.82_0.09_195)] ring-1 ring-white/15"
          : "bg-[var(--brand-teal-soft)] text-[var(--brand-navy)]",
      )}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

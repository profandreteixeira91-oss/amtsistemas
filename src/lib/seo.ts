// SEO e GEO do site público da AMT Sistemas (amtsistemas.com.br): cabeçalho de cada página, dados
// estruturados (schema.org) e a lista de páginas públicas usada pelo sitemap.xml e pelo llms.txt.

import {
  CONTACT_EMAIL,
  SUPPORT_WHATSAPP_NUMBER,
  WHATSAPP_NUMBER,
} from "@/components/site/site-config";

export const SITE_HOST = "amtsistemas.com.br";
export const SITE_WWW_HOST = `www.${SITE_HOST}`;
export const SITE_URL = `https://${SITE_HOST}`;
export const SITE_NAME = "AMT Sistemas e Soluções";
export const SITE_DESCRIPTION =
  "Sistemas White Label com a marca da sua empresa, sites, softwares para Windows, aplicativos Android e iOS, lojas virtuais e automações sob medida.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/brand/og-amt-sistemas.jpg`;

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export function absoluteUrl(path: string): string {
  return path.startsWith("http") ? path : `${SITE_URL}${path}`;
}

/** "5511999738440" -> "+55 11 99973-8440" */
function phoneBR(digits: string): string {
  const m = digits.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `+55 ${m[1]} ${m[2]}-${m[3]}` : `+${digits}`;
}

/** Páginas públicas indexáveis (sitemap.xml e llms.txt). lastmod = última mudança relevante do conteúdo. */
export const PUBLIC_PAGES: Array<{
  path: string;
  title: string;
  summary: string;
  lastmod: string;
  priority: string;
}> = [
  {
    path: "/",
    title: "AMT Sistemas e Soluções",
    summary:
      "Sistemas White Label, sites, softwares para Windows, aplicativos, lojas virtuais e automações sob medida.",
    lastmod: "2026-11-19",
    priority: "1.0",
  },
  {
    path: "/optione",
    title: "AMT OptiOne",
    summary: "Sistema de gestão para óticas (Windows), com planos e teste grátis de 14 dias.",
    lastmod: "2026-11-19",
    priority: "0.9",
  },
  {
    path: "/optione/teste-gratis",
    title: "Teste grátis do AMT OptiOne",
    summary: "Cadastro da ótica para usar o AMT OptiOne por 14 dias, sem cartão.",
    lastmod: "2026-11-19",
    priority: "0.7",
  },
  {
    path: "/termos",
    title: "Termos de Serviço",
    summary: "Termos e condições de uso dos sistemas e serviços da AMT Sistemas.",
    lastmod: "2026-11-19",
    priority: "0.2",
  },
  {
    path: "/privacidade",
    title: "Política de Privacidade",
    summary: "Como a AMT Sistemas coleta, usa e protege dados pessoais (LGPD).",
    lastmod: "2026-11-19",
    priority: "0.2",
  },
];

/** Páginas que o www redireciona para o domínio principal (as áreas logadas ficam onde estão). */
export function isPublicSeoPath(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return PUBLIC_PAGES.some((page) => page.path === path) || path.startsWith("/lp/");
}

type HeadMeta = Record<string, string>;

/**
 * Título, descrição, canônico e Open Graph/Twitter completos de uma página. Cada página define todos os
 * campos de compartilhamento, para nenhum valor genérico da raiz sobrar misturado.
 */
export function pageHead({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  imageAlt = SITE_NAME,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  noindex?: boolean;
}): { meta: HeadMeta[]; links: HeadMeta[] } {
  const url = absoluteUrl(path);
  const img = absoluteUrl(image);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...(noindex ? [{ name: "robots", content: "noindex, follow" }] : []),
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:image", content: img },
      { property: "og:image:alt", content: imageAlt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: img },
    ],
    links: noindex ? [] : [{ rel: "canonical", href: url }],
  };
}

export function organizationLd() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    alternateName: "AMT Sistemas",
    url: `${SITE_URL}/`,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/brand/amt-logo.png`,
      width: 900,
      height: 665,
    },
    image: DEFAULT_OG_IMAGE,
    description:
      "Empresa brasileira de tecnologia que desenvolve sistemas White Label com a marca do cliente, sites, softwares para Windows, aplicativos Android e iOS, lojas virtuais e automações sob medida.",
    email: CONTACT_EMAIL,
    telephone: phoneBR(WHATSAPP_NUMBER),
    areaServed: { "@type": "Country", name: "Brasil" },
    knowsLanguage: "pt-BR",
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        telephone: phoneBR(WHATSAPP_NUMBER),
        email: CONTACT_EMAIL,
        areaServed: "BR",
        availableLanguage: "Portuguese",
      },
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        telephone: phoneBR(SUPPORT_WHATSAPP_NUMBER),
        email: CONTACT_EMAIL,
        areaServed: "BR",
        availableLanguage: "Portuguese",
      },
    ],
  };
}

export function websiteLd() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    alternateName: "AMT Sistemas",
    description: SITE_DESCRIPTION,
    inLanguage: "pt-BR",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function faqLd(path: string, items: Array<{ q: string; a: string }>) {
  return {
    "@type": "FAQPage",
    "@id": `${absoluteUrl(path)}#faq`,
    inLanguage: "pt-BR",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/** Um único bloco JSON-LD com todos os nós da página (@graph). */
export function jsonLd(nodes: object[]) {
  return {
    type: "application/ld+json",
    children: JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }),
  };
}

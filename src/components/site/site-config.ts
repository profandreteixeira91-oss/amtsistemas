// Configuração do site público: contatos, menus e classes de chamada.

export const WHATSAPP_NUMBER = "5511999738440";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Olá! Gostaria de falar com a AMT Sistemas sobre um projeto.",
)}`;
export const CONTACT_EMAIL = "contato@amtsistemas.com.br";

/** WhatsApp do suporte (instância amt-suporte): atende o chat do site, no celular e no /admin. */
export const SUPPORT_WHATSAPP_NUMBER = "551151040791";
export const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}`;

/** Evento que abre o chat do site (components/site/site-chat.tsx). */
export const SITE_CHAT_EVENT = "amt:site-chat-open";

/**
 * Clique num botão "WhatsApp" do site: abre o chat na própria página. Sem o chat carregado (JavaScript
 * desligado, erro), o link segue para o WhatsApp normalmente.
 */
export function openSiteChat(event?: { preventDefault(): void }) {
  if (
    typeof window === "undefined" ||
    !(window as unknown as { __amtSiteChat?: boolean }).__amtSiteChat
  )
    return;
  event?.preventDefault();
  window.dispatchEvent(new Event(SITE_CHAT_EVENT));
}

export type NavItem = { label: string; href: string };

export const HOME_NAV: NavItem[] = [
  { label: "White Label", href: "/#white-label" },
  { label: "Serviços", href: "/#servicos" },
  { label: "Sistemas", href: "/#sistemas" },
  { label: "Como trabalhamos", href: "/#como-funciona" },
  { label: "Dúvidas", href: "/#faq" },
];

export const SISTEMAS: NavItem[] = [
  { label: "AMT OptiOne — óticas", href: "/optione" },
  { label: "AMT Dojo Manager — academias", href: "https://amtdojomanager.com.br/dojo" },
  { label: "AMT Fight Wear — e-commerce", href: "https://amtfightwear.com.br" },
];

/** Botões de chamada do site: mais altos e com toque confortável no celular. */
export const CTA_LG = "h-12 rounded-xl px-6 text-[15px] font-semibold";
export const CTA_MD = "h-10 rounded-lg px-4 text-sm font-semibold";

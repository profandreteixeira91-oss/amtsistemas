// Configuração do site público: contatos, menus e classes de chamada.

export const WHATSAPP_NUMBER = "5511999738440";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Olá! Gostaria de falar com a AMT Sistemas sobre um projeto.",
)}`;
export const CONTACT_EMAIL = "contato@amtsistemas.com.br";

export type NavItem = { label: string; href: string };

export const HOME_NAV: NavItem[] = [
  { label: "Soluções", href: "/#solucoes" },
  { label: "White Label", href: "/#white-label" },
  { label: "Como trabalhamos", href: "/#como-funciona" },
  { label: "Dúvidas", href: "/#faq" },
];

export const SISTEMAS: NavItem[] = [
  { label: "AMT OptiOne — óticas", href: "/optione" },
  { label: "AMT Dojo Manager — academias", href: "https://dojomanager.amtfightwear.com.br" },
  { label: "AMT Fight Wear — e-commerce", href: "https://amtfightwear.com.br" },
];

/** Botões de chamada do site: mais altos e com toque confortável no celular. */
export const CTA_LG = "h-12 rounded-xl px-6 text-[15px] font-semibold";
export const CTA_MD = "h-10 rounded-lg px-4 text-sm font-semibold";

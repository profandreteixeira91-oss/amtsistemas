import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

import { SITE_HOST, SITE_WWW_HOST, isPublicSeoPath } from "@/lib/seo";

// Conta as visitas das páginas públicas (relatório em /admin › Visitas): avisa /api/public/visita a cada página
// vista, inclusive nas trocas de página sem recarregar. Sem cookies e sem dados pessoais; navegadores onde alguém
// entrou no Control Center não contam (marca salva pelo AdminShell).

export const IGNORE_VISITS_KEY = "amt-visitas-ignorar";

let firstView = true;
let lastPath = "";

function send(path: string) {
  const entry = firstView;
  firstView = false;
  const params = new URLSearchParams(window.location.search);
  const body = JSON.stringify({
    path,
    entry,
    referrer: entry ? document.referrer : "",
    utm_source: entry
      ? (params.get("utm_source") ??
        (params.has("gclid") ? "google" : params.has("fbclid") ? "facebook" : ""))
      : "",
    utm_medium: entry ? (params.get("utm_medium") ?? (params.has("gclid") ? "cpc" : "")) : "",
    utm_campaign: entry ? (params.get("utm_campaign") ?? "") : "",
  });
  const blob = new Blob([body], { type: "text/plain" });
  if (navigator.sendBeacon?.("/api/public/visita", blob)) return;
  void fetch("/api/public/visita", {
    method: "POST",
    body,
    keepalive: true,
    headers: { "content-type": "text/plain" },
  }).catch(() => undefined);
}

export function VisitTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const host = window.location.hostname;
    if (host !== SITE_HOST && host !== SITE_WWW_HOST) return;
    if (!isPublicSeoPath(pathname) || pathname === lastPath) return;
    try {
      if (localStorage.getItem(IGNORE_VISITS_KEY) === "1") return;
    } catch {
      // sem armazenamento: conta normalmente
    }
    lastPath = pathname;
    send(pathname);
  }, [pathname]);

  return null;
}

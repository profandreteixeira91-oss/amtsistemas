import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { SITE_HOST, SITE_WWW_HOST, isPublicSeoPath } from "@/lib/seo";

function requestHostnames(request: Request): string[] {
  const normalize = (h: string | null | undefined) =>
    (h ?? "").split(",")[0].trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  return [
    normalize(request.headers.get("x-forwarded-host")),
    normalize(request.headers.get("host")),
    normalize(new URL(request.url).host),
  ].filter(Boolean);
}

/**
 * Um endereço só para o Google: no www, as páginas públicas (src/lib/seo.ts) vão para o domínio principal
 * com 301. Áreas logadas, APIs e webhooks continuam respondendo no www, para não derrubar sessões nem
 * integrações já configuradas.
 */
const canonicalHostMiddleware = createMiddleware().server(async ({ next, request }) => {
  const isPageRequest =
    (request.method === "GET" || request.method === "HEAD") &&
    (request.headers.get("accept")?.includes("text/html") ?? false);
  if (isPageRequest && requestHostnames(request).includes(SITE_WWW_HOST)) {
    const url = new URL(request.url);
    if (isPublicSeoPath(url.pathname)) {
      return Response.redirect(`https://${SITE_HOST}${url.pathname}${url.search}`, 301);
    }
  }
  return next();
});

/**
 * Cabeçalhos de toda resposta do servidor: HSTS no domínio oficial (o navegador passa a usar sempre HTTPS)
 * e X-Robots-Tag: noindex em qualquer outro endereço (workers.dev, previews), que nunca deve ir ao Google.
 */
const siteHeadersMiddleware = createMiddleware().server(async ({ next, request }) => {
  const result = await next();
  const original = (result as { response?: Response }).response ?? (result as unknown as Response);
  if (!(original instanceof Response)) return result;
  const hosts = requestHostnames(request);
  const official = hosts.some((h) => h === SITE_HOST || h === SITE_WWW_HOST);
  const local = !official && (hosts[0] === "localhost" || hosts[0] === "127.0.0.1");
  if (local) return result;
  // Cabeçalhos de Response.redirect() são imutáveis: copia a resposta antes de marcar.
  const response = new Response(original.body, original);
  if (official) response.headers.set("Strict-Transport-Security", "max-age=31536000");
  else response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return result === (original as unknown) ? response : { ...result, response };
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [siteHeadersMiddleware, canonicalHostMiddleware, errorMiddleware],
}));

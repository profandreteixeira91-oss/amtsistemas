import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { PUBLIC_PAGES, absoluteUrl } from "@/lib/seo";

// sitemap.xml do site da AMT Sistemas: páginas públicas fixas (src/lib/seo.ts) + landing pages publicadas
// no CRM (/lp/:slug).

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function publishedLandingPages(): Promise<Array<{ slug: string; lastmod: string }>> {
  try {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data } = await supabase
      .from("manager_landing_pages")
      .select("slug, updated_at")
      .eq("status", "publicada")
      .order("updated_at", { ascending: false })
      .limit(500);
    return (data ?? []).map((lp) => ({ slug: lp.slug, lastmod: lp.updated_at.slice(0, 10) }));
  } catch {
    return [];
  }
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const landingPages = await publishedLandingPages();
        const urls = [
          ...PUBLIC_PAGES.map((page) => ({
            loc: absoluteUrl(page.path === "/" ? "/" : page.path),
            lastmod: page.lastmod,
            priority: page.priority,
          })),
          ...landingPages.map((lp) => ({
            loc: absoluteUrl(`/lp/${encodeURIComponent(lp.slug)}`),
            lastmod: lp.lastmod,
            priority: "0.5",
          })),
        ];
        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`,
  )
  .join("\n")}
</urlset>
`;
        return new Response(body, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

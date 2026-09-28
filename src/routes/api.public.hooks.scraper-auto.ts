/**
 * Endpoint público para o pg_cron acionar a prospecção automática diária.
 * Autenticação: apikey (chave publishable do Supabase).
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/scraper-auto")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        const apiKey =
          request.headers.get("apikey") ??
          request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ??
          "";

        if (!expected || !apiKey || apiKey !== expected) {
          return new Response(
            JSON.stringify({ error: "unauthorized" }),
            { status: 401, headers: { "Content-Type": "application/json" } },
          );
        }

        try {
          const { executarAutoScraper } = await import(
            "@/lib/lead-scraper-auto.server"
          );
          const result = await executarAutoScraper();
          return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("[scraper-auto] falhou", message);
          return new Response(
            JSON.stringify({ error: "internal", message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});

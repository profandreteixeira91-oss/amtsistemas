import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Endpoint público consumido pelas landing pages dos sistemas AMT.
//
// GET https://amtsistemas.com.br/api/public/planos/amt-restaurant
// GET https://amtsistemas.com.br/api/public/planos/amt-clinic
// GET https://amtsistemas.com.br/api/public/planos/amt-hotel
// GET https://amtsistemas.com.br/api/public/planos/amt-vet
//
// Qualquer alteração em /amt-admin (sistemas, planos, módulos, comercial,
// suporte, hero, CTAs) reflete aqui em até 60s (cache CDN).

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
  "Content-Type": "application/json; charset=utf-8",
};

export const Route = createFileRoute("/api/public/planos/$slug")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ params }) => {
        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );

        const { data: sistema, error: sErr } = await supabase
          .from("manager_sistemas")
          .select(
            "id, slug, nome, descricao, cor, url, logo_url, dominio, checkout_url, versao, trial_dias, pitch_comercial, suporte_whatsapp, suporte_email, configuracoes",
          )
          .eq("slug", params.slug)
          .eq("ativo", true)
          .maybeSingle();

        if (sErr) {
          return new Response(JSON.stringify({ error: sErr.message }), { status: 500, headers: CORS });
        }
        if (!sistema) {
          return new Response(JSON.stringify({ error: "Sistema não encontrado" }), { status: 404, headers: CORS });
        }

        const { data: planos, error: pErr } = await supabase
          .from("manager_planos")
          .select(
            "slug, nome, descricao, preco_mensal, preco_anual, recursos, limites, destaque, ordem, cor, badge, recomendado, texto_comercial, botao_destaque",
          )
          .eq("ativo", true)
          .eq("sistema_id", sistema.id)
          .order("ordem")
          .order("preco_mensal");

        if (pErr) {
          return new Response(JSON.stringify({ error: pErr.message }), { status: 500, headers: CORS });
        }

        const cfg = (sistema.configuracoes as Record<string, any> | null) ?? {};
        const landing = {
          hero_titulo: cfg.hero_titulo ?? sistema.nome,
          hero_subtitulo: cfg.hero_subtitulo ?? sistema.descricao ?? "",
          pitch: sistema.pitch_comercial ?? "",
          cta_primario: cfg.cta_primario ?? "Começar agora",
          cta_secundario: cfg.cta_secundario ?? "Falar com vendas",
          checkout_url: sistema.checkout_url ?? "",
          logo_url: sistema.logo_url ?? "",
          cor: sistema.cor ?? "",
          dominio: sistema.dominio ?? "",
          versao: sistema.versao ?? "",
          trial_dias: sistema.trial_dias ?? 0,
          suporte: {
            whatsapp: sistema.suporte_whatsapp ?? "",
            email: sistema.suporte_email ?? "",
            msg_boas_vindas: cfg.msg_boas_vindas ?? "",
          },
        };

        return new Response(
          JSON.stringify({ sistema, landing, planos: planos ?? [] }),
          { status: 200, headers: CORS },
        );
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";

import { CONTACT_EMAIL, SISTEMAS, WHATSAPP_NUMBER } from "@/components/site/site-config";
import { loadOptionePlanos } from "@/lib/optione.functions";
import { PUBLIC_PAGES, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";
import { HOME_FAQ, OPTIONE_FAQ, OPTIONE_RECURSOS, SERVICOS } from "@/lib/site-content";

// /llms.txt (https://llmstxt.org): resumo da AMT Sistemas em Markdown para assistentes de IA (ChatGPT,
// Claude, Perplexity, Gemini). Montado dos mesmos textos do site (src/lib/site-content.ts) e dos planos do
// catálogo, para nunca ficar desatualizado.

const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const faqMarkdown = (items: Array<{ q: string; a: string }>) =>
  items.map((item) => `### ${item.q}\n${item.a}`).join("\n\n");

async function buildLlmsTxt(): Promise<string> {
  const planos = await loadOptionePlanos();
  const planosMd = planos
    .filter((p) => p.preco_mensal > 0)
    .map(
      (p) => `- **${p.nome}** — ${brl(p.preco_mensal)}/mês${p.descricao ? `: ${p.descricao}` : ""}`,
    )
    .join("\n");

  return `# ${SITE_NAME}

> Empresa brasileira de tecnologia que desenvolve sistemas White Label com a marca do cliente, sites, softwares para Windows, aplicativos Android e iOS, lojas virtuais e automações sob medida. Também mantém produtos próprios: o AMT OptiOne (gestão de óticas) e o AMT Dojo Manager (gestão de academias de artes marciais).

A AMT Sistemas e Soluções (também chamada de "AMT Sistemas") atende empresas de todo o Brasil. No modelo White Label, a AMT desenvolve, hospeda, atualiza e dá suporte ao sistema, e o cliente apresenta a solução com o próprio nome, logotipo, cores e domínio.

## Serviços
${SERVICOS.map((s) => `- **${s.titulo}**: ${s.texto}`).join("\n")}

## Produtos próprios
${SISTEMAS.map((s) => `- [${s.label}](${absoluteUrl(s.href)})`).join("\n")}

## AMT OptiOne — sistema de gestão para óticas
Software para Windows 10 e 11. Teste grátis de 14 dias, sem cartão: ${absoluteUrl("/optione/teste-gratis")}

${OPTIONE_RECURSOS.map((r) => `- **${r.titulo}**: ${r.texto}`).join("\n")}
${planosMd ? `\n### Planos (preço mensal)\n${planosMd}\n` : ""}
## Páginas
${PUBLIC_PAGES.map((page) => `- [${page.title}](${absoluteUrl(page.path)}): ${page.summary}`).join("\n")}

## Perguntas frequentes — AMT Sistemas
${faqMarkdown(HOME_FAQ)}

## Perguntas frequentes — AMT OptiOne
${faqMarkdown(OPTIONE_FAQ)}

## Contato
- Site: ${SITE_URL}/
- E-mail: ${CONTACT_EMAIL}
- WhatsApp: https://wa.me/${WHATSAPP_NUMBER}
`;
}

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(await buildLlmsTxt(), {
          headers: {
            "content-type": "text/markdown; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        }),
    },
  },
});

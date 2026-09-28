import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const schema = z.object({
  empresa_id: z.string().uuid(),
  tipo: z.enum(["insights", "sugerir_preco", "previsao_demanda"]),
  produto_id: z.string().uuid().optional(),
});

export const gerarInsightsIA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");

    // Verificar acesso à empresa
    const { data: membro } = await supabase.from("membros").select("id")
      .eq("empresa_id", data.empresa_id).eq("user_id", context.userId).eq("ativo", true).maybeSingle();
    if (!membro) throw new Error("Sem acesso a esta empresa");

    // Coletar contexto
    const desde = new Date(); desde.setDate(desde.getDate() - 30);
    const [comandas, itens, produtos, insumos, lancs] = await Promise.all([
      supabase.from("comandas").select("total,status,aberta_em").eq("empresa_id", data.empresa_id).gte("aberta_em", desde.toISOString()),
      supabase.from("itens_comanda").select("quantidade,total,produto_id,created_at,produto:produtos(nome)")
        .eq("empresa_id", data.empresa_id).gte("created_at", desde.toISOString()),
      supabase.from("produtos").select("id,nome,preco_venda,custo,cmv_percentual,destaque").eq("empresa_id", data.empresa_id),
      supabase.from("insumos").select("nome,estoque_atual,estoque_minimo,custo_unitario").eq("empresa_id", data.empresa_id),
      supabase.from("lancamentos_financeiros").select("tipo,categoria,valor,pago").eq("empresa_id", data.empresa_id),
    ]);

    const resumo = {
      periodo: "últimos 30 dias",
      comandas_total: comandas.data?.length ?? 0,
      comandas_fechadas: comandas.data?.filter((c) => c.status === "fechada").length ?? 0,
      faturamento: comandas.data?.filter((c) => c.status === "fechada").reduce((s, c) => s + Number(c.total ?? 0), 0) ?? 0,
      top_produtos: (() => {
        const map: Record<string, { nome: string; qtd: number; total: number }> = {};
        (itens.data ?? []).forEach((it) => {
          const nome = (it as unknown as { produto: { nome: string } | null }).produto?.nome ?? "?";
          const k = it.produto_id;
          if (!map[k]) map[k] = { nome, qtd: 0, total: 0 };
          map[k].qtd += Number(it.quantidade);
          map[k].total += Number(it.total);
        });
        return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
      })(),
      produtos_alto_cmv: (produtos.data ?? []).filter((p) => Number(p.cmv_percentual) > 35).map((p) => ({
        nome: p.nome, preco: p.preco_venda, custo: p.custo, cmv: p.cmv_percentual,
      })),
      insumos_baixo_estoque: (insumos.data ?? []).filter((i) => Number(i.estoque_atual) <= Number(i.estoque_minimo)),
      financeiro: {
        receitas_pagas: (lancs.data ?? []).filter((l) => l.tipo === "receita" && l.pago).reduce((s, l) => s + Number(l.valor), 0),
        despesas_pagas: (lancs.data ?? []).filter((l) => l.tipo === "despesa" && l.pago).reduce((s, l) => s + Number(l.valor), 0),
        a_pagar: (lancs.data ?? []).filter((l) => l.tipo === "despesa" && !l.pago).reduce((s, l) => s + Number(l.valor), 0),
      },
    };

    const prompts: Record<typeof data.tipo, string> = {
      insights: `Você é um consultor sênior de restaurantes. Analise os dados abaixo e gere 5 insights ACIONÁVEIS em português (PT-BR) para o gestor, focando em: rentabilidade, mix de produtos, engargalamentos de estoque e oportunidades. Seja específico com números. Formato: markdown com títulos curtos.\n\nDADOS:\n${JSON.stringify(resumo, null, 2)}`,
      sugerir_preco: `Você é especialista em precificação para food service. A partir dos dados abaixo, sugira ajustes de preço para os 5 produtos com maior potencial de melhoria de margem, considerando CMV ideal de 30-32%. Justifique cada sugestão. Responda em português com tabela markdown (Produto | Preço atual | Sugerido | Novo CMV | Justificativa).\n\nDADOS:\n${JSON.stringify(resumo, null, 2)}`,
      previsao_demanda: `Você é analista de demanda para restaurantes. Com base no histórico dos últimos 30 dias, faça uma previsão qualitativa dos próximos 7 dias: quais produtos tendem a vender mais, quais insumos merecem reposição imediata, e recomendações operacionais (equipe, mise en place). Responda em português com seções markdown.\n\nDADOS:\n${JSON.stringify(resumo, null, 2)}`,
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um consultor de food service experiente. Sempre responda em português do Brasil com markdown bem estruturado." },
          { role: "user", content: prompts[data.tipo] },
        ],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      if (resp.status === 429) throw new Error("Limite de requisições atingido. Tente em alguns instantes.");
      if (resp.status === 402) throw new Error("Créditos de IA insuficientes na workspace Lovable.");
      throw new Error(`IA retornou ${resp.status}: ${txt}`);
    }
    const json = await resp.json() as { choices: Array<{ message: { content: string } }> };
    return { conteudo: json.choices[0]?.message?.content ?? "", resumo };
  });

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const schema = z.object({ empresa_id: z.string().uuid() });

type PrecoItem = {
  id: string;
  nome: string;
  unidade: string;
  custo_novo: number;
  custo_anterior: number;
  fonte: string;
};

/**
 * Consulta preços atuais de mercado (Brasil) via IA para todos os insumos
 * da empresa, atualiza custo_unitario e recalcula o custo dos produtos
 * a partir da ficha técnica (custo = Σ insumo.custo × quantidade × (1 + perda%)).
 */
export const atualizarPrecosMercado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");

    const { data: membro } = await supabase
      .from("membros").select("id")
      .eq("empresa_id", data.empresa_id).eq("user_id", userId).eq("ativo", true)
      .maybeSingle();
    if (!membro) throw new Error("Sem acesso a esta empresa");

    const { data: insumos, error: eIns } = await supabase
      .from("insumos")
      .select("id,nome,unidade,custo_unitario,fornecedor,categoria")
      .eq("empresa_id", data.empresa_id).eq("ativo", true);
    if (eIns) throw new Error(eIns.message);
    if (!insumos || insumos.length === 0) {
      return { atualizados: [] as PrecoItem[], produtos_recalculados: 0, mensagem: "Nenhum insumo cadastrado." };
    }

    // Contexto: quais produtos usam quais insumos (ajuda a IA a estimar melhor)
    const { data: fichas } = await supabase
      .from("ficha_tecnica")
      .select("insumo_id, produto:produtos(nome)")
      .eq("empresa_id", data.empresa_id);
    const usoPorInsumo: Record<string, string[]> = {};
    (fichas ?? []).forEach((f) => {
      const nome = (f as unknown as { produto: { nome: string } | null }).produto?.nome;
      if (!nome) return;
      (usoPorInsumo[f.insumo_id] ??= []).push(nome);
    });

    const lista = insumos.map((i) => ({
      id: i.id,
      nome: i.nome,
      unidade: i.unidade,
      custo_atual: Number(i.custo_unitario),
      usado_em: usoPorInsumo[i.id]?.slice(0, 5) ?? [],
    }));

    const prompt = `Você é um analista de compras para restaurantes no Brasil. Estime o PREÇO DE MERCADO ATACADO ATUAL (BRL) por unidade para cada insumo abaixo, considerando cotações típicas de fornecedores de food service brasileiros (CEASA, atacadistas como Assaí/Atacadão, distribuidores regionais). Retorne APENAS um JSON válido no formato:

{"itens":[{"id":"<uuid>","custo_unitario":<numero em BRL por unidade>,"fonte":"<breve nota, ex: 'CEASA-SP média jun/2026'>"}]}

Regras:
- O custo_unitario deve estar na MESMA unidade informada (ex: se unidade é 'kg', retorne R$/kg; se 'un', retorne R$/unidade).
- Use valores realistas de atacado (não varejo).
- Se não souber, mantenha próximo ao custo_atual.
- NÃO adicione texto fora do JSON.

INSUMOS:
${JSON.stringify(lista, null, 2)}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é analista de compras de food service no Brasil. Responde SEMPRE JSON válido, sem markdown, sem comentários." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      if (resp.status === 429) throw new Error("Limite de requisições atingido. Tente novamente em instantes.");
      if (resp.status === 402) throw new Error("Créditos de IA insuficientes.");
      throw new Error(`IA retornou ${resp.status}: ${txt.slice(0, 200)}`);
    }

    const json = (await resp.json()) as { choices: Array<{ message: { content: string } }> };
    const raw = json.choices[0]?.message?.content ?? "{}";
    let parsed: { itens?: Array<{ id: string; custo_unitario: number; fonte?: string }> };
    try { parsed = JSON.parse(raw); } catch { throw new Error("IA retornou formato inválido."); }
    const itens = parsed.itens ?? [];
    if (itens.length === 0) throw new Error("IA não retornou preços.");

    // Atualiza insumos
    const atualizados: PrecoItem[] = [];
    for (const it of itens) {
      const orig = insumos.find((i) => i.id === it.id);
      if (!orig) continue;
      const novo = Number(it.custo_unitario);
      if (!Number.isFinite(novo) || novo <= 0) continue;
      const { error } = await supabase
        .from("insumos")
        .update({ custo_unitario: novo })
        .eq("id", it.id).eq("empresa_id", data.empresa_id);
      if (error) continue;
      atualizados.push({
        id: it.id, nome: orig.nome, unidade: orig.unidade,
        custo_novo: novo, custo_anterior: Number(orig.custo_unitario),
        fonte: it.fonte ?? "estimativa de mercado",
      });
    }

    // Recalcula custo dos produtos com ficha técnica
    const { data: prods } = await supabase
      .from("produtos").select("id").eq("empresa_id", data.empresa_id);
    let recalculados = 0;
    for (const p of prods ?? []) {
      const { data: ft } = await supabase
        .from("ficha_tecnica")
        .select("quantidade,perda_percentual,insumo:insumos(custo_unitario)")
        .eq("produto_id", p.id);
      if (!ft || ft.length === 0) continue;
      const custo = ft.reduce((s, r) => {
        const cu = Number((r as unknown as { insumo: { custo_unitario: number } | null }).insumo?.custo_unitario ?? 0);
        const q = Number(r.quantidade);
        const perda = Number(r.perda_percentual) / 100;
        return s + cu * q * (1 + perda);
      }, 0);
      await supabase.from("produtos").update({ custo: Number(custo.toFixed(2)) }).eq("id", p.id);
      recalculados += 1;
    }

    return { atualizados, produtos_recalculados: recalculados, mensagem: `${atualizados.length} insumos atualizados.` };
  });

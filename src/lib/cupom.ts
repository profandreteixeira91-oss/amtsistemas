import { supabase } from "@/integrations/supabase/client";

type Args = {
  empresaId: string;
  comandaId: string;
  userId?: string | null;
};

/**
 * Ao quitar uma comanda, gera e armazena um comprovante (cupom) com os dados
 * exigidos por legislação para documentos de venda: identificação do
 * estabelecimento (razão social, CNPJ, endereço), data/hora, itens, totais e
 * formas de pagamento. Retorna o id do cupom para impressão.
 *
 * Observação: NFC-e / SAT / CF-e requerem integração com SEFAZ + certificado
 * digital, fora do escopo desta função. Este é um documento auxiliar interno.
 */
export async function gerarCupom({ empresaId, comandaId, userId }: Args): Promise<string> {
  const [{ data: empresa, error: eEmp }, { data: comanda, error: eCom }, { data: itens, error: eIt }, { data: pags, error: ePg }] =
    await Promise.all([
      supabase.from("empresas").select("razao_social,nome_fantasia,cnpj,endereco,cidade,estado,telefone,logo_url")
        .eq("id", empresaId).single(),
      supabase.from("comandas")
        .select("id,numero,cliente_nome,subtotal,desconto,taxa_servico,total,observacao,mesa:mesas(numero)")
        .eq("id", comandaId).single(),
      supabase.from("itens_comanda")
        .select("quantidade,preco_unitario,total,observacao,produto:produtos(nome)")
        .eq("comanda_id", comandaId).neq("status", "cancelado"),
      supabase.from("pagamentos").select("metodo,valor,created_at").eq("comanda_id", comandaId).order("created_at"),
    ]);
  if (eEmp) throw eEmp;
  if (eCom) throw eCom;
  if (eIt) throw eIt;
  if (ePg) throw ePg;

  const itensPayload = (itens ?? []).map((i) => ({
    nome: (i.produto as { nome: string } | null)?.nome ?? "Item",
    quantidade: Number(i.quantidade),
    preco_unitario: Number(i.preco_unitario),
    total: Number(i.total),
    observacao: i.observacao,
  }));
  const pagsPayload = (pags ?? []).map((p) => ({
    metodo: p.metodo,
    valor: Number(p.valor),
    created_at: p.created_at,
  }));

  const mesaNumero = (comanda?.mesa as { numero: string | number } | null)?.numero;
  const mesaNumeroStr = mesaNumero != null ? String(mesaNumero) : null;

  const { data: cupom, error } = await supabase.from("cupons_fiscais").insert({
    empresa_id: empresaId,
    comanda_id: comandaId,
    emitido_por: userId ?? null,
    razao_social: empresa!.razao_social,
    nome_fantasia: empresa!.nome_fantasia,
    cnpj: empresa!.cnpj,
    endereco: empresa!.endereco,
    cidade: empresa!.cidade,
    estado: empresa!.estado,
    telefone: empresa!.telefone,
    mesa_numero: mesaNumeroStr,
    cliente_nome: comanda!.cliente_nome,
    subtotal: Number(comanda!.subtotal),
    desconto: Number(comanda!.desconto),
    taxa_servico: Number(comanda!.taxa_servico),
    total: Number(comanda!.total),
    itens: itensPayload,
    pagamentos: pagsPayload,
    observacoes: comanda!.observacao,
  }).select("id").single();

  if (error) throw error;
  return cupom.id;
}

export function abrirCupomImpressao(cupomId: string) {
  const url = `/cupom/${cupomId}?print=1`;
  window.open(url, "_blank", "noopener");
}

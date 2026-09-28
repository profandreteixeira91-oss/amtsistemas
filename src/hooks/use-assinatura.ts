import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/empresa-context";

export type AssinaturaStatus = "trial" | "ativa" | "vencida" | "cancelada";

export type Assinatura = {
  id: string;
  empresa_id: string;
  plano: string;
  ciclo: string;
  status: AssinaturaStatus;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancelada_em: string | null;
};

export function useAssinatura() {
  const { empresaAtual } = useEmpresa();
  const empresaId = empresaAtual?.id;

  const query = useQuery({
    queryKey: ["assinatura", empresaId],
    enabled: !!empresaId,
    refetchInterval: 60_000,
    queryFn: async (): Promise<Assinatura | null> => {
      const { data, error } = await supabase
        .from("assinaturas")
        .select("*")
        .eq("empresa_id", empresaId!)
        .maybeSingle();
      if (error) throw error;
      return (data as Assinatura) ?? null;
    },
  });

  const assinatura = query.data ?? null;
  const now = Date.now();
  const trialEnd = assinatura?.trial_ends_at ? new Date(assinatura.trial_ends_at).getTime() : null;
  const periodEnd = assinatura?.current_period_end
    ? new Date(assinatura.current_period_end).getTime()
    : null;

  const isTrial = assinatura?.status === "trial";
  const trialExpirado = !!(isTrial && trialEnd && trialEnd < now);
  const ativaExpirada = !!(
    assinatura?.status === "ativa" &&
    periodEnd &&
    periodEnd < now
  );
  const bloqueado =
    !!assinatura &&
    (assinatura.status === "cancelada" ||
      assinatura.status === "vencida" ||
      trialExpirado ||
      ativaExpirada);

  const diasRestantes =
    isTrial && trialEnd
      ? Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)))
      : null;

  return {
    assinatura,
    loading: query.isLoading,
    bloqueado,
    isTrial,
    diasRestantes,
    recarregar: () => void query.refetch(),
  };
}

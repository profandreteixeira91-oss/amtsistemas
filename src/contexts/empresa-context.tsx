import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Database } from "@/integrations/supabase/types";

export type Empresa = Database["public"]["Tables"]["empresas"]["Row"];
export type AppRole = Database["public"]["Enums"]["app_role"];

type Membership = {
  empresa: Empresa;
  role: AppRole;
};

type EmpresaCtx = {
  empresaAtual: Empresa | null;
  roleAtual: AppRole | null;
  memberships: Membership[];
  trocarEmpresa: (id: string) => void;
  carregando: boolean;
  recarregar: () => void;
};

const Ctx = createContext<EmpresaCtx | null>(null);
const STORAGE_KEY = "kitchenos.empresa_atual";

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [empresaId, setEmpresaId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["memberships", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Membership[]> => {
      const { data, error } = await supabase
        .from("membros")
        .select("role, empresa:empresas(*)")
        .eq("user_id", user!.id)
        .eq("ativo", true);
      if (error) throw error;
      return (data ?? [])
        .filter((m) => m.empresa)
        .map((m) => ({ role: m.role as AppRole, empresa: m.empresa as Empresa }));
    },
  });

  const memberships = data ?? [];

  // Auto-seleciona a primeira empresa se nenhuma estiver escolhida
  useEffect(() => {
    if (!memberships.length) return;
    const idValido = memberships.find((m) => m.empresa.id === empresaId);
    if (!idValido) {
      const primeira = memberships[0].empresa.id;
      setEmpresaId(primeira);
      localStorage.setItem(STORAGE_KEY, primeira);
    }
  }, [memberships, empresaId]);

  const atual = useMemo(
    () => memberships.find((m) => m.empresa.id === empresaId) ?? null,
    [memberships, empresaId],
  );

  const value: EmpresaCtx = {
    empresaAtual: atual?.empresa ?? null,
    roleAtual: atual?.role ?? null,
    memberships,
    trocarEmpresa: (id: string) => {
      setEmpresaId(id);
      localStorage.setItem(STORAGE_KEY, id);
    },
    carregando: isLoading,
    recarregar: () => void refetch(),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEmpresa() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useEmpresa deve estar dentro de <EmpresaProvider>");
  return c;
}

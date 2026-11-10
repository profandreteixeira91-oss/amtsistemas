import { useEffect, useState } from "react";
import {
  Cloud,
  Database,
  Download,
  FlaskConical,
  GitBranch,
  Glasses,
  Globe2,
  KeyRound,
  LayoutDashboard,
  Plus,
  Swords,
  Users,
} from "lucide-react";

import { amtSupabase } from "@/integrations/amt-supabase/client";

// Sistemas da AMT acompanhados no Control Center (/admin) e dados comerciais compartilhados entre os módulos.

export type IconType = React.ComponentType<{ className?: string }>;

export type AmtSystem = {
  id: string;
  /** slug em manager_sistemas: catálogo, planos e leads do site */
  catalogSlug: string;
  name: string;
  platform: string;
  description: string;
  href: string;
  icon: IconType;
  githubRepo: string;
  /** repositório público com os instaladores (só sistemas desktop) */
  releasesRepo?: string;
  /** Edge Function platform-overview do sistema: clientes, assinaturas, cobranças e uso (só leitura) */
  overviewUrl: string;
  capabilities: string[];
  links: Array<{ label: string; hint: string; href: string; icon: IconType }>;
};

export const OPTIONE_TRIAL_ORIGIN = "teste-gratis-amt-optione";

export const systems: AmtSystem[] = [
  {
    id: "optione",
    catalogSlug: "amt-optione",
    name: "AMT OptiOne",
    platform: "Desktop · SaaS",
    description: "Gestão para óticas: aplicativo desktop multi-loja, vendido com teste grátis de 14 dias pelo site.",
    href: "https://amtsistemas.com.br/optione",
    icon: Glasses,
    githubRepo: "profandreteixeira91-oss/gestao_otica",
    releasesRepo: "profandreteixeira91-oss/amt-optione-releases",
    overviewUrl: "https://rragitmijwruydspafac.supabase.co/functions/v1/platform-overview",
    capabilities: ["Landing e teste grátis", "Chave de acesso", "Instalador Windows", "Supabase", "Mercado Pago"],
    links: [
      { label: "Landing page", hint: "amtsistemas.com.br/optione", href: "https://amtsistemas.com.br/optione", icon: Globe2 },
      { label: "Teste grátis", hint: "Cadastro da ótica pelo site", href: "https://amtsistemas.com.br/optione/teste-gratis", icon: Plus },
      { label: "Nova chave de acesso", hint: "O dono gera com login e senha", href: "https://amtsistemas.com.br/optione/nova-chave", icon: KeyRound },
      { label: "Versões do instalador", hint: "Releases no GitHub", href: "https://github.com/profandreteixeira91-oss/amt-optione-releases/releases", icon: Download },
      { label: "Código-fonte", hint: "GitHub · gestao_otica", href: "https://github.com/profandreteixeira91-oss/gestao_otica", icon: GitBranch },
      { label: "Supabase", hint: "Projeto rragitmijwruydspafac", href: "https://supabase.com/dashboard/project/rragitmijwruydspafac", icon: Database },
    ],
  },
  {
    id: "dojo-manager",
    catalogSlug: "amt-dojo-manager",
    name: "AMT Dojo Manager",
    platform: "Web · SaaS",
    description: "Gestão para academias de artes marciais, dojos e estúdios de treino, com app do aluno.",
    href: "https://amtdojomanager.com.br/dojo",
    icon: Swords,
    githubRepo: "profandreteixeira91-oss/amtdojomanager",
    overviewUrl: "https://gudjmkiyprgwgxmzbgji.supabase.co/functions/v1/platform-overview",
    capabilities: ["Painel da academia", "App do aluno (PWA)", "Portal da equipe", "Supabase", "Cloudflare Workers"],
    links: [
      { label: "Site", hint: "amtdojomanager.com.br", href: "https://amtdojomanager.com.br/dojo", icon: Globe2 },
      { label: "Painel da academia", hint: "/dojo/app", href: "https://amtdojomanager.com.br/dojo/app", icon: LayoutDashboard },
      { label: "App do aluno", hint: "/app", href: "https://amtdojomanager.com.br/app", icon: Users },
      { label: "Ambiente de teste", hint: "teste.amtsistemas.com.br · branch 1nov26", href: "https://teste.amtsistemas.com.br/dojo", icon: FlaskConical },
      { label: "Código-fonte", hint: "GitHub · amtdojomanager", href: "https://github.com/profandreteixeira91-oss/amtdojomanager", icon: GitBranch },
      { label: "Supabase", hint: "Projeto gudjmkiyprgwgxmzbgji", href: "https://supabase.com/dashboard/project/gudjmkiyprgwgxmzbgji", icon: Database },
      { label: "Cloudflare", hint: "Workers e domínios", href: "https://dash.cloudflare.com/", icon: Cloud },
    ],
  },
];

export type CatalogSystem = { id: string; slug: string; nome: string; versao: string | null; trial_dias: number | null; ativo: boolean };
export type CatalogPlan = { id: string; sistema_id: string; slug: string; nome: string; preco_mensal: number | null; preco_anual: number | null; ativo: boolean; destaque: boolean };
export type CommercialLead = { id: string; nome: string; empresa: string | null; email: string | null; telefone: string | null; origem: string | null; status: string; observacoes: string | null; sistema_interesse_id: string | null; created_at: string };

export const commercialLeadStatuses = [
  ["novo", "Novo"], ["contatado", "Contatado"], ["qualificado", "Qualificado"], ["proposta", "Proposta"],
  ["negociacao", "Negociação"], ["ganho", "Ganho"], ["perdido", "Perdido"],
] as const;

export const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const daysAgo = (days: number) => Date.now() - days * 86400000;

// Catálogo (manager_sistemas/manager_planos) e leads comerciais (manager_leads) dos sistemas do Control Center.
export function useCommercialData() {
  const [catalog, setCatalog] = useState<CatalogSystem[]>([]);
  const [plans, setPlans] = useState<CatalogPlan[]>([]);
  const [leads, setLeads] = useState<CommercialLead[]>([]);
  const [leadsError, setLeadsError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [catalogResult, plansResult, leadsResult] = await Promise.all([
      amtSupabase.from("manager_sistemas").select("id,slug,nome,versao,trial_dias,ativo").in("slug", systems.map((system) => system.catalogSlug)),
      amtSupabase.from("manager_planos").select("id,sistema_id,slug,nome,preco_mensal,preco_anual,ativo,destaque").order("ordem").order("preco_mensal"),
      amtSupabase.from("manager_leads").select("id,nome,empresa,email,telefone,origem,status,observacoes,sistema_interesse_id,created_at").order("created_at", { ascending: false }).limit(500),
    ]);
    const catalogRows = (catalogResult.data ?? []) as CatalogSystem[];
    const ids = new Set(catalogRows.map((item) => item.id));
    setCatalog(catalogRows);
    setPlans(((plansResult.data ?? []) as CatalogPlan[]).filter((plan) => ids.has(plan.sistema_id)));
    setLeads(((leadsResult.data ?? []) as CommercialLead[]).filter((lead) => (lead.sistema_interesse_id && ids.has(lead.sistema_interesse_id)) || lead.origem === OPTIONE_TRIAL_ORIGIN));
    setLeadsError(leadsResult.error ? "Leads comerciais indisponíveis: o acesso do Control Center a manager_leads ainda não foi liberado no banco." : "");
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  return { catalog, plans, leads, setLeads, leadsError, loading, reload: load };
}

export function isOptioneTrial(lead: CommercialLead) {
  return lead.origem === OPTIONE_TRIAL_ORIGIN;
}

export function pad(value: number) {
  return String(value).padStart(2, "0");
}

export type AuditLog = { id: string; actor_user_id: string | null; action: string; resource_type: string | null; resource_id: string | null; metadata: Record<string, unknown>; created_at: string };
export type FormSubmission = { id: string; form_name: string; name: string; email: string | null; phone: string | null; source: string | null; status: string; notes: string | null; payload: Record<string, unknown>; created_at: string };

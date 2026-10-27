import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

// AMT OptiOne (sistema de gestão para óticas): teste grátis de 14 dias vendido por esta página.
//
// O cadastro é feito pela Edge Function `site-signup` do projeto Supabase do AMT OptiOne, chamada
// SOMENTE daqui (servidor), com o segredo OPTIONE_SITE_SECRET. O navegador nunca recebe o segredo.
// Ela cria o login do dono, a ótica com 14 dias de teste e devolve a chave de acesso, que o sistema
// pede uma única vez em cada computador. Contrato completo: docs/site-integration.md do repositório
// profandreteixeira91-oss/gestao_otica.
//
// Cada teste grátis também vira um lead em manager_leads (origem "teste-gratis-amt-optione").

export const OPTIONE_SLUG = "amt-optione";
const SIGNUP_URL =
  process.env.OPTIONE_SIGNUP_URL ??
  "https://rragitmijwruydspafac.supabase.co/functions/v1/site-signup";

export type OptionePlano = {
  slug: string;
  nome: string;
  descricao: string;
  preco_mensal: number;
  recursos: string[];
  destaque: boolean;
  badge: string | null;
};

// Usados enquanto o AMT OptiOne não estiver no catálogo (manager_sistemas / manager_planos).
// Os códigos (slug) são os mesmos planos do sistema: essencial, profissional, rede.
const PLANOS_PADRAO: OptionePlano[] = [
  {
    slug: "essencial",
    nome: "Essencial",
    descricao: "Para a ótica que está começando a organizar a operação.",
    preco_mensal: 149,
    recursos: [
      "Até 3 usuários",
      "Até 2 computadores",
      "Vendas, PDV, receitas e laboratório",
      "Estoque, financeiro e indicadores",
    ],
    destaque: false,
    badge: null,
  },
  {
    slug: "profissional",
    nome: "Profissional",
    descricao: "A operação completa, com WhatsApp automático para os clientes.",
    preco_mensal: 249,
    recursos: [
      "Até 10 usuários",
      "Até 5 computadores",
      "Tudo do Essencial",
      "WhatsApp automático: pedidos, PDFs e pós-venda",
    ],
    destaque: true,
    badge: "Mais escolhido",
  },
  {
    slug: "rede",
    nome: "Rede",
    descricao: "Para óticas com equipe grande ou várias frentes de atendimento.",
    preco_mensal: 399,
    recursos: [
      "Usuários ilimitados",
      "Computadores ilimitados",
      "Tudo do Profissional",
      "Atendimento prioritário",
    ],
    destaque: false,
    badge: null,
  },
];

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const optionePlanos = createServerFn({ method: "GET" }).handler(
  async (): Promise<OptionePlano[]> => {
    try {
      const supabase = publicClient();
      const { data: sistema } = await supabase
        .from("manager_sistemas")
        .select("id")
        .eq("slug", OPTIONE_SLUG)
        .eq("ativo", true)
        .maybeSingle();
      if (!sistema) return PLANOS_PADRAO;
      const { data: planos } = await supabase
        .from("manager_planos")
        .select("slug, nome, descricao, preco_mensal, recursos, destaque, badge")
        .eq("sistema_id", sistema.id)
        .eq("ativo", true)
        .order("ordem")
        .order("preco_mensal");
      if (!planos?.length) return PLANOS_PADRAO;
      return planos.map((p) => ({
        slug: String(p.slug),
        nome: String(p.nome),
        descricao: String(p.descricao ?? ""),
        preco_mensal: Number(p.preco_mensal ?? 0),
        recursos: Array.isArray(p.recursos) ? p.recursos.map(String) : [],
        destaque: Boolean(p.destaque),
        badge: p.badge ?? null,
      }));
    } catch {
      return PLANOS_PADRAO;
    }
  },
);

class SignupError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function callSignup(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const secret = process.env.OPTIONE_SITE_SECRET;
  if (!secret) {
    throw new SignupError(
      "Cadastro temporariamente indisponível. Fale com a AMT pelo WhatsApp.",
      503,
    );
  }
  let response: Response;
  try {
    response = await fetch(SIGNUP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-site-secret": secret },
      body: JSON.stringify(body),
    });
  } catch {
    throw new SignupError(
      "Não foi possível falar com o AMT OptiOne agora. Tente de novo em instantes.",
      502,
    );
  }
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new SignupError(
      String(data.error ?? "Não foi possível concluir o cadastro."),
      response.status,
    );
  }
  return data;
}

function clientIp(): string {
  try {
    const headers = getRequest().headers;
    return (
      headers.get("cf-connecting-ip") ??
      headers.get("x-real-ip") ??
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      ""
    );
  } catch {
    return "";
  }
}

const codigoInput = z.object({ store_code: z.string().trim().toLowerCase().max(32) });

export const optioneVerificarCodigo = createServerFn({ method: "POST" })
  .validator((input) => codigoInput.parse(input))
  .handler(async ({ data }) => {
    try {
      const result = await callSignup({ action: "check_store_code", store_code: data.store_code });
      return {
        available: Boolean(result.available),
        valid: Boolean(result.valid),
        suggestion: String(result.suggestion ?? ""),
      };
    } catch {
      return { available: true, valid: true, suggestion: "" }; // a criação confere de novo
    }
  });

const cadastroInput = z.object({
  store_name: z.string().trim().min(2, "Informe o nome da ótica.").max(120),
  store_code: z.string().trim().toLowerCase().max(32).optional().default(""),
  owner_name: z.string().trim().min(2, "Informe o seu nome.").max(80),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(160),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(72),
  plan_id: z.enum(["essencial", "profissional", "rede"]).default("profissional"),
  document: z.string().trim().max(30).optional().default(""),
  phone: z.string().trim().max(30).optional().default(""),
  whatsapp: z.string().trim().max(30).optional().default(""),
  // Campo-isca: invisível para pessoas; robôs costumam preencher.
  website: z.string().max(200).optional().default(""),
});

export type OptioneCadastroResultado =
  | {
      ok: true;
      store_code: string;
      access_key: string;
      trial_ends_at: string;
      login: string;
      download_url: string | null;
    }
  | { ok: false; error: string };

export const optioneCriarTeste = createServerFn({ method: "POST" })
  .validator((input) => cadastroInput.parse(input))
  .handler(async ({ data }): Promise<OptioneCadastroResultado> => {
    if (data.website) {
      return { ok: false, error: "Não foi possível concluir o cadastro." };
    }
    let result: Record<string, unknown>;
    try {
      result = await callSignup({
        action: "create_store",
        store_name: data.store_name,
        store_code: data.store_code || undefined,
        owner_name: data.owner_name,
        email: data.email,
        password: data.password,
        plan_id: data.plan_id,
        document: data.document,
        phone: data.phone,
        whatsapp: data.whatsapp,
        client_ip: clientIp(),
      });
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Não foi possível concluir o cadastro.",
      };
    }

    // Lead comercial (não bloqueia o cadastro se falhar).
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: sistema } = await supabaseAdmin
        .from("manager_sistemas")
        .select("id")
        .eq("slug", OPTIONE_SLUG)
        .maybeSingle();
      const { error: leadError } = await supabaseAdmin.from("manager_leads").insert({
        nome: data.owner_name,
        empresa: data.store_name,
        email: data.email,
        telefone: data.whatsapp || data.phone || null,
        origem: "teste-gratis-amt-optione",
        status: "novo",
        sistema_interesse_id: sistema?.id ?? null,
        observacoes: [
          `Teste grátis do AMT OptiOne iniciado pelo site (plano ${data.plan_id}).`,
          `Código da ótica: ${result.store_code}. Teste até ${String(result.trial_ends_at ?? "").slice(0, 10)}.`,
          data.document ? `CNPJ: ${data.document}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      });
      if (leadError) console.error("optione: lead não registrado", leadError.message);
    } catch (error) {
      console.error("optione: lead não registrado", error instanceof Error ? error.message : error);
    }

    return {
      ok: true,
      store_code: String(result.store_code),
      access_key: String(result.access_key),
      trial_ends_at: String(result.trial_ends_at),
      login: String(result.login ?? data.email),
      download_url: (result.download_url as string | null) ?? null,
    };
  });

const novaChaveInput = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(160),
  password: z.string().min(1, "Informe a senha.").max(72),
});

export const optioneNovaChave = createServerFn({ method: "POST" })
  .validator((input) => novaChaveInput.parse(input))
  .handler(async ({ data }) => {
    try {
      const result = await callSignup({
        action: "new_access_key",
        email: data.email,
        password: data.password,
      });
      return {
        ok: true as const,
        store_code: String(result.store_code),
        access_key: String(result.access_key),
      };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Não foi possível gerar a chave.",
      };
    }
  });

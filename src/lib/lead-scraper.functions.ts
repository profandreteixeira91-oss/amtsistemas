import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============================================================================
// Tipos
// ============================================================================

type Place = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  regularOpeningHours?: unknown;
  businessStatus?: string;
  primaryTypeDisplayName?: { text?: string };
  types?: string[];
};

type ContadoresBusca = {
  encontrados: number;
  validos: number;
  descartados_sem_contato: number;
  duplicados: number;
  com_email: number;
  com_whatsapp: number;
  com_instagram: number;
  com_site: number;
};

const CONTADORES_ZERO: ContadoresBusca = {
  encontrados: 0,
  validos: 0,
  descartados_sem_contato: 0,
  duplicados: 0,
  com_email: 0,
  com_whatsapp: 0,
  com_instagram: 0,
  com_site: 0,
};

// ============================================================================
// Helpers
// ============================================================================

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

function normalizeStr(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function digitsOnly(s: string | null | undefined): string {
  return (s ?? "").replace(/\D/g, "");
}

function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function isOwnDomain(url: string | null | undefined): boolean {
  const d = extractDomain(url);
  if (!d) return false;
  return !(
    d.includes("facebook.com") ||
    d.includes("instagram.com") ||
    d.includes("linkedin.com") ||
    d.includes("google.com") ||
    d.includes("wa.me") ||
    d.includes("api.whatsapp.com") ||
    d.includes("linktr.ee")
  );
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+?55\s?)?\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}/g;
const IG_RE = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._-]+)/i;
const FB_RE = /(?:https?:\/\/)?(?:www\.)?facebook\.com\/([A-Za-z0-9._-]+)/i;
const LI_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/([A-Za-z0-9._-]+)/i;
const WA_RE = /(?:https?:\/\/)?(?:api\.whatsapp\.com\/send|wa\.me)\/?\??[^\s"'<>]*/i;

function extractFromText(text: string) {
  const emails = Array.from(text.matchAll(EMAIL_RE))
    .map((m) => m[0].toLowerCase())
    .filter((e) => !e.includes("wixpress") && !e.includes("sentry") && !e.endsWith(".png") && !e.endsWith(".jpg"));
  const phones = Array.from(text.matchAll(PHONE_RE)).map((m) => digitsOnly(m[0])).filter((p) => p.length >= 10 && p.length <= 13);
  const ig = text.match(IG_RE);
  const fb = text.match(FB_RE);
  const li = text.match(LI_RE);
  const wa = text.match(WA_RE);
  return {
    email: emails[0] ?? null,
    telefones: Array.from(new Set(phones)),
    instagram: ig ? `https://instagram.com/${ig[1]}` : null,
    facebook: fb ? `https://facebook.com/${fb[1]}` : null,
    linkedin: li ? `https://linkedin.com/${text.match(/linkedin\.com\/(company|in)\//)?.[1] ?? "company"}/${li[1]}` : null,
    whatsapp: wa ? wa[0] : null,
  };
}

function isWhatsAppPhone(phone: string | null): boolean {
  // Consideramos qualquer telefone celular (com 9 na frente) como potencial WhatsApp
  const d = digitsOnly(phone);
  if (d.length < 10) return false;
  const numeroNacional = d.length === 13 ? d.slice(2) : d.length === 12 ? d.slice(2) : d;
  return numeroNacional.length === 11 && numeroNacional[2] === "9";
}

function computeScore(lead: {
  website: string | null;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  total_avaliacoes: number | null;
}): number {
  let s = 0;
  if (isOwnDomain(lead.website)) s++;
  if (lead.email) s++;
  if (lead.whatsapp || (lead.telefone && isWhatsAppPhone(lead.telefone))) s++;
  if (lead.instagram) s++;
  if (lead.facebook) s++;
  if ((lead.total_avaliacoes ?? 0) >= 20) s++;
  return Math.min(5, s);
}

function computeHashDedupe(lead: {
  google_place_id: string | null;
  website: string | null;
  telefone: string | null;
  email: string | null;
  nome: string;
  cidade: string | null;
}): string {
  if (lead.google_place_id) return `place:${lead.google_place_id}`;
  const domain = extractDomain(lead.website);
  if (domain) return `dom:${domain}`;
  const phone = digitsOnly(lead.telefone);
  if (phone.length >= 10) return `tel:${phone}`;
  if (lead.email) return `mail:${lead.email.toLowerCase()}`;
  return `nome:${normalizeStr(lead.nome)}::${normalizeStr(lead.cidade ?? "")}`;
}

// ============================================================================
// Google Places (New) — Text Search via connector gateway
// ============================================================================

async function googlePlacesTextSearch(params: {
  textQuery: string;
  lat?: number;
  lng?: number;
  radiusM?: number;
  maxResults?: number;
}): Promise<Place[]> {
  const LOVABLE = process.env.LOVABLE_API_KEY;
  const GKEY = process.env.GOOGLE_MAPS_API_KEY;
  if (!LOVABLE || !GKEY) {
    throw new Error("Google Maps connector não configurado (LOVABLE_API_KEY / GOOGLE_MAPS_API_KEY ausentes).");
  }
  const body: Record<string, unknown> = {
    textQuery: params.textQuery,
    languageCode: "pt-BR",
    regionCode: "BR",
    maxResultCount: Math.min(20, params.maxResults ?? 20),
  };
  if (params.lat != null && params.lng != null && params.radiusM) {
    body.locationBias = {
      circle: {
        center: { latitude: params.lat, longitude: params.lng },
        radius: Math.min(50000, params.radiusM),
      },
    };
  }
  const res = await fetch(`${GATEWAY}/places/v1/places:searchText`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE}`,
      "X-Connection-Api-Key": GKEY,
      "Content-Type": "application/json",
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.regularOpeningHours,places.businessStatus,places.primaryTypeDisplayName,places.types",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error(`[places] ${res.status} — ${errText.slice(0, 500)}`);
    throw new Error(`Google Places [${res.status}]: ${errText.slice(0, 200)}`);
  }
  const payload = (await res.json()) as { places?: Place[] };
  return payload.places ?? [];
}

// ============================================================================
// Firecrawl (enriquecimento)
// ============================================================================

async function firecrawlScrape(url: string, timeoutMs = 15000): Promise<string | null> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, waitFor: 500 }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: { markdown?: string }; markdown?: string };
    return data.data?.markdown ?? data.markdown ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// ============================================================================
// Endpoints públicos (server functions)
// ============================================================================

async function ensureSuperAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_super_admin", { _user_id: userId });
  if (!data) throw new Error("Acesso restrito a super administradores");
}

// ---- Catálogo ------------------------------------------------------------

export const getCatalogo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const [sistemas, nichos, cidades] = await Promise.all([
      context.supabase.from("manager_sistemas").select("id, slug, nome, cor, logo_url").eq("ativo", true).order("nome"),
      context.supabase.from("manager_scraper_nichos").select("*").eq("ativo", true).order("sistema_id").order("ordem"),
      context.supabase.from("manager_scraper_cidades").select("uf, nome, populacao, latitude, longitude").eq("ativa", true).order("uf").order("nome"),
    ]);
    return {
      sistemas: sistemas.data ?? [],
      nichos: nichos.data ?? [],
      cidades: cidades.data ?? [],
    };
  });

// ---- Salvar nicho ---------------------------------------------------------

const salvarNichoInput = z.object({
  id: z.string().uuid().optional(),
  sistema_id: z.string().uuid(),
  slug: z.string().min(2).max(60),
  nome: z.string().min(2).max(120),
  termos: z.array(z.string().min(2).max(120)).min(1).max(50),
  ativo: z.boolean().default(true),
});

export const salvarNicho = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => salvarNichoInput.parse(d))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const payload = {
      sistema_id: data.sistema_id,
      slug: data.slug,
      nome: data.nome,
      termos: data.termos,
      ativo: data.ativo,
    };
    if (data.id) {
      const { data: r, error } = await context.supabase
        .from("manager_scraper_nichos")
        .update(payload)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return r;
    }
    const { data: r, error } = await context.supabase
      .from("manager_scraper_nichos")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return r;
  });

// ---- Iniciar busca --------------------------------------------------------

const iniciarBuscaInput = z.object({
  sistema_id: z.string().uuid(),
  nichos_slugs: z.array(z.string()).min(1),
  escopo: z.enum(["cidade", "uf", "brasil", "raio"]),
  cidade: z.string().max(120).nullable().optional(),
  uf: z.string().max(2).nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  raio_km: z.number().int().min(1).max(50).nullable().optional(),
  limite_por_busca: z.number().int().min(1).max(20).default(20),
  enriquecer: z.boolean().default(true),
});

export const iniciarBusca = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => iniciarBuscaInput.parse(d))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const { supabase, userId } = context;

    // Resolver nichos + termos
    const { data: nichos, error: nErr } = await supabase
      .from("manager_scraper_nichos")
      .select("*")
      .eq("sistema_id", data.sistema_id)
      .in("slug", data.nichos_slugs);
    if (nErr) throw new Error(nErr.message);
    if (!nichos || nichos.length === 0) throw new Error("Nenhum nicho encontrado.");

    // Resolver cidades-alvo
    let cidadesAlvo: Array<{ uf: string; nome: string; latitude: number | null; longitude: number | null }> = [];
    if (data.escopo === "cidade") {
      if (!data.cidade || !data.uf) throw new Error("Cidade e UF obrigatórios.");
      cidadesAlvo = [{ uf: data.uf, nome: data.cidade, latitude: data.latitude ?? null, longitude: data.longitude ?? null }];
    } else if (data.escopo === "raio") {
      if (data.latitude == null || data.longitude == null || !data.raio_km) throw new Error("Latitude, longitude e raio obrigatórios.");
      cidadesAlvo = [{ uf: data.uf ?? "--", nome: data.cidade ?? "Raio", latitude: data.latitude, longitude: data.longitude }];
    } else {
      let q = supabase.from("manager_scraper_cidades").select("uf, nome, latitude, longitude").eq("ativa", true);
      if (data.escopo === "uf" && data.uf) q = q.eq("uf", data.uf);
      const { data: cs } = await q.order("populacao", { ascending: false });
      cidadesAlvo = (cs ?? []).map((c) => ({ uf: c.uf, nome: c.nome, latitude: c.latitude, longitude: c.longitude }));
    }
    if (cidadesAlvo.length === 0) throw new Error("Nenhuma cidade a processar.");

    const termosTotais = Array.from(new Set(nichos.flatMap((n) => (n.termos as string[]) ?? [])));

    const { data: busca, error: bErr } = await supabase
      .from("manager_scraper_buscas")
      .insert({
        sistema_id: data.sistema_id,
        tipo_negocio: nichos.map((n) => n.nome).join(", "),
        cidade: data.escopo === "cidade" ? data.cidade : null,
        estado: data.uf ?? null,
        uf: data.uf ?? null,
        rede: "google_places",
        nichos: data.nichos_slugs,
        escopo: data.escopo,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        raio_km: data.raio_km ?? null,
        query_final: `${termosTotais.slice(0, 3).join(" | ")}${termosTotais.length > 3 ? " ..." : ""}`,
        status: "processando",
        criado_por: userId,
        total_cidades: cidadesAlvo.length,
        cidades_processadas: 0,
        contadores: CONTADORES_ZERO,
        iniciado_em: new Date().toISOString(),
      })
      .select()
      .single();
    if (bErr || !busca) throw new Error(bErr?.message ?? "Falha ao registrar busca");

    // Processa síncrono até MAX cidades ou tempo (mantém sob teto do worker)
    const iniciado = Date.now();
    const MAX_MS = 55_000; // 55s de teto de trabalho por chamada
    let processadas = 0;
    let contadores = { ...CONTADORES_ZERO };

    for (const cidade of cidadesAlvo) {
      if (Date.now() - iniciado > MAX_MS) break;
      // Checa cancelamento
      const { data: bChk } = await supabase.from("manager_scraper_buscas").select("cancelada").eq("id", busca.id).maybeSingle();
      if (bChk?.cancelada) break;

      await supabase.from("manager_scraper_buscas").update({ cidade_atual: `${cidade.nome}/${cidade.uf}` }).eq("id", busca.id);

      const parcial = await processarCidade({
        supabase,
        busca_id: busca.id,
        sistema_id: data.sistema_id,
        cidade,
        nichos,
        maxPorBusca: data.limite_por_busca,
        raio_km: data.raio_km ?? null,
        enriquecer: data.enriquecer,
      });
      contadores = somarContadores(contadores, parcial);
      processadas++;

      await supabase
        .from("manager_scraper_buscas")
        .update({ cidades_processadas: processadas, contadores })
        .eq("id", busca.id);
    }

    const concluida = processadas >= cidadesAlvo.length;
    await supabase
      .from("manager_scraper_buscas")
      .update({
        status: concluida ? "concluido" : "pausado",
        cidade_atual: concluida ? null : `Parcial (${processadas}/${cidadesAlvo.length})`,
        contadores,
        total_resultados: contadores.validos,
        finalizado_em: concluida ? new Date().toISOString() : null,
      })
      .eq("id", busca.id);

    return { busca_id: busca.id, processadas, total: cidadesAlvo.length, contadores };
  });

// ---- Continuar busca (retomar) -------------------------------------------

const continuarInput = z.object({ busca_id: z.string().uuid() });

export const continuarBusca = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => continuarInput.parse(d))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const { supabase } = context;
    const { data: b } = await supabase.from("manager_scraper_buscas").select("*").eq("id", data.busca_id).single();
    if (!b) throw new Error("Busca não encontrada");
    if (b.status === "concluido") return { ok: true, processadas: b.cidades_processadas, total: b.total_cidades };

    // Repopular cidades e reprocessar do offset atual
    let cidades: Array<{ uf: string; nome: string; latitude: number | null; longitude: number | null }> = [];
    if (b.escopo === "cidade" || b.escopo === "raio") {
      cidades = [{ uf: b.uf ?? "--", nome: b.cidade ?? "Local", latitude: b.latitude, longitude: b.longitude }];
    } else {
      let q = supabase.from("manager_scraper_cidades").select("uf, nome, latitude, longitude").eq("ativa", true);
      if (b.escopo === "uf" && b.uf) q = q.eq("uf", b.uf);
      const { data: cs } = await q.order("populacao", { ascending: false });
      cidades = (cs ?? []).map((c) => ({ uf: c.uf, nome: c.nome, latitude: c.latitude, longitude: c.longitude }));
    }
    const restantes = cidades.slice(b.cidades_processadas ?? 0);

    if (!b.sistema_id) throw new Error("Busca sem sistema associado");
    const sistemaId = b.sistema_id as string;
    const { data: nichos } = await supabase
      .from("manager_scraper_nichos")
      .select("*")
      .eq("sistema_id", sistemaId)
      .in("slug", (b.nichos as string[]) ?? []);
    if (!nichos || nichos.length === 0) throw new Error("Nichos não encontrados");


    await supabase.from("manager_scraper_buscas").update({ status: "processando", cancelada: false }).eq("id", b.id);

    const iniciado = Date.now();
    const MAX_MS = 55_000;
    let processadas = b.cidades_processadas ?? 0;
    let contadores = (b.contadores as ContadoresBusca) ?? CONTADORES_ZERO;

    for (const cidade of restantes) {
      if (Date.now() - iniciado > MAX_MS) break;
      const { data: bChk } = await supabase.from("manager_scraper_buscas").select("cancelada").eq("id", b.id).maybeSingle();
      if (bChk?.cancelada) break;
      await supabase.from("manager_scraper_buscas").update({ cidade_atual: `${cidade.nome}/${cidade.uf}` }).eq("id", b.id);
      const parcial = await processarCidade({
        supabase,
        busca_id: b.id,
        sistema_id: sistemaId,
        cidade,
        nichos,
        maxPorBusca: 20,
        raio_km: b.raio_km,
        enriquecer: true,
      });
      contadores = somarContadores(contadores, parcial);
      processadas++;
      await supabase
        .from("manager_scraper_buscas")
        .update({ cidades_processadas: processadas, contadores })
        .eq("id", b.id);
    }

    const concluida = processadas >= cidades.length;
    await supabase
      .from("manager_scraper_buscas")
      .update({
        status: concluida ? "concluido" : "pausado",
        cidade_atual: concluida ? null : `Parcial (${processadas}/${cidades.length})`,
        contadores,
        total_resultados: contadores.validos,
        finalizado_em: concluida ? new Date().toISOString() : null,
      })
      .eq("id", b.id);

    return { ok: true, processadas, total: cidades.length, contadores };
  });

// ---- Cancelar -------------------------------------------------------------

export const cancelarBusca = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ busca_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    await context.supabase
      .from("manager_scraper_buscas")
      .update({ cancelada: true, status: "cancelado", finalizado_em: new Date().toISOString() })
      .eq("id", data.busca_id);
    return { ok: true };
  });

// ---- Listar buscas --------------------------------------------------------

export const listarBuscas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("manager_scraper_buscas")
      .select("*, manager_sistemas(nome, slug, cor)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ---- Listar leads capturados ---------------------------------------------

const listarLeadsInput = z.object({
  busca_id: z.string().uuid().nullable().optional(),
  sistema_id: z.string().uuid().nullable().optional(),
  uf: z.string().max(2).nullable().optional(),
  score_min: z.number().int().min(0).max(5).nullable().optional(),
  apenas_email: z.boolean().optional(),
  apenas_whatsapp: z.boolean().optional(),
  q: z.string().max(120).nullable().optional(),
  limite: z.number().int().min(1).max(500).default(200),
});

export const listarLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listarLeadsInput.parse(d))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    let q = context.supabase.from("manager_scraper_leads").select("*").order("score", { ascending: false }).order("capturado_em", { ascending: false }).limit(data.limite);
    if (data.busca_id) q = q.eq("busca_id", data.busca_id);
    if (data.sistema_id) q = q.eq("sistema_id", data.sistema_id);
    if (data.uf) q = q.eq("uf", data.uf);
    if (data.score_min != null) q = q.gte("score", data.score_min);
    if (data.apenas_email) q = q.not("email", "is", null);
    if (data.apenas_whatsapp) q = q.not("whatsapp", "is", null);
    if (data.q) q = q.ilike("nome", `%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ---- Enviar para CRM ------------------------------------------------------

export const enviarLeadCRM = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ lead_ids: z.array(z.string().uuid()).min(1).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const { supabase } = context;
    const { data: leads, error } = await supabase
      .from("manager_scraper_leads")
      .select("*")
      .in("id", data.lead_ids)
      .eq("enviado_crm", false);
    if (error) throw new Error(error.message);
    let enviados = 0;
    for (const l of leads ?? []) {
      const { data: novo, error: e2 } = await supabase
        .from("manager_leads")
        .insert({
          nome: l.nome,
          empresa: l.nome,
          email: l.email,
          telefone: l.whatsapp ?? l.telefone,
          origem: `scraper:${l.origem ?? "google_places"}`,
          status: "novo",
          score: l.score,
          sistema_interesse_id: l.sistema_id,
          observacoes: [
            l.endereco && `Endereço: ${l.endereco}`,
            l.website && `Site: ${l.website}`,
            l.instagram && `Instagram: ${l.instagram}`,
            l.facebook && `Facebook: ${l.facebook}`,
            l.google_maps_url && `Maps: ${l.google_maps_url}`,
            l.avaliacao != null && `Avaliação Google: ${l.avaliacao} (${l.total_avaliacoes ?? 0})`,
          ]
            .filter(Boolean)
            .join("\n"),
        })
        .select()
        .single();
      if (e2 || !novo) continue;
      await supabase.from("manager_scraper_leads").update({ enviado_crm: true, lead_id: novo.id }).eq("id", l.id);
      enviados++;
    }
    return { enviados };
  });

// ============================================================================
// Núcleo — processar 1 cidade
// ============================================================================

function somarContadores(a: ContadoresBusca, b: ContadoresBusca): ContadoresBusca {
  return {
    encontrados: (a.encontrados ?? 0) + (b.encontrados ?? 0),
    validos: (a.validos ?? 0) + (b.validos ?? 0),
    descartados_sem_contato: (a.descartados_sem_contato ?? 0) + (b.descartados_sem_contato ?? 0),
    duplicados: (a.duplicados ?? 0) + (b.duplicados ?? 0),
    com_email: (a.com_email ?? 0) + (b.com_email ?? 0),
    com_whatsapp: (a.com_whatsapp ?? 0) + (b.com_whatsapp ?? 0),
    com_instagram: (a.com_instagram ?? 0) + (b.com_instagram ?? 0),
    com_site: (a.com_site ?? 0) + (b.com_site ?? 0),
  };
}

export async function processarCidade(args: {
  supabase: any;
  busca_id: string;
  sistema_id: string;
  cidade: { uf: string; nome: string; latitude: number | null; longitude: number | null };
  nichos: Array<{ nome: string; termos: string[] }>;
  maxPorBusca: number;
  raio_km: number | null;
  enriquecer: boolean;
}): Promise<ContadoresBusca> {
  const contadores: ContadoresBusca = { ...CONTADORES_ZERO };

  // Constrói queries por nicho x termo (limita a 8 termos por nicho para não explodir custos)
  const buscas: string[] = [];
  for (const n of args.nichos) {
    for (const termo of (n.termos ?? []).slice(0, 8)) {
      buscas.push(`${termo} em ${args.cidade.nome} ${args.cidade.uf}`);
    }
  }

  const placesUnicos = new Map<string, Place>();
  for (const q of buscas) {
    try {
      const places = await googlePlacesTextSearch({
        textQuery: q,
        lat: args.cidade.latitude ?? undefined,
        lng: args.cidade.longitude ?? undefined,
        radiusM: args.raio_km ? args.raio_km * 1000 : args.cidade.latitude ? 25000 : undefined,
        maxResults: args.maxPorBusca,
      });
      for (const p of places) if (p.id) placesUnicos.set(p.id, p);
    } catch (err) {
      console.error(`[processarCidade] query="${q}"`, err);
    }
  }

  contadores.encontrados = placesUnicos.size;

  for (const p of placesUnicos.values()) {
    if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue;
    const nome = p.displayName?.text ?? "Sem nome";
    const telefone = p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null;
    const website = p.websiteUri ?? null;
    const google_maps_url = p.googleMapsUri ?? null;

    let email: string | null = null;
    let instagram: string | null = null;
    let facebook: string | null = null;
    let linkedin: string | null = null;
    let whatsapp: string | null = null;

    if (args.enriquecer && isOwnDomain(website)) {
      const md = await firecrawlScrape(website!, 12_000);
      if (md) {
        const ex = extractFromText(md);
        email = ex.email;
        instagram = ex.instagram;
        facebook = ex.facebook;
        linkedin = ex.linkedin;
        whatsapp = ex.whatsapp;
      }
    }

    if (!whatsapp && telefone && isWhatsAppPhone(telefone)) {
      whatsapp = `https://wa.me/55${digitsOnly(telefone).slice(-11)}`;
    }

    const temContato = Boolean(email || whatsapp || telefone || instagram || facebook || (website && isOwnDomain(website)));
    if (!temContato) {
      contadores.descartados_sem_contato++;
      continue;
    }

    const leadBase = {
      google_place_id: p.id,
      website,
      telefone,
      email,
      nome,
      cidade: args.cidade.nome,
    };
    const hash = computeHashDedupe(leadBase);

    const { data: existente } = await args.supabase
      .from("manager_scraper_leads")
      .select("id")
      .eq("hash_dedupe", hash)
      .maybeSingle();
    if (existente) {
      contadores.duplicados++;
      continue;
    }

    const score = computeScore({
      website,
      email,
      telefone,
      whatsapp,
      instagram,
      facebook,
      total_avaliacoes: p.userRatingCount ?? null,
    });

    const insertRow = {
      busca_id: args.busca_id,
      sistema_id: args.sistema_id,
      google_place_id: p.id,
      nome,
      categoria: p.primaryTypeDisplayName?.text ?? (p.types?.[0] ?? null),
      cidade: args.cidade.nome,
      uf: args.cidade.uf,
      endereco: p.formattedAddress ?? null,
      telefone,
      whatsapp,
      email,
      website,
      instagram,
      facebook,
      linkedin,
      google_maps_url,
      avaliacao: p.rating ?? null,
      total_avaliacoes: p.userRatingCount ?? null,
      horario_funcionamento: (p.regularOpeningHours as any) ?? null,
      score,
      origem: "google_places",
      hash_dedupe: hash,
      metadata: { types: p.types ?? [] },
    };

    const { error: insErr } = await args.supabase.from("manager_scraper_leads").insert(insertRow);
    if (insErr) {
      // pode ser corrida de dedupe
      if (String(insErr.message).includes("hash_dedupe")) {
        contadores.duplicados++;
        continue;
      }
      console.error("[insert lead]", insErr);
      continue;
    }

    contadores.validos++;
    if (email) contadores.com_email++;
    if (whatsapp) contadores.com_whatsapp++;
    if (instagram) contadores.com_instagram++;
    if (website && isOwnDomain(website)) contadores.com_site++;
  }

  return contadores;
}

// ============================================================================
// Auto-scraper — configuração diária
// ============================================================================

export const getAutoConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("manager_scraper_auto_config")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return data ?? null;
  });

const salvarAutoConfigInput = z.object({
  id: z.string().uuid().optional(),
  ativo: z.boolean(),
  sistemas_ids: z.array(z.string().uuid()).default([]),
  ufs: z.array(z.string().length(2)).default([]),
  score_min: z.number().int().min(0).max(5).default(3),
  enriquecer: z.boolean().default(true),
  limite_por_busca: z.number().int().min(1).max(20).default(15),
});

export const salvarAutoConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => salvarAutoConfigInput.parse(d))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const payload = {
      ativo: data.ativo,
      sistemas_ids: data.sistemas_ids,
      ufs: data.ufs.map((u) => u.toUpperCase()),
      score_min: data.score_min,
      enriquecer: data.enriquecer,
      limite_por_busca: data.limite_por_busca,
    };
    if (data.id) {
      const { data: r, error } = await context.supabase
        .from("manager_scraper_auto_config")
        .update(payload)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return r;
    }
    const { data: r, error } = await context.supabase
      .from("manager_scraper_auto_config")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return r;
  });

export const executarAutoScraperAgora = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const { executarAutoScraper } = await import("@/lib/lead-scraper-auto.server");
    return executarAutoScraper();
  });


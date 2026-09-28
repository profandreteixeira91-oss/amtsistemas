import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Camada de IA com cadeia automática de fallback.
 * Lê providers ativos de crm_integracoes e tenta em ordem de prioridade.
 * Inclui muitas opções GRATUITAS: Lovable AI, Groq, OpenRouter (:free),
 * Gemini, Mistral, Cohere, HuggingFace, Cloudflare Workers AI, Ollama (self-host),
 * Pollinations (imagem sem chave), Together (FLUX schnell), Stability.
 */

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const TIPOS_TEXTO = [
  "lovable_ai", "groq", "openrouter", "gemini", "mistral", "cohere",
  "huggingface", "cloudflare_ai", "ollama", "together_ai", "openai", "claude",
] as const;

const TIPOS_IMAGEM = [
  "pollinations", "lovable_ai", "together_ai", "gemini",
  "huggingface", "stability", "openai",
] as const;

const PRIORIDADE_PADRAO: Record<string, number> = {
  pollinations: 5, lovable_ai: 10, together_ai: 12, groq: 15, openai: 20,
  openrouter: 25, claude: 30, mistral: 35, gemini: 40, stability: 42,
  cohere: 45, replicate: 48, huggingface: 50, cloudflare_ai: 55, ollama: 60,
};

const MODELO_TEXTO_PADRAO: Record<string, string> = {
  lovable_ai: "google/gemini-2.5-flash",
  openai: "gpt-4o-mini",
  claude: "claude-3-5-sonnet-latest",
  gemini: "gemini-2.0-flash",
  groq: "llama-3.3-70b-versatile",
  openrouter: "meta-llama/llama-3.1-8b-instruct:free",
  mistral: "mistral-small-latest",
  cohere: "command-r-plus",
  huggingface: "meta-llama/Llama-3.1-8B-Instruct",
  cloudflare_ai: "@cf/meta/llama-3.1-8b-instruct",
  ollama: "llama3.1",
  together_ai: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
};

const MODELO_IMAGEM_PADRAO: Record<string, string> = {
  lovable_ai: "google/gemini-2.5-flash-image",
  openai: "gpt-image-1",
  gemini: "gemini-2.0-flash-preview-image-generation",
  pollinations: "flux",
  together_ai: "black-forest-labs/FLUX.1-schnell-Free",
  stability: "stable-diffusion-3-medium",
  huggingface: "black-forest-labs/FLUX.1-schnell",
};

// Fallback interno de nomes de modelo dentro de um mesmo provedor (para 404 de modelo)
const GEMINI_FALLBACK_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
  "gemini-pro",
];

async function listIaProviders(supabase: any) {
  const { data } = await supabase
    .from("crm_integracoes")
    .select("tipo, credenciais, config, ativo")
    .in("tipo", TIPOS_TEXTO as unknown as string[])
    .eq("ativo", true);
  return (data ?? []) as Array<{ tipo: string; credenciais: any; config: any }>;
}

function buildChain(
  rows: Array<{ tipo: string; credenciais: any; config: any }>,
  kind: "texto" | "imagem",
) {
  const map = new Map<string, { tipo: string; credenciais: any; config: any }>();
  for (const r of rows) map.set(r.tipo, r);
  // Lovable sempre presente como fallback
  if (!map.has("lovable_ai")) map.set("lovable_ai", { tipo: "lovable_ai", credenciais: {}, config: {} });
  // Pollinations é grátis e sem chave — sempre presente para imagem
  if (kind === "imagem" && !map.has("pollinations")) {
    map.set("pollinations", { tipo: "pollinations", credenciais: {}, config: {} });
  }

  const valid = kind === "texto" ? TIPOS_TEXTO : TIPOS_IMAGEM;
  const items = Array.from(map.values()).filter((r) => {
    if (!(valid as readonly string[]).includes(r.tipo)) return false;
    const cfg = r.config ?? {};
    if (kind === "texto") return cfg.usar_para_texto !== false;
    // imagem
    if (r.tipo === "lovable_ai" || r.tipo === "pollinations") return cfg.usar_para_imagem !== false;
    return cfg.usar_para_imagem === true;
  });

  items.sort((a, b) => {
    const pa = Number(a.config?.prioridade ?? PRIORIDADE_PADRAO[a.tipo] ?? 99);
    const pb = Number(b.config?.prioridade ?? PRIORIDADE_PADRAO[b.tipo] ?? 99);
    return pa - pb;
  });
  return items;
}

/* ═══════════ TEXTO ═══════════ */

async function callLovableChat(model: string, messages: ChatMessage[]) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    if (resp.status === 429) throw new Error("LOVABLE_RATE_LIMIT");
    if (resp.status === 402) throw new Error("LOVABLE_SEM_CREDITO");
    throw new Error(`LOVABLE_${resp.status}: ${txt.slice(0, 200)}`);
  }
  const j = (await resp.json()) as any;
  return j.choices?.[0]?.message?.content ?? "";
}

async function callOpenAICompatible(baseUrl: string, apiKey: string, model: string, messages: ChatMessage[], extraHeaders: Record<string, string> = {}) {
  const resp = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, ...extraHeaders },
    body: JSON.stringify({ model, messages }),
  });
  if (!resp.ok) throw new Error(`${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const j = (await resp.json()) as any;
  return j.choices?.[0]?.message?.content ?? "";
}

async function callClaudeChat(apiKey: string, model: string, messages: ChatMessage[]) {
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const nonSys = messages.filter((m) => m.role !== "system");
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: 2048, system, messages: nonSys }),
  });
  if (!resp.ok) throw new Error(`CLAUDE_${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const j = (await resp.json()) as any;
  return j.content?.[0]?.text ?? "";
}

async function callGeminiChatOnce(apiKey: string, model: string, messages: ChatMessage[]) {
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const system = messages.find((m) => m.role === "system")?.content;
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents, systemInstruction: system ? { parts: [{ text: system }] } : undefined }),
    },
  );
  if (!resp.ok) {
    const err = new Error(`GEMINI_${resp.status}: ${(await resp.text()).slice(0, 200)}`);
    (err as any).status = resp.status;
    throw err;
  }
  const j = (await resp.json()) as any;
  return j.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function callGeminiChat(apiKey: string, preferredModel: string, messages: ChatMessage[]) {
  const tried = new Set<string>();
  const chain = [preferredModel, ...GEMINI_FALLBACK_MODELS].filter((m) => m && !tried.has(m) && tried.add(m));
  let lastErr: any = null;
  for (const m of chain) {
    try {
      const out = await callGeminiChatOnce(apiKey, m, messages);
      if (out) return out;
    } catch (e: any) {
      lastErr = e;
      if (e?.status !== 404) throw e; // só troca de modelo se for 404
    }
  }
  throw lastErr ?? new Error("GEMINI: sem modelo válido");
}

async function callCohereChat(apiKey: string, model: string, messages: ChatMessage[]) {
  const resp = await fetch("https://api.cohere.com/v1/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      message: messages.filter((m) => m.role === "user").slice(-1)[0]?.content ?? "",
      preamble: messages.find((m) => m.role === "system")?.content,
      chat_history: messages.filter((m) => m.role !== "system").slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "CHATBOT" : "USER", message: m.content,
      })),
    }),
  });
  if (!resp.ok) throw new Error(`COHERE_${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const j = (await resp.json()) as any;
  return j.text ?? "";
}

async function callHuggingFaceChat(apiKey: string, model: string, messages: ChatMessage[]) {
  const resp = await fetch(`https://router.huggingface.co/hf-inference/models/${model}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: 1024 }),
  });
  if (!resp.ok) throw new Error(`HF_${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const j = (await resp.json()) as any;
  return j.choices?.[0]?.message?.content ?? "";
}

async function callCloudflareAI(accountId: string, apiKey: string, model: string, messages: ChatMessage[]) {
  const resp = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ messages }),
    },
  );
  if (!resp.ok) throw new Error(`CF_${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const j = (await resp.json()) as any;
  return j.result?.response ?? "";
}

async function callOllama(baseUrl: string, model: string, messages: ChatMessage[]) {
  const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false }),
  });
  if (!resp.ok) throw new Error(`OLLAMA_${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const j = (await resp.json()) as any;
  return j.message?.content ?? "";
}

async function tentarProviderTexto(r: { tipo: string; credenciais: any; config: any }, modelo: string, messages: ChatMessage[]): Promise<string> {
  const c = r.credenciais ?? {};
  switch (r.tipo) {
    case "lovable_ai":     return callLovableChat(modelo, messages);
    case "openai":         return callOpenAICompatible("https://api.openai.com/v1/chat/completions", c.api_key, modelo, messages);
    case "groq":           return callOpenAICompatible("https://api.groq.com/openai/v1/chat/completions", c.api_key, modelo, messages);
    case "openrouter":     return callOpenAICompatible("https://openrouter.ai/api/v1/chat/completions", c.api_key, modelo, messages, { "HTTP-Referer": "https://amtsistemas.com.br" });
    case "mistral":        return callOpenAICompatible("https://api.mistral.ai/v1/chat/completions", c.api_key, modelo, messages);
    case "together_ai":    return callOpenAICompatible("https://api.together.xyz/v1/chat/completions", c.api_key, modelo, messages);
    case "claude":         return callClaudeChat(c.api_key, modelo, messages);
    case "gemini":         return callGeminiChat(c.api_key, modelo, messages);
    case "cohere":         return callCohereChat(c.api_key, modelo, messages);
    case "huggingface":    return callHuggingFaceChat(c.api_key, modelo, messages);
    case "cloudflare_ai":  return callCloudflareAI(c.account_id, c.api_key, modelo, messages);
    case "ollama":         return callOllama(c.base_url, modelo, messages);
  }
  throw new Error(`Provider ${r.tipo} não implementado`);
}

export async function chatComFallback(
  supabase: any,
  messages: ChatMessage[],
  opts?: { modelo?: string; provider_preferido?: string },
) {
  const rows = await listIaProviders(supabase);
  let chain = buildChain(rows, "texto");
  if (opts?.provider_preferido) {
    const pref = opts.provider_preferido;
    chain = [...chain.filter((c) => c.tipo === pref), ...chain.filter((c) => c.tipo !== pref)];
  }
  const tentativas: Array<{ provider: string; erro: string }> = [];

  for (const r of chain) {
    const modelo = opts?.modelo || (r.config?.modelo_default as string) || MODELO_TEXTO_PADRAO[r.tipo];
    try {
      const content = await tentarProviderTexto(r, modelo, messages);
      if (!content) throw new Error(`${r.tipo}: resposta vazia`);
      return { content, provider_usado: r.tipo, modelo, tentativas };
    } catch (e: any) {
      const erro = String(e?.message ?? e).slice(0, 200);
      tentativas.push({ provider: r.tipo, erro });
      console.warn(`[IA] ${r.tipo} falhou:`, erro);
    }
  }
  throw new Error(
    `Todos os provedores de IA falharam. Configure uma chave em /crm/integracoes. Tentativas: ${JSON.stringify(tentativas)}`,
  );
}

/* ═══════════ IMAGEM ═══════════ */

async function imagemLovable(model: string, prompt: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], modalities: ["image", "text"] }),
  });
  if (!resp.ok) {
    if (resp.status === 429) throw new Error("LOVABLE_RATE_LIMIT");
    if (resp.status === 402) throw new Error("LOVABLE_SEM_CREDITO");
    throw new Error(`LOVABLE_IMG_${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  }
  const j = (await resp.json()) as any;
  const url: string | undefined =
    j.choices?.[0]?.message?.images?.[0]?.image_url?.url ??
    j.choices?.[0]?.message?.images?.[0]?.url;
  if (!url) throw new Error("Lovable não retornou imagem");
  return url;
}

async function imagemPollinations(prompt: string, model: string): Promise<string> {
  // 100% grátis, sem chave. Retorna URL da imagem.
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=${encodeURIComponent(model || "flux")}&nologo=true&width=1024&height=1024`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`POLLI_${resp.status}`);
  const buf = new Uint8Array(await resp.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  return `data:image/jpeg;base64,${btoa(bin)}`;
}

async function imagemOpenAI(apiKey: string, model: string, prompt: string): Promise<string> {
  const resp = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: model || "gpt-image-1", prompt, size: "1024x1024", n: 1 }),
  });
  if (!resp.ok) throw new Error(`OPENAI_IMG_${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const j = (await resp.json()) as any;
  const b64 = j.data?.[0]?.b64_json;
  const url = j.data?.[0]?.url;
  if (b64) return `data:image/png;base64,${b64}`;
  if (url) return url;
  throw new Error("OpenAI não retornou imagem");
}

async function imagemGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const modelos = [model, "gemini-2.0-flash-preview-image-generation", "gemini-2.5-flash-image"].filter(Boolean);
  let lastErr: any;
  for (const m of modelos) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
          }),
        },
      );
      if (!resp.ok) { lastErr = new Error(`GEMINI_IMG_${resp.status}`); if (resp.status !== 404) throw lastErr; continue; }
      const j = (await resp.json()) as any;
      const parts = j.candidates?.[0]?.content?.parts ?? [];
      for (const p of parts) {
        const b64 = p.inlineData?.data ?? p.inline_data?.data;
        const mime = p.inlineData?.mimeType ?? p.inline_data?.mime_type ?? "image/png";
        if (b64) return `data:${mime};base64,${b64}`;
      }
    } catch (e) { lastErr = e; }
  }
  throw lastErr ?? new Error("Gemini não retornou imagem");
}

async function imagemTogether(apiKey: string, model: string, prompt: string): Promise<string> {
  const resp = await fetch("https://api.together.xyz/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, prompt, width: 1024, height: 1024, steps: 4, response_format: "b64_json" }),
  });
  if (!resp.ok) throw new Error(`TOGETHER_IMG_${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const j = (await resp.json()) as any;
  const b64 = j.data?.[0]?.b64_json;
  if (b64) return `data:image/png;base64,${b64}`;
  throw new Error("Together não retornou imagem");
}

async function imagemStability(apiKey: string, _model: string, prompt: string): Promise<string> {
  const form = new FormData();
  form.append("prompt", prompt);
  form.append("output_format", "png");
  const resp = await fetch("https://api.stability.ai/v2beta/stable-image/generate/core", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "image/*" },
    body: form,
  });
  if (!resp.ok) throw new Error(`STABILITY_${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const buf = new Uint8Array(await resp.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  return `data:image/png;base64,${btoa(bin)}`;
}

async function imagemHuggingFace(apiKey: string, model: string, prompt: string): Promise<string> {
  const resp = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ inputs: prompt }),
  });
  if (!resp.ok) throw new Error(`HF_IMG_${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const buf = new Uint8Array(await resp.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  return `data:image/png;base64,${btoa(bin)}`;
}

export async function imagemComFallback(supabase: any, prompt: string, preferido?: string, estrito?: boolean) {
  const rows = await listIaProviders(supabase);
  let chain = buildChain(rows, "imagem");
  if (preferido) {
    if (estrito) {
      chain = chain.filter((c) => c.tipo === preferido);
      if (chain.length === 0) throw new Error(`Provedor "${preferido}" não está ativo em /crm/integracoes.`);
    } else {
      chain = [...chain.filter((c) => c.tipo === preferido), ...chain.filter((c) => c.tipo !== preferido)];
    }
  }
  if (chain.length === 0) throw new Error("Nenhum provedor de imagem configurado. Ative em /crm/integracoes.");


  const tentativas: Array<{ provider: string; erro: string }> = [];
  for (const r of chain) {
    const modelo = (r.config?.modelo_imagem as string) || MODELO_IMAGEM_PADRAO[r.tipo];
    const c = r.credenciais ?? {};
    // até 2 tentativas por provider em caso de 429 (rate-limit), com backoff curto
    let ultimo: any = null;
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      try {
        let dataUrl = "";
        switch (r.tipo) {
          case "pollinations":  dataUrl = await imagemPollinations(prompt, modelo); break;
          case "lovable_ai":    dataUrl = await imagemLovable(modelo, prompt); break;
          case "together_ai":   dataUrl = await imagemTogether(c.api_key, modelo, prompt); break;
          case "openai":        dataUrl = await imagemOpenAI(c.api_key, modelo, prompt); break;
          case "gemini":        dataUrl = await imagemGemini(c.api_key, modelo, prompt); break;
          case "stability":     dataUrl = await imagemStability(c.api_key, modelo, prompt); break;
          case "huggingface":   dataUrl = await imagemHuggingFace(c.api_key, modelo, prompt); break;
          default: ultimo = new Error("provider desconhecido"); break;
        }
        if (dataUrl) return { image_url: dataUrl, provider_usado: r.tipo, modelo, tentativas };
      } catch (e: any) {
        ultimo = e;
        const msg = String(e?.message ?? e);
        if (msg.includes("429") || msg.includes("RATE_LIMIT")) {
          await new Promise((res) => setTimeout(res, 1500 * (tentativa + 1)));
          continue;
        }
        break;
      }
    }
    const erro = String(ultimo?.message ?? ultimo).slice(0, 200);
    tentativas.push({ provider: r.tipo, erro });
    console.warn(`[IA-IMG] ${r.tipo} falhou:`, erro);
  }

  // Mensagem humana e acionável em vez de JSON cru
  const rotulo: Record<string, string> = {
    pollinations: "Pollinations (grátis)",
    lovable_ai: "Lovable AI",
    together_ai: "Together AI",
    openai: "OpenAI",
    gemini: "Google Gemini",
    stability: "Stability AI",
    huggingface: "Hugging Face",
  };
  const linhas = tentativas.map((t) => {
    const nome = rotulo[t.provider] ?? t.provider;
    if (t.erro.includes("LOVABLE_SEM_CREDITO")) return `• ${nome}: sem créditos no workspace Lovable AI`;
    if (t.erro.includes("LOVABLE_RATE_LIMIT") || t.erro.includes("429") || t.erro.includes("RATE_LIMIT"))
      return `• ${nome}: limite de requisições atingido (429) — aguarde alguns minutos ou use um provedor pago`;
    if (t.erro.match(/_(401|403)/)) return `• ${nome}: chave de API inválida ou sem permissão`;
    if (t.erro.match(/_(402)/) || t.erro.toLowerCase().includes("credit")) return `• ${nome}: sem créditos/saldo na conta`;
    return `• ${nome}: ${t.erro}`;
  }).join("\n");

  const preferidoInfo = preferido
    ? (estrito
        ? `O provedor "${preferido}" que você selecionou falhou. `
        : `Nenhum provedor conseguiu gerar (começando pelo escolhido "${preferido}"). `)
    : "Nenhum provedor conseguiu gerar. ";
  throw new Error(
    `${preferidoInfo}Detalhes:\n${linhas}\n\nSoluções: (1) configure uma chave paga em /crm/integracoes (OpenAI, Stability ou Together AI raramente ficam sem cota), (2) recarregue créditos do Lovable AI, ou (3) aguarde e tente novamente.`,
  );
}


/* ═══════════ Helpers ═══════════ */

async function requireSuperAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_super_admin", { _user_id: userId });
  if (!data) throw new Error("Acesso negado");
}

async function resolvePrompt(supabase: any, chave: string, fallback: string) {
  const { data } = await supabase
    .from("crm_prompts_ia").select("template, modelo").eq("chave", chave).maybeSingle();
  return {
    template: (data?.template as string) ?? fallback,
    modelo: (data?.modelo as string) || undefined,
  };
}

function fill(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

/* ═══════════ Server functions ═══════════ */

export const iaGerarCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ canal: z.string(), objetivo: z.string(), tom: z.string().default("consultivo"), tema: z.string() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.supabase, context.userId);
    const { template, modelo } = await resolvePrompt(
      context.supabase, "copy_generica",
      "Gere copy para {canal} com objetivo {objetivo}, tom {tom}, sobre {tema}. Retorne JSON: {headline, subheadline, cta, texto_curto, texto_longo}.",
    );
    return chatComFallback(context.supabase, [
      { role: "system", content: "Você é um copywriter B2B brasileiro. Responda em português BR e retorne SEMPRE JSON válido quando o prompt pedir JSON." },
      { role: "user", content: fill(template, data) },
    ], { modelo });
  });

export const iaAnalisarLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      lead_id: z.string().uuid(),
      provider_preferido: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.supabase, context.userId);
    const { data: lead, error } = await context.supabase.from("manager_leads").select("*").eq("id", data.lead_id).maybeSingle();
    if (error || !lead) throw new Error("Lead não encontrado");
    const { template, modelo } = await resolvePrompt(
      context.supabase, "analisar_lead",
      "Analise o lead {lead_json} e retorne JSON com resumo, probabilidade_compra, problemas_provaveis, sistema_recomendado, abordagem_sugerida.",
    );
    const r = await chatComFallback(context.supabase, [
      { role: "system", content: "Você é consultor de vendas B2B da AMT Sistemas. Responda em JSON válido em português BR." },
      { role: "user", content: fill(template, { lead_json: JSON.stringify(lead) }) },
    ], { modelo, provider_preferido: data.provider_preferido });
    return { ...r, lead };
  });

export const iaGerarMensagem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      canal: z.enum(["whatsapp", "email", "instagram", "ligacao"]),
      empresa: z.string(), categoria: z.string().default(""),
      tom: z.string().default("consultivo"),
      objetivo: z.string().default("agendar demonstração"),
      cta: z.string().default("agendar 15min de conversa"),
      provider_preferido: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.supabase, context.userId);
    const chave = data.canal === "email" ? "email_prospeccao" : "mensagem_whatsapp";
    const fallback = data.canal === "email"
      ? "Escreva um email de prospecção B2B para {empresa} ({categoria}). Tom {tom}. Formato: assunto + corpo. CTA: {cta}."
      : "Escreva UMA mensagem curta de {canal} em PT-BR, tom {tom}, para {empresa} ({categoria}). Objetivo: {objetivo}.";
    const { template, modelo } = await resolvePrompt(context.supabase, chave, fallback);
    return chatComFallback(context.supabase, [
      { role: "system", content: "Você é um SDR B2B brasileiro. Direto, consultivo, sem clichê." },
      { role: "user", content: fill(template, { ...data }) },
    ], { modelo, provider_preferido: data.provider_preferido });
  });

export const iaGerarPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ formato: z.enum(["feed", "carrossel", "story", "reels"]), tema: z.string() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.supabase, context.userId);
    const { template, modelo } = await resolvePrompt(
      context.supabase, "post_instagram",
      "Crie post Instagram formato {formato} sobre {tema}. Retorne JSON: titulo, legenda, hashtags, cta, texto_arte, descricao.",
    );
    return chatComFallback(context.supabase, [
      { role: "system", content: "Você é social media da AMT Sistemas. Responda em JSON válido, PT-BR." },
      { role: "user", content: fill(template, data) },
    ], { modelo });
  });

export const iaGerarImagem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      prompt: z.string().min(3),
      provider_preferido: z.enum([
        "pollinations", "lovable_ai", "together_ai", "openai", "gemini", "stability", "huggingface",
      ]).optional(),
      estrito: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.supabase, context.userId);
    return imagemComFallback(context.supabase, data.prompt, data.provider_preferido, data.estrito);
  });


export const iaListarProvidersDisponiveis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireSuperAdmin(context.supabase, context.userId);
    const rows = await listIaProviders(context.supabase);
    const texto = buildChain(rows, "texto").map((r) => ({
      tipo: r.tipo,
      prioridade: Number(r.config?.prioridade ?? PRIORIDADE_PADRAO[r.tipo] ?? 99),
      modelo: r.config?.modelo_default || MODELO_TEXTO_PADRAO[r.tipo],
    }));
    const imagem = buildChain(rows, "imagem").map((r) => ({
      tipo: r.tipo,
      prioridade: Number(r.config?.prioridade ?? PRIORIDADE_PADRAO[r.tipo] ?? 99),
      modelo: r.config?.modelo_imagem || MODELO_IMAGEM_PADRAO[r.tipo],
    }));
    return { texto, imagem };
  });

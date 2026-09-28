/**
 * Catálogo declarativo de integrações suportadas pelo CRM.
 * Cada tipo define seus campos de credencial e configuração.
 * Compartilhado entre backend (validação/uso) e UI (renderização).
 *
 * Campo "plano":
 *  - "gratis"    → 100% gratuito (self-host, tier permanente sem cartão, etc.)
 *  - "freemium"  → possui camada gratuita generosa + planos pagos
 *  - "pago"      → requer plano pago (trial pode existir)
 */

export type CampoTipo = "text" | "password" | "url" | "textarea" | "select" | "boolean";

export type CampoDef = {
  key: string;
  label: string;
  tipo: CampoTipo;
  obrigatorio?: boolean;
  placeholder?: string;
  ajuda?: string;
  opcoes?: Array<{ value: string; label: string }>;
};

export type PlanoTipo = "gratis" | "freemium" | "pago";

export type IntegracaoDef = {
  tipo: string;
  label: string;
  categoria:
    | "mensageria"
    | "email"
    | "ia"
    | "ia_imagem"
    | "google"
    | "meta"
    | "automacao"
    | "push"
    | "sms"
    | "storage"
    | "analytics"
    | "pagamento"
    | "outros";
  descricao: string;
  docs?: string;
  credenciais: CampoDef[];
  config?: CampoDef[];
  testavel?: boolean;
  plano: PlanoTipo;
  plano_detalhe?: string;
};

export const CATALOGO: IntegracaoDef[] = [
  // ═══════════════════════════════════════════════════════
  // MENSAGERIA
  // ═══════════════════════════════════════════════════════
  {
    tipo: "telegram_bot",
    label: "Telegram Bot API",
    categoria: "mensageria",
    plano: "gratis",
    plano_detalhe: "100% grátis, sem limites documentados de mensagens.",
    descricao: "Bot do Telegram para envio e recebimento de mensagens. Criação via @BotFather.",
    docs: "https://core.telegram.org/bots/api",
    testavel: true,
    credenciais: [
      { key: "bot_token", label: "Bot Token", tipo: "password", obrigatorio: true, placeholder: "123456:ABC-DEF...", ajuda: "Obtido no @BotFather." },
    ],
    config: [
      { key: "chat_id_padrao", label: "Chat ID padrão", tipo: "text", placeholder: "-1001234567890" },
    ],
  },
  {
    tipo: "discord_webhook",
    label: "Discord Webhook",
    categoria: "mensageria",
    plano: "gratis",
    plano_detalhe: "Webhooks do Discord são gratuitos e ilimitados.",
    descricao: "Envio de mensagens/alertas para canais Discord via webhook.",
    docs: "https://support.discord.com/hc/en-us/articles/228383668",
    testavel: true,
    credenciais: [
      { key: "webhook_url", label: "Webhook URL", tipo: "url", obrigatorio: true, placeholder: "https://discord.com/api/webhooks/..." },
    ],
  },
  {
    tipo: "slack_webhook",
    label: "Slack Incoming Webhook",
    categoria: "mensageria",
    plano: "gratis",
    plano_detalhe: "Incoming webhooks são gratuitos no plano Free do Slack.",
    descricao: "Notificações para canais do Slack via webhook.",
    docs: "https://api.slack.com/messaging/webhooks",
    testavel: true,
    credenciais: [
      { key: "webhook_url", label: "Webhook URL", tipo: "url", obrigatorio: true, placeholder: "https://hooks.slack.com/services/..." },
    ],
  },
  {
    tipo: "whatsapp_cloud",
    label: "WhatsApp Cloud API (Meta)",
    categoria: "mensageria",
    plano: "freemium",
    plano_detalhe: "1.000 conversas iniciadas por empresa/mês grátis; excedente pago por conversa.",
    descricao: "WhatsApp Business oficial da Meta.",
    docs: "https://developers.facebook.com/docs/whatsapp/cloud-api",
    testavel: true,
    credenciais: [
      { key: "access_token", label: "Access Token", tipo: "password", obrigatorio: true, ajuda: "Token permanente do app da Meta." },
      { key: "phone_number_id", label: "Phone Number ID", tipo: "text", obrigatorio: true },
      { key: "business_account_id", label: "WABA ID", tipo: "text" },
    ],
    config: [
      { key: "graph_version", label: "Versão Graph API", tipo: "text", placeholder: "v20.0" },
      { key: "default_template", label: "Template padrão (fora janela 24h)", tipo: "text" },
    ],
  },
  {
    tipo: "evolution_api",
    label: "Evolution API (self-host)",
    categoria: "mensageria",
    plano: "gratis",
    plano_detalhe: "Open-source, gratuito. Custo apenas de servidor (VPS a partir de ~US$5/mês).",
    descricao: "WhatsApp não-oficial via Baileys. Instância self-hosted, código aberto.",
    docs: "https://doc.evolution-api.com",
    testavel: true,
    credenciais: [
      { key: "base_url", label: "URL base", tipo: "url", obrigatorio: true, placeholder: "https://evo.seuservidor.com" },
      { key: "api_key", label: "API Key", tipo: "password", obrigatorio: true },
      { key: "instance", label: "Nome da instância", tipo: "text", obrigatorio: true },
    ],
  },
  {
    tipo: "baileys_ws",
    label: "Baileys (WhatsApp WebSocket)",
    categoria: "mensageria",
    plano: "gratis",
    plano_detalhe: "Biblioteca open-source. Endpoint HTTP próprio necessário.",
    descricao: "Endpoint HTTP customizado que expõe uma instância Baileys.",
    credenciais: [
      { key: "base_url", label: "URL base", tipo: "url", obrigatorio: true },
      { key: "token", label: "Token", tipo: "password" },
    ],
  },
  {
    tipo: "meta_graph",
    label: "Meta Graph API (Facebook/Instagram)",
    categoria: "meta",
    plano: "gratis",
    plano_detalhe: "API grátis para páginas próprias; sujeita a limites de rate.",
    descricao: "Publicações, mensagens diretas e leads no Facebook/Instagram.",
    docs: "https://developers.facebook.com/docs/graph-api",
    credenciais: [
      { key: "access_token", label: "Access Token", tipo: "password", obrigatorio: true },
      { key: "app_id", label: "App ID", tipo: "text" },
      { key: "app_secret", label: "App Secret", tipo: "password" },
      { key: "page_id", label: "Page ID", tipo: "text" },
      { key: "ig_user_id", label: "Instagram Business User ID", tipo: "text" },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // EMAIL
  // ═══════════════════════════════════════════════════════
  {
    tipo: "smtp",
    label: "SMTP genérico",
    categoria: "email",
    plano: "gratis",
    plano_detalhe: "Grátis usando seu próprio servidor ou provedores como Gmail (500/dia), Zoho, etc.",
    descricao: "Qualquer servidor SMTP (Gmail, Zoho, Outlook, próprio).",
    testavel: true,
    credenciais: [
      { key: "host", label: "Host", tipo: "text", obrigatorio: true, placeholder: "smtp.gmail.com" },
      { key: "port", label: "Porta", tipo: "text", placeholder: "587" },
      { key: "user", label: "Usuário", tipo: "text", obrigatorio: true },
      { key: "password", label: "Senha / App password", tipo: "password", obrigatorio: true },
    ],
    config: [
      { key: "from_email", label: "From (email)", tipo: "text", placeholder: "no-reply@seudominio.com" },
      { key: "from_nome", label: "From (nome)", tipo: "text" },
      { key: "secure", label: "Usar TLS (465)", tipo: "boolean" },
    ],
  },
  {
    tipo: "brevo",
    label: "Brevo (ex-Sendinblue)",
    categoria: "email",
    plano: "freemium",
    plano_detalhe: "300 emails/dia grátis para sempre (sem cartão).",
    descricao: "Envio transacional e marketing. Camada gratuita generosa.",
    docs: "https://app.brevo.com/settings/keys/api",
    testavel: true,
    credenciais: [
      { key: "api_key", label: "API Key (v3)", tipo: "password", obrigatorio: true, placeholder: "xkeysib-..." },
    ],
    config: [
      { key: "from_email", label: "From (email)", tipo: "text" },
      { key: "from_nome", label: "From (nome)", tipo: "text" },
    ],
  },
  {
    tipo: "resend",
    label: "Resend",
    categoria: "email",
    plano: "freemium",
    plano_detalhe: "3.000 emails/mês e 100/dia grátis.",
    descricao: "API moderna para emails transacionais.",
    docs: "https://resend.com/api-keys",
    testavel: true,
    credenciais: [
      { key: "api_key", label: "API Key", tipo: "password", obrigatorio: true, placeholder: "re_..." },
    ],
    config: [{ key: "from", label: "From", tipo: "text", placeholder: "onboarding@resend.dev" }],
  },
  {
    tipo: "mailersend",
    label: "MailerSend",
    categoria: "email",
    plano: "freemium",
    plano_detalhe: "3.000 emails/mês grátis.",
    descricao: "Transacional com bom deliverability.",
    docs: "https://www.mailersend.com/help/managing-api-tokens",
    credenciais: [{ key: "api_key", label: "API Token", tipo: "password", obrigatorio: true }],
    config: [{ key: "from", label: "From", tipo: "text" }],
  },
  {
    tipo: "sendgrid",
    label: "SendGrid",
    categoria: "email",
    plano: "freemium",
    plano_detalhe: "100 emails/dia grátis para sempre.",
    descricao: "Provedor tradicional de email transacional (Twilio).",
    docs: "https://app.sendgrid.com/settings/api_keys",
    credenciais: [{ key: "api_key", label: "API Key", tipo: "password", obrigatorio: true, placeholder: "SG..." }],
    config: [{ key: "from", label: "From", tipo: "text" }],
  },

  // ═══════════════════════════════════════════════════════
  // IA — TEXTO
  // ═══════════════════════════════════════════════════════
  {
    tipo: "lovable_ai",
    label: "Lovable AI Gateway",
    categoria: "ia",
    plano: "freemium",
    plano_detalhe: "Incluído nos créditos do plano Lovable (grátis dentro do limite).",
    descricao: "Gateway padrão da plataforma. Sem chave — usa créditos da conta.",
    credenciais: [],
    config: [
      { key: "modelo_default", label: "Modelo de texto padrão", tipo: "text", placeholder: "google/gemini-2.5-flash" },
      { key: "modelo_imagem", label: "Modelo de imagem", tipo: "text", placeholder: "google/gemini-2.5-flash-image" },
      { key: "prioridade", label: "Prioridade no fallback (menor = tentado primeiro)", tipo: "text", placeholder: "10" },
      { key: "usar_para_texto", label: "Usar para geração de texto", tipo: "boolean" },
      { key: "usar_para_imagem", label: "Usar para geração de imagem", tipo: "boolean" },
    ],
  },
  {
    tipo: "groq",
    label: "Groq (LLaMA / Mixtral ultra-rápidos)",
    categoria: "ia",
    plano: "gratis",
    plano_detalhe: "Tier grátis generoso: milhares de requisições/dia sem cartão.",
    descricao: "Inferência extremamente rápida de modelos open (Llama 3.1/3.3, Mixtral, Gemma).",
    docs: "https://console.groq.com/keys",
    testavel: true,
    credenciais: [{ key: "api_key", label: "API Key", tipo: "password", obrigatorio: true, placeholder: "gsk_..." }],
    config: [
      { key: "modelo_default", label: "Modelo padrão", tipo: "text", placeholder: "llama-3.3-70b-versatile" },
      { key: "prioridade", label: "Prioridade no fallback", tipo: "text", placeholder: "15" },
      { key: "usar_para_texto", label: "Usar para geração de texto", tipo: "boolean" },
    ],
  },
  {
    tipo: "openrouter",
    label: "OpenRouter (múltiplos modelos)",
    categoria: "ia",
    plano: "freemium",
    plano_detalhe: "Vários modelos com sufixo :free totalmente grátis (rate-limitados).",
    descricao: "Roteador para 100+ LLMs. Modelos como llama-3.1-8b:free, gemma-2:free, etc.",
    docs: "https://openrouter.ai/keys",
    testavel: true,
    credenciais: [{ key: "api_key", label: "API Key", tipo: "password", obrigatorio: true, placeholder: "sk-or-..." }],
    config: [
      { key: "modelo_default", label: "Modelo padrão", tipo: "text", placeholder: "meta-llama/llama-3.1-8b-instruct:free" },
      { key: "prioridade", label: "Prioridade no fallback", tipo: "text", placeholder: "25" },
      { key: "usar_para_texto", label: "Usar para geração de texto", tipo: "boolean" },
    ],
  },
  {
    tipo: "gemini",
    label: "Google Gemini (AI Studio)",
    categoria: "ia",
    plano: "freemium",
    plano_detalhe: "Tier grátis com limites de RPM/dia (Flash é o mais generoso).",
    descricao: "Chave direta do Google AI Studio (texto e imagem).",
    docs: "https://aistudio.google.com/app/apikey",
    testavel: true,
    credenciais: [{ key: "api_key", label: "API Key", tipo: "password", obrigatorio: true }],
    config: [
      { key: "modelo_default", label: "Modelo de texto padrão", tipo: "text", placeholder: "gemini-2.5-flash" },
      { key: "modelo_imagem", label: "Modelo de imagem", tipo: "text", placeholder: "gemini-2.5-flash-image" },
      { key: "prioridade", label: "Prioridade no fallback", tipo: "text", placeholder: "40" },
      { key: "usar_para_texto", label: "Usar para geração de texto", tipo: "boolean" },
      { key: "usar_para_imagem", label: "Usar para geração de imagem", tipo: "boolean" },
    ],
  },
  {
    tipo: "mistral",
    label: "Mistral La Plateforme",
    categoria: "ia",
    plano: "freemium",
    plano_detalhe: "Tier experimental grátis (1 req/s, 500k tokens/min).",
    descricao: "Modelos Mistral Large, Small, Codestral.",
    docs: "https://console.mistral.ai/api-keys",
    testavel: true,
    credenciais: [{ key: "api_key", label: "API Key", tipo: "password", obrigatorio: true }],
    config: [
      { key: "modelo_default", label: "Modelo padrão", tipo: "text", placeholder: "mistral-small-latest" },
      { key: "prioridade", label: "Prioridade no fallback", tipo: "text", placeholder: "35" },
      { key: "usar_para_texto", label: "Usar para geração de texto", tipo: "boolean" },
    ],
  },
  {
    tipo: "cohere",
    label: "Cohere",
    categoria: "ia",
    plano: "freemium",
    plano_detalhe: "Trial gratuito: 1.000 chamadas/mês em Chat/Embed/Rerank.",
    descricao: "Command R+, embeddings e rerank.",
    docs: "https://dashboard.cohere.com/api-keys",
    credenciais: [{ key: "api_key", label: "API Key", tipo: "password", obrigatorio: true }],
    config: [
      { key: "modelo_default", label: "Modelo padrão", tipo: "text", placeholder: "command-r-plus" },
      { key: "prioridade", label: "Prioridade no fallback", tipo: "text", placeholder: "45" },
      { key: "usar_para_texto", label: "Usar para geração de texto", tipo: "boolean" },
    ],
  },
  {
    tipo: "huggingface",
    label: "Hugging Face Inference",
    categoria: "ia",
    plano: "freemium",
    plano_detalhe: "Camada Serverless grátis com rate limits; muitos modelos abertos.",
    descricao: "API de inferência para milhares de modelos open-source.",
    docs: "https://huggingface.co/settings/tokens",
    testavel: true,
    credenciais: [{ key: "api_key", label: "Access Token", tipo: "password", obrigatorio: true, placeholder: "hf_..." }],
    config: [
      { key: "modelo_default", label: "Modelo padrão", tipo: "text", placeholder: "meta-llama/Llama-3.1-8B-Instruct" },
      { key: "prioridade", label: "Prioridade no fallback", tipo: "text", placeholder: "50" },
      { key: "usar_para_texto", label: "Usar para geração de texto", tipo: "boolean" },
      { key: "usar_para_imagem", label: "Usar para geração de imagem", tipo: "boolean" },
    ],
  },
  {
    tipo: "cloudflare_ai",
    label: "Cloudflare Workers AI",
    categoria: "ia",
    plano: "freemium",
    plano_detalhe: "10.000 neurons/dia grátis (suficiente para milhares de chats leves).",
    descricao: "LLMs open-source rodando na edge Cloudflare.",
    docs: "https://developers.cloudflare.com/workers-ai/",
    credenciais: [
      { key: "account_id", label: "Account ID", tipo: "text", obrigatorio: true },
      { key: "api_key", label: "API Token", tipo: "password", obrigatorio: true },
    ],
    config: [
      { key: "modelo_default", label: "Modelo padrão", tipo: "text", placeholder: "@cf/meta/llama-3.1-8b-instruct" },
      { key: "prioridade", label: "Prioridade no fallback", tipo: "text", placeholder: "55" },
      { key: "usar_para_texto", label: "Usar para geração de texto", tipo: "boolean" },
    ],
  },
  {
    tipo: "ollama",
    label: "Ollama (self-host local)",
    categoria: "ia",
    plano: "gratis",
    plano_detalhe: "100% grátis. Roda modelos localmente na sua máquina/servidor.",
    descricao: "LLMs locais (Llama, Mistral, Qwen, etc). Só precisa de URL do servidor.",
    docs: "https://ollama.com",
    credenciais: [
      { key: "base_url", label: "URL do Ollama", tipo: "url", obrigatorio: true, placeholder: "http://localhost:11434" },
    ],
    config: [
      { key: "modelo_default", label: "Modelo padrão", tipo: "text", placeholder: "llama3.1" },
      { key: "prioridade", label: "Prioridade no fallback", tipo: "text", placeholder: "60" },
      { key: "usar_para_texto", label: "Usar para geração de texto", tipo: "boolean" },
    ],
  },
  {
    tipo: "openai",
    label: "OpenAI (GPT-4/5, DALL·E)",
    categoria: "ia",
    plano: "pago",
    plano_detalhe: "Pré-pago por uso. Sem tier gratuito recorrente.",
    descricao: "OpenAI. Suporta texto e imagem.",
    docs: "https://platform.openai.com/api-keys",
    testavel: true,
    credenciais: [{ key: "api_key", label: "API Key", tipo: "password", obrigatorio: true, placeholder: "sk-..." }],
    config: [
      { key: "modelo_default", label: "Modelo de texto padrão", tipo: "text", placeholder: "gpt-4o-mini" },
      { key: "modelo_imagem", label: "Modelo de imagem", tipo: "text", placeholder: "gpt-image-1" },
      { key: "organization", label: "Organization ID (opcional)", tipo: "text" },
      { key: "prioridade", label: "Prioridade no fallback", tipo: "text", placeholder: "20" },
      { key: "usar_para_texto", label: "Usar para geração de texto", tipo: "boolean" },
      { key: "usar_para_imagem", label: "Usar para geração de imagem", tipo: "boolean" },
    ],
  },
  {
    tipo: "claude",
    label: "Anthropic Claude",
    categoria: "ia",
    plano: "pago",
    plano_detalhe: "Pré-pago por uso; sem tier gratuito recorrente na API.",
    descricao: "Modelos Claude 3.5/4 (apenas texto).",
    docs: "https://console.anthropic.com/settings/keys",
    testavel: true,
    credenciais: [{ key: "api_key", label: "API Key", tipo: "password", obrigatorio: true, placeholder: "sk-ant-..." }],
    config: [
      { key: "modelo_default", label: "Modelo padrão", tipo: "text", placeholder: "claude-3-5-sonnet-latest" },
      { key: "prioridade", label: "Prioridade no fallback", tipo: "text", placeholder: "30" },
      { key: "usar_para_texto", label: "Usar para geração de texto", tipo: "boolean" },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // IA — IMAGEM
  // ═══════════════════════════════════════════════════════
  {
    tipo: "pollinations",
    label: "Pollinations.ai",
    categoria: "ia_imagem",
    plano: "gratis",
    plano_detalhe: "100% grátis, sem chave. Imagens ilimitadas via URL.",
    descricao: "Geração de imagens totalmente gratuita e sem autenticação.",
    docs: "https://pollinations.ai",
    credenciais: [],
    config: [
      { key: "modelo_default", label: "Modelo", tipo: "text", placeholder: "flux" },
      { key: "prioridade", label: "Prioridade no fallback", tipo: "text", placeholder: "5" },
      { key: "usar_para_imagem", label: "Usar para geração de imagem", tipo: "boolean" },
    ],
  },
  {
    tipo: "together_ai",
    label: "Together AI",
    categoria: "ia_imagem",
    plano: "freemium",
    plano_detalhe: "US$1 grátis + modelo FLUX.1 [schnell] grátis para sempre.",
    descricao: "FLUX schnell grátis. Também tem LLMs.",
    docs: "https://api.together.ai/settings/api-keys",
    credenciais: [{ key: "api_key", label: "API Key", tipo: "password", obrigatorio: true }],
    config: [
      { key: "modelo_imagem", label: "Modelo de imagem", tipo: "text", placeholder: "black-forest-labs/FLUX.1-schnell-Free" },
      { key: "modelo_default", label: "Modelo de texto", tipo: "text" },
      { key: "prioridade", label: "Prioridade no fallback", tipo: "text", placeholder: "12" },
      { key: "usar_para_texto", label: "Usar para geração de texto", tipo: "boolean" },
      { key: "usar_para_imagem", label: "Usar para geração de imagem", tipo: "boolean" },
    ],
  },
  {
    tipo: "stability",
    label: "Stability AI",
    categoria: "ia_imagem",
    plano: "freemium",
    plano_detalhe: "25 créditos grátis mensais recorrentes.",
    descricao: "Stable Diffusion 3/SDXL via API oficial.",
    docs: "https://platform.stability.ai/account/keys",
    credenciais: [{ key: "api_key", label: "API Key", tipo: "password", obrigatorio: true, placeholder: "sk-..." }],
    config: [
      { key: "modelo_imagem", label: "Modelo", tipo: "text", placeholder: "stable-diffusion-3-medium" },
      { key: "prioridade", label: "Prioridade no fallback", tipo: "text", placeholder: "42" },
      { key: "usar_para_imagem", label: "Usar para geração de imagem", tipo: "boolean" },
    ],
  },
  {
    tipo: "replicate",
    label: "Replicate",
    categoria: "ia_imagem",
    plano: "pago",
    plano_detalhe: "Pré-pago por segundo de GPU (sem tier grátis recorrente).",
    descricao: "Milhares de modelos open (FLUX, SDXL, upscalers, etc).",
    docs: "https://replicate.com/account/api-tokens",
    credenciais: [{ key: "api_key", label: "API Token", tipo: "password", obrigatorio: true, placeholder: "r8_..." }],
    config: [
      { key: "modelo_imagem", label: "Modelo", tipo: "text", placeholder: "black-forest-labs/flux-schnell" },
      { key: "prioridade", label: "Prioridade no fallback", tipo: "text", placeholder: "48" },
      { key: "usar_para_imagem", label: "Usar para geração de imagem", tipo: "boolean" },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // GOOGLE
  // ═══════════════════════════════════════════════════════
  {
    tipo: "google_maps",
    label: "Google Maps Platform",
    categoria: "google",
    plano: "freemium",
    plano_detalhe: "US$200/mês grátis recorrentes (~28k geocoding ou 100k Static Maps).",
    descricao: "Geocoding, Places, Static Maps.",
    docs: "https://console.cloud.google.com/apis/credentials",
    credenciais: [{ key: "api_key", label: "API Key", tipo: "password", obrigatorio: true }],
  },
  {
    tipo: "google_calendar",
    label: "Google Calendar",
    categoria: "google",
    plano: "gratis",
    plano_detalhe: "API 100% gratuita (1M req/dia).",
    descricao: "Sincronização de agenda via Service Account ou OAuth.",
    docs: "https://developers.google.com/calendar",
    credenciais: [
      { key: "client_email", label: "Service Account email", tipo: "text" },
      { key: "private_key", label: "Private Key", tipo: "textarea" },
      { key: "calendar_id", label: "Calendar ID", tipo: "text", placeholder: "primary" },
    ],
  },
  {
    tipo: "google_sheets",
    label: "Google Sheets",
    categoria: "google",
    plano: "gratis",
    plano_detalhe: "API gratuita (limites de rate generosos).",
    descricao: "Leitura e escrita em planilhas via Service Account.",
    docs: "https://developers.google.com/sheets/api",
    credenciais: [
      { key: "client_email", label: "Service Account email", tipo: "text", obrigatorio: true },
      { key: "private_key", label: "Private Key", tipo: "textarea", obrigatorio: true },
    ],
    config: [{ key: "sheet_id_padrao", label: "Sheet ID padrão", tipo: "text" }],
  },
  {
    tipo: "google_business",
    label: "Google Business Profile",
    categoria: "google",
    plano: "gratis",
    plano_detalhe: "API gratuita para perfis próprios.",
    descricao: "Gerenciamento de perfis de empresa no Google.",
    docs: "https://developers.google.com/my-business",
    credenciais: [
      { key: "client_id", label: "Client ID", tipo: "text" },
      { key: "client_secret", label: "Client Secret", tipo: "password" },
      { key: "refresh_token", label: "Refresh Token", tipo: "password" },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // AUTOMAÇÃO
  // ═══════════════════════════════════════════════════════
  {
    tipo: "n8n",
    label: "n8n (self-hosted)",
    categoria: "automacao",
    plano: "gratis",
    plano_detalhe: "Open-source, ilimitado quando self-hosted.",
    descricao: "Endpoint de workflows n8n. Self-host grátis.",
    credenciais: [
      { key: "base_url", label: "URL base", tipo: "url", obrigatorio: true, placeholder: "https://n8n.exemplo.com" },
      { key: "api_key", label: "API Key (X-N8N-API-KEY)", tipo: "password" },
    ],
    config: [{ key: "webhook_padrao", label: "Webhook padrão", tipo: "url" }],
  },
  {
    tipo: "make",
    label: "Make (Integromat)",
    categoria: "automacao",
    plano: "freemium",
    plano_detalhe: "1.000 operações/mês grátis.",
    descricao: "Cenários Make disparados por webhook.",
    credenciais: [
      { key: "webhook_url", label: "Webhook URL", tipo: "url", obrigatorio: true },
      { key: "api_token", label: "API Token (opcional)", tipo: "password" },
    ],
  },
  {
    tipo: "zapier",
    label: "Zapier",
    categoria: "automacao",
    plano: "freemium",
    plano_detalhe: "100 tarefas/mês grátis; Zaps simples de 2 passos.",
    descricao: "Webhook de disparo para Zaps.",
    credenciais: [{ key: "webhook_url", label: "Webhook URL", tipo: "url", obrigatorio: true }],
  },
  {
    tipo: "pipedream",
    label: "Pipedream",
    categoria: "automacao",
    plano: "freemium",
    plano_detalhe: "10.000 invocações/mês grátis + 3 workflows.",
    descricao: "Workflows serverless via webhook.",
    credenciais: [{ key: "webhook_url", label: "Webhook URL", tipo: "url", obrigatorio: true }],
  },
  {
    tipo: "webhook_generico",
    label: "Webhook genérico",
    categoria: "automacao",
    plano: "gratis",
    plano_detalhe: "Depende do destino; a integração em si é gratuita.",
    descricao: "POST HTTP para qualquer URL (teste com webhook.site, requestbin).",
    testavel: true,
    credenciais: [
      { key: "url", label: "URL", tipo: "url", obrigatorio: true },
      { key: "header_auth", label: "Header Authorization (opcional)", tipo: "password" },
    ],
  },
  {
    tipo: "mcp_server",
    label: "MCP Server",
    categoria: "automacao",
    plano: "gratis",
    plano_detalhe: "Protocolo aberto; custo apenas do servidor.",
    descricao: "Servidor Model Context Protocol para ferramentas de IA.",
    credenciais: [
      { key: "url", label: "URL do MCP", tipo: "url", obrigatorio: true },
      { key: "token", label: "Token de autenticação", tipo: "password" },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // PUSH / NOTIFICAÇÕES
  // ═══════════════════════════════════════════════════════
  {
    tipo: "web_push_vapid",
    label: "Web Push (VAPID)",
    categoria: "push",
    plano: "gratis",
    plano_detalhe: "Padrão W3C, 100% grátis. Chaves VAPID geradas localmente.",
    descricao: "Push nativo do navegador (PWA), sem intermediários.",
    credenciais: [
      { key: "vapid_public", label: "VAPID Public Key", tipo: "text", obrigatorio: true },
      { key: "vapid_private", label: "VAPID Private Key", tipo: "password", obrigatorio: true },
      { key: "subject", label: "Subject (mailto:)", tipo: "text", placeholder: "mailto:you@site.com" },
    ],
  },
  {
    tipo: "ntfy",
    label: "ntfy.sh",
    categoria: "push",
    plano: "gratis",
    plano_detalhe: "Servidor público grátis ou self-host.",
    descricao: "Push simples via HTTP para celular (app ntfy) sem cadastro.",
    docs: "https://ntfy.sh",
    testavel: true,
    credenciais: [
      { key: "server", label: "Servidor", tipo: "url", placeholder: "https://ntfy.sh" },
      { key: "topic", label: "Tópico", tipo: "text", obrigatorio: true },
      { key: "token", label: "Token (opcional)", tipo: "password" },
    ],
  },
  {
    tipo: "onesignal",
    label: "OneSignal",
    categoria: "push",
    plano: "freemium",
    plano_detalhe: "Grátis para até 10.000 assinantes web/mobile.",
    descricao: "Push web e mobile multicanal.",
    docs: "https://dashboard.onesignal.com",
    credenciais: [
      { key: "app_id", label: "App ID", tipo: "text", obrigatorio: true },
      { key: "api_key", label: "REST API Key", tipo: "password", obrigatorio: true },
    ],
  },
  {
    tipo: "firebase_fcm",
    label: "Firebase Cloud Messaging",
    categoria: "push",
    plano: "gratis",
    plano_detalhe: "Push ilimitado e gratuito pelo Google.",
    descricao: "FCM v1 via Service Account.",
    docs: "https://firebase.google.com/docs/cloud-messaging",
    credenciais: [
      { key: "project_id", label: "Project ID", tipo: "text", obrigatorio: true },
      { key: "client_email", label: "Service Account email", tipo: "text", obrigatorio: true },
      { key: "private_key", label: "Private Key", tipo: "textarea", obrigatorio: true },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // SMS / VOZ
  // ═══════════════════════════════════════════════════════
  {
    tipo: "textbelt",
    label: "TextBelt",
    categoria: "sms",
    plano: "freemium",
    plano_detalhe: "1 SMS grátis por dia por IP (chave 'textbelt').",
    descricao: "SMS internacional simples via HTTP.",
    docs: "https://textbelt.com",
    testavel: true,
    credenciais: [{ key: "api_key", label: "API Key", tipo: "password", placeholder: "textbelt" }],
  },
  {
    tipo: "twilio",
    label: "Twilio (SMS/Voz/WhatsApp)",
    categoria: "sms",
    plano: "pago",
    plano_detalhe: "Trial com US$15 de crédito; depois pré-pago.",
    descricao: "SMS, voz e WhatsApp Business via Twilio.",
    docs: "https://console.twilio.com",
    credenciais: [
      { key: "account_sid", label: "Account SID", tipo: "text", obrigatorio: true },
      { key: "auth_token", label: "Auth Token", tipo: "password", obrigatorio: true },
      { key: "from", label: "Número de origem", tipo: "text", placeholder: "+15551234567" },
    ],
  },
  {
    tipo: "vonage",
    label: "Vonage (Nexmo)",
    categoria: "sms",
    plano: "freemium",
    plano_detalhe: "€2 grátis no cadastro.",
    descricao: "SMS/voz global.",
    docs: "https://dashboard.nexmo.com",
    credenciais: [
      { key: "api_key", label: "API Key", tipo: "text", obrigatorio: true },
      { key: "api_secret", label: "API Secret", tipo: "password", obrigatorio: true },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // STORAGE / MÍDIA
  // ═══════════════════════════════════════════════════════
  {
    tipo: "cloudinary",
    label: "Cloudinary",
    categoria: "storage",
    plano: "freemium",
    plano_detalhe: "25 créditos/mês (~25GB storage + 25GB bandwidth).",
    descricao: "Upload, transformação e CDN de imagens/vídeos.",
    docs: "https://console.cloudinary.com/settings/api-keys",
    credenciais: [
      { key: "cloud_name", label: "Cloud name", tipo: "text", obrigatorio: true },
      { key: "api_key", label: "API Key", tipo: "text", obrigatorio: true },
      { key: "api_secret", label: "API Secret", tipo: "password", obrigatorio: true },
    ],
  },
  {
    tipo: "imgbb",
    label: "ImgBB",
    categoria: "storage",
    plano: "gratis",
    plano_detalhe: "Upload de imagens ilimitado e grátis.",
    descricao: "Hospedagem simples de imagens via API.",
    docs: "https://api.imgbb.com",
    credenciais: [{ key: "api_key", label: "API Key", tipo: "password", obrigatorio: true }],
  },
  {
    tipo: "uploadcare",
    label: "Uploadcare",
    categoria: "storage",
    plano: "freemium",
    plano_detalhe: "3.000 uploads/mês + 3GB storage grátis.",
    descricao: "Upload + CDN + transformação de imagens.",
    docs: "https://uploadcare.com",
    credenciais: [
      { key: "public_key", label: "Public Key", tipo: "text", obrigatorio: true },
      { key: "secret_key", label: "Secret Key", tipo: "password" },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════════
  {
    tipo: "umami",
    label: "Umami (self-host)",
    categoria: "analytics",
    plano: "gratis",
    plano_detalhe: "Open-source; grátis quando self-hosted.",
    descricao: "Alternativa privacy-first ao Google Analytics.",
    docs: "https://umami.is",
    credenciais: [
      { key: "base_url", label: "URL", tipo: "url", obrigatorio: true },
      { key: "website_id", label: "Website ID", tipo: "text", obrigatorio: true },
    ],
  },
  {
    tipo: "posthog",
    label: "PostHog",
    categoria: "analytics",
    plano: "freemium",
    plano_detalhe: "1M eventos/mês grátis + session replay + feature flags.",
    descricao: "Product analytics completo com camada gratuita generosa.",
    docs: "https://posthog.com",
    credenciais: [
      { key: "api_host", label: "Host", tipo: "url", placeholder: "https://us.i.posthog.com" },
      { key: "api_key", label: "Project API Key", tipo: "password", obrigatorio: true },
    ],
  },
  {
    tipo: "google_analytics",
    label: "Google Analytics 4",
    categoria: "analytics",
    plano: "gratis",
    plano_detalhe: "GA4 é grátis para até 10M eventos/mês por propriedade.",
    descricao: "Measurement Protocol e Data API do GA4.",
    docs: "https://developers.google.com/analytics",
    credenciais: [
      { key: "measurement_id", label: "Measurement ID", tipo: "text", placeholder: "G-XXXXXXX" },
      { key: "api_secret", label: "API Secret", tipo: "password" },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // PAGAMENTO
  // ═══════════════════════════════════════════════════════
  {
    tipo: "mercadopago",
    label: "Mercado Pago",
    categoria: "pagamento",
    plano: "gratis",
    plano_detalhe: "API sem mensalidade; cobra apenas taxa por transação aprovada.",
    descricao: "Pix, boleto, cartão para o Brasil.",
    docs: "https://www.mercadopago.com.br/developers/panel/app",
    credenciais: [
      { key: "access_token", label: "Access Token", tipo: "password", obrigatorio: true, placeholder: "APP_USR-..." },
      { key: "public_key", label: "Public Key", tipo: "text" },
    ],
  },
  {
    tipo: "asaas",
    label: "Asaas",
    categoria: "pagamento",
    plano: "gratis",
    plano_detalhe: "Sem mensalidade; taxa por transação. Pix grátis até certos limites.",
    descricao: "Cobranças Pix/boleto/cartão para o Brasil.",
    docs: "https://docs.asaas.com",
    credenciais: [{ key: "api_key", label: "API Key", tipo: "password", obrigatorio: true }],
  },
  {
    tipo: "stripe",
    label: "Stripe",
    categoria: "pagamento",
    plano: "gratis",
    plano_detalhe: "Sem mensalidade; cobra apenas por transação.",
    descricao: "Pagamentos internacionais com cartão.",
    docs: "https://dashboard.stripe.com/apikeys",
    credenciais: [
      { key: "secret_key", label: "Secret Key", tipo: "password", obrigatorio: true, placeholder: "sk_..." },
      { key: "publishable_key", label: "Publishable Key", tipo: "text" },
      { key: "webhook_secret", label: "Webhook Secret", tipo: "password" },
    ],
  },
];

export function findDef(tipo: string): IntegracaoDef | undefined {
  return CATALOGO.find((c) => c.tipo === tipo);
}

export const PLANO_META: Record<PlanoTipo, { label: string; className: string }> = {
  gratis: { label: "Grátis", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  freemium: { label: "Freemium", className: "bg-sky-500/15 text-sky-600 border-sky-500/30" },
  pago: { label: "Pago", className: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
};

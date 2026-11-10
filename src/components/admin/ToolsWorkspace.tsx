import { useState } from "react";
import {
  Check,
  Code2,
  Copy,
  ExternalLink,
  RefreshCw,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";

// Utilitários rápidos (JSON, UUID, URL), processados no navegador.

export function ToolsWorkspace() {
  const [jsonInput, setJsonInput] = useState("");
  const [jsonOutput, setJsonOutput] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [uuid, setUuid] = useState(() => crypto.randomUUID());
  const [urlInput, setUrlInput] = useState("");
  const [urlOutput, setUrlOutput] = useState("");
  const [urlMode, setUrlMode] = useState<"encode" | "decode">("encode");
  const [copied, setCopied] = useState("");

  async function copyValue(value: string, label: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1600);
  }

  function formatJson(compact = false) {
    setJsonError("");
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed, null, compact ? 0 : 2));
    } catch {
      setJsonOutput("");
      setJsonError("JSON inválido. Verifique aspas, vírgulas e chaves.");
    }
  }

  function transformUrl() {
    try {
      setUrlOutput(urlMode === "encode" ? encodeURIComponent(urlInput) : decodeURIComponent(urlInput));
    } catch {
      setUrlOutput("Não foi possível processar o valor informado.");
    }
  }

  const ToolHeader = ({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) => (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-blue-50 p-2 text-blue-700"><Icon className="h-4 w-4" /></div>
      <div><h3 className="font-semibold text-slate-950">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>
    </div>
  );

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Ferramentas</h2>
        <p className="mt-1 text-sm text-slate-500">Utilitários rápidos para desenvolvimento, operação e suporte do ecossistema AMT.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <ToolHeader icon={Code2} title="Formatador de JSON" description="Valide, organize ou compacte objetos JSON antes de usar em APIs, configurações ou registros." />
          <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder='{"exemplo": true}' className="mt-5 min-h-40 w-full rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-950 outline-none focus:border-blue-500" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => formatJson(false)} className="bg-black text-white hover:bg-slate-900">Formatar</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => formatJson(true)}>Compactar</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setJsonInput(""); setJsonOutput(""); setJsonError(""); }}>Limpar</Button>
          </div>
          {jsonError && <p className="mt-3 text-xs font-medium text-red-600">{jsonError}</p>}
          {jsonOutput && <div className="mt-4"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-medium text-slate-500">Resultado</span><button type="button" onClick={() => void copyValue(jsonOutput, "json")} className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">{copied === "json" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied === "json" ? "Copiado" : "Copiar"}</button></div><pre className="max-h-56 overflow-auto rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-800">{jsonOutput}</pre></div>}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <ToolHeader icon={RefreshCw} title="Gerador de UUID" description="Gere identificadores UUID v4 para testes, registros técnicos e operações administrativas." />
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-sm break-all text-slate-950">{uuid}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => setUuid(crypto.randomUUID())} className="bg-black text-white hover:bg-slate-900">Novo UUID</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => void copyValue(uuid, "uuid")} className="gap-1.5"><Copy className="h-3.5 w-3.5" />{copied === "uuid" ? "Copiado" : "Copiar"}</Button>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <ToolHeader icon={ExternalLink} title="Codificador de URL" description="Converta parâmetros e valores para uso seguro em URLs ou decodifique valores já existentes." />
          <textarea value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="texto ou parâmetro de URL" className="mt-5 min-h-28 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-950 outline-none focus:border-blue-500" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select value={urlMode} onChange={(e) => setUrlMode(e.target.value as "encode" | "decode")} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950"><option value="encode">Codificar</option><option value="decode">Decodificar</option></select>
            <Button type="button" size="sm" onClick={transformUrl} className="bg-black text-white hover:bg-slate-900">Processar</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setUrlInput(""); setUrlOutput(""); }}>Limpar</Button>
          </div>
          {urlOutput && <div className="mt-4"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-medium text-slate-500">Resultado</span><button type="button" onClick={() => void copyValue(urlOutput, "url")} className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">{copied === "url" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied === "url" ? "Copiado" : "Copiar"}</button></div><div className="max-h-40 overflow-auto rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-800">{urlOutput}</div></div>}
        </article>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3"><Wrench className="mt-0.5 h-4 w-4 text-blue-700" /><div><h3 className="text-sm font-semibold text-slate-950">Uso seguro</h3><p className="mt-1 text-xs leading-5 text-slate-500">Estas ferramentas executam processamento local no navegador. Elas não alteram dados do ecossistema por conta própria.</p></div></div>
      </div>
    </section>
  );
}

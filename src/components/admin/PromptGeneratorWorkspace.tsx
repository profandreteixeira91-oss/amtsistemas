import { useEffect, useMemo, useState } from "react";
import { Clipboard, ExternalLink, FileCode2, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

type Project = {
  id: string;
  name: string;
  description: string | null;
  repository: string | null;
  branch: string | null;
  production_url: string | null;
  stack: string | null;
  status: string;
};

type Issue = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  module: string | null;
  priority: string;
  status: string;
};

type Change = {
  id: string;
  project_id: string;
  summary: string;
  commit_sha: string | null;
  files: string[];
  created_at: string;
};

type PageOption = {
  label: string;
  path: string;
};

const fallbackPages: Record<string, PageOption[]> = {
  "AB Academy": [
    { label: "Página inicial", path: "/" },
    { label: "Matrícula", path: "/matricula" },
    { label: "Checkout", path: "/checkout/:pagamentoId" },
    { label: "Portal do aluno", path: "/aluno" },
    { label: "Central de prática", path: "/aluno/central" },
    { label: "Sala de aula", path: "/professor/aula/:id" },
    { label: "Administração", path: "/admin" },
  ],
};

function routeFromPageFile(path: string) {
  const normalized = path.replace(/^src\/pages\//, "").replace(/\.(tsx|ts|jsx|js)$/, "");
  if (!normalized || normalized.toLowerCase() === "index") return "/";
  const clean = normalized.replace(/\/index$/, "");
  const segments = clean.split("/");
  return "/" + segments.map((segment) => {
    if (/^\[[^\]]+\]$/.test(segment)) return ":" + segment.slice(1, -1);
    return segment.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }).join("/");
}

export function PromptGeneratorWorkspace({
  projects,
  issues,
  changes,
}: {
  projects: Project[];
  issues: Issue[];
  changes: Change[];
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [page, setPage] = useState("");
  const [customPage, setCustomPage] = useState("");
  const [description, setDescription] = useState("");
  const [pages, setPages] = useState<PageOption[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [message, setMessage] = useState("");

  const project = projects.find((item) => item.id === projectId);
  const projectIssues = useMemo(
    () => issues.filter((item) => item.project_id === projectId && !["corrigido", "validado"].includes(item.status)).slice(0, 8),
    [issues, projectId],
  );
  const projectChanges = useMemo(
    () => changes.filter((item) => item.project_id === projectId).slice(0, 8),
    [changes, projectId],
  );

  useEffect(() => {
    if (!project) return;
    setPage("");
    setCustomPage("");
    setPrompt("");
    setMessage("");

    const fallback = fallbackPages[project.name] || [];
    setPages(fallback);

    if (!project.repository?.includes("/")) return;

    let cancelled = false;
    setLoadingPages(true);

    fetch(`https://api.github.com/repos/${project.repository}/git/trees/${project.branch || "main"}?recursive=1`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Não foi possível ler a estrutura do GitHub.");
        return response.json() as Promise<{ tree?: Array<{ path: string; type: string }> }>;
      })
      .then((data) => {
        if (cancelled) return;
        const discovered = (data.tree || [])
          .filter((item) => item.type === "blob" && /^src\/pages\/.*\.(tsx|ts|jsx|js)$/.test(item.path))
          .map((item) => ({ label: item.path.replace(/^src\/pages\//, ""), path: routeFromPageFile(item.path) }))
          .filter((item, index, list) => list.findIndex((candidate) => candidate.path === item.path) === index)
          .sort((a, b) => a.path.localeCompare(b.path));

        setPages(discovered.length ? discovered : fallback);
      })
      .catch(() => {
        if (!cancelled) setMessage("Não foi possível descobrir as páginas pelo GitHub. Você pode informar a rota manualmente.");
      })
      .finally(() => {
        if (!cancelled) setLoadingPages(false);
      });

    return () => { cancelled = true; };
  }, [project]);

  function generatePrompt() {
    const selectedPage = customPage.trim() || page;
    if (!project) {
      setMessage("Selecione um projeto.");
      return;
    }
    if (!selectedPage) {
      setMessage("Selecione ou informe a página.");
      return;
    }
    if (!description.trim()) {
      setMessage("Descreva a mudança que precisa ser feita.");
      return;
    }

    const openIssues = projectIssues.length
      ? projectIssues.map((item) => `- [${item.priority.toUpperCase()}] ${item.title}${item.module ? ` — ${item.module}` : ""}${item.description ? `: ${item.description}` : ""}`).join("\n")
      : "- Nenhum problema relacionado registrado.";

    const recentChanges = projectChanges.length
      ? projectChanges.map((item) => `- ${item.summary} — ${item.commit_sha ? `commit ${item.commit_sha.slice(0, 7)}` : "sem commit"}`).join("\n")
      : "- Nenhuma alteração recente registrada.";

    const generated = `Você é o responsável técnico por implementar uma alteração em um sistema existente.

PROJETO
- Sistema: ${project.name}
- Stack: ${project.stack || "verifique no repositório"}
- Repositório: ${project.repository || "não informado"}
- Branch principal: ${project.branch || "não informada"}
- Produção: ${project.production_url || "não informada"}

PÁGINA / ROTA ALVO
- ${selectedPage}

MUDANÇA SOLICITADA
${description.trim()}

CONTEXTO DO PROJETO
Problemas em aberto:
${openIssues}

Últimas alterações registradas:
${recentChanges}

INSTRUÇÕES OBRIGATÓRIAS
1. Primeiro audite a implementação atual, a página alvo, os componentes utilizados, o fluxo relacionado e as dependências.
2. Não recrie o sistema, não substitua funcionalidades existentes e não use placeholders para resolver a tarefa.
3. Preserve integralmente os fluxos que já funcionam.
4. Altere somente o necessário para atender à mudança solicitada.
5. Se a alteração exigir banco de dados, autenticação, RLS, Edge Functions ou integrações, verifique a implementação existente antes de criar algo novo.
6. Reutilize componentes, estilos, tipos, hooks e serviços existentes sempre que fizer sentido.
7. Mantenha o padrão visual já estabelecido no projeto.
8. Considere desktop, tablet e mobile quando a alteração afetar interface.
9. Antes de concluir, revise possíveis regressões nas áreas relacionadas.
10. Implemente a solução completa, não apenas a interface visual.
11. Informe exatamente quais arquivos foram alterados e por quê.
12. Gere um resumo final objetivo com: alterações realizadas, banco/integrações afetados, riscos e validações executadas.
13. Se estiver trabalhando em um repositório GitHub, registre a alteração em um commit claro e descritivo.
14. Não faça mudanças fora do escopo solicitado sem explicar antes.

RESULTADO ESPERADO
Entregar a alteração funcionando no projeto existente, preservando o que já está implementado e sem introduzir regressões.

Comece pela auditoria do código existente e, em seguida, implemente a mudança solicitada.`;

    setPrompt(generated);
    setMessage("Prompt gerado com contexto do projeto e da página.");
  }

  async function copyPrompt() {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setMessage("Prompt copiado. O ChatGPT será aberto em uma nova aba.");
    window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer");
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-blue-600">Automação de desenvolvimento</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">Gerador de Prompt</h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Transforme uma solicitação curta em um prompt técnico, assertivo e contextualizado para o ChatGPT.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="h-4 w-4 text-blue-600" />
            Contexto do projeto incluído automaticamente
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-900">Projeto</span>
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950"
            >
              <option value="">Selecione o projeto</option>
              {projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-900">Página / rota</span>
            <select
              value={page}
              onChange={(event) => { setPage(event.target.value); setCustomPage(""); }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950"
            >
              <option value="">{loadingPages ? "Lendo páginas do projeto..." : "Selecione a página"}</option>
              {pages.map((item) => <option key={item.path} value={item.path}>{item.label} — {item.path}</option>)}
              <option value="__custom">Outra página / rota</option>
            </select>
          </label>
        </div>

        {(page === "__custom" || !pages.length) && (
          <label className="mt-4 block space-y-2">
            <span className="text-sm font-medium text-slate-900">Rota ou página</span>
            <input
              value={customPage}
              onChange={(event) => setCustomPage(event.target.value)}
              placeholder="/minha-rota"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950"
            />
          </label>
        )}

        <label className="mt-4 block space-y-2">
          <span className="text-sm font-medium text-slate-900">Descreva a mudança</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ex.: Na página de matrícula, permitir cartão de terceiros e exigir os dados do titular quando essa opção for selecionada."
            className="min-h-36 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none focus:border-blue-500"
          />
        </label>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            O prompt preserva o princípio: auditar primeiro, alterar somente o necessário e não quebrar o que já funciona.
          </p>
          <Button type="button" onClick={generatePrompt} className="bg-black text-white hover:bg-slate-900">
            <Sparkles className="mr-2 h-4 w-4" /> Gerar prompt
          </Button>
        </div>
      </div>

      {message && <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">{message}</div>}

      {prompt && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-semibold text-slate-950">Prompt pronto para o ChatGPT</h3>
              <p className="mt-1 text-xs text-slate-500">O texto abaixo já contém o projeto, a página, a solicitação e as regras de implementação.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => void navigator.clipboard.writeText(prompt).then(() => setMessage("Prompt copiado para a área de transferência."))} className="bg-white text-slate-900 hover:bg-slate-100">
                <Clipboard className="mr-2 h-4 w-4" /> Copiar prompt
              </Button>
              <Button type="button" onClick={() => void copyPrompt()} className="bg-black text-white hover:bg-slate-900">
                <ExternalLink className="mr-2 h-4 w-4" /> Copiar e abrir ChatGPT
              </Button>
            </div>
          </div>
          <div className="relative mt-4">
            <FileCode2 className="absolute right-4 top-4 h-4 w-4 text-slate-400" />
            <textarea readOnly value={prompt} className="min-h-[560px] w-full rounded-xl border border-slate-200 bg-slate-50 p-5 pr-12 font-mono text-xs leading-5 text-slate-800 outline-none" />
          </div>
        </section>
      )}
    </section>
  );
}

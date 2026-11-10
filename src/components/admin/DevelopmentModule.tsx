import { useEffect, useState } from "react";
import {
  Sparkles as SparklesIcon,
} from "lucide-react";

import { DevelopmentWorkspace } from "@/components/admin/DevelopmentWorkspace";
import { PromptGeneratorWorkspace } from "@/components/admin/PromptGeneratorWorkspace";
import { DevelopmentAgentWorkspace } from "@/components/admin/DevelopmentAgentWorkspace";
import { amtSupabase } from "@/integrations/amt-supabase/client";

// Desenvolvimento: central, gerador de prompt e agente GPT/Codex.

export function DevelopmentModuleWorkspace() {
  const [view, setView] = useState<"central" | "prompt" | "agent">("central");
  const [projects, setProjects] = useState<Array<{
    id: string;
    name: string;
    description: string | null;
    repository: string | null;
    branch: string | null;
    production_url: string | null;
    stack: string | null;
    status: string;
  }>>([]);
  const [issues, setIssues] = useState<Array<{
    id: string;
    project_id: string;
    title: string;
    description: string | null;
    module: string | null;
    priority: string;
    status: string;
  }>>([]);
  const [changes, setChanges] = useState<Array<{
    id: string;
    project_id: string;
    summary: string;
    commit_sha: string | null;
    files: string[];
    created_at: string;
  }>>([]);

  useEffect(() => {
    void Promise.all([
      amtSupabase.from("development_projects").select("id,name,description,repository,branch,production_url,stack,status").order("name"),
      amtSupabase.from("development_issues").select("id,project_id,title,description,module,priority,status").order("created_at", { ascending: false }),
      amtSupabase.from("development_changes").select("id,project_id,summary,commit_sha,files,created_at").order("created_at", { ascending: false }).limit(100),
    ]).then(([projectsResult, issuesResult, changesResult]) => {
      setProjects((projectsResult.data ?? []) as typeof projects);
      setIssues((issuesResult.data ?? []) as typeof issues);
      setChanges((changesResult.data ?? []) as typeof changes);
    });
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <button type="button" onClick={() => setView("central")} className={`rounded-lg px-3 py-2 text-sm font-medium ${view === "central" ? "bg-black text-white" : "text-slate-600 hover:bg-slate-100"}`}>
          Central de desenvolvimento
        </button>
        <button type="button" onClick={() => setView("prompt")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${view === "prompt" ? "bg-black text-white" : "text-slate-600 hover:bg-slate-100"}`}>
          <SparklesIcon className="h-4 w-4" />
          Gerador de prompt
        </button>
        <button type="button" onClick={() => setView("agent")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${view === "agent" ? "bg-black text-white" : "text-slate-600 hover:bg-slate-100"}`}>
          <SparklesIcon className="h-4 w-4" />
          Agente GPT/Codex
        </button>
      </div>
      {view === "central" ? <DevelopmentWorkspace /> : view === "prompt" ? <PromptGeneratorWorkspace projects={projects} issues={issues} changes={changes} /> : <DevelopmentAgentWorkspace projects={projects} issues={issues} changes={changes} />}
    </section>
  );
}

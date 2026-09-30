import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Bot, CheckCircle2, FileCode2, GitBranch, Loader2, Search, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { amtSupabase } from "@/integrations/amt-supabase/client";

type Project = { id:string; name:string; description:string|null; repository:string|null; branch:string|null; production_url:string|null; stack:string|null; status:string };
type Issue = { id:string; project_id:string; title:string; description:string|null; module:string|null; priority:string; status:string };
type Change = { id:string; project_id:string; summary:string; commit_sha:string|null; files:string[]; created_at:string };
type AgentAnalysis = {
  summary?:string; findings?:string[]; files?:Array<{path:string;reason:string;confidence:string}>;
  plan?:string[]; risks?:string[]; validation?:string[]; needs_database?:boolean; needs_auth?:boolean; needs_cloudflare?:boolean;
};
type Proposal = {
  summary?:string;
  files?:Array<{path:string;content:string;summary:string}>;
  risks?:string[];
  validation?:string[];
};

export function DevelopmentAgentWorkspace({ projects, issues, changes }: { projects:Project[]; issues:Issue[]; changes:Change[] }) {
  const [projectId,setProjectId]=useState(projects[0]?.id||"");
  const [route,setRoute]=useState("");
  const [request,setRequest]=useState("");
  const [analysis,setAnalysis]=useState<AgentAnalysis|null>(null);
  const [proposal,setProposal]=useState<Proposal|null>(null);
  const [runId,setRunId]=useState("");
  const [inspectedFiles,setInspectedFiles]=useState<string[]>([]);
  const [loading,setLoading]=useState(false);
  const [applying,setApplying]=useState(false);
  const [message,setMessage]=useState("");
  const [branch,setBranch]=useState("");

  const project=projects.find((item)=>item.id===projectId);
  const projectIssues=useMemo(()=>issues.filter((item)=>item.project_id===projectId&&!["corrigido","validado"].includes(item.status)).slice(0,8),[issues,projectId]);
  const projectChanges=useMemo(()=>changes.filter((item)=>item.project_id===projectId).slice(0,8),[changes,projectId]);

  async function invoke(action:"analyze"|"propose"|"apply", extra:Record<string,unknown>={}) {
    if(!project) { setMessage("Selecione um projeto."); return null; }
    if(!project.repository) { setMessage("O projeto selecionado ainda não possui repositório configurado."); return null; }
    if(action!=="apply" && (!route.trim()||!request.trim())) { setMessage("Informe a rota e descreva a alteração."); return null; }
    setLoading(action!=="apply");
    setApplying(action==="apply");
    setMessage("");
    const {data,error}=await amtSupabase.functions.invoke("development-agent",{body:{
      action, project, route:route.trim(), request:request.trim(), issues:projectIssues, changes:projectChanges, ...extra
    }});
    setLoading(false); setApplying(false);
    if(error){setMessage(error.message||"Não foi possível consultar o agente.");return null;}
    if(data?.error){setMessage(data.error);return null;}
    return data;
  }

  async function analyze() {
    setAnalysis(null); setProposal(null); setRunId(""); setBranch("");
    const data=await invoke("analyze");
    if(data){setAnalysis(data.analysis??null);setInspectedFiles(data.inspectedFiles??[]);setMessage("Análise concluída. Nenhuma alteração foi aplicada.");}
  }

  async function propose() {
    setProposal(null); setRunId("");
    const data=await invoke("propose");
    if(data){setProposal(data.proposal??null);setRunId(data.runId??"");setInspectedFiles(data.inspectedFiles??[]);setMessage("Proposta gerada. Revise os arquivos antes de aplicar.");}
  }

  async function applyProposal() {
    if(!runId){setMessage("Nenhuma proposta pronta para aplicação.");return;}
    const confirmed=window.confirm("Aplicar esta proposta em uma nova branch do GitHub? A branch principal não será alterada.");
    if(!confirmed)return;
    const data=await invoke("apply",{run_id:runId});
    if(data){setBranch(data.branchName||"");setMessage(`Alteração aplicada na branch ${data.branchName}. A branch principal não foi alterada.`);}
  }

  function clear(){setAnalysis(null);setProposal(null);setRunId("");setBranch("");setInspectedFiles([]);setMessage("");}

  return <section className="space-y-4">
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-blue-600">GPT / Codex</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">Agente de Desenvolvimento</h3>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">Analisa o código real, gera uma proposta e, somente após sua confirmação, aplica a proposta em uma branch separada.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600"><ShieldCheck className="h-4 w-4 text-emerald-600"/> Branch protegida · aprovação manual</div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <label className="space-y-2"><span className="text-sm font-medium text-slate-900">Projeto</span>
          <select value={projectId} onChange={(e)=>{setProjectId(e.target.value);clear();}} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950">
            <option value="">Selecione o projeto</option>{projects.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="space-y-2"><span className="text-sm font-medium text-slate-900">Página / rota</span>
          <input value={route} onChange={(e)=>setRoute(e.target.value)} placeholder="/aluno/central" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950"/>
        </label>
      </div>

      <label className="mt-4 block space-y-2"><span className="text-sm font-medium text-slate-900">O que precisa ser desenvolvido?</span>
        <textarea value={request} onChange={(e)=>setRequest(e.target.value)} placeholder="Descreva a alteração com suas palavras." className="min-h-36 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none focus:border-blue-500"/>
      </label>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400">Etapas: analisar → propor → revisar → aplicar em branch. Nenhuma alteração vai diretamente para a branch principal.</p>
        <div className="flex flex-wrap gap-2">
          {(analysis||proposal)&&<Button type="button" variant="outline" onClick={clear} className="bg-white text-slate-900 hover:bg-slate-100">Limpar</Button>}
          <Button type="button" variant="outline" onClick={()=>void analyze()} disabled={loading||applying} className="bg-white text-slate-900 hover:bg-slate-100"><Search className="mr-2 h-4 w-4"/>Analisar</Button>
          {analysis&&<Button type="button" onClick={()=>void propose()} disabled={loading||applying} className="bg-black text-white hover:bg-slate-900">{loading?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Bot className="mr-2 h-4 w-4"/>}{loading?"Gerando...":"Gerar proposta"}</Button>}
        </div>
      </div>
    </div>

    {message&&<div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">{message}</div>}

    {analysis&&<section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Bot className="h-5 w-5 text-blue-700"/><h3 className="font-semibold text-slate-950">Análise do agente</h3></div><p className="mt-3 text-sm leading-6 text-slate-700">{analysis.summary||"Sem resumo retornado."}</p></div>
      <div className="grid gap-4 lg:grid-cols-2"><AgentList title="Constatações" items={analysis.findings} icon={CheckCircle2}/><AgentList title="Plano proposto" items={analysis.plan} icon={Bot}/><AgentList title="Riscos" items={analysis.risks} icon={ShieldCheck}/><AgentList title="Validação posterior" items={analysis.validation} icon={CheckCircle2}/></div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold text-slate-950">Arquivos prováveis</h3><div className="mt-4 space-y-2">{(analysis.files||[]).map((file)=><div key={file.path} className="rounded-lg border border-slate-200 p-3"><div className="flex items-center gap-2"><FileCode2 className="h-4 w-4 text-blue-700"/><span className="font-mono text-xs font-medium text-slate-900">{file.path}</span><span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-500">{file.confidence}</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{file.reason}</p></div>)}</div></div>
    </section>}

    {proposal&&<section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-600">Proposta pronta para revisão</p><h3 className="mt-1 font-semibold text-slate-950">{proposal.summary||"Alteração proposta"}</h3></div>
          <Button type="button" onClick={()=>void applyProposal()} disabled={applying||!!branch} className="bg-black text-white hover:bg-slate-900">{applying?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<GitBranch className="mr-2 h-4 w-4"/>}{applying?"Aplicando...":branch?"Aplicada":"Aprovar e aplicar em branch"}</Button>
        </div>
        {branch&&<p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">Branch criada: {branch}</p>}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold text-slate-950">Arquivos propostos</h3><div className="mt-4 space-y-3">{(proposal.files||[]).map((file)=><details key={file.path} className="rounded-lg border border-slate-200"><summary className="cursor-pointer list-none px-4 py-3"><div className="flex items-center gap-2"><FileCode2 className="h-4 w-4 text-blue-700"/><span className="font-mono text-xs font-medium text-slate-900">{file.path}</span></div><p className="mt-1 text-xs text-slate-500">{file.summary}</p></summary><pre className="max-h-96 overflow-auto border-t border-slate-200 bg-slate-950 p-4 text-xs leading-5 text-slate-100">{file.content}</pre></details>)}</div></div>
      <div className="grid gap-4 lg:grid-cols-2"><AgentList title="Riscos da proposta" items={proposal.risks} icon={ShieldCheck}/><AgentList title="Validação recomendada" items={proposal.validation} icon={CheckCircle2}/></div>
    </section>}

    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-5"><p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Arquivos inspecionados</p><div className="mt-3 flex flex-wrap gap-2">{inspectedFiles.map((file)=><span key={file} className="rounded-md bg-slate-50 px-2.5 py-1 font-mono text-[10px] text-slate-600">{file}</span>)}</div></div>
  </section>;
}

function AgentList({title,items,icon:Icon}:{title:string;items?:string[];icon:ComponentType<{className?:string}>}) {
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-blue-700"/><h3 className="font-semibold text-slate-950">{title}</h3></div><ul className="mt-4 space-y-2">{(items||[]).length?(items||[]).map((item,index)=><li key={index} className="text-sm leading-5 text-slate-600">• {item}</li>):<li className="text-sm text-slate-400">Nenhum item retornado.</li>}</ul></div>;
}

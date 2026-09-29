import type { ComponentType } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdminSession, signOutAdmin } from "@/lib/amt-admin-auth";
import { useEffect, useState } from "react";

export function AdminModulePage({
  title,
  eyebrow,
  description,
  icon: Icon,
}: {
  title: string;
  eyebrow: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getAdminSession()
      .then((session) => {
        if (!session) navigate({ to: "/admin/login" });
        else {
          setEmail(session.user.email ?? "");
          setLoading(false);
        }
      })
      .catch(() => navigate({ to: "/admin/login" }));
  }, [navigate]);

  async function logout() {
    await signOutAdmin();
    navigate({ to: "/admin/login" });
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-400">Validando sessão...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Voltar ao dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white ring-1 ring-slate-200">
              <img src="/amt-sistemas-logo.png" alt="AMT Sistemas" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <p className="font-semibold">AMT Control Center</p>
              <p className="text-xs text-slate-500">{email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="gap-2">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-5 sm:p-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Icon className="h-6 w-6" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <p className="text-sm font-medium">Módulo preparado para integração</p>
            <p className="mt-1 text-sm text-slate-500">A interface estrutural está criada. Os dados reais serão conectados ao Supabase na próxima etapa.</p>
          </div>
          <Link to="/admin" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800">
            Voltar ao dashboard <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </main>
  );
}

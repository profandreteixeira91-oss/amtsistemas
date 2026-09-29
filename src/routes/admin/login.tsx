import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminSession, signInAdmin } from "@/lib/amt-admin-auth";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Login administrativo — AMT Sistemas" },
      { name: "description", content: "Acesso administrativo ao AMT Control Center." },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    void getAdminSession()
      .then((session) => {
        if (active && session) navigate({ to: "/admin" });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      await signInAdmin(email.trim(), password);
      toast.success("Acesso autorizado.");
      navigate({ to: "/admin" });
    } catch (error) {
      console.error(error);
      toast.error("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,.28),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(14,165,233,.16),transparent_35%)]" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-lg">
                <img src="/amt-sistemas-logo.png" alt="AMT Sistemas" className="h-10 w-10 object-contain" />
              </div>
              <div>
                <p className="font-semibold">AMT Sistemas</p>
                <p className="text-xs text-slate-400">Control Center</p>
              </div>
            </div>

            <div className="mt-28 max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Ambiente administrativo
              </span>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight xl:text-6xl">
                Um único centro para operar seus sistemas.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                Acompanhe projetos, leads, infraestrutura, segurança e atividade operacional em uma
                interface centralizada.
              </p>
            </div>
          </div>
          <p className="relative text-xs text-slate-500">AMT Sistemas e Soluções · Acesso restrito</p>
        </section>

        <section className="flex items-center justify-center bg-white px-5 py-10 text-slate-950">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                  <img src="/amt-sistemas-logo.png" alt="AMT Sistemas" className="h-9 w-9 object-contain" />
                </div>
                <div>
                  <p className="font-semibold">AMT Sistemas</p>
                  <p className="text-xs text-slate-500">Control Center</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <h2 className="text-3xl font-semibold tracking-tight">Entrar no Control Center</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Use suas credenciais administrativas para continuar.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="admin-email">E-mail</Label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@amtsistemas.com.br"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">Senha</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 pr-11"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="h-12 w-full gap-2">
                {loading ? "Autenticando..." : "Entrar"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <p className="mt-8 text-center text-xs leading-5 text-slate-400">
              O acesso administrativo utiliza autenticação do Supabase. Nenhuma chave privilegiada é
              exposta no navegador.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

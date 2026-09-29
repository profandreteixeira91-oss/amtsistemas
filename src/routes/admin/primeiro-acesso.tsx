import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FIRST_ADMIN_EMAIL, getAdminSession, setFirstAdminPassword } from "@/lib/amt-admin-auth";

export const Route = createFileRoute("/admin/primeiro-acesso")({
  head: () => ({ meta: [{ title: "Primeiro acesso — AMT Control Center" }] }),
  component: FirstAdminAccess,
});

function FirstAdminAccess() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getAdminSession()
      .then((session) => {
        if (session?.user?.email?.toLowerCase() === FIRST_ADMIN_EMAIL) setLoading(false);
        else navigate({ to: "/admin/login" });
      })
      .catch(() => navigate({ to: "/admin/login" }));
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (password.length < 10) return void toast.error("A senha deve ter pelo menos 10 caracteres.");
    if (password !== confirmation) return void toast.error("As senhas não coincidem.");

    setSaving(true);
    try {
      await setFirstAdminPassword(password);
      toast.success("Senha criada com sucesso.");
      navigate({ to: "/admin" });
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível definir a senha.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-400">Validando convite...</div>;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,.28),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(14,165,233,.16),transparent_35%)]" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-lg"><img src="/amt-sistemas-logo.png" alt="AMT Sistemas" className="h-10 w-10 object-contain" /></div>
              <div><p className="font-semibold">AMT Sistemas</p><p className="text-xs text-slate-400">Control Center</p></div>
            </div>
            <div className="mt-28 max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-200"><ShieldCheck className="h-3.5 w-3.5" /> Primeiro acesso seguro</span>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight xl:text-6xl">Configure sua credencial administrativa.</h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">Este fluxo é exclusivo para o primeiro administrador autorizado do Control Center.</p>
            </div>
          </div>
          <p className="relative text-xs text-slate-500">AMT Sistemas e Soluções · Acesso restrito</p>
        </section>
        <section className="flex items-center justify-center bg-white px-5 py-10 text-slate-950">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><LockKeyhole className="h-5 w-5" /></div>
              <h2 className="text-3xl font-semibold tracking-tight">Criar sua senha</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Primeiro acesso de {FIRST_ADMIN_EMAIL}.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="first-admin-password">Nova senha</Label>
                <div className="relative">
                  <Input id="first-admin-password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 pr-11" />
                  <button type="button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-700">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="first-admin-confirmation">Confirmar senha</Label>
                <Input id="first-admin-confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={10} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="h-12" />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"><div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>Use uma senha exclusiva com pelo menos 10 caracteres. Depois de criada, ela será usada nos próximos acessos.</span></div></div>
              <Button type="submit" disabled={saving} className="h-12 w-full">{saving ? "Salvando..." : "Criar senha e entrar"}</Button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

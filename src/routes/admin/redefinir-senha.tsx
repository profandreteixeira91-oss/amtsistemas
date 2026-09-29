import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminSession, updateAdminPassword } from "@/lib/amt-admin-auth";
import { amtSupabase } from "@/integrations/amt-supabase/client";

export const Route = createFileRoute("/admin/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — AMT Sistemas" },
      { name: "description", content: "Redefinição segura da senha administrativa." },
    ],
  }),
  component: ResetAdminPassword,
});

function ResetAdminPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function prepare() {
      try {
        const session = await getAdminSession();
        if (session && active) {
          setReady(true);
          setLoading(false);
          return;
        }

        if (!amtSupabase) throw new Error("Autenticação indisponível.");

        const { data } = await amtSupabase.auth.getSession();
        if (active) {
          setReady(Boolean(data.session));
          setLoading(false);
        }
      } catch (error) {
        console.error(error);
        if (active) {
          setReady(false);
          setLoading(false);
        }
      }
    }

    void prepare();

    const subscription = amtSupabase?.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setReady(true);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    if (password.length < 10) {
      toast.error("A senha deve ter pelo menos 10 caracteres.");
      return;
    }

    if (password !== confirmation) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setSaving(true);
    try {
      await updateAdminPassword(password);
      toast.success("Senha atualizada com sucesso.");
      await amtSupabase?.auth.signOut();
      navigate({ to: "/admin/login" });
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível atualizar a senha.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-400">Validando recuperação...</div>;
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <CheckCircle2 className="mx-auto h-10 w-10 text-blue-600" />
          <h1 className="mt-5 text-2xl font-semibold text-slate-950">Link de recuperação inválido</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Solicite uma nova recuperação de senha pela tela de login.
          </p>
          <Button className="mt-6 w-full bg-black text-white hover:bg-slate-900" onClick={() => navigate({ to: "/admin/login" })}>
            Voltar para o login
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl sm:p-9">
        <div className="mb-7">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Definir nova senha</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Crie uma nova senha para acessar o AMT Control Center.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={10}
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

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nova senha</Label>
            <Input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={10}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="h-12"
            />
          </div>

          <p className="text-xs leading-5 text-slate-400">Use pelo menos 10 caracteres e não reutilize uma senha comprometida.</p>

          <Button type="submit" disabled={saving} className="h-12 w-full bg-black text-white hover:bg-slate-900">
            {saving ? "Atualizando..." : "Atualizar senha"}
          </Button>
        </form>
      </section>
    </main>
  );
}

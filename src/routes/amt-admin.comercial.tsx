import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Sparkles } from "lucide-react";
import { amtListarSistemas, amtSalvarSistema } from "@/lib/amt-admin/admin.functions";

function ComercialPage() {
  const qc = useQueryClient();
  const listar = useServerFn(amtListarSistemas);
  const salvar = useServerFn(amtSalvarSistema);
  const { data: sistemas } = useQuery({ queryKey: ["amt-sistemas"], queryFn: () => listar() });
  const [sel, setSel] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!sel && sistemas?.[0]) setSel(sistemas[0].id);
  }, [sistemas, sel]);

  useEffect(() => {
    if (!sel || !sistemas) return;
    const s = sistemas.find((x: any) => x.id === sel);
    if (s) setForm({ ...s, configuracoes: s.configuracoes ?? {} });
  }, [sel, sistemas]);

  const mut = useMutation({
    mutationFn: (payload: any) => salvar({ data: payload }),
    onSuccess: () => {
      toast.success("Conteúdo salvo. Landings propagam em ≤30s.");
      qc.invalidateQueries({ queryKey: ["amt-sistemas"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="h-6 w-6" />Landing / Comercial</h1>
        <p className="text-sm text-muted-foreground">Hero, pitch, CTAs e suporte de cada sistema.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(sistemas ?? []).map((s: any) => (
          <Button key={s.id} size="sm" variant={sel === s.id ? "default" : "outline"} onClick={() => setSel(s.id)}>
            {s.nome}
          </Button>
        ))}
      </div>

      {form.id && (
        <Card>
          <CardHeader><CardTitle className="text-base">{form.nome}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <F label="Título do hero"><Input value={form.configuracoes?.hero_titulo ?? ""} onChange={(e) => setForm({ ...form, configuracoes: { ...form.configuracoes, hero_titulo: e.target.value } })} /></F>
              <F label="URL do logo"><Input value={form.logo_url ?? ""} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} /></F>
            </div>
            <F label="Subtítulo do hero"><Textarea rows={2} value={form.configuracoes?.hero_subtitulo ?? ""} onChange={(e) => setForm({ ...form, configuracoes: { ...form.configuracoes, hero_subtitulo: e.target.value } })} /></F>
            <F label="Pitch comercial"><Textarea rows={4} value={form.pitch_comercial ?? ""} onChange={(e) => setForm({ ...form, pitch_comercial: e.target.value })} /></F>
            <div className="grid md:grid-cols-2 gap-3">
              <F label="CTA primário"><Input placeholder="Começar agora" value={form.configuracoes?.cta_primario ?? ""} onChange={(e) => setForm({ ...form, configuracoes: { ...form.configuracoes, cta_primario: e.target.value } })} /></F>
              <F label="CTA secundário"><Input placeholder="Falar com vendas" value={form.configuracoes?.cta_secundario ?? ""} onChange={(e) => setForm({ ...form, configuracoes: { ...form.configuracoes, cta_secundario: e.target.value } })} /></F>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <F label="Checkout URL"><Input value={form.checkout_url ?? ""} onChange={(e) => setForm({ ...form, checkout_url: e.target.value })} /></F>
              <F label="Domínio público"><Input value={form.dominio ?? ""} onChange={(e) => setForm({ ...form, dominio: e.target.value })} /></F>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <F label="Suporte WhatsApp"><Input value={form.suporte_whatsapp ?? ""} onChange={(e) => setForm({ ...form, suporte_whatsapp: e.target.value })} /></F>
              <F label="Suporte e-mail"><Input value={form.suporte_email ?? ""} onChange={(e) => setForm({ ...form, suporte_email: e.target.value })} /></F>
              <F label="Trial (dias)"><Input type="number" value={form.trial_dias ?? 14} onChange={(e) => setForm({ ...form, trial_dias: Number(e.target.value) })} /></F>
            </div>
            <F label="Mensagem de boas-vindas (in-app)"><Textarea rows={3} value={form.configuracoes?.msg_boas_vindas ?? ""} onChange={(e) => setForm({ ...form, configuracoes: { ...form.configuracoes, msg_boas_vindas: e.target.value } })} /></F>
            <div className="flex justify-end">
              <Button onClick={() => mut.mutate(form)} disabled={mut.isPending}><Save className="h-4 w-4 mr-2" />Salvar e propagar</Button>
            </div>
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Endpoint público: <code>/api/public/planos/{form.slug}</code> — reflete em ≤30s.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}

export const Route = createFileRoute("/amt-admin/comercial")({
  component: ComercialPage,
});

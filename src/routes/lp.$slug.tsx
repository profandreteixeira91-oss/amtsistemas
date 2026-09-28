import { useEffect, useState } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type PublicLP = {
  id: string;
  slug: string;
  titulo: string;
  headline: string | null;
  subheadline: string | null;
  cta_texto: string | null;
  cta_url: string | null;
  cor_primaria: string | null;
  imagem_hero: string | null;
  status: string;
  seo_titulo: string | null;
  seo_descricao: string | null;
  visualizacoes: number;
};

export const Route = createFileRoute("/lp/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("manager_landing_pages")
      .select("id,slug,titulo,headline,subheadline,cta_texto,cta_url,cor_primaria,imagem_hero,status,seo_titulo,seo_descricao,visualizacoes")
      .eq("slug", params.slug)
      .eq("status", "publicada")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return { page: data as PublicLP };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Página não encontrada" }, { name: "robots", content: "noindex" }] };
    }
    const p = loaderData.page;
    const title = p.seo_titulo || p.titulo;
    const desc = p.seo_descricao || p.headline || p.titulo;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(p.imagem_hero ? [{ property: "og:image", content: p.imagem_hero }, { name: "twitter:image", content: p.imagem_hero }] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Página não encontrada</h1>
        <p className="text-muted-foreground">Esta landing page não está publicada ou não existe.</p>
      </div>
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-6">
      <p className="text-muted-foreground">Falha ao carregar a página.</p>
    </div>
  ),
  component: PublicLanding,
});

function PublicLanding() {
  const { page } = Route.useLoaderData();
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", empresa: "", mensagem: "" });
  const [sent, setSent] = useState(false);
  const color = page.cor_primaria || "#6366f1";

  // Fire-and-forget view counter increment
  useEffect(() => {
    supabase
      .from("manager_landing_pages")
      .update({ visualizacoes: (page.visualizacoes ?? 0) + 1 })
      .eq("id", page.id)
      .then(() => {});
  }, [page.id, page.visualizacoes]);

  const submit = useMutation({
    mutationFn: async () => {
      const { error: e1 } = await supabase.from("manager_landing_leads").insert({
        landing_page_id: page.id,
        nome: form.nome || null,
        email: form.email || null,
        telefone: form.telefone || null,
        empresa: form.empresa || null,
        mensagem: form.mensagem || null,
      });
      if (e1) throw e1;
      await supabase
        .from("manager_landing_pages")
        .update({ conversoes: 1 })
        .eq("id", page.id);
    },
    onSuccess: () => {
      setSent(true);
      toast.success("Recebemos seu contato!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${color}22, transparent)` }}
      >
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid gap-10 md:grid-cols-2 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              {page.headline || page.titulo}
            </h1>
            {page.subheadline && (
              <p className="text-lg text-muted-foreground">{page.subheadline}</p>
            )}
            {page.cta_url && page.cta_texto && (
              <Button size="lg" style={{ backgroundColor: color }} asChild>
                <a href={page.cta_url} target="_blank" rel="noreferrer">{page.cta_texto}</a>
              </Button>
            )}
          </div>
          {page.imagem_hero ? (
            <img src={page.imagem_hero} alt={page.titulo} className="rounded-xl shadow-2xl w-full" />
          ) : (
            <div
              className="rounded-xl aspect-video w-full"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}
            />
          )}
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-6 py-16">
        <Card>
          <CardContent className="p-6 md:p-8">
            {sent ? (
              <div className="text-center space-y-3 py-6">
                <CheckCircle2 className="h-12 w-12 mx-auto" style={{ color }} />
                <h2 className="text-2xl font-semibold">Obrigado!</h2>
                <p className="text-muted-foreground">Recebemos seus dados e entraremos em contato em breve.</p>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!form.nome && !form.email) {
                    toast.error("Informe pelo menos nome ou e-mail");
                    return;
                  }
                  submit.mutate();
                }}
              >
                <div>
                  <h2 className="text-2xl font-semibold">Fale conosco</h2>
                  <p className="text-sm text-muted-foreground">Preencha o formulário e nossa equipe entrará em contato.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Nome</Label>
                    <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>E-mail</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telefone</Label>
                    <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Empresa</Label>
                    <Input value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Mensagem</Label>
                  <Textarea rows={4} value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} />
                </div>
                <Button type="submit" size="lg" className="w-full" style={{ backgroundColor: color }} disabled={submit.isPending}>
                  {submit.isPending ? "Enviando..." : page.cta_texto || "Enviar"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} — {page.titulo}
      </footer>
    </div>
  );
}

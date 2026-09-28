import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LifeBuoy, Plus, ChevronLeft } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketChat, ticketStatusBadge, formatWhen } from "@/components/tickets/ticket-chat";
import { toast } from "sonner";

export const Route = createFileRoute("/widget/suporte")({
  ssr: false,
  component: WidgetSuporte,
});

type Ticket = {
  id: string;
  numero: number;
  assunto: string;
  descricao: string | null;
  status: string;
  updated_at: string;
};

function WidgetSuporte() {
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    assunto: "",
    descricao: "",
    categoria: "duvida",
    prioridade: "media",
    email: "",
    nome: "",
  });

  useEffect(() => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const { data: tickets = [] } = useQuery({
    queryKey: ["widget-tickets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manager_tickets")
        .select("id,numero,assunto,descricao,status,updated_at")
        .eq("solicitante_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Ticket[];
    },
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`widget-tickets-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "manager_tickets", filter: `solicitante_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["widget-tickets", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  async function createTicket() {
    if (!user) return;
    if (!form.assunto.trim()) return toast.error("Assunto obrigatório");
    const nome =
      (user.user_metadata as any)?.nome ??
      (user.user_metadata as any)?.full_name ??
      user.email;
    const { data, error } = await supabase
      .from("manager_tickets")
      .insert({
        assunto: form.assunto,
        descricao: form.descricao || null,
        categoria: form.categoria,
        prioridade: form.prioridade,
        canal: "widget",
        status: "aberto",
        solicitante_id: user.id,
        solicitante_nome: nome,
        solicitante_email: user.email,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);

    if (form.descricao.trim()) {
      await supabase.from("manager_ticket_mensagens").insert({
        ticket_id: data.id,
        autor_id: user.id,
        autor_tipo: "cliente",
        autor_nome: nome,
        mensagem: form.descricao,
        interna: false,
      });
    }
    toast.success(`Ticket #${data.numero} criado`);
    setCreating(false);
    setSelectedId(data.id);
    setForm({ assunto: "", descricao: "", categoria: "duvida", prioridade: "media", email: "", nome: "" });
    qc.invalidateQueries({ queryKey: ["widget-tickets", user.id] });
  }

  async function magicLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email.trim()) return toast.error("Informe seu email");
    const { error } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: { emailRedirectTo: window.location.href, data: { nome: form.nome || undefined } },
    });
    if (error) return toast.error(error.message);
    toast.success("Enviamos um link de acesso ao seu email.");
  }

  if (user === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <header className="flex items-center gap-2 border-b p-3">
          <LifeBuoy className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Suporte</span>
        </header>
        <div className="flex flex-1 items-center justify-center p-6">
          <form onSubmit={magicLogin} className="w-full max-w-sm space-y-3">
            <div>
              <h2 className="text-base font-semibold">Fale com o suporte</h2>
              <p className="text-xs text-muted-foreground">
                Informe seu email para acessar seus tickets e conversar com nossa equipe.
              </p>
            </div>
            <div>
              <Label className="text-xs">Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Seu nome"
              />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="voce@empresa.com"
              />
            </div>
            <Button type="submit" className="w-full">
              Receber link de acesso
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const selected = tickets.find((t) => t.id === selectedId);
  const userName = (user.user_metadata as any)?.nome ?? user.email ?? "Cliente";

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between gap-2 border-b p-3">
        <div className="flex min-w-0 items-center gap-2">
          {selected || creating ? (
            <Button variant="ghost" size="icon" onClick={() => { setSelectedId(null); setCreating(false); }}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <LifeBuoy className="h-4 w-4 shrink-0 text-primary" />
          )}
          <span className="truncate text-sm font-semibold">
            {selected ? `#${selected.numero} · ${selected.assunto}` : creating ? "Novo ticket" : "Suporte"}
          </span>
        </div>
        {!selected && !creating && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="mr-1 h-3 w-3" /> Novo
          </Button>
        )}
      </header>

      {selected ? (
        <div className="flex-1 min-h-0">
          <TicketChat
            ticketId={selected.id}
            ticketStatus={selected.status}
            role="cliente"
            currentUserId={user.id}
            currentUserName={userName}
          />
        </div>
      ) : creating ? (
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <div>
            <Label className="text-xs">Assunto</Label>
            <Input value={form.assunto} onChange={(e) => setForm({ ...form, assunto: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="duvida">Dúvida</SelectItem>
                  <SelectItem value="problema">Problema</SelectItem>
                  <SelectItem value="sugestao">Sugestão</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Prioridade</Label>
              <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea rows={5} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </div>
          <Button className="w-full" onClick={createTicket}>Abrir ticket</Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {tickets.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
              <LifeBuoy className="h-8 w-8 opacity-50" />
              <p>Nenhum ticket ainda.</p>
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus className="mr-1 h-3 w-3" /> Abrir ticket
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {tickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className="flex w-full items-start justify-between gap-2 p-3 text-left transition hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">#{t.numero} · {t.assunto}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.descricao ?? "—"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {ticketStatusBadge(t.status)}
                    <span className="text-[10px] text-muted-foreground">{formatWhen(t.updated_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LifeBuoy, Plus, ChevronLeft } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { TicketChat, ticketStatusBadge, formatWhen } from "@/components/tickets/ticket-chat";
import { toast } from "sonner";

export const Route = createFileRoute("/suporte")({
  component: SuporteUsuarioPage,
});

type Ticket = {
  id: string;
  numero: number;
  assunto: string;
  descricao: string | null;
  status: string;
  prioridade: string;
  categoria: string;
  updated_at: string;
  created_at: string;
};

function SuporteUsuarioPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openNew, setOpenNew] = useState(false);
  const [form, setForm] = useState({ assunto: "", descricao: "", categoria: "duvida", prioridade: "media" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["meus-tickets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manager_tickets")
        .select("*")
        .eq("solicitante_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Ticket[];
    },
    refetchInterval: 20000,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`meus-tickets-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "manager_tickets", filter: `solicitante_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["meus-tickets", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  if (user === undefined) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  if (user === null) {
    return (
      <div className="max-w-md mx-auto mt-24 p-6 text-center space-y-4">
        <LifeBuoy className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-2xl font-bold">Suporte</h1>
        <p className="text-muted-foreground">Faça login para abrir e acompanhar seus tickets.</p>
        <Button onClick={() => navigate({ to: "/" })}>Entrar</Button>
      </div>
    );
  }

  async function createTicket() {
    if (!form.assunto.trim()) return toast.error("Assunto obrigatório");
    const nome = (user!.user_metadata as any)?.nome ?? (user!.user_metadata as any)?.full_name ?? user!.email;
    const { data, error } = await supabase
      .from("manager_tickets")
      .insert({
        assunto: form.assunto,
        descricao: form.descricao || null,
        categoria: form.categoria,
        prioridade: form.prioridade,
        canal: "portal",
        status: "aberto",
        solicitante_id: user!.id,
        solicitante_nome: nome,
        solicitante_email: user!.email,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);

    // First message = the description
    if (form.descricao.trim()) {
      await supabase.from("manager_ticket_mensagens").insert({
        ticket_id: data.id,
        autor_id: user!.id,
        autor_tipo: "cliente",
        autor_nome: nome,
        mensagem: form.descricao,
        interna: false,
      });
    }

    toast.success(`Ticket #${data.numero} criado`);
    setOpenNew(false);
    setForm({ assunto: "", descricao: "", categoria: "duvida", prioridade: "media" });
    setSelectedId(data.id);
    qc.invalidateQueries({ queryKey: ["meus-tickets", user!.id] });
  }

  const selected = tickets.find((t) => t.id === selectedId);
  const userName = (user.user_metadata as any)?.nome ?? user.email ?? "Cliente";

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <LifeBuoy className="h-7 w-7 text-primary" /> Central de Suporte
          </h1>
          <p className="text-muted-foreground mt-1">Abra tickets e converse em tempo real com nossa equipe.</p>
        </div>
        <Button onClick={() => setOpenNew(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo ticket
        </Button>
      </div>

      {selected ? (
        <Card className="flex flex-col" style={{ minHeight: 640 }}>
          <div className="p-3 border-b flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            {ticketStatusBadge(selected.status)}
          </div>
          <div className="flex-1 min-h-0">
            <TicketChat
              ticketId={selected.id}
              ticketTitle={`#${selected.numero} · ${selected.assunto}`}
              ticketStatus={selected.status}
              role="cliente"
              currentUserId={user.id}
              currentUserName={userName}
            />
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Meus tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <LifeBuoy className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Você ainda não abriu nenhum ticket.</p>
                <Button onClick={() => setOpenNew(true)} className="mt-4"><Plus className="h-4 w-4 mr-2" /> Abrir primeiro ticket</Button>
              </div>
            ) : (
              <div className="divide-y">
                {tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className="w-full text-left p-3 hover:bg-muted/50 transition rounded"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">#{t.numero} · {t.assunto}</p>
                        <p className="text-sm text-muted-foreground truncate">{t.descricao ?? "—"}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {ticketStatusBadge(t.status)}
                        <span className="text-xs text-muted-foreground">{formatWhen(t.updated_at)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Assunto</Label>
              <Input value={form.assunto} onChange={(e) => setForm({ ...form, assunto: e.target.value })} placeholder="Descreva brevemente o problema" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="duvida">Dúvida</SelectItem>
                    <SelectItem value="problema">Problema</SelectItem>
                    <SelectItem value="sugestao">Sugestão</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
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
              <Label>Descrição</Label>
              <Textarea rows={5} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Conte com detalhes o que está acontecendo..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
            <Button onClick={createTicket}>Abrir ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

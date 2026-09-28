import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, Lock, User as UserIcon, Shield } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export type TicketMessage = {
  id: string;
  ticket_id: string;
  autor_id: string | null;
  autor_tipo: string;
  autor_nome: string | null;
  mensagem: string;
  interna: boolean;
  created_at: string;
};

type Props = {
  ticketId: string;
  ticketTitle?: string;
  ticketStatus?: string | null;
  /** 'agente' (Manager) or 'cliente' (end-user) */
  role: "agente" | "cliente";
  currentUserId: string;
  currentUserName?: string | null;
  allowInternalNote?: boolean;
};

export function TicketChat({
  ticketId,
  ticketTitle,
  ticketStatus,
  role,
  currentUserId,
  currentUserName,
  allowInternalNote,
}: Props) {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [text, setText] = useState("");
  const [interna, setInterna] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("manager_ticket_mensagens")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (error) {
        toast.error(error.message);
      } else if (mounted) {
        setMessages((data ?? []) as TicketMessage[]);
      }
      setLoading(false);
    })();

    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "manager_ticket_mensagens",
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          const m = payload.new as TicketMessage;
          setMessages((prev) => (prev.find((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const msg = text.trim();
    if (!msg) return;
    setSending(true);
    const payload = {
      ticket_id: ticketId,
      autor_id: currentUserId,
      autor_tipo: role,
      autor_nome: currentUserName ?? null,
      mensagem: msg,
      interna: role === "agente" ? interna : false,
    };
    const { error } = await supabase.from("manager_ticket_mensagens").insert(payload);
    if (error) {
      toast.error(error.message);
    } else {
      setText("");
      // If agente replied publicly and ticket was 'aberto', move to 'em_andamento'
      if (role === "agente" && !interna && ticketStatus === "aberto") {
        await supabase.from("manager_tickets").update({ status: "em_andamento" }).eq("id", ticketId);
      }
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col h-full">
      {ticketTitle && (
        <div className="border-b p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold">{ticketTitle}</p>
            <p className="text-xs text-muted-foreground">Ticket #{ticketId.slice(0, 8)}</p>
          </div>
          {ticketStatus && <Badge variant="outline">{ticketStatus}</Badge>}
        </div>
      )}

      <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[400px] max-h-[600px]">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Carregando...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhuma mensagem ainda. Envie a primeira.
          </p>
        ) : (
          messages.map((m) => {
            const isMine =
              (role === "agente" && m.autor_tipo === "agente") ||
              (role === "cliente" && m.autor_tipo === "cliente");
            const isAgent = m.autor_tipo === "agente";
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    m.interna
                      ? "bg-amber-500/10 border border-amber-500/30 text-amber-100"
                      : isMine
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs mb-1 opacity-80">
                    {isAgent ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                    <span>{m.autor_nome ?? (isAgent ? "Suporte" : "Você")}</span>
                    {m.interna && <Lock className="h-3 w-3" />}
                    <span>·</span>
                    <span>{formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: ptBR })}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{m.mensagem}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t p-3 space-y-2">
        {allowInternalNote && role === "agente" && (
          <div className="flex items-center gap-2">
            <Switch id="interna" checked={interna} onCheckedChange={setInterna} />
            <Label htmlFor="interna" className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" /> Nota interna (não visível ao cliente)
            </Label>
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={role === "agente" ? "Responder ao cliente..." : "Escreva sua mensagem..."}
            className="min-h-[60px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button onClick={send} disabled={sending || !text.trim()} className="self-end">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">Ctrl/⌘ + Enter para enviar</p>
      </div>
    </div>
  );
}

export function ticketStatusBadge(status: string | null) {
  const map: Record<string, { label: string; className: string }> = {
    aberto: { label: "Aberto", className: "bg-blue-500/15 text-blue-500" },
    em_andamento: { label: "Em andamento", className: "bg-amber-500/15 text-amber-500" },
    aguardando: { label: "Aguardando cliente", className: "bg-purple-500/15 text-purple-500" },
    resolvido: { label: "Resolvido", className: "bg-emerald-500/15 text-emerald-500" },
    fechado: { label: "Fechado", className: "bg-muted text-muted-foreground" },
  };
  const s = map[status ?? ""] ?? { label: status ?? "—", className: "bg-muted" };
  return <Badge className={s.className}>{s.label}</Badge>;
}

export function formatWhen(d: string) {
  return format(new Date(d), "dd/MM HH:mm", { locale: ptBR });
}

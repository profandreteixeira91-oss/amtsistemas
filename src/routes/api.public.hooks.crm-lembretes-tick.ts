import { createFileRoute } from "@tanstack/react-router";

type Lembrete = {
  id: string;
  tipo: string;
  titulo: string | null;
  destinatario_nome: string | null;
  destinatario_telefone: string;
  lead_id: string | null;
  cliente_id: string | null;
  template: string;
  variaveis: Record<string, unknown> | null;
  tentativas: number;
};

function renderTemplate(tpl: string, vars: Record<string, unknown>) {
  return tpl.replace(/{{\s*([\w.]+)\s*}}/g, (_m, key) => {
    const v = vars?.[key];
    return v === undefined || v === null ? "" : String(v);
  });
}

export const Route = createFileRoute("/api/public/hooks/crm-lembretes-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const providedKey =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || providedKey !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: pendentes, error } = await supabaseAdmin
          .from("crm_lembretes" as any)
          .select(
            "id, tipo, titulo, destinatario_nome, destinatario_telefone, lead_id, cliente_id, template, variaveis, tentativas",
          )
          .eq("status", "pendente")
          .lte("agendado_para", new Date().toISOString())
          .order("agendado_para", { ascending: true })
          .limit(50);
        if (error) throw error;

        const results: Array<Record<string, unknown>> = [];

        for (const l of ((pendentes ?? []) as unknown as Lembrete[])) {
          try {
            const vars = {
              nome: l.destinatario_nome ?? "",
              telefone: l.destinatario_telefone ?? "",
              titulo: l.titulo ?? "",
              tipo: l.tipo,
              ...(l.variaveis ?? {}),
            };
            const conteudo = renderTemplate(l.template, vars);

            const { data: msg, error: msgErr } = await supabaseAdmin
              .from("crm_mensagens")
              .insert({
                canal: "whatsapp",
                direcao: "saida",
                status: "pendente",
                conteudo,
                destinatario: l.destinatario_telefone,
                lead_id: l.lead_id,
                cliente_id: l.cliente_id,
                assunto: l.titulo ?? `Lembrete: ${l.tipo}`,
              } as any)
              .select("id")
              .single();
            if (msgErr) throw msgErr;

            await supabaseAdmin
              .from("crm_lembretes" as any)
              .update({
                status: "enviado",
                mensagem_id: msg.id,
                tentativas: (l.tentativas ?? 0) + 1,
                erro: null,
              })
              .eq("id", l.id);

            results.push({ id: l.id, ok: true, mensagem_id: msg.id });
          } catch (err) {
            const erroMsg = String((err as Error)?.message ?? err).slice(0, 500);
            const novasTentativas = (l.tentativas ?? 0) + 1;
            await supabaseAdmin
              .from("crm_lembretes" as any)
              .update({
                status: novasTentativas >= 3 ? "falha" : "pendente",
                tentativas: novasTentativas,
                erro: erroMsg,
              })
              .eq("id", l.id);
            results.push({ id: l.id, ok: false, erro: erroMsg });
          }
        }

        return new Response(
          JSON.stringify({
            processados: results.length,
            results,
            at: new Date().toISOString(),
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});

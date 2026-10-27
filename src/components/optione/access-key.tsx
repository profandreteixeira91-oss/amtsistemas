import { AlertTriangle, Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/** Access key shown once after sign-up (or a new key): the database keeps only its hash. */
export function ChaveDeAcesso({ chave }: { chave: string }) {
  async function copiar() {
    try {
      await navigator.clipboard.writeText(chave);
      toast.success("Chave copiada.");
    } catch {
      toast.error("Não foi possível copiar. Selecione a chave e copie manualmente.");
    }
  }
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 text-center">
      <p className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
        <KeyRound className="h-4 w-4" /> Chave de acesso da ótica
      </p>
      <p className="mt-3 select-all break-all font-mono text-2xl font-semibold tracking-wider sm:text-3xl">
        {chave}
      </p>
      <Button type="button" variant="outline" size="sm" className="mt-4 gap-2" onClick={copiar}>
        <Copy className="h-4 w-4" /> Copiar chave
      </Button>
      <p className="mt-4 flex items-start justify-center gap-2 text-left text-xs text-muted-foreground sm:items-center sm:text-center">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 sm:mt-0" />
        Guarde esta chave agora: por segurança, ela não é exibida de novo. Se perder, gere uma nova.
      </p>
    </div>
  );
}

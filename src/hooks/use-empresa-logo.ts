import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve o logo_url da empresa em uma URL exibível.
 * - Se o valor já for uma URL http(s), retorna direto.
 * - Se for um path do bucket privado `empresa-logos`, gera signed URL.
 */
export function useEmpresaLogo(logoPath: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    if (!logoPath) {
      setUrl(null);
      return;
    }
    if (/^https?:\/\//i.test(logoPath) || logoPath.startsWith("/")) {
      setUrl(logoPath);
      return;
    }
    supabase.storage
      .from("empresa-logos")
      .createSignedUrl(logoPath, 60 * 60 * 6)
      .then(({ data }) => {
        if (!cancel) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancel = true;
    };
  }, [logoPath]);

  return url;
}

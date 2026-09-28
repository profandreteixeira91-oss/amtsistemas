import { useEffect } from "react";

/**
 * Widget flutuante de suporte AMT.
 * Carrega o script oficial https://amtsistemas.com.br/widget.js e o remove ao desmontar.
 * Renderizar apenas dentro de áreas autenticadas.
 */
export function SupportWidget() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById("amt-support-widget")) return;

    const s = document.createElement("script");
    s.id = "amt-support-widget";
    s.src = "https://amtsistemas.com.br/widget.js";
    s.async = true;
    s.dataset.origin = "https://amtsistemas.com.br";
    s.dataset.color = "#6366f1";
    s.dataset.label = "Suporte";
    s.dataset.position = "right";
    document.body.appendChild(s);

    return () => {
      s.remove();
      document
        .querySelectorAll(".amt-sup-btn, .amt-sup-panel")
        .forEach((el) => el.remove());
    };
  }, []);

  return null;
}

export const brl = (v: number | string | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(v ?? 0),
  );

export const num = (v: number | string | null | undefined, d = 2) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d }).format(
    Number(v ?? 0),
  );

export const dateBR = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";

export const dateTimeBR = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
    : "—";

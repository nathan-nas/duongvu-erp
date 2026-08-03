const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function formatVnd(n: number): string {
  return vndFormatter.format(n);
}

export function formatViDate(iso: string | null): string {
  if (iso == null || iso === "") return "—";
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "—";
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

/** Composite đối tác label — must match SQL spend_agg_by_party / spend_lines_page. */
export function formatPartyLabel(
  partyCode: string | null | undefined,
  partyName: string | null | undefined,
): string | null {
  const code = partyCode?.trim() ?? "";
  const name = partyName?.trim() ?? "";
  if (code === "" && name === "") return null;
  return `${code || "—"} — ${name || "—"}`;
}

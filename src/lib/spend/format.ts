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

/**
 * Composite code — name label (đối tác / hàng hóa).
 * Both sides: `mã — tên`. Only one side: that value alone (no `— — ` placeholder).
 * Must match SQL spend_party_label / spend_item_label.
 */
export function formatCodeNameLabel(
  code: string | null | undefined,
  name: string | null | undefined,
): string | null {
  const trimmedCode = code?.trim() ?? "";
  const trimmedName = name?.trim() ?? "";
  if (trimmedCode === "" && trimmedName === "") return null;
  if (trimmedCode !== "" && trimmedName !== "") {
    return `${trimmedCode} — ${trimmedName}`;
  }
  return trimmedCode || trimmedName;
}

/** Composite đối tác label — must match SQL spend_agg_by_party / spend_lines_page. */
export function formatPartyLabel(
  partyCode: string | null | undefined,
  partyName: string | null | undefined,
): string | null {
  return formatCodeNameLabel(partyCode, partyName);
}

/**
 * Hàng hóa label — must match SQL spend_item_label / spend_agg_items_for_party.
 */
export function formatItemLabel(
  itemCode: string | null | undefined,
  itemName: string | null | undefined,
): string | null {
  return formatCodeNameLabel(itemCode, itemName);
}

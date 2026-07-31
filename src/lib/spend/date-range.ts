/** ISO date YYYY-MM-DD */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** Parse YYYY-MM-DD as a local calendar Date (no UTC shift). */
export function isoToLocalDate(iso: string): Date | undefined {
  if (!isIsoDate(iso)) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Format a local Date as YYYY-MM-DD. */
export function localDateToIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseAnalyticsDateRange(
  fromRaw: string | undefined,
  toRaw: string | undefined,
  defaults: { min: string | null; max: string | null },
):
  | { from: string; to: string; error: null }
  | { from: string | null; to: string | null; error: string } {
  const from = fromRaw && isIsoDate(fromRaw) ? fromRaw : defaults.min;
  const to = toRaw && isIsoDate(toRaw) ? toRaw : defaults.max;

  if (!from || !to) {
    return {
      from: null,
      to: null,
      error: "Chưa có dữ liệu giao dịch.",
    };
  }

  if (from > to) {
    return {
      from,
      to,
      error: "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.",
    };
  }

  return { from, to, error: null };
}

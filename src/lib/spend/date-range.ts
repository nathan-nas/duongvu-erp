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

/** Parse dd/MM/yyyy (flexible day/month digits) to ISO YYYY-MM-DD. */
export function parseViDateToIso(text: string): string | null {
  const match = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return isIsoDate(iso) ? iso : null;
}

/** 1 Jan of `now`'s year → `now` (local calendar). */
export function yearToDateRange(now: Date = new Date()): {
  from: string;
  to: string;
} {
  return {
    from: `${now.getFullYear()}-01-01`,
    to: localDateToIso(now),
  };
}

export function parseAnalyticsDateRange(
  fromRaw: string | undefined,
  toRaw: string | undefined,
  bounds: { min: string | null; max: string | null },
  now: Date = new Date(),
):
  | { from: string; to: string; error: null }
  | { from: string | null; to: string | null; error: string } {
  if (!bounds.min || !bounds.max) {
    return {
      from: null,
      to: null,
      error: "Chưa có dữ liệu giao dịch.",
    };
  }

  const ytd = yearToDateRange(now);
  const from = fromRaw && isIsoDate(fromRaw) ? fromRaw : ytd.from;
  const to = toRaw && isIsoDate(toRaw) ? toRaw : ytd.to;

  if (from > to) {
    return {
      from,
      to,
      error: "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.",
    };
  }

  return { from, to, error: null };
}

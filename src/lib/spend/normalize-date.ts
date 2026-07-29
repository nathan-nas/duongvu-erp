function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatValidDate(year: number, month: number, day: number): string | null {
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${pad(month)}-${pad(day)}`;
}

export function parsePaymentDate(
  raw: unknown,
  periodYear: number,
): { date: string | null; raw: string | null; flags: string[] } {
  const flags: string[] = [];
  if (raw == null || raw === "") {
    return { date: null, raw: null, flags: ["missing_date"] };
  }
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    const iso = `${raw.getFullYear()}-${pad(raw.getMonth() + 1)}-${pad(raw.getDate())}`;
    return { date: iso, raw: String(raw), flags };
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    // Excel serial dates are typically > 30000 for 2020s; DDMM ints are smaller
    if (raw > 20000) {
      // Excel serial → treat via SheetJS date code in parse layer; here flag
      flags.push("excel_serial_unhandled");
      return { date: null, raw: String(raw), flags };
    }
    const s = String(Math.trunc(raw));
    let day: number;
    let month: number;
    if (s.length <= 2) {
      flags.push("invalid_date");
      return { date: null, raw: s, flags };
    }
    if (s.length === 3) {
      day = Number(s.slice(0, 1));
      month = Number(s.slice(1));
    } else {
      day = Number(s.slice(0, s.length - 2));
      month = Number(s.slice(-2));
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      flags.push("invalid_date");
      return { date: null, raw: s, flags };
    }
    const date = formatValidDate(periodYear, month, day);
    if (!date) {
      flags.push("invalid_date");
      return { date: null, raw: s, flags };
    }

    return { date, raw: s, flags };
  }
  const str = String(raw).trim();
  const dmy = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    let year = Number(dmy[3]);
    if (year < 100) year += 2000;
    const date = formatValidDate(year, month, day);
    if (!date) {
      flags.push("invalid_date");
      return { date: null, raw: str, flags };
    }

    return { date, raw: str, flags };
  }
  flags.push("invalid_date");
  return { date: null, raw: str, flags };
}

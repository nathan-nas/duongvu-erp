type AmountLine = {
  amount: number | null;
};

export type SpendAggregate = {
  label: string;
  amount: number;
};

export function sumBy<T extends AmountLine>(
  lines: T[],
  key: keyof T,
  top?: number,
): SpendAggregate[] {
  const totals = new Map<string, number>();

  for (const line of lines) {
    const value = line[key];
    if (typeof value !== "string" || value.trim() === "") continue;

    totals.set(value, (totals.get(value) ?? 0) + (line.amount ?? 0));
  }

  const results = Array.from(totals, ([label, amount]) => ({ label, amount })).sort(
    (a, b) => b.amount - a.amount,
  );

  return top == null ? results : results.slice(0, top);
}

export function sumByMonth<T extends AmountLine & { payment_date: string | null }>(
  lines: T[],
): SpendAggregate[] {
  const totals = new Map<string, number>();

  for (const line of lines) {
    const month = line.payment_date?.slice(0, 7);
    if (!month || !/^\d{4}-\d{2}$/.test(month)) continue;

    totals.set(month, (totals.get(month) ?? 0) + (line.amount ?? 0));
  }

  return Array.from(totals, ([label, amount]) => ({ label, amount })).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

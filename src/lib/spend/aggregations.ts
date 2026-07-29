type AmountLine = {
  amount: number | null;
};

export type SpendAggregate = {
  label: string;
  amount: number;
  count: number;
};

export function sumBy<T extends AmountLine>(
  lines: T[],
  key: keyof T,
  top?: number,
): SpendAggregate[] {
  const totals = new Map<string, { amount: number; count: number }>();

  for (const line of lines) {
    const value = line[key];
    if (typeof value !== "string" || value.trim() === "") continue;

    const prev = totals.get(value) ?? { amount: 0, count: 0 };
    totals.set(value, {
      amount: prev.amount + (line.amount ?? 0),
      count: prev.count + 1,
    });
  }

  const results = Array.from(totals, ([label, { amount, count }]) => ({
    label,
    amount,
    count,
  })).sort((a, b) => b.amount - a.amount);

  return top == null ? results : results.slice(0, top);
}

export function sumByMonth<T extends AmountLine & { payment_date: string | null }>(
  lines: T[],
): SpendAggregate[] {
  const totals = new Map<string, { amount: number; count: number }>();

  for (const line of lines) {
    const month = line.payment_date?.slice(0, 7);
    if (!month || !/^\d{4}-\d{2}$/.test(month)) continue;

    const prev = totals.get(month) ?? { amount: 0, count: 0 };
    totals.set(month, {
      amount: prev.amount + (line.amount ?? 0),
      count: prev.count + 1,
    });
  }

  return Array.from(totals, ([label, { amount, count }]) => ({
    label,
    amount,
    count,
  })).sort((a, b) => a.label.localeCompare(b.label));
}

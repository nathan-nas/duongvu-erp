import {
  AnalyticsDashboard,
  type AnalyticsBatch,
  type AnalyticsLine,
} from "@/components/spend/analytics-dashboard";
import { createClient } from "@/lib/supabase/server";

type AnalyticsPageProps = {
  searchParams: Promise<{ batch?: string | string[] }>;
};

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const supabase = await createClient();
  const { data: batchRows } = await supabase
    .from("import_batch")
    .select("id, source_filename, period_year, batch_kind")
    .order("created_at", { ascending: false });
  const batches: AnalyticsBatch[] = (batchRows ?? []).map((batch) => ({
    id: String(batch.id),
    source_filename: String(batch.source_filename),
    period_year: Number(batch.period_year),
    batch_kind:
      batch.batch_kind === "annual" || batch.batch_kind === "period"
        ? batch.batch_kind
        : "unknown",
  }));
  const params = await searchParams;
  const requestedBatchId =
    typeof params.batch === "string" ? params.batch : undefined;
  const selectedBatchId = batches.some((batch) => batch.id === requestedBatchId)
    ? requestedBatchId!
    : (batches[0]?.id ?? null);
  const { data: lineRows } = selectedBatchId
    ? await supabase
        .from("spend_line")
        .select(
          "id, payment_date, party_code, party_name, item_code, item_name, uom, qty, unit_price, amount, plant_name, expense_code, payment_method, description, invoice, note",
        )
        .eq("batch_id", selectedBatchId)
        .order("payment_date", { ascending: true })
    : { data: [] };
  const lines: AnalyticsLine[] = (lineRows ?? []).map((line) => ({
    id: String(line.id),
    payment_date: stringOrNull(line.payment_date),
    party_code: stringOrNull(line.party_code),
    party_name: stringOrNull(line.party_name),
    item_code: stringOrNull(line.item_code),
    item_name: stringOrNull(line.item_name),
    uom: stringOrNull(line.uom),
    qty: numberOrNull(line.qty),
    unit_price: numberOrNull(line.unit_price),
    amount: numberOrNull(line.amount),
    plant_name: stringOrNull(line.plant_name),
    expense_code: stringOrNull(line.expense_code),
    payment_method: stringOrNull(line.payment_method),
    description: stringOrNull(line.description),
    invoice: stringOrNull(line.invoice),
    note: stringOrNull(line.note),
  }));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold">Phân tích</h1>
      <AnalyticsDashboard
        batches={batches}
        selectedBatchId={selectedBatchId}
        lines={lines}
      />
    </main>
  );
}

import {
  AnalyticsDashboard,
  type AnalyticsBatch,
} from "@/components/spend/analytics-dashboard";
import { fetchSpendAggregates } from "@/api/analytics";
import { createClient } from "@/lib/supabase/server";
import type { SpendAggregate } from "@/lib/spend/aggregations";

type AnalyticsPageProps = {
  searchParams: Promise<{ batch?: string | string[] }>;
};

const emptySeries = {
  plant: [] as SpendAggregate[],
  expense: [] as SpendAggregate[],
  month: [] as SpendAggregate[],
  plantAll: [] as SpendAggregate[],
  expenseAll: [] as SpendAggregate[],
};

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const supabase = await createClient();
  const { data: batchRows } = await supabase
    .from("import_batch")
    .select(
      "id, source_filename, period_year, batch_kind, fact_rows, amount_sum, status",
    )
    .eq("status", "ready")
    .order("created_at", { ascending: false });

  const batches: AnalyticsBatch[] = (batchRows ?? []).map((batch) => ({
    id: String(batch.id),
    source_filename: String(batch.source_filename),
    period_year: Number(batch.period_year),
    batch_kind:
      batch.batch_kind === "annual" || batch.batch_kind === "period"
        ? batch.batch_kind
        : "unknown",
    fact_rows: Number(batch.fact_rows ?? 0),
    amount_sum: Number(batch.amount_sum ?? 0),
  }));

  const params = await searchParams;
  const requestedBatchId =
    typeof params.batch === "string" ? params.batch : undefined;
  const selectedBatchId = batches.some((batch) => batch.id === requestedBatchId)
    ? requestedBatchId!
    : (batches[0]?.id ?? null);

  const series = selectedBatchId
    ? ((await fetchSpendAggregates(selectedBatchId)) ?? emptySeries)
    : emptySeries;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold">Phân tích</h1>
      <AnalyticsDashboard
        batches={batches}
        selectedBatchId={selectedBatchId}
        plantData={series.plant}
        expenseData={series.expense}
        monthData={series.month}
        plantAll={series.plantAll}
        expenseAll={series.expenseAll}
      />
    </main>
  );
}

import { AnalyticsDashboard } from "@/components/spend/analytics-dashboard";
import {
  fetchSpendAggregates,
  fetchSpendDateBounds,
} from "@/api/analytics";
import { parseAnalyticsDateRange } from "@/lib/spend/date-range";
import type { SpendAggregate } from "@/lib/spend/aggregations";

type AnalyticsPageProps = {
  searchParams: Promise<{ from?: string | string[]; to?: string | string[] }>;
};

const emptySeries = {
  plant: [] as SpendAggregate[],
  expense: [] as SpendAggregate[],
  party: [] as SpendAggregate[],
  month: [] as SpendAggregate[],
  plantAll: [] as SpendAggregate[],
  expenseAll: [] as SpendAggregate[],
  partyAll: [] as SpendAggregate[],
  totals: { amountSum: 0, factRows: 0 },
};

function firstString(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const params = await searchParams;
  const bounds = await fetchSpendDateBounds();
  const range = parseAnalyticsDateRange(
    firstString(params.from),
    firstString(params.to),
    bounds,
  );

  const series =
    range.error || !range.from || !range.to
      ? emptySeries
      : ((await fetchSpendAggregates({ from: range.from, to: range.to })) ??
        emptySeries);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold">Phân tích</h1>
      <AnalyticsDashboard
        key={`${range.from ?? ""}-${range.to ?? ""}`}
        from={range.from}
        to={range.to}
        boundsMin={bounds.min}
        boundsMax={bounds.max}
        rangeError={range.error}
        amountSum={series.totals.amountSum}
        plantData={series.plant}
        expenseData={series.expense}
        partyData={series.party}
        monthData={series.month}
        plantAll={series.plantAll}
        expenseAll={series.expenseAll}
        partyAll={series.partyAll}
      />
    </main>
  );
}

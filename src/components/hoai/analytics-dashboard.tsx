"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { sumBy, sumByMonth } from "@/lib/hoai/aggregations";
import { formatVnd, formatViDate } from "@/lib/hoai/format";
import { SpendBarChart } from "./spend-bar-chart";

export type AnalyticsBatch = {
  id: string;
  source_filename: string;
  period_year: number;
  batch_kind: "annual" | "period" | "unknown";
};

export type AnalyticsLine = {
  id: string;
  payment_date: string | null;
  party_code: string | null;
  party_name: string | null;
  item_code: string | null;
  item_name: string | null;
  uom: string | null;
  qty: number | null;
  unit_price: number | null;
  amount: number | null;
  plant_name: string | null;
  expense_code: string | null;
  payment_method: string | null;
  description: string | null;
  invoice: string | null;
  note: string | null;
};

type AnalyticsDashboardProps = {
  batches: AnalyticsBatch[];
  selectedBatchId: string | null;
  lines: AnalyticsLine[];
};

const batchKindLabel = {
  annual: "Cả năm",
  period: "Theo kỳ",
  unknown: "Không xác định",
};

function DetailCell({ children }: { children: React.ReactNode }) {
  return <td className="whitespace-nowrap px-3 py-2">{children ?? "—"}</td>;
}

export function AnalyticsDashboard({
  batches,
  selectedBatchId,
  lines,
}: AnalyticsDashboardProps) {
  const router = useRouter();

  if (batches.length === 0 || !selectedBatchId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chưa có dữ liệu</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          <p>Chưa có dữ liệu. Hãy tải lên file Excel.</p>
          <Button render={<Link href="/app/uploads" />}>Tải lên file</Button>
        </CardContent>
      </Card>
    );
  }

  const totalAmount = lines.reduce((total, line) => total + (line.amount ?? 0), 0);
  const plantCount = new Set(
    lines.map((line) => line.plant_name?.trim()).filter(Boolean),
  ).size;
  const expenseCodeCount = new Set(
    lines.map((line) => line.expense_code?.trim()).filter(Boolean),
  ).size;
  const cards = [
    { label: "Tổng chi", value: formatVnd(totalAmount) },
    { label: "Số dòng", value: new Intl.NumberFormat("vi-VN").format(lines.length) },
    { label: "Số nhà máy", value: new Intl.NumberFormat("vi-VN").format(plantCount) },
    { label: "Số mã chi", value: new Intl.NumberFormat("vi-VN").format(expenseCodeCount) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="pt-4">
          <label className="grid max-w-xl gap-2 text-sm font-medium">
            Lô dữ liệu
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={selectedBatchId}
              onChange={(event) =>
                router.push(`/app/analytics?batch=${event.target.value}`)
              }
            >
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.source_filename} — {batch.period_year} (
                  {batchKindLabel[batch.batch_kind]})
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Chỉ số tổng quan">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold">{card.value}</CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Chi theo nhà máy (NM)</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendBarChart data={sumBy(lines, "plant_name", 10)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Chi theo mã (MÃ)</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendBarChart data={sumBy(lines, "expense_code", 10)} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Chi theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendBarChart data={sumByMonth(lines)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Chi theo hình thức thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendBarChart data={sumBy(lines, "payment_method", 10)} />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-y bg-muted/50">
              <tr>
                {[
                  "Ngày chi tiền",
                  "MÃ KH",
                  "TÊN CỬA HÀNG",
                  "Mã hàng",
                  "TÊN HÀNG",
                  "ĐVT",
                  "S. LƯỢNG",
                  "ĐƠN GIÁ",
                  "THÀNH TIỀN",
                  "NM",
                  "MÃ",
                  "THANH TOÁN",
                  "DIỄN GIẢI",
                  "HÓA ĐƠN",
                  "GHI CHÚ",
                ].map((header) => (
                  <th key={header} className="whitespace-nowrap px-3 py-2 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className="border-b last:border-0">
                  <DetailCell>{formatViDate(line.payment_date)}</DetailCell>
                  <DetailCell>{line.party_code}</DetailCell>
                  <DetailCell>{line.party_name}</DetailCell>
                  <DetailCell>{line.item_code}</DetailCell>
                  <DetailCell>{line.item_name}</DetailCell>
                  <DetailCell>{line.uom}</DetailCell>
                  <DetailCell>
                    {line.qty != null ? line.qty.toLocaleString("vi-VN") : null}
                  </DetailCell>
                  <DetailCell>
                    {line.unit_price != null ? formatVnd(line.unit_price) : null}
                  </DetailCell>
                  <DetailCell>
                    {line.amount != null ? formatVnd(line.amount) : null}
                  </DetailCell>
                  <DetailCell>{line.plant_name}</DetailCell>
                  <DetailCell>{line.expense_code}</DetailCell>
                  <DetailCell>{line.payment_method}</DetailCell>
                  <DetailCell>{line.description}</DetailCell>
                  <DetailCell>{line.invoice}</DetailCell>
                  <DetailCell>{line.note}</DetailCell>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

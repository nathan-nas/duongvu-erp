"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SpendAggregate } from "@/lib/spend/aggregations";
import { formatVnd } from "@/lib/spend/format";

export function SpendBarChart({ data }: { data: SpendAggregate[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-muted-foreground">
        Chưa có dữ liệu.
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(value) =>
              new Intl.NumberFormat("vi-VN", {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(value)
            }
          />
          <YAxis
            type="category"
            dataKey="label"
            width={112}
            tick={{ fontSize: 12 }}
          />
          <Tooltip formatter={(value) => formatVnd(Number(value))} />
          <Bar dataKey="amount" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

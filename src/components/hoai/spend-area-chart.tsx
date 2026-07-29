"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SpendAggregate } from "@/lib/hoai/aggregations";
import { formatVnd } from "@/lib/hoai/format";

type Props = {
  data: SpendAggregate[];
  onClickPoint?: (label: string) => void;
};

export function SpendAreaChart({ data, onClickPoint }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Chưa có dữ liệu.
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ left: 8, right: 16, top: 8, bottom: 0 }}
          onClick={(e) => {
            if (e?.activeLabel && onClickPoint) {
              onClickPoint(String(e.activeLabel));
            }
          }}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis
            tickFormatter={(v) =>
              new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(v)
            }
            tick={{ fontSize: 11 }}
          />
          <Tooltip formatter={(value) => formatVnd(Number(value))} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#2563eb"
            strokeWidth={2}
            fill="url(#areaGradient)"
            dot={{ r: 3, cursor: "pointer" }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

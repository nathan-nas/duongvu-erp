"use client";

import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import type { SpendAggregate } from "@/lib/spend/aggregations";
import { formatVnd } from "@/lib/spend/format";

const COLORS = [
  "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#d97706",
  "#65a30d", "#0d9488", "#0284c7", "#6366f1", "#e11d48",
  "#059669", "#4f46e5", "#c026d3", "#0891b2", "#dc2626",
];

const PARTY_SEP = " — ";

/** Prefer mã when composite labels are too long for the cell; full name stays in tooltip. */
export function truncateTreemapLabel(name: string, maxChars: number): string {
  if (maxChars < 1) return "…";
  if (name.length <= maxChars) return name;

  const sepIdx = name.indexOf(PARTY_SEP);
  if (sepIdx > 0) {
    const code = name.slice(0, sepIdx);
    if (code.length <= maxChars) return code;
    return `${code.slice(0, Math.max(1, maxChars - 1))}…`;
  }

  return `${name.slice(0, Math.max(1, maxChars - 1))}…`;
}

type TreemapContentProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  name?: string;
  amount?: number;
};

function CustomContent({ x = 0, y = 0, width = 0, height = 0, index = 0, name, amount }: TreemapContentProps) {
  if (width < 4 || height < 4) return null;
  const color = COLORS[index % COLORS.length];
  const showLabel = width > 50 && height > 30;
  const maxChars = Math.max(1, Math.floor(width / 7));

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        stroke="#fff"
        strokeWidth={2}
        rx={4}
        className="treemap-cell cursor-pointer"
      />
      {showLabel && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - (height > 50 ? 8 : 0)}
            textAnchor="middle"
            fill="#fff"
            fontSize={Math.min(12, width / 8)}
            fontWeight={600}
          >
            {truncateTreemapLabel(name ?? "", maxChars)}
          </text>
          {height > 50 && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 12}
              textAnchor="middle"
              fill="rgba(255,255,255,0.85)"
              fontSize={Math.min(10, width / 9)}
            >
              {new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(amount ?? 0)}
            </text>
          )}
        </>
      )}
    </g>
  );
}

type Props = {
  data: SpendAggregate[];
  onClickBlock?: (label: string) => void;
};

export function SpendTreemap({ data, onClickBlock }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-muted-foreground">
        Chưa có dữ liệu.
      </div>
    );
  }

  const treemapData = data.map((d) => ({ name: d.label, amount: d.amount }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={treemapData}
          dataKey="amount"
          nameKey="name"
          content={<CustomContent />}
          onClick={(node) => {
            if (node && onClickBlock) {
              onClickBlock(String(node.name ?? ""));
            }
          }}
        >
          <Tooltip
            formatter={(value) => formatVnd(Number(value))}
            labelFormatter={(label) => String(label)}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}

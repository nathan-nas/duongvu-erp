"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  commitImport,
  markImportBatchFailed,
} from "@/api/import-spend";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatVnd } from "@/lib/spend/format";
import type { BatchKind, SpendSheetSummary } from "@/lib/spend/types";

const batchKindLabel = {
  annual: "C\u1ea3 n\u0103m",
  period: "Theo k\u1ef3",
  unknown: "Kh\u00f4ng x\u00e1c \u0111\u1ecbnh",
};

type ConfirmImportProps = {
  batchId: string;
  filename: string;
  factRows: number;
  amountSum: number;
  sheetSummaries: SpendSheetSummary[];
  batchKind: BatchKind;
  periodYear: number;
  onCancel: () => void;
};

export function ConfirmImport({
  batchId,
  filename,
  factRows,
  amountSum,
  sheetSummaries,
  batchKind,
  periodYear: initialPeriodYear,
  onCancel,
}: ConfirmImportProps) {
  const router = useRouter();
  const [periodYear, setPeriodYear] = useState(initialPeriodYear);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmImport() {
    setError(null);
    setSaving(true);

    const result = await commitImport(batchId, periodYear);

    if ("error" in result) {
      await markImportBatchFailed(batchId);
      setError(result.error);
      toast.error(result.error);
      setSaving(false);
      return;
    }

    toast.success(
      `\u0110\u00e3 nh\u1eadp ${factRows.toLocaleString("vi-VN")} d\u00f2ng th\u00e0nh c\u00f4ng.`,
    );
    router.push("/app/analytics");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{"X\u00e1c nh\u1eadn nh\u1eadp d\u1eef li\u1ec7u"}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{"T\u00ean file"}</p>
          <p>{filename}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{"Lo\u1ea1i file"}</p>
          <p>{batchKindLabel[batchKind]}</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="period-year">{"N\u0103m h\u1ea1ch to\u00e1n"}</Label>
          <Input
            id="period-year"
            type="number"
            min={2000}
            max={2100}
            value={periodYear}
            disabled={saving}
            onChange={(event) => setPeriodYear(Number(event.target.value))}
          />
        </div>
        <div className="grid gap-2">
          <p className="text-sm font-medium">{"Chi ti\u1ebft theo sheet"}</p>
          <div className="grid gap-2">
            {sheetSummaries.map((summary) => (
              <div
                key={summary.sheetName}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2"
              >
                <span className="font-medium">{summary.sheetName}</span>
                <span className="text-sm text-muted-foreground">
                  {summary.factRows.toLocaleString("vi-VN")}{" d\u00f2ng \u00b7 "}
                  {formatVnd(summary.amountSum)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{"T\u1ed5ng s\u1ed1 d\u00f2ng"}</p>
          <p>{factRows.toLocaleString("vi-VN")}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{"T\u1ed5ng th\u00e0nh ti\u1ec1n"}</p>
          <p>{formatVnd(amountSum)}</p>
        </div>
        {saving && (
          <p aria-live="polite">{"\u0110ang l\u01b0u d\u1eef li\u1ec7u tr\u00ean m\u00e1y ch\u1ee7\u2026"}</p>
        )}
        {error && <p className="text-destructive">{error}</p>}
      </CardContent>
      <CardFooter className="gap-2">
        <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>
          {"H\u1ee7y"}
        </Button>
        <Button type="button" disabled={saving} onClick={confirmImport}>
          {"X\u00e1c nh\u1eadn nh\u1eadp"}
        </Button>
      </CardFooter>
    </Card>
  );
}

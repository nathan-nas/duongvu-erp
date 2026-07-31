"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  createSpendLine,
  updateSpendLine,
} from "@/api/spend-lines";
import type { AnalyticsLine } from "@/api/analytics";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  emptySpendLineFields,
  type SpendLineFields,
} from "@/lib/spend/line-fields";

type Mode = { kind: "create" } | { kind: "edit"; line: AnalyticsLine };

type Props = {
  open: boolean;
  mode: Mode | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

function lineToFields(line: AnalyticsLine): SpendLineFields {
  return {
    payment_date: line.payment_date,
    party_code: line.party_code,
    party_name: line.party_name,
    item_code: line.item_code,
    item_name: line.item_name,
    uom: line.uom,
    qty: line.qty,
    unit_price: line.unit_price,
    amount: line.amount,
    plant_name: line.plant_name,
    expense_code: line.expense_code,
    payment_method: line.payment_method,
    description: line.description,
    invoice: line.invoice,
    note: line.note,
  };
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function SpendLineFormBody({
  mode,
  onOpenChange,
  onSaved,
}: {
  mode: Mode;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [fields, setFields] = useState<SpendLineFields>(() =>
    mode.kind === "edit" ? lineToFields(mode.line) : emptySpendLineFields(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setText(key: keyof SpendLineFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value === "" ? null : value }));
  }

  function setNumber(key: "qty" | "unit_price" | "amount", value: string) {
    if (value.trim() === "") {
      setFields((prev) => ({ ...prev, [key]: null }));
      return;
    }
    const n = Number(value);
    setFields((prev) => ({ ...prev, [key]: Number.isFinite(n) ? n : null }));
  }

  async function submit() {
    setSaving(true);
    setError(null);
    const result =
      mode.kind === "create"
        ? await createSpendLine(fields)
        : await updateSpendLine(mode.line.id, fields);
    setSaving(false);

    if ("error" in result) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success(mode.kind === "create" ? "Đã thêm dòng." : "Đã cập nhật dòng.");
    onOpenChange(false);
    onSaved();
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="payment_date" label="Ngày thanh toán">
          <DatePicker
            id="payment_date"
            value={fields.payment_date ?? ""}
            onChange={(v) =>
              setFields((prev) => ({
                ...prev,
                payment_date: v || null,
              }))
            }
          />
        </Field>
        <Field id="plant_name" label="Nhà máy">
          <Input
            id="plant_name"
            value={fields.plant_name ?? ""}
            onChange={(e) => setText("plant_name", e.target.value)}
          />
        </Field>
        <Field id="expense_code" label="Mã chi">
          <Input
            id="expense_code"
            value={fields.expense_code ?? ""}
            onChange={(e) => setText("expense_code", e.target.value)}
          />
        </Field>
        <Field id="payment_method" label="Hình thức TT">
          <Input
            id="payment_method"
            value={fields.payment_method ?? ""}
            onChange={(e) => setText("payment_method", e.target.value)}
          />
        </Field>
        <Field id="party_code" label="Mã cửa hàng">
          <Input
            id="party_code"
            value={fields.party_code ?? ""}
            onChange={(e) => setText("party_code", e.target.value)}
          />
        </Field>
        <Field id="party_name" label="Tên cửa hàng">
          <Input
            id="party_name"
            value={fields.party_name ?? ""}
            onChange={(e) => setText("party_name", e.target.value)}
          />
        </Field>
        <Field id="item_code" label="Mã hàng">
          <Input
            id="item_code"
            value={fields.item_code ?? ""}
            onChange={(e) => setText("item_code", e.target.value)}
          />
        </Field>
        <Field id="item_name" label="Tên hàng">
          <Input
            id="item_name"
            value={fields.item_name ?? ""}
            onChange={(e) => setText("item_name", e.target.value)}
          />
        </Field>
        <Field id="uom" label="ĐVT">
          <Input
            id="uom"
            value={fields.uom ?? ""}
            onChange={(e) => setText("uom", e.target.value)}
          />
        </Field>
        <Field id="qty" label="Số lượng">
          <Input
            id="qty"
            type="number"
            inputMode="decimal"
            value={fields.qty ?? ""}
            onChange={(e) => setNumber("qty", e.target.value)}
          />
        </Field>
        <Field id="unit_price" label="Đơn giá">
          <Input
            id="unit_price"
            type="number"
            inputMode="decimal"
            value={fields.unit_price ?? ""}
            onChange={(e) => setNumber("unit_price", e.target.value)}
          />
        </Field>
        <Field id="amount" label="Thành tiền">
          <Input
            id="amount"
            type="number"
            inputMode="decimal"
            value={fields.amount ?? ""}
            onChange={(e) => setNumber("amount", e.target.value)}
          />
        </Field>
        <Field id="invoice" label="Hóa đơn">
          <Input
            id="invoice"
            value={fields.invoice ?? ""}
            onChange={(e) => setText("invoice", e.target.value)}
          />
        </Field>
        <Field id="description" label="Diễn giải">
          <Input
            id="description"
            value={fields.description ?? ""}
            onChange={(e) => setText("description", e.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field id="note" label="Ghi chú">
            <Input
              id="note"
              value={fields.note ?? ""}
              onChange={(e) => setText("note", e.target.value)}
            />
          </Field>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <DialogFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={() => onOpenChange(false)}
        >
          Hủy
        </Button>
        <Button type="button" disabled={saving} onClick={() => void submit()}>
          {saving ? "Đang lưu…" : "Lưu"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function SpendLineFormDialog({
  open,
  mode,
  onOpenChange,
  onSaved,
}: Props) {
  const title = mode?.kind === "edit" ? "Sửa dòng chi" : "Thêm dòng chi";
  const formKey =
    mode?.kind === "edit" ? `edit-${mode.line.id}` : mode ? "create" : "closed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg duration-200"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode?.kind === "create"
              ? "Dòng mới được gắn vào lô Nhập tay."
              : "Chỉnh sửa các trường của dòng chi."}
          </DialogDescription>
        </DialogHeader>

        {open && mode ? (
          <SpendLineFormBody
            key={formKey}
            mode={mode}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

# HOAI Excel Upload → Visualization POC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let authenticated Vietnam users upload either HOAI workbook type, confirm year, persist `BANG CHI TIET` fact lines, and view a Vietnamese analytics screen with batch switcher plus equal spend charts by `NM` and `MÃ`.

**Architecture:** Client parses `.xlsx` with SheetJS (files can exceed Vercel serverless body limits ~4.5MB). Confirm UI edits `period_year`, then Server Actions insert `import_batch` + chunked `spend_line` rows into Supabase under RLS. Analytics reads one selected batch and aggregates in SQL or in-memory for POC-scale (~20k rows).

**Tech Stack:** Next.js App Router, TypeScript, Supabase (`@supabase/ssr`), SheetJS (`xlsx`), Recharts, shadcn/ui, Vitest, Vietnamese UI copy, `vi-VN` formatting.

## Global Constraints

- UI copy: **Vietnamese only** (no English user-facing strings).
- Money/dates: **vi-VN**, VND, display **dd/MM/yyyy**.
- Fact source: sheet **BANG CHI TIET** only; ignore plant duplicate tabs.
- Support **both** file kinds: `annual` (TH CHI TIẾT NĂM…) and `period` (VAT TU T…).
- Year for ambiguous dates: filename default, **editable before confirm**.
- First analytics screen: **two equal charts** — spend by `NM`, spend by `MÃ` — plus KPI strip and batch switcher.
- Deploy: Vercel only; DB: Supabase; no org model; RLS = owning user.
- YAGNI: no `spend_line_raw` table, no P4 multi-batch compare, no Excel write-back in this plan.
- P2 MKH labels: included as final optional task; can ship without it.

---

## File structure

```text
supabase/migrations/20260729120000_hoai_spend.sql
src/lib/hoai/types.ts
src/lib/hoai/format.ts
src/lib/hoai/period-year.ts
src/lib/hoai/normalize-date.ts
src/lib/hoai/classify-batch.ts
src/lib/hoai/map-fact-row.ts
src/lib/hoai/parse-workbook.ts
src/lib/hoai/aggregations.ts
src/app/app/actions/import-spend.ts
src/app/app/uploads/page.tsx
src/components/hoai/upload-wizard.tsx
src/components/hoai/confirm-import.tsx
src/app/app/analytics/page.tsx
src/components/hoai/analytics-dashboard.tsx
src/components/hoai/spend-bar-chart.tsx
src/components/app/app-nav.tsx
src/lib/hoai/*.test.ts
```

---

### Task 1: Supabase schema for batches and spend lines

**Files:**
- Create: `supabase/migrations/20260729120000_hoai_spend.sql`
- Modify: `supabase/README.md` (short apply note)

**Interfaces:**
- Produces: tables `import_batch`, `spend_line` with RLS policies `auth.uid() = user_id`

- [ ] **Step 1: Write migration SQL**

```sql
-- supabase/migrations/20260729120000_hoai_spend.sql
create type public.batch_kind as enum ('annual', 'period', 'unknown');

create table public.import_batch (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_filename text not null,
  period_year int not null check (period_year between 2000 and 2100),
  batch_kind public.batch_kind not null default 'unknown',
  fact_rows int not null default 0,
  amount_sum numeric not null default 0,
  status text not null default 'ready' check (status in ('ready', 'failed')),
  created_at timestamptz not null default now()
);

create table public.spend_line (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batch (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  payment_date date,
  payment_date_raw text,
  party_code text,
  party_name text,
  item_code text,
  item_name text,
  uom text,
  qty numeric,
  unit_price numeric,
  amount numeric,
  plant_name text,
  expense_code text,
  payment_method text,
  description text,
  invoice text,
  note text,
  quality_flags jsonb not null default '[]'::jsonb
);

create index spend_line_batch_id_idx on public.spend_line (batch_id);
create index spend_line_user_id_idx on public.spend_line (user_id);
create index import_batch_user_id_idx on public.import_batch (user_id);

alter table public.import_batch enable row level security;
alter table public.spend_line enable row level security;

create policy "import_batch_owner_all"
  on public.import_batch for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "spend_line_owner_all"
  on public.spend_line for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 2: Apply migration to project `mcqarpgqsjpyzjkhquay`**

Use Supabase MCP `apply_migration` with name `hoai_spend` and the SQL above, **or** Supabase SQL editor. Verify with `list_tables`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260729120000_hoai_spend.sql supabase/README.md
git commit -m "feat(db): add import_batch and spend_line for HOAI POC"
```

---

### Task 2: Period year from filename + date normalize (TDD)

**Files:**
- Create: `src/lib/hoai/period-year.ts`
- Create: `src/lib/hoai/normalize-date.ts`
- Create: `src/lib/hoai/period-year.test.ts`
- Create: `src/lib/hoai/normalize-date.test.ts`

**Interfaces:**
- Produces:
  - `extractPeriodYearFromFilename(filename: string): number | null`
  - `parsePaymentDate(raw: unknown, periodYear: number): { date: string | null; raw: string | null; flags: string[] }`
    - `date` is ISO `yyyy-MM-dd` or null

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/hoai/period-year.test.ts
import { describe, expect, it } from "vitest";
import { extractPeriodYearFromFilename } from "./period-year";

describe("extractPeriodYearFromFilename", () => {
  it("reads year from annual filename", () => {
    expect(
      extractPeriodYearFromFilename("TH CHI TIẾT NĂM 2025 (HOAI) (1).xlsx"),
    ).toBe(2025);
  });
  it("reads year from VAT TU filename", () => {
    expect(extractPeriodYearFromFilename("VAT TU T12-2025 (HOAI).xlsx")).toBe(
      2025,
    );
  });
  it("returns null when missing", () => {
    expect(extractPeriodYearFromFilename("bao-cao.xlsx")).toBeNull();
  });
});
```

```ts
// src/lib/hoai/normalize-date.test.ts
import { describe, expect, it } from "vitest";
import { parsePaymentDate } from "./normalize-date";

describe("parsePaymentDate", () => {
  it("parses DDMM number 412 as 2025-12-04", () => {
    const r = parsePaymentDate(412, 2025);
    expect(r.date).toBe("2025-12-04");
  });
  it("parses 1812 as 2025-12-18", () => {
    expect(parsePaymentDate(1812, 2025).date).toBe("2025-12-18");
  });
  it("keeps Excel Date objects", () => {
    const r = parsePaymentDate(new Date(2025, 11, 4), 2025);
    expect(r.date).toBe("2025-12-04");
  });
  it("flags invalid", () => {
    const r = parsePaymentDate("abc", 2025);
    expect(r.date).toBeNull();
    expect(r.flags).toContain("invalid_date");
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `pnpm test src/lib/hoai/period-year.test.ts src/lib/hoai/normalize-date.test.ts`  
Expected: FAIL (modules missing)

- [ ] **Step 3: Implement**

```ts
// src/lib/hoai/period-year.ts
export function extractPeriodYearFromFilename(filename: string): number | null {
  const m = filename.match(/(?:19|20)\d{2}/);
  if (!m) return null;
  const y = Number(m[0]);
  return y >= 2000 && y <= 2100 ? y : null;
}
```

```ts
// src/lib/hoai/normalize-date.ts
function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function parsePaymentDate(
  raw: unknown,
  periodYear: number,
): { date: string | null; raw: string | null; flags: string[] } {
  const flags: string[] = [];
  if (raw == null || raw === "") {
    return { date: null, raw: null, flags: ["missing_date"] };
  }
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    const iso = `${raw.getFullYear()}-${pad(raw.getMonth() + 1)}-${pad(raw.getDate())}`;
    return { date: iso, raw: String(raw), flags };
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    // Excel serial dates are typically > 30000 for 2020s; DDMM ints are smaller
    if (raw > 20000) {
      // Excel serial → treat via SheetJS date code in parse layer; here flag
      flags.push("excel_serial_unhandled");
      return { date: null, raw: String(raw), flags };
    }
    const s = String(Math.trunc(raw));
    let day: number;
    let month: number;
    if (s.length <= 2) {
      flags.push("invalid_date");
      return { date: null, raw: s, flags };
    }
    if (s.length === 3) {
      day = Number(s.slice(0, 1));
      month = Number(s.slice(1));
    } else {
      day = Number(s.slice(0, s.length - 2));
      month = Number(s.slice(-2));
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      flags.push("invalid_date");
      return { date: null, raw: s, flags };
    }
    return {
      date: `${periodYear}-${pad(month)}-${pad(day)}`,
      raw: s,
      flags,
    };
  }
  const str = String(raw).trim();
  const dmy = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    let year = Number(dmy[3]);
    if (year < 100) year += 2000;
    return {
      date: `${year}-${pad(month)}-${pad(day)}`,
      raw: str,
      flags,
    };
  }
  flags.push("invalid_date");
  return { date: null, raw: str, flags };
}
```

Update Excel-serial handling in Task 4 via `xlsx` `SFS` date parse; adjust test if you convert serials before calling `parsePaymentDate`.

- [ ] **Step 4: Run tests — expect PASS**

Run: `pnpm test src/lib/hoai/period-year.test.ts src/lib/hoai/normalize-date.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/lib/hoai/period-year.ts src/lib/hoai/normalize-date.ts src/lib/hoai/*.test.ts
git commit -m "feat(hoai): parse period year and payment dates"
```

---

### Task 3: Classify batch kind + map fact row (TDD)

**Files:**
- Create: `src/lib/hoai/types.ts`
- Create: `src/lib/hoai/classify-batch.ts`
- Create: `src/lib/hoai/map-fact-row.ts`
- Create: `src/lib/hoai/classify-batch.test.ts`
- Create: `src/lib/hoai/map-fact-row.test.ts`

**Interfaces:**
- Produces:
  - `classifyBatchKind(filename: string, sheetNames: string[]): 'annual' | 'period' | 'unknown'`
  - `mapFactRow(cells: unknown[], periodYear: number): SpendLineDraft | null`
  - type `SpendLineDraft` matching DB fields (without ids)

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { classifyBatchKind } from "./classify-batch";
import { mapFactRow } from "./map-fact-row";

describe("classifyBatchKind", () => {
  it("detects annual from filename", () => {
    expect(
      classifyBatchKind("TH CHI TIẾT NĂM 2025 (HOAI).xlsx", ["BANG CHI TIET"]),
    ).toBe("annual");
  });
  it("detects period from VAT TU", () => {
    expect(classifyBatchKind("VAT TU T12-2025 (HOAI).xlsx", ["MKH"])).toBe(
      "period",
    );
  });
});

describe("mapFactRow", () => {
  it("maps a material line", () => {
    const row = mapFactRow(
      [412, "NM90", "THIÊN NAM PHÁT", "CÁI", "DB77", "DÂY CUROA B77", 6, 53000, 318000, "mua", "KHO", "MÁY CÁM", "t53", "A", null, "TM", "HD1", ""],
      2025,
    );
    expect(row?.expense_code).toBe("T53");
    expect(row?.amount).toBe(318000);
    expect(row?.plant_name).toBe("MÁY CÁM");
    expect(row?.payment_date).toBe("2025-12-04");
  });
  it("returns null for empty row", () => {
    expect(mapFactRow([], 2025)).toBeNull();
  });
  it("flags amount mismatch", () => {
    const row = mapFactRow(
      [412, "X", "Y", null, null, "Z", 2, 100, 999, null, null, "NM", "T01", null, null, "TM", null, null],
      2025,
    );
    expect(row?.quality_flags).toContain("amount_mismatch");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement types + functions**

```ts
// src/lib/hoai/types.ts
export type BatchKind = "annual" | "period" | "unknown";

export type SpendLineDraft = {
  payment_date: string | null;
  payment_date_raw: string | null;
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
  quality_flags: string[];
};

export type ParsedWorkbookPreview = {
  sheetNames: string[];
  hasFactSheet: boolean;
  batchKind: BatchKind;
  suggestedPeriodYear: number | null;
  lines: SpendLineDraft[];
  factRows: number;
  amountSum: number;
};
```

```ts
// classify-batch.ts — uppercase filename; if includes NĂM or "NAM 20" → annual;
// if includes "VAT TU" or /T\d{1,2}-20/ → period; else unknown

// map-fact-row.ts — column index order matching BANG CHI TIET header;
// uppercase codes; coerce numbers; call parsePaymentDate;
// if qty!=null && unit_price!=null && amount!=null && Math.abs(qty*unit_price-amount)>1 → amount_mismatch
// return null if all measure/identity fields blank
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(hoai): classify batch kind and map fact rows"
```

---

### Task 4: Parse workbook client-side (SheetJS)

**Files:**
- Create: `src/lib/hoai/parse-workbook.ts`
- Create: `src/lib/hoai/parse-workbook.test.ts` (build tiny workbook with `xlsx` utils)
- Modify: `package.json` — add dependency `xlsx` and `@types/xlsx` if needed

**Interfaces:**
- Consumes: `classifyBatchKind`, `mapFactRow`, `extractPeriodYearFromFilename`
- Produces: `parseHoaiWorkbook(file: ArrayBuffer, filename: string): ParsedWorkbookPreview`
  - Finds sheet whose normalized name is `BANGCHI TIET` / `BANG CHI TIET` (strip spaces, casefold)
  - Header detection: first 10 rows, pick row containing `THÀNH TIỀN` and `Ngày`
  - Data from next row; skip plant tabs

- [ ] **Step 1: Install**

```bash
pnpm add xlsx
pnpm add -D @types/xlsx
```

- [ ] **Step 2: Write test that builds a minimal sheet in memory**

Use `XLSX.utils.aoa_to_sheet` + `book_new` / `book_append_sheet` / `write` → `parseHoaiWorkbook`. Expect 1 mapped line and `hasFactSheet: true`.

- [ ] **Step 3: Implement `parseHoaiWorkbook`**

Normalize sheet name: `name.normalize('NFC').toUpperCase().replace(/\s+/g,'')` equals `BANGCHITIET`.

- [ ] **Step 4: Run `pnpm test src/lib/hoai/parse-workbook.test.ts` — PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(hoai): parse BANG CHI TIET from xlsx"
```

---

### Task 5: Vietnamese format helpers

**Files:**
- Create: `src/lib/hoai/format.ts`
- Create: `src/lib/hoai/format.test.ts`

**Interfaces:**
- Produces:
  - `formatVnd(n: number): string` using `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })`
  - `formatViDate(iso: string | null): string` → `dd/MM/yyyy` or `—`

- [ ] **Step 1–4: TDD implement + commit**

```bash
git commit -m "feat(hoai): add vi-VN money and date formatters"
```

---

### Task 6: Persist import (Server Actions, chunked)

**Files:**
- Create: `src/app/app/actions/import-spend.ts`

**Interfaces:**
- Produces:
  - `createImportBatch(input: { source_filename: string; period_year: number; batch_kind: BatchKind; fact_rows: number; amount_sum: number }): Promise<{ batchId: string } | { error: string }>`
  - `insertSpendLinesChunk(batchId: string, lines: SpendLineDraft[]): Promise<{ error: string | null }>`
  - Chunk size constant `SPEND_LINE_CHUNK = 400`

- [ ] **Step 1: Implement server actions** using `createClient()` from `@/lib/supabase/server`, `auth.getUser()`, insert batch then lines with `user_id` set. Return Vietnamese error strings (`"Bạn cần đăng nhập."`, `"Không lưu được dữ liệu."`).

- [ ] **Step 2: Manual smoke** — temporary call from a logged-in session with 2 fake lines; verify in Supabase table editor.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(hoai): server actions to save import batches"
```

---

### Task 7: Upload wizard UI (Vietnamese)

**Files:**
- Create: `src/components/hoai/upload-wizard.tsx`
- Create: `src/components/hoai/confirm-import.tsx`
- Create: `src/app/app/uploads/page.tsx`
- Modify: `src/components/app/shell-header.tsx` or add `src/components/app/app-nav.tsx`
- Modify: `src/app/app/page.tsx` — links to Tải lên / Phân tích

**Interfaces:**
- Consumes: `parseHoaiWorkbook`, `createImportBatch`, `insertSpendLinesChunk`
- UX steps: (1) chọn file → parse (2) xác nhận năm + xem số dòng/tổng tiền → (3) lưu theo chunk + thanh tiến trình → redirect `/app/analytics?batch=`

- [ ] **Step 1: Build `uploads/page.tsx` with title `Tải lên Excel HOAI`**

- [ ] **Step 2: `UploadWizard`** — `<input type="file" accept=".xlsx,.xls" />`, on change `file.arrayBuffer()` → `parseHoaiWorkbook`. If `!hasFactSheet`, show `Không tìm thấy sheet BANG CHI TIET.`

- [ ] **Step 3: `ConfirmImport`** — fields:
  - Loại file: `Cả năm` / `Theo kỳ` / `Không xác định`
  - Năm hạch toán: number input (default `suggestedPeriodYear ?? new Date().getFullYear()`)
  - Số dòng, Tổng thành tiền (`formatVnd`)
  - Buttons: `Hủy`, `Xác nhận nhập`

- [ ] **Step 4: On confirm** — re-map lines if year changed (re-run `mapFactRow` path: easiest re-parse file from kept `ArrayBuffer` + new year). Then `createImportBatch` + loop chunks. Show `Đang lưu… {done}/{total}`.

- [ ] **Step 5: Nav** — `Trang chủ` | `Tải lên` | `Phân tích` | `Đăng xuất` in Vietnamese on `/app/*`.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(hoai): Vietnamese upload and confirm wizard"
```

---

### Task 8: Aggregations + analytics dashboard

**Files:**
- Create: `src/lib/hoai/aggregations.ts`
- Create: `src/lib/hoai/aggregations.test.ts`
- Create: `src/components/hoai/spend-bar-chart.tsx`
- Create: `src/components/hoai/analytics-dashboard.tsx`
- Create: `src/app/app/analytics/page.tsx`
- Modify: `package.json` — `pnpm add recharts`

**Interfaces:**
- Produces:
  - `sumBy(lines, key): { label: string; amount: number }[]` sorted desc, top N optional
  - `sumByMonth(lines): { label: string; amount: number }[]` using `payment_date` slice `yyyy-MM`
- Dashboard loads batches for user; selected batch id from searchParams; fetch lines `select * from spend_line where batch_id = ?`.

- [ ] **Step 1: TDD aggregations**

```ts
expect(
  sumBy(
    [
      { plant_name: "A", amount: 100, expense_code: "T1" },
      { plant_name: "A", amount: 50, expense_code: "T2" },
      { plant_name: "B", amount: 20, expense_code: "T1" },
    ],
    "plant_name",
  ),
).toEqual([
  { label: "A", amount: 150 },
  { label: "B", amount: 20 },
]);
```

- [ ] **Step 2: Analytics page (Vietnamese)**

Layout:
1. Select `Lô dữ liệu` (filename + year + kind)
2. KPI: `Tổng chi`, `Số dòng`, `Số nhà máy`, `Số mã chi`
3. **Row of two equal charts:** `Chi theo nhà máy (NM)`, `Chi theo mã (MÃ)` — same height
4. Secondary: `Chi theo tháng`, `Chi theo hình thức thanh toán` (optional second row)
5. Table `Chi tiết` with columns matching Excel VN headers

- [ ] **Step 3: Empty state** — `Chưa có dữ liệu. Hãy tải lên file Excel.` + link to `/app/uploads`

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(hoai): analytics dashboard with NM and Ma charts"
```

---

### Task 9: End-to-end verification checklist

**Files:** none (manual)

- [ ] **Step 1:** `pnpm lint && pnpm typecheck && pnpm test`

- [ ] **Step 2:** Upload `VAT TU T12-2025 (HOAI).xlsx` — expect ~5.9k rows, amount sum order ~4.0B VND; charts render.

- [ ] **Step 3:** Upload annual file — new batch; switcher swaps charts.

- [ ] **Step 4:** Override year on confirm — dates use new year.

- [ ] **Step 5:** Confirm no English UI on `/app/uploads` and `/app/analytics`.

- [ ] **Step 6:** Commit any fixes; push for Vercel preview.

---

### Task 10 (optional P2): MKH code labels

**Files:**
- Extend parse to optional `code_master` rows from `MKH`
- Migration `code_master` if not done earlier
- Join labels on expense_code in chart tooltips

Skip unless P0–P1 stable. Prefer separate follow-up plan if large.

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| Both file formats + batch switcher | 3, 7, 8 |
| BANG CHI TIET only | 4 |
| Confirm year override | 7 |
| Charts NM + MÃ equal | 8 |
| Vietnamese UI / vi-VN | 5, 7, 8 |
| RLS owner-only | 1, 6 |
| Date DDMM normalize | 2, 4 |
| Amount mismatch flag | 3 |
| Ignore plant tabs | 4 |
| P2 MKH | 10 optional |
| P4 compare | Out of plan |

## Placeholder scan

No TBD steps; Excel serial edge handled in Task 2/4 with explicit path.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-29-hoai-excel-viz-poc.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — execute tasks in this session with checkpoints  

Which approach?

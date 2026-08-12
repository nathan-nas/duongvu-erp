# Excel header column mapping — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Map spend Excel columns by normalized header aliases so `T7_8894.xlsx`-style workbooks import correctly while preserving two-sheet validation, summaries, and commit flow.

**Architecture:** Add a pure header→field resolver; change sheet parsing to resolve indices once per sheet, convert date cells for resolved date columns, skip totals/blank rows, and map rows via field records. Keep `parseSpendWorkbook` / import API contracts unchanged aside from correct line payloads.

**Tech Stack:** TypeScript, SheetJS (`xlsx`), Vitest, existing `src/lib/spend/*` + `src/api/import-spend.ts`.

## Global Constraints

- UI copy remains Vietnamese.
- Required sheets stay `VẬT TƯ NHÀ MÁY` then `VẬT TƯ XE`; no `BANG CHI TIET` fallback.
- No Postgres / RPC / analytics schema changes.
- Do not import `MÃ NCC` or plant tabs.
- Author commits as `nathan-nas <77968170+nathan-nas@users.noreply.github.com>` (per-command env only).
- Spec: `docs/superpowers/specs/2026-08-11-excel-header-column-mapping-design.md`.

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/spend/header-aliases.ts` | Normalize headers + alias table + `resolveColumnMap(headerRow)` |
| `src/lib/spend/header-aliases.test.ts` | Alias / conflict / legacy+new header fixtures |
| `src/lib/spend/map-fact-row.ts` | Map `Partial<Record<SpendFactField, unknown>>` → `SpendLineDraft` |
| `src/lib/spend/map-fact-row.test.ts` | Field-record mapping tests (new + legacy semantics) |
| `src/lib/spend/parse-workbook.ts` | Use column map, date conversion on mapped cols, skip totals |
| `src/lib/spend/parse-workbook.test.ts` | STT-first workbook + legacy alias workbook + totals skip |
| `src/lib/spend/types.ts` | Optional shared `SpendFactField` type if not colocated |

---

### Task 1: Header alias resolver

**Files:**
- Create: `src/lib/spend/header-aliases.ts`
- Create: `src/lib/spend/header-aliases.test.ts`
- Modify (optional): `src/lib/spend/types.ts` — export `SpendFactField` if shared

**Interfaces:**
- Produces:
  - `normalizeHeader(value: unknown): string`
  - `resolveColumnMap(headerRow: unknown[]): Partial<Record<SpendFactField, number>>`
  - `hasFactHeaders(headerRow: unknown[]): boolean` — true when both `payment_date` and `amount` resolve

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import {
  hasFactHeaders,
  normalizeHeader,
  resolveColumnMap,
} from "./header-aliases";

describe("header-aliases", () => {
  it("resolves T7-style headers including STT gap", () => {
    const map = resolveColumnMap([
      "STT",
      "NGÀY CHI TIỀN",
      "MÃ KH",
      "NCC",
      "NGÀY NHẬP HÀNG",
      "LOẠI HÀNG",
      "ĐV TÍNH",
      " SỐ LƯỢNG ",
      " ĐƠN GIÁ ",
      " THÀNH TIỀN ",
      "DIỄN GIẢI",
      "MÃ NV",
      "NGƯỜI MUA/NHẬN",
      "NHÀ MÁY",
      "HÌNH THỨC THANH TOÁN",
      "SỐ HĐ",
    ]);
    expect(map.payment_date).toBe(1);
    expect(map.party_name).toBe(3);
    expect(map.received_date).toBe(4);
    expect(map.item_name).toBe(5);
    expect(map.amount).toBe(9);
    expect(map.plant_name).toBe(13);
    expect(map.invoice).toBe(15);
    expect(hasFactHeaders(map as never) || hasFactHeaders([
      "STT", "NGÀY CHI TIỀN", /* ... */ "THÀNH TIỀN",
    ])).toBe(true);
  });

  it("resolves legacy aliases without STT", () => {
    const map = resolveColumnMap([
      "Ngày chi tiền",
      "Mã",
      "TÊN CỬA HÀNG",
      "ĐVT",
      "Mã hàng",
      "TÊN HÀNG",
      "S. LƯỢNG",
      "ĐƠN GIÁ",
      "THÀNH TIỀN",
      "DIỄN GIẢI",
      "Kho",
      "NM",
      "Mã chi",
      "NGƯỜI NHẬN",
      "PHIẾU NGÀY",
      "THANH TOÁN",
      "HÓA ĐƠN",
      "GHI CHÚ",
    ]);
    expect(map.payment_date).toBe(0);
    expect(map.party_name).toBe(2);
    expect(map.plant_name).toBe(11);
    expect(map.received_date).toBe(14);
    expect(map.note).toBe(17);
  });

  it("maps GHI CHÚ to note and leaves plant unset when NHÀ MÁY missing", () => {
    const map = resolveColumnMap([
      "STT",
      "NGÀY CHI TIỀN",
      "MÃ KH",
      "NCC",
      "NGÀY NHẬP HÀNG",
      "LOẠI HÀNG",
      "ĐV TÍNH",
      "SỐ LƯỢNG",
      "ĐƠN GIÁ",
      "THÀNH TIỀN",
      "DIỄN GIẢI",
      "MÃ NV",
      "NGƯỜI MUA",
      "GHI CHÚ",
      "HÌNH THỨC THANH TOÁN",
      "SỐ HĐ",
    ]);
    expect(map.note).toBe(13);
    expect(map.plant_name).toBeUndefined();
    expect(map.recipient_name).toBe(12);
  });
});
```

Adjust `hasFactHeaders` API in the test to match the implementation (row-based is fine).

- [ ] **Step 2: Run test — expect FAIL**

Run: `pnpm exec vitest run src/lib/spend/header-aliases.test.ts`

Expected: FAIL module not found / exports missing.

- [ ] **Step 3: Implement `header-aliases.ts`**

Implement `normalizeHeader`, ordered alias list (longer exact strings first), first-match wins per column, first column wins per field. Export `SpendFactField` union matching the design table. Implement `hasFactHeaders(row)` via `resolveColumnMap`.

- [ ] **Step 4: Run test — expect PASS**

Run: `pnpm exec vitest run src/lib/spend/header-aliases.test.ts`

- [ ] **Step 5: Commit**

```powershell
$env:GIT_AUTHOR_NAME = "nathan-nas"
$env:GIT_AUTHOR_EMAIL = "77968170+nathan-nas@users.noreply.github.com"
$env:GIT_COMMITTER_NAME = "nathan-nas"
$env:GIT_COMMITTER_EMAIL = "77968170+nathan-nas@users.noreply.github.com"
git add src/lib/spend/header-aliases.ts src/lib/spend/header-aliases.test.ts src/lib/spend/types.ts
git commit -m "feat(spend): add Excel header alias column resolver"
```

---

### Task 2: Remap `mapFactRow` to field records

**Files:**
- Modify: `src/lib/spend/map-fact-row.ts`
- Modify: `src/lib/spend/map-fact-row.test.ts`

**Interfaces:**
- Consumes: `SpendFactField` from Task 1
- Produces: `mapFactRow(fields: Partial<Record<SpendFactField, unknown>>, periodYear: number): SpendLineDraft | null`
- Blank/totals rule: return `null` when payment date raw empty AND no meaningful party/item identity; also `null` when only amount is present (totals row)

- [ ] **Step 1: Rewrite tests for field-record API**

Replace positional arrays with objects, e.g.:

```ts
mapFactRow(
  {
    payment_date: 412,
    party_code: "NM90",
    party_name: "THIÊN NAM PHÁT",
    uom: "CÁI",
    item_code: "DB77",
    item_name: "DÂY CUROA B77",
    qty: 6,
    unit_price: 53000,
    amount: 318000,
    description: "mua",
    plant_name: "MÁY CÁM",
    expense_code: "t53",
    recipient_name: "CHINH",
    received_date: "2/12",
    payment_method: "TM",
    invoice: "HD1",
  },
  2025,
);
```

Add case: `{ amount: 3_791_312_856 }` → `null` (totals).
Add case: empty `{}` → `null`.

- [ ] **Step 2: Run test — expect FAIL** (signature / behavior)

Run: `pnpm exec vitest run src/lib/spend/map-fact-row.test.ts`

- [ ] **Step 3: Implement field-record mapping**

Keep quality flags (`missing_date`, `amount_mismatch`, `received_*`). Do not parse Excel serials here if still unhandled — caller converts date cells first; for string/Date/DDMM keep existing `parsePaymentDate`.

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```powershell
# same GIT_* author env as Task 1
git add src/lib/spend/map-fact-row.ts src/lib/spend/map-fact-row.test.ts
git commit -m "feat(spend): map fact rows from header-resolved fields"
```

---

### Task 3: Wire `parseSpendWorkbook` to header maps

**Files:**
- Modify: `src/lib/spend/parse-workbook.ts`
- Modify: `src/lib/spend/parse-workbook.test.ts`

**Interfaces:**
- Consumes: `hasFactHeaders`, `resolveColumnMap`, new `mapFactRow`
- Produces: unchanged `ParsedWorkbookPreview` shape

- [ ] **Step 1: Update workbook fixtures / tests**

1. **STT-first fixture** mirroring `T7_8894` headers on both sheets; NM row with plant; XE row with `GHI CHÚ`; include a totals-only row after header; assert it is skipped; assert merged counts and key fields.
2. Keep / adapt **missing sheet** and **unreadable header** tests.
3. Keep a **legacy alias header** sheet (no STT) still producing correct `payment_date` / `party_name` / `amount`.
4. Remove reliance on positional `cells[0]` / `cells[14]` in parser.

Example expectations for STT-first:

```ts
expect(preview.hasFactSheet).toBe(true);
expect(preview.factRows).toBe(2); // 1 NM + 1 XE after skipping totals
expect(preview.lines[0]).toEqual(
  expect.objectContaining({
    party_name: "CÔNG TY TNHH MTV TÍN THỊNH",
    amount: 13_824_000,
    plant_name: "NHÀ MÁY",
    recipient_name: "S DƯƠNG",
  }),
);
```

For date serials in fixtures, set `cell.z` date format like existing tests and ensure parser runs `dateCellValue` on resolved `payment_date` / `received_date` indices.

- [ ] **Step 2: Run parse tests — expect FAIL**

Run: `pnpm exec vitest run src/lib/spend/parse-workbook.test.ts`

- [ ] **Step 3: Implement parser changes**

In `parseRequiredSheet`:

1. Find `headerRowIndex` with `hasFactHeaders`.
2. `columnMap = resolveColumnMap(rows[headerRowIndex])`.
3. For each data row, build `fields` from `columnMap`; for date fields read sheet cell via `encode_cell` + `dateCellValue`.
4. `mapFactRow(fields, periodYear)`; filter nulls.
5. Keep sheet summary + merge order.

Replace old `hasExpectedHeaders` with `hasFactHeaders`.

- [ ] **Step 4: Run parse + map + alias tests — expect PASS**

Run: `pnpm exec vitest run src/lib/spend/header-aliases.test.ts src/lib/spend/map-fact-row.test.ts src/lib/spend/parse-workbook.test.ts`

- [ ] **Step 5: Commit**

```powershell
git add src/lib/spend/parse-workbook.ts src/lib/spend/parse-workbook.test.ts
git commit -m "feat(spend): parse workbooks using header column maps"
```

---

### Task 4: Regression gate + optional import-action smoke

**Files:**
- Modify only if `import-spend` tests hard-code positional previews: `src/api/import-spend.test.ts`

- [ ] **Step 1: Run full verification**

Run: `pnpm lint; pnpm typecheck; pnpm test`

Expected: all pass. Fix any call sites still using positional `mapFactRow`.

- [ ] **Step 2: Manual sanity (optional)** — if local file available, script or temporary test reading `T7_8894.xlsx` should report ~1071 + ~6 lines and amount sums near sheet totals (NM ~3,791,312,856; XE ~2,637,000,000). Do not commit the binary.

- [ ] **Step 3: Commit any test fixes**

```powershell
git add src/api/import-spend.test.ts # only if touched
git commit -m "test(spend): align import tests with header-mapped parser"
```

(Skip empty commit if nothing changed.)

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Header alias mapping | Task 1 |
| T7 STT-first layout | Task 3 |
| Legacy aliases | Tasks 1 + 3 |
| XE `GHI CHÚ` → note | Tasks 1 + 3 |
| Skip totals / blank | Task 2 (+ 3 fixture) |
| Date serial conversion on mapped cols | Task 3 |
| Two-sheet validation unchanged | Task 3 |
| No schema / extra sheets | Global constraints |
| lint / typecheck / test | Task 4 |

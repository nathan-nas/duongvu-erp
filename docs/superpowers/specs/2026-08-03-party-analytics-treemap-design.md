# Chi theo đối tác — analytics treemap

**Date:** 2026-08-03  
**Status:** Approved

## Summary

Add a third analytics treemap on **Phân tích** that groups spend by supplier/counterparty (**đối tác**), using a composite label from `party_code` + `party_name`. Clicking a block opens the existing paged line detail panel with total spent on that party.

## Goals

- Let users see spend concentration by đối tác within the selected **Kỳ giao dịch**
- Drill into contributing spend lines (hàng hóa, qty, amount, …) with **Tải thêm**
- Reuse plant / expense patterns (SQL agg + `spend_lines_page` branch)

## Non-goals

- KPI “Số đối tác”
- Item-level rollup before lines
- URL deep-link `?party=`
- Master NCC / supplier table or org schema
- Client-side aggregation of full date ranges

## Identity

Composite label (em dash separator), identical in agg RPC and page filter:

```text
{party_code or —} — {party_name or —}
```

Exclude rows where both code and name are null/blank. One side missing still forms a label (e.g. `N001 — —`).

## Architecture

1. RPC `spend_agg_by_party(p_from, p_to, p_top)` → `(label, amount, count)`
2. `spend_lines_page` filter kind `party` matches the same label expression
3. RSC loads aggregates; dashboard shows full-width treemap between plant/expense row and monthly chart
4. Click → `fetchSpendLinesPage` with `filterKind: "party"` → `DetailSheet` + **Tải thêm**

## Security

- `SECURITY INVOKER` RPCs; RLS on `spend_line` via `auth.uid() = user_id`
- Grant `EXECUTE` to `authenticated` only

## UI (Vietnamese)

- Card title: **Chi theo đối tác**
- Hint: **Nhấn biểu đồ để lọc chi tiết**
- Drill title: `Đối tác: {label}`
- Detail columns unchanged (existing line sheet)

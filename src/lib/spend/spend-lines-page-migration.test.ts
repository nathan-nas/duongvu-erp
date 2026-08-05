import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationName =
  "20260804161726_spend_line_receipt_columns_rpc_v2.sql";
const migrationPath = resolve(
  process.cwd(),
  "supabase",
  "migrations",
  migrationName,
);
const sql = readFileSync(migrationPath, "utf8");

describe("spend_lines_page receipt migration", () => {
  it("runs after the party/item analytics migrations", () => {
    expect(migrationName > "20260803130000_spend_item_label_display.sql").toBe(
      true,
    );
    expect(
      existsSync(
        resolve(
          process.cwd(),
          "supabase",
          "migrations",
          "20260803032751_spend_line_receipt_columns.sql",
        ),
      ),
    ).toBe(false);
  });

  it("exposes one seven-argument RPC contract with receipt fields", () => {
    expect(sql.match(/create function public\.spend_lines_page\s*\(/g)).toHaveLength(
      1,
    );
    expect(sql).toContain(
      "drop function if exists public.spend_lines_page(date, date, text, text, int, int);",
    );
    expect(sql).toContain(
      "drop function if exists public.spend_lines_page(date, date, text, text, int, int, text);",
    );
    expect(sql).toMatch(/p_item_label text default null\s*\)/);
    expect(sql).toMatch(/returns table \([\s\S]*received_date date/);
    expect(sql).toMatch(/returns table \([\s\S]*recipient_name text/);
  });

  it("keeps every optimized filter branch and the item filter", () => {
    expect(sql).toContain("if v_kind = 'all' then");
    expect(sql).toContain("elsif v_kind = 'plant_name' then");
    expect(sql).toContain("elsif v_kind = 'expense_code' then");
    expect(sql).toContain("elsif v_kind = 'month' then");
    expect(sql).toContain("elsif v_kind = 'party' then");
    expect(sql).toContain(
      "public.spend_item_label(s.item_code, s.item_name) = v_item",
    );
    expect(sql.match(/s\.received_date/g)).toHaveLength(6);
    expect(sql.match(/s\.recipient_name/g)).toHaveLength(6);
  });

  it("preserves RLS and restricts Data API execution", () => {
    expect(sql).toContain("security invoker");
    expect(sql).toContain(
      "revoke all on function public.spend_lines_page(date, date, text, text, int, int, text) from public;",
    );
    expect(sql).toContain(
      "grant execute on function public.spend_lines_page(date, date, text, text, int, int, text) to authenticated;",
    );
  });
});

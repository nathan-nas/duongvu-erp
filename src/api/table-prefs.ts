"use server";

import { createClient } from "@/lib/supabase/server";
import {
  isTablePrefId,
  type TableColumnPrefPayload,
  type TablePrefId,
} from "@/lib/table-prefs/types";

const LOGIN_REQUIRED = "Bạn cần đăng nhập.";
const INVALID_TABLE = "Bảng không hợp lệ.";
const SAVE_FAILED = "Không lưu được tùy chọn cột.";
const LOAD_FAILED = "Không tải được tùy chọn cột.";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { supabase, user: null as null, error: LOGIN_REQUIRED };
  }

  return { supabase, user, error: null as null };
}

function normalizePayload(
  prefs: TableColumnPrefPayload,
): TableColumnPrefPayload | { error: string } {
  if (!Array.isArray(prefs.columnOrder) || !Array.isArray(prefs.visibleIds)) {
    return { error: SAVE_FAILED };
  }
  if (
    prefs.widths == null ||
    typeof prefs.widths !== "object" ||
    Array.isArray(prefs.widths)
  ) {
    return { error: SAVE_FAILED };
  }

  const widths: Record<string, number> = {};
  for (const [key, value] of Object.entries(prefs.widths)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      widths[key] = Math.round(value);
    }
  }

  return {
    columnOrder: prefs.columnOrder.filter((id) => typeof id === "string"),
    visibleIds: prefs.visibleIds.filter((id) => typeof id === "string"),
    widths,
  };
}

export async function getTableColumnPrefs(
  tableId: string,
): Promise<
  { prefs: TableColumnPrefPayload | null } | { error: string }
> {
  if (!isTablePrefId(tableId)) {
    return { error: INVALID_TABLE };
  }

  const { supabase, user, error } = await requireUser();
  if (error || !user) return { error: error ?? LOGIN_REQUIRED };

  const { data, error: queryError } = await supabase
    .from("user_table_pref")
    .select("column_order, visible_ids, widths")
    .eq("user_id", user.id)
    .eq("table_id", tableId)
    .maybeSingle();

  if (queryError) {
    return { error: LOAD_FAILED };
  }

  if (!data) {
    return { prefs: null };
  }

  const widths =
    data.widths && typeof data.widths === "object" && !Array.isArray(data.widths)
      ? (data.widths as Record<string, number>)
      : {};

  return {
    prefs: {
      columnOrder: data.column_order ?? [],
      visibleIds: data.visible_ids ?? [],
      widths,
    },
  };
}

export async function upsertTableColumnPrefs(
  tableId: string,
  prefs: TableColumnPrefPayload,
): Promise<{ ok: true } | { error: string }> {
  if (!isTablePrefId(tableId)) {
    return { error: INVALID_TABLE };
  }

  const normalized = normalizePayload(prefs);
  if ("error" in normalized) return normalized;

  const { supabase, user, error } = await requireUser();
  if (error || !user) return { error: error ?? LOGIN_REQUIRED };

  const { error: upsertError } = await supabase.from("user_table_pref").upsert(
    {
      user_id: user.id,
      table_id: tableId as TablePrefId,
      column_order: normalized.columnOrder,
      visible_ids: normalized.visibleIds,
      widths: normalized.widths,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,table_id" },
  );

  if (upsertError) {
    return { error: SAVE_FAILED };
  }

  return { ok: true };
}

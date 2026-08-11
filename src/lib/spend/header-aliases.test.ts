import { describe, expect, it } from "vitest";
import {
  hasFactHeaders,
  normalizeHeader,
  resolveColumnMap,
} from "./header-aliases";

describe("normalizeHeader", () => {
  it("trims, uppercases, NFC-normalizes, and collapses whitespace", () => {
    expect(normalizeHeader("  Số   lượng  ")).toBe("SỐ LƯỢNG");
    expect(normalizeHeader(null)).toBe("");
    expect(normalizeHeader(undefined)).toBe("");
  });
});

describe("header-aliases", () => {
  it("resolves T7-style headers including STT gap", () => {
    const headerRow = [
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
    ];
    const map = resolveColumnMap(headerRow);
    expect(map.payment_date).toBe(1);
    expect(map.party_name).toBe(3);
    expect(map.received_date).toBe(4);
    expect(map.item_name).toBe(5);
    expect(map.amount).toBe(9);
    expect(map.plant_name).toBe(13);
    expect(map.invoice).toBe(15);
    expect(hasFactHeaders(headerRow)).toBe(true);
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

  it("returns false from hasFactHeaders when amount is missing", () => {
    expect(
      hasFactHeaders(["STT", "NGÀY CHI TIỀN", "NCC"]),
    ).toBe(false);
  });
});

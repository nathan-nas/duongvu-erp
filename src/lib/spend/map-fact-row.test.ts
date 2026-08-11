import { describe, expect, it } from "vitest";
import { mapFactRow } from "./map-fact-row";

describe("mapFactRow", () => {
  it("maps a material line", () => {
    const row = mapFactRow(
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
        recipient_name: "A",
        payment_method: "TM",
        invoice: "HD1",
      },
      2025,
    );
    expect(row?.expense_code).toBe("T53");
    expect(row?.amount).toBe(318000);
    expect(row?.plant_name).toBe("MÁY CÁM");
    expect(row?.payment_date).toBe("2025-12-04");
    expect(row?.recipient_name).toBe("A");
    expect(row?.received_date).toBeNull();
  });

  it("maps recipient and received date", () => {
    const row = mapFactRow(
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

    expect(row?.recipient_name).toBe("CHINH");
    expect(row?.received_date).toBe("2025-12-02");
    expect(row?.received_date_raw).toBe("2/12");
  });

  it("returns null for empty field record", () => {
    expect(mapFactRow({}, 2025)).toBeNull();
  });

  it("returns null for totals row with only amount", () => {
    expect(mapFactRow({ amount: 3_791_312_856 }, 2025)).toBeNull();
  });

  it("flags amount mismatch", () => {
    const row = mapFactRow(
      {
        payment_date: 412,
        party_code: "X",
        party_name: "Y",
        item_name: "Z",
        qty: 2,
        unit_price: 100,
        amount: 999,
        plant_name: "NM",
        expense_code: "T01",
        payment_method: "TM",
      },
      2025,
    );
    expect(row?.quality_flags).toContain("amount_mismatch");
  });
});

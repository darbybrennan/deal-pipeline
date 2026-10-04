import { formatCapRate, formatCurrency, pipelineMetrics, pricePerSF } from "@/lib/deals";
import type { BoardData } from "@/lib/kanban";

const board: BoardData = {
  columns: [
    { id: "a", title: "Sourcing", cardIds: ["1", "2"] },
    { id: "b", title: "LOI", cardIds: ["3"] },
    { id: "c", title: "Closed", cardIds: ["4"] },
  ],
  cards: {
    "1": { id: "1", title: "A", details: "", price: 10_000_000, cap_rate: 6 },
    "2": { id: "2", title: "B", details: "", price: 5_000_000, cap_rate: 7 },
    "3": { id: "3", title: "C", details: "" },
    "4": { id: "4", title: "D", details: "", price: 20_000_000, cap_rate: 5 },
  },
};

describe("pipelineMetrics", () => {
  it("separates active pipeline from closed deals", () => {
    expect(pipelineMetrics(board)).toEqual({
      activeDeals: 3,
      activeValue: 15_000_000,
      avgCapRate: 6.5,
      closedValue: 20_000_000,
    });
  });

  it("returns null average when no cap rates", () => {
    const empty: BoardData = { columns: [{ id: "a", title: "A", cardIds: [] }, { id: "z", title: "Closed", cardIds: [] }], cards: {} };
    expect(pipelineMetrics(empty).avgCapRate).toBeNull();
  });
});

describe("formatters", () => {
  it("formats currency compactly", () => {
    expect(formatCurrency(58_500_000)).toBe("$58.5M");
    expect(formatCurrency(1_250_000_000)).toBe("$1.25B");
    expect(formatCurrency(950_000)).toBe("$950K");
    expect(formatCurrency(null)).toBe("--");
  });

  it("formats cap rate", () => {
    expect(formatCapRate(6.25)).toBe("6.25%");
  });

  it("computes price per SF", () => {
    expect(pricePerSF({ id: "x", title: "x", details: "", price: 1_000_000, size_sf: 10_000 })).toBe(100);
    expect(pricePerSF({ id: "x", title: "x", details: "", price: 1_000_000 })).toBeNull();
  });
});

import type { BoardData, Card } from "@/lib/kanban";

export const formatCurrency = (value: number | null | undefined) => {
  if (value == null) return "--";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export const formatSF = (value: number | null | undefined) =>
  value == null ? "--" : `${value.toLocaleString("en-US")} SF`;

export const formatCapRate = (value: number | null | undefined) =>
  value == null ? "--" : `${value.toFixed(2)}%`;

export const pricePerSF = (card: Card) =>
  card.price != null && card.size_sf ? card.price / card.size_sf : null;

export type PipelineMetrics = {
  activeDeals: number;
  activeValue: number;
  avgCapRate: number | null;
  closedValue: number;
};

// The last column is treated as "closed"; everything before it is active pipeline.
export const pipelineMetrics = (board: BoardData): PipelineMetrics => {
  const lastIndex = board.columns.length - 1;
  const active = board.columns
    .slice(0, lastIndex)
    .flatMap((column) => column.cardIds.map((id) => board.cards[id]));
  const closed = (board.columns[lastIndex]?.cardIds ?? []).map((id) => board.cards[id]);
  const capRates = active
    .map((card) => card.cap_rate)
    .filter((rate): rate is number => rate != null);

  return {
    activeDeals: active.length,
    activeValue: active.reduce((sum, card) => sum + (card.price ?? 0), 0),
    avgCapRate: capRates.length
      ? capRates.reduce((sum, rate) => sum + rate, 0) / capRates.length
      : null,
    closedValue: closed.reduce((sum, card) => sum + (card.price ?? 0), 0),
  };
};

export type CashbackTier = {
  label: string;
  min: number;
  max: number;
  reward: {
    min: number;
    max: number;
  };
};

export const CASHBACK_TIERS: CashbackTier[] = [
  {
    label: "Holding below 500k tokens",
    min: 0,
    max: 500_000,
    reward: { min: 0.047, max: 0.1 },
  },
  {
    label: "Holding 500k - 1M tokens",
    min: 500_000,
    max: 1_000_000,
    reward: { min: 0.100, max: 0.221 },
  },
  {
    label: "Holding 1M - 5M tokens",
    min: 1_000_000,
    max: 5_000_000,
    reward: { min: 0.221, max: 0.388 },
  },
  {
    label: "Holding 5M - 10M tokens",
    min: 5_000_000,
    max: 10_000_000,
    reward: { min: 0.388, max: 1.500 },
  },
  {
    label: "Holding 10M+ tokens",
    min: 10_000_000,
    max: Number.POSITIVE_INFINITY,
    reward: { min: 0.0537, max: 0.0811 },
  },
];

export function findCashbackTier(holdingAmount: number): CashbackTier | null {
  return (
    CASHBACK_TIERS.find(
      (tier) => holdingAmount >= tier.min && holdingAmount < tier.max
    ) ?? null
  );
}

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
    reward: { min: 0.0027, max: 0.0054 },
  },
  {
    label: "Holding 500k - 1M tokens",
    min: 500_000,
    max: 1_000_000,
    reward: { min: 0.0054, max: 0.0121 },
  },
  {
    label: "Holding 1M - 5M tokens",
    min: 1_000_000,
    max: 5_000_000,
    reward: { min: 0.0161, max: 0.0268 },
  },
  {
    label: "Holding 5M - 10M tokens",
    min: 5_000_000,
    max: 10_000_000,
    reward: { min: 0.0359, max: 0.0537 },
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

export type ShippingChoice = {
  groupId: string;
  handle: string;
  title: string;
  amount: string;
  currencyCode: string;
  kind: "cheapest" | "faster";
};

/** Cheapest rate, plus one faster rate near the middle of the price range. */
export function customerShippingChoices(options: Omit<ShippingChoice, "kind">[]): ShippingChoice[] {
  const sorted = [...options].sort((a, b) => Number(a.amount) - Number(b.amount) || a.title.localeCompare(b.title));
  const cheapest = sorted[0];
  if (!cheapest) return [];
  const economy = { ...cheapest, kind: "cheapest" as const };
  const rest = sorted.filter((option) => option.groupId !== cheapest.groupId || option.handle !== cheapest.handle);
  if (!rest.length) {
    const low = Number(cheapest.amount);
    const middle = Math.max(Math.round(low) + 1, Math.round((low + low * 2) / 2));
    return [economy, { ...cheapest, title: "", amount: middle.toFixed(2), kind: "faster" }];
  }

  const low = Number(cheapest.amount);
  const high = Number(sorted[sorted.length - 1].amount);
  const middle = (low + high) / 2;
  const faster = rest.reduce((best, option) =>
    Math.abs(Number(option.amount) - middle) < Math.abs(Number(best.amount) - middle) ? option : best,
  );
  return [economy, { ...faster, kind: "faster" }];
}

/** Replace either price when a set amount is provided. */
export function withSetPrices(
  options: ShippingChoice[],
  prices: { cheapest: number | null; faster: number | null },
): ShippingChoice[] {
  if (!options.length || (prices.cheapest == null && prices.faster == null)) return options;
  const cheapest = options.find((option) => option.kind === "cheapest") ?? options[0];
  const faster = options.find((option) => option.kind === "faster");
  const cheap: ShippingChoice = {
    ...cheapest,
    kind: "cheapest",
    amount: prices.cheapest == null ? cheapest.amount : prices.cheapest.toFixed(2),
  };
  const fastAmount = prices.faster == null ? (faster?.amount ?? null) : prices.faster.toFixed(2);
  if (fastAmount == null) return [cheap];
  return [
    cheap,
    {
      ...(faster ?? { ...cheapest, title: "", kind: "faster" as const }),
      kind: "faster",
      title: prices.faster == null ? (faster?.title ?? "") : "",
      amount: fastAmount,
    },
  ];
}

export type ShippingChoice = {
  groupId: string;
  handle: string;
  title: string;
  description: string;
  amount: string;
  currencyCode: string;
  kind: "cheapest" | "faster" | "option";
};

export type ShippingSelection = {
  groupId: string;
  handle: string;
};

const DAY_RANGE = /(\d+)\s*(?:(?:-|–|—|to)\s*(\d+))?\s*(?:business\s+)?days?\b/i;

/** A transit window from a Shopify description, written in days. */
export function deliveryDays(text: string) {
  const match = text.match(DAY_RANGE);
  if (!match) return null;
  const min = Number(match[1]);
  const max = Number(match[2] ?? match[1]);
  if (!Number.isInteger(min) || !Number.isInteger(max) || min <= 0 || max < min) return null;
  return { min, max };
}

/** Usual domestic windows for services Shopify names but does not time. */
const SERVICE_WINDOWS: { test: RegExp; carrier: string; min: number; max: number }[] = [
  { test: /priority mail express|prioritymailexpress/i, carrier: "USPS", min: 1, max: 2 },
  { test: /priority mail|^priority$/i, carrier: "USPS", min: 1, max: 3 },
  { test: /ground advantage|groundadvantage/i, carrier: "USPS", min: 2, max: 5 },
  { test: /\bups next day air\b/i, carrier: "UPS", min: 1, max: 1 },
  { test: /\bups 2nd day air\b/i, carrier: "UPS", min: 2, max: 2 },
  { test: /\bups ground\b/i, carrier: "UPS", min: 1, max: 5 },
  { test: /\bfedex (?:priority overnight|standard overnight|first overnight)\b/i, carrier: "FedEx", min: 1, max: 1 },
  { test: /\bfedex 2day\b/i, carrier: "FedEx", min: 2, max: 2 },
  { test: /\bfedex (?:ground|home delivery)\b/i, carrier: "FedEx", min: 1, max: 5 },
  { test: /\bdhl express\b/i, carrier: "DHL", min: 1, max: 3 },
];

const CARRIER_PREFIX = /^(USPS|UPS|FedEx|DHL)\b/i;

function knownService(title: string) {
  const service = SERVICE_WINDOWS.find((item) => item.test.test(title));
  return service ? { carrier: service.carrier, days: { min: service.min, max: service.max } } : null;
}

export function formatDayRange(days: { min: number; max: number }) {
  return days.min === days.max ? String(days.min) : `${days.min}–${days.max}`;
}

/** Carrier and business days. Shopify's own day range wins when it sends one. */
function carrierName(prefix: string) {
  const name = prefix.toUpperCase();
  if (name === "FEDEX") return "FedEx";
  if (name === "DHL") return "DHL";
  return name;
}

export function shippingFacts(option: Pick<ShippingChoice, "title" | "description">) {
  const known = knownService(option.title);
  const prefix = option.title.match(CARRIER_PREFIX)?.[1] ?? "";
  return {
    carrier: known?.carrier ?? (prefix ? carrierName(prefix) : ""),
    days: deliveryDays(option.description) ?? known?.days ?? null,
  };
}

function transitDays(option: { title: string; description: string }) {
  return shippingFacts(option).days;
}

/** Every Shopify rate, cheapest first. Nothing is added or repriced. */
export function customerShippingChoices(
  options: Omit<ShippingChoice, "kind">[],
): ShippingChoice[] {
  const seen = new Set<string>();
  const unique: Omit<ShippingChoice, "kind">[] = [];
  for (const option of options) {
    const amount = Number(option.amount);
    const key = `${option.groupId}:${option.handle}`;
    if (!option.groupId || !option.handle || seen.has(key) || !Number.isFinite(amount)) continue;
    seen.add(key);
    unique.push({
      ...option,
      title: option.title.trim(),
      description: option.description.trim(),
      amount: option.amount,
    });
  }
  unique.sort((a, b) => Number(a.amount) - Number(b.amount) || a.title.localeCompare(b.title));
  const low = unique[0] ? Number(unique[0].amount) : null;
  const cheapestDays = unique[0] ? transitDays(unique[0]) : null;
  return unique.map((option) => {
    const cheapest = Number(option.amount) === low;
    const days = transitDays(option);
    const faster = !cheapest && cheapestDays != null && days != null && days.max < cheapestDays.min;
    return { ...option, kind: cheapest ? "cheapest" : faster ? "faster" : "option" };
  });
}

export type ShippingComparison = {
  priceDifference: string | null;
  daysDifference: number | null;
};

function cents(amount: string) {
  return Math.round(Number(amount) * 100);
}

/** Price and transit gaps versus the cheapest rate in the same delivery group. */
export function shippingComparison(option: ShippingChoice, options: ShippingChoice[]): ShippingComparison {
  const group = options.filter((item) => item.groupId === option.groupId && item.currencyCode === option.currencyCode);
  const low = group.reduce((min, item) => Math.min(min, cents(item.amount)), Number.POSITIVE_INFINITY);
  const baseline = group.find((item) => cents(item.amount) === low);
  const priceGap = cents(option.amount) - low;
  const baselineDays = baseline ? transitDays(baseline) : null;
  const days = transitDays(option);
  let daysDifference: number | null = null;
  if (baseline && baseline.handle !== option.handle && baselineDays && days) {
    if (days.max < baselineDays.min) daysDifference = baselineDays.min - days.max;
    else if (days.min > baselineDays.max) daysDifference = -(days.min - baselineDays.max);
  }
  return {
    priceDifference: priceGap > 0 ? (priceGap / 100).toFixed(2) : null,
    daysDifference,
  };
}

/** Sum of one confirmed Shopify rate per delivery group. */
export function selectedShippingTotal(
  options: ShippingChoice[],
  selected: ShippingSelection[],
): { amount: string; currencyCode: string } | null {
  const groups = [...new Set(options.map((option) => option.groupId))];
  if (!groups.length) return null;
  let total = 0;
  let currency = "";
  for (const groupId of groups) {
    const pick = selected.find((item) => item.groupId === groupId);
    const option = pick
      ? options.find((item) => item.groupId === groupId && item.handle === pick.handle)
      : undefined;
    if (!option) return null;
    if (!currency) currency = option.currencyCode;
    if (option.currencyCode !== currency) return null;
    const amount = Number(option.amount);
    if (!Number.isFinite(amount)) return null;
    total += amount;
  }
  return { amount: total.toFixed(2), currencyCode: currency };
}

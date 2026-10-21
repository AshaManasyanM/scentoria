import type { Money } from "./types";

export function discountPercent(price: Money, compare?: Money | null) {
  const priceAmount = Number(price.amount);
  const compareAmount = Number(compare?.amount);
  if (!compare || !(compareAmount > priceAmount) || !priceAmount) return null;
  return Math.round((1 - priceAmount / compareAmount) * 100);
}

export function formatMoney(money: Money, _locale = "en") {
  const n = Number(money.amount);
  const grouped = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  if (money.currencyCode === "AMD") return `${grouped}֏`;
  return `${grouped} ${money.currencyCode}`;
}

/** Shopify shipping amounts keep their cents so the summary matches checkout. */
export function formatExactMoney(money: Money) {
  const n = Number(money.amount);
  if (!Number.isFinite(n)) return "";
  if (money.currencyCode === "AMD") return formatMoney(money);
  const [whole, cents] = n.toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${grouped}.${cents} ${money.currencyCode}`;
}

export function sizeWithOz(title: string) {
  if (/\boz\b/i.test(title)) return title;
  const match = title.match(/(\d+(?:[.,]\d+)?)\s*ml\b/i);
  if (!match) return title;
  const ml = Number(match[1].replace(",", "."));
  if (!ml) return title;
  const oz = ml / 29.5735;
  const shown = oz < 1 ? oz.toFixed(2) : oz.toFixed(1);
  return `${title.trim()} / ${shown}oz`;
}

export function formatPriceRange(min: Money, max: Money, locale = "en") {
  if (min.amount === max.amount) return formatMoney(min, locale);
  return `${formatMoney(min, locale)} – ${formatMoney(max, locale)}`;
}

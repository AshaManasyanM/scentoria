import type { Money } from "./types";

export function formatMoney(money: Money, _locale = "en") {
  const n = Number(money.amount);
  const grouped = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  if (money.currencyCode === "AMD") return `${grouped}֏`;
  return `${grouped} ${money.currencyCode}`;
}

export function formatPriceRange(min: Money, max: Money, locale = "en") {
  if (min.amount === max.amount) return formatMoney(min, locale);
  return `${formatMoney(min, locale)} – ${formatMoney(max, locale)}`;
}

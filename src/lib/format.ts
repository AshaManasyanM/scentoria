import type { Money } from "./types";

const formatterCache = new Map<string, Intl.NumberFormat>();

export function formatMoney(money: Money, locale = "en") {
  const key = `${locale}-${money.currencyCode}`;
  let fmt = formatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale === "hy" ? "hy-AM" : "en-US", {
      style: "currency",
      currency: money.currencyCode === "AMD" ? "AMD" : money.currencyCode,
      maximumFractionDigits: 0,
    });
    formatterCache.set(key, fmt);
  }
  return fmt.format(Number(money.amount));
}

export function formatPriceRange(min: Money, max: Money, locale = "en") {
  if (min.amount === max.amount) return formatMoney(min, locale);
  return `${formatMoney(min, locale)} – ${formatMoney(max, locale)}`;
}

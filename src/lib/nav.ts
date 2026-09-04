import { path } from "./path";
import type { Locale } from "./types";

export const NAV = ["home", "about", "brands", "perfumes", "blog", "sales"] as const;
export type NavKey = (typeof NAV)[number];

export function hrefFor(locale: Locale, key: NavKey) {
  if (key === "home") return path(locale);
  if (key === "perfumes") return path(locale, "/products");
  return path(locale, `/${key}`);
}

import type { Locale } from "./types";

export function path(locale: Locale, href = "") {
  const suffix = href.startsWith("/") ? href : href ? `/${href}` : "";
  return `/${locale}${suffix}`;
}

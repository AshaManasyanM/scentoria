import type { Locale } from "./types";
import { en } from "./i18n/en";
import { es } from "./i18n/es";
import { hy } from "./i18n/hy";

export const locales: Locale[] = ["en", "hy", "es"];

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "hy" || value === "es";
}

export function parseLocale(value: string | null | undefined, fallback: Locale = "en"): Locale {
  return value && isLocale(value) ? value : fallback;
}

/** Shopify Storefront API LanguageCode for @inContext. */
export function shopifyLanguage(locale: Locale): "EN" | "HY" | "ES" {
  if (locale === "hy") return "HY";
  if (locale === "es") return "ES";
  return "EN";
}

export type Dictionary = typeof en;

export function getDict(locale: Locale): Dictionary {
  if (locale === "hy") return hy;
  if (locale === "es") return es;
  return en;
}

export { en, es, hy };

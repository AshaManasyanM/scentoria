import { isLocale } from "./i18n";
import type { Locale } from "./types";
import { notFound } from "next/navigation";

export async function localeFrom(
  params: Promise<{ locale: string }>,
): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

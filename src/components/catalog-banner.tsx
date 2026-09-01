import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import type { CatalogSource } from "@/lib/shopify/catalog";

export function CatalogBanner({
  locale,
  source,
}: {
  locale: Locale;
  source: CatalogSource;
}) {
  const t = getDict(locale);
  if (source === "shopify") {
    return (
      <p className="bg-bg-2 px-4 py-2 text-center text-xs text-gold">{t.liveBanner}</p>
    );
  }
  if (source === "empty") {
    return (
      <p className="bg-bg-2 px-4 py-2 text-center text-xs text-gold">{t.emptyCatalog}</p>
    );
  }
  return (
    <p className="bg-bg-2 px-4 py-2 text-center text-xs text-gold">{t.sampleBanner}</p>
  );
}

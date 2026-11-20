import { getDict, type Dictionary } from "@/lib/i18n";
import type { CatalogFilterGroup, FilterGroupId } from "@/lib/shopify/catalog";
import type { Locale } from "@/lib/types";

function occasionLabel(t: Dictionary, value: string, fallback: string) {
  const key = value.toLowerCase();
  if (key in t.occasions) return t.occasions[key as keyof typeof t.occasions];
  return fallback;
}

function choiceLabel(t: Dictionary, group: FilterGroupId, value: string, fallback: string) {
  if (group === "gender") {
    if (value === "men") return t.men;
    if (value === "women") return t.women;
    if (value === "unisex") return t.unisex;
  }
  if (group === "season" && value in t.seasons) {
    return t.seasons[value as keyof typeof t.seasons];
  }
  if (group === "occasion") return occasionLabel(t, value, fallback);
  if (group === "size") {
    if (value === "travel") return t.sizeTravel;
    if (value === "medium") return t.sizeMedium;
    if (value === "large") return t.sizeLarge;
  }
  return fallback;
}

/** Apply locale dictionary labels to Shopify filter option Display names when known. */
export function localizedFilterGroups(locale: Locale, groups: CatalogFilterGroup[]): CatalogFilterGroup[] {
  const t = getDict(locale);
  return groups.map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      label: choiceLabel(t, group.id, item.value, item.label),
    })),
  }));
}

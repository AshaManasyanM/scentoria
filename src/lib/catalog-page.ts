import { path } from "./path";
import type { Locale } from "./types";

export const CATALOG_PAGE_SIZE = 12;

type Query = Record<string, string | string[] | undefined>;

export function catalogSlice<T>(items: T[], rawPage: string | string[] | undefined) {
  const totalPages = Math.max(1, Math.ceil(items.length / CATALOG_PAGE_SIZE));
  const raw = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  const parsed = raw == null || raw === "" ? 1 : Number(raw);
  const valid = Number.isInteger(parsed) && parsed >= 1 && parsed <= totalPages;
  const page = valid ? parsed : Math.min(Math.max(Number.isInteger(parsed) ? parsed : 1, 1), totalPages);
  const start = (page - 1) * CATALOG_PAGE_SIZE;
  return {
    page,
    totalPages,
    items: items.slice(start, start + CATALOG_PAGE_SIZE),
    needsRedirect: raw != null && raw !== "" && !valid,
  };
}

export function catalogQuery(query: Query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key === "page" || value == null || value === "") continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item) params.append(key, item);
    }
  }
  return params.toString();
}

export function catalogHref(locale: Locale, basePath: string, query: Query, page: number) {
  const params = new URLSearchParams(catalogQuery(query));
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return path(locale, `${basePath}${qs ? `?${qs}` : ""}`);
}

export function pageList(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const wanted = [1, total, current - 1, current, current + 1].filter(
    (page, index, list) => page >= 1 && page <= total && list.indexOf(page) === index,
  );
  wanted.sort((a, b) => a - b);
  const pages: Array<number | "gap"> = [];
  for (const page of wanted) {
    const previous = pages[pages.length - 1];
    if (typeof previous === "number" && page - previous > 1) pages.push("gap");
    pages.push(page);
  }
  return pages;
}

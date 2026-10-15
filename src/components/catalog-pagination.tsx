"use client";

import { pageList } from "@/lib/catalog-page";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import { scrollToCatalog } from "@/lib/scroll-catalog";
import type { Locale } from "@/lib/types";
import { useRouter } from "next/navigation";

export function CatalogPagination({
  locale,
  page,
  totalPages,
  basePath,
  query,
}: {
  locale: Locale;
  page: number;
  totalPages: number;
  basePath: string;
  query: string;
}) {
  const t = getDict(locale);
  const router = useRouter();
  if (totalPages <= 1) return null;

  function go(next: number) {
    if (next === page || next < 1 || next > totalPages) return;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    const params = new URLSearchParams(query);
    if (next > 1) params.set("page", String(next));
    const qs = params.toString();
    router.push(path(locale, `${basePath}${qs ? `?${qs}` : ""}`), { scroll: false });
    scrollToCatalog();
  }

  const control =
    "inline-flex h-10 items-center justify-center rounded-[2px] border border-[#D8D0C4] bg-white text-xs font-semibold uppercase tracking-[0.08em] text-[#083534] transition-colors hover:border-[#c5a059] disabled:pointer-events-none disabled:opacity-40";

  return (
    <nav aria-label={t.pagination} className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <button type="button" className={`${control} px-4`} onClick={() => go(page - 1)} disabled={page <= 1}>
        {t.previousPage}
      </button>
      {pageList(page, totalPages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-[#083534]/50">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => go(item)}
            aria-current={item === page ? "page" : undefined}
            className={
              item === page
                ? "inline-flex h-10 min-w-10 items-center justify-center rounded-[2px] border border-[#083534] bg-[#083534] px-3 text-sm text-[#f7f2ea]"
                : `${control} min-w-10 px-3 normal-case tracking-normal`
            }
          >
            {item}
          </button>
        ),
      )}
      <button type="button" className={`${control} px-4`} onClick={() => go(page + 1)} disabled={page >= totalPages}>
        {t.nextPage}
      </button>
    </nav>
  );
}

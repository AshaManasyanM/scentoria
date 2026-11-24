"use client";

import { BrandLogoTile } from "@/components/brand-logo-tile";
import type { Locale } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

type BrandItem = {
  name: string;
  handle: string;
  logo?: string | null;
};

export function BrandLogoGrid({
  locale,
  brands,
  previousLabel,
  nextLabel,
  pageSizeMobile = 6,
  pageSizeDesktop = 8,
  className = "mt-6 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:mt-8 sm:grid-cols-3 sm:gap-3 md:gap-4 lg:grid-cols-4",
}: {
  locale: Locale;
  brands: BrandItem[];
  previousLabel: string;
  nextLabel: string;
  pageSizeMobile?: number;
  pageSizeDesktop?: number;
  className?: string;
}) {
  const [desktop, setDesktop] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const apply = () => setDesktop(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const pageSize = desktop ? pageSizeDesktop : pageSizeMobile;
  const pageCount = Math.max(1, Math.ceil(brands.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);

  useEffect(() => {
    setPage(0);
  }, [pageSize, brands.length]);

  const visible = useMemo(() => {
    const start = safePage * pageSize;
    return brands.slice(start, start + pageSize);
  }, [brands, pageSize, safePage]);

  if (!brands.length) return null;

  return (
    <div>
      <div className={className}>
        {visible.map((brand) => (
          <BrandLogoTile
            key={brand.handle}
            locale={locale}
            name={brand.name}
            handle={brand.handle}
            logo={brand.logo}
          />
        ))}
      </div>

      {pageCount > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-4 sm:mt-8">
          <button
            type="button"
            aria-label={previousLabel}
            disabled={safePage === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c5a059] text-[#083534] transition hover:bg-[#d4b46e] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <path d="M15 5 8 12l7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: pageCount }, (_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Page ${index + 1}`}
                aria-current={index === safePage ? "page" : undefined}
                onClick={() => setPage(index)}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  index === safePage ? "bg-[#c5a059]" : "bg-white/35 hover:bg-white/55"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label={nextLabel}
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c5a059] text-[#083534] transition hover:bg-[#d4b46e] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useWishlist } from "@/components/wishlist-provider";
import { formatPriceRange } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale, Product } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

export function WishlistItems({
  locale,
  products,
}: {
  locale: Locale;
  products: Product[];
}) {
  const t = getDict(locale);
  const { items, toggle } = useWishlist();
  const saved = items
    .map((item) => products.find((product) => product.handle === item.handle) ?? item)
    .filter(Boolean);

  return (
    <div>
      {saved.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center px-4 py-10 text-center">
          <svg viewBox="0 0 24 24" className="h-14 w-14 text-[#9a9188]" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M12 20s-7-4.4-7-9.2C5 8 6.8 6.2 9.2 6.2c1.4 0 2.5.7 2.8 1.8.3-1.1 1.4-1.8 2.8-1.8C17.2 6.2 19 8 19 10.8 19 15.6 12 20 12 20z" />
          </svg>
          <h1 className="mt-5 text-lg font-medium text-[#111]">{t.emptyWishlist}</h1>
          <Link href={path(locale, "/products")} className="mt-2 text-sm text-[#6b7280]">
            {t.emptyWishlistHint}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {saved.map((entry) => {
            const product = "minPrice" in entry ? entry : null;
            const handle = entry.handle;
            const brand = entry.brand;
            const title = entry.title;
            const image = "minPrice" in entry ? entry.images[0]?.url : entry.image;
            return (
              <article
                key={handle}
                className="flex w-full flex-col rounded-md border border-[#e6ddd2] bg-[#f6f1ea] p-3 text-[#083534]"
              >
                <Link href={path(locale, `/products/${handle}`)} className="relative block aspect-square overflow-hidden rounded-sm bg-white">
                  {product?.onSale ? (
                    <span className="absolute left-2 top-2 z-[1] bg-[#c53030] px-1.5 py-0.5 text-[11px] font-semibold text-white">
                      {product.discountLabel ?? "Sale"}
                    </span>
                  ) : null}
                  {image ? (
                    <Image src={image} alt="" fill sizes="260px" className="object-contain p-4" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-sm text-[#083534]/50">Scentoria</span>
                  )}
                </Link>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em]">{brand}</p>
                <h2 className="mt-1 text-sm leading-5">{title}</h2>
                {product ? (
                  <p className="mt-2 text-xs tracking-[0.08em] text-[#c5a059]">
                    ★★★★★ <span className="tracking-normal text-[#083534]/70">({product.reviewCount})</span>
                  </p>
                ) : null}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-sm">
                    {product ? formatPriceRange(product.minPrice, product.maxPrice, locale) : null}
                  </p>
                  <button
                    type="button"
                    aria-label={t.remove}
                    onClick={() =>
                      toggle({
                        handle,
                        title,
                        brand,
                        image,
                      })
                    }
                    className="shrink-0"
                  >
                    <svg width="18" height="16" viewBox="0 0 25 22" fill="none" aria-hidden>
                      <path
                        d="M22.5737 1.49585C19.8979 -0.784421 15.9185 -0.374265 13.4624 2.15991L12.5005 3.15112L11.5386 2.15991C9.0874 -0.374265 5.10303 -0.784421 2.42725 1.49585C-0.63916 4.11304 -0.800293 8.8103 1.94385 11.6472L11.3921 21.4031C12.0024 22.033 12.9937 22.033 13.604 21.4031L23.0522 11.6472C25.8013 8.8103 25.6401 4.11304 22.5737 1.49585Z"
                        fill="#083534"
                      />
                    </svg>
                  </button>
                </div>
                <Link
                  href={path(locale, `/products/${handle}`)}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-[2px] bg-[#083534] px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#f7f2ea]"
                >
                  {t.viewProduct}
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

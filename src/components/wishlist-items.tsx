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
      <h1 className="font-serif text-[28px] font-medium text-[#083534] md:text-[32px]">{t.yourWishlist}</h1>
      {saved.length === 0 ? (
        <div className="mt-8">
          <p className="text-[15px] leading-7 text-[#083534]">{t.emptyWishlist}</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#083534]/70">{t.emptyWishlistHint}</p>
          <Link
            href={path(locale, "/products")}
            className="mt-6 inline-flex rounded-[2px] bg-[#083534] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#f7f2ea]"
          >
            {t.viewAllProducts}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {saved.map((entry) => {
            const product = "minPrice" in entry ? entry : null;
            const handle = entry.handle;
            const brand = entry.brand;
            const title = entry.title;
            const image = product ? product.images[0]?.url : entry.image;
            return (
              <article
                key={handle}
                className="flex w-full max-w-[280px] flex-col rounded-md border border-[#e6ddd2] bg-[#f6f1ea] p-3 text-[#083534]"
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

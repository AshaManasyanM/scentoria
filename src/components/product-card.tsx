"use client";

import { useEffect, useState } from "react";
import { useWishlist } from "@/components/wishlist-provider";
import { formatPriceRange } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale, Product } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

export function ProductCard({
  product,
  locale,
  variant = "grid",
}: {
  product: Product;
  locale: Locale;
  variant?: "grid" | "slider";
}) {
  const t = getDict(locale);
  const img = product.images[0];
  const { has, toggle } = useWishlist();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const saved = ready && has(product.handle);
  const slider = variant === "slider";

  const badges = (
    <div className="absolute left-2 top-2 z-[1] flex flex-col items-start gap-1.5">
      {product.featured ? (
        <span className="inline-flex min-h-5 items-center rounded-l-md bg-black px-2 text-[14px] font-medium leading-[22px] text-white">
          Best seller
        </span>
      ) : null}
      {product.isNew ? (
        <span className="inline-flex min-h-5 items-center rounded-l-md bg-black px-2 text-[14px] font-medium leading-[22px] text-white">
          New
        </span>
      ) : null}
      {product.onSale ? (
        <span className="inline-flex min-h-5 items-center rounded-l-md bg-[#c53030] px-2 text-[14px] font-medium leading-[22px] text-white">
          {product.discountLabel ?? "Sale"}
        </span>
      ) : null}
    </div>
  );

  const heart = (
    <button
      type="button"
      aria-label={t.wishlist}
      onClick={() =>
        toggle({
          handle: product.handle,
          title: product.title,
          brand: product.brand,
          image: img?.url,
        })
      }
      className={
        slider
          ? "flex h-9 w-9 shrink-0 items-center justify-center text-fg"
          : "absolute right-5 top-5 z-10 rounded-full bg-white/90 p-1.5"
      }
    >
      <svg
        stroke="currentColor"
        fill="currentColor"
        strokeWidth="0"
        viewBox="0 0 512 512"
        height="20"
        width="20"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className={saved ? "text-sale" : "text-fg"}
      >
        <path d="M458.4 64.3C400.6 15.7 311.3 23 256 79.3 200.7 23 111.4 15.6 53.6 64.3-21.6 127.6-10.6 230.8 43 285.5l175.4 178.7c10 10.2 23.4 15.9 37.6 15.9 14.3 0 27.6-5.6 37.6-15.8L469 285.6c53.5-54.7 64.7-157.9-10.6-221.3zm-23.6 187.5L259.4 430.5c-2.4 2.4-4.4 2.4-6.8 0L77.2 251.8c-36.5-37.2-43.9-107.6 7.3-150.7 38.9-32.7 98.9-27.8 136.5 10.5l35 35.7 35-35.7c37.8-38.5 97.8-43.2 136.5-10.6 51.1 43.1 43.5 113.9 7.3 150.8z" />
      </svg>
    </button>
  );

  if (slider) {
    return (
      <div className="relative flex h-full w-full flex-col gap-[5px] rounded-[18px] bg-[#eee2d8] p-2 text-left">
        <Link
          href={path(locale, `/products/${product.handle}`)}
          className="relative block h-[270px] overflow-hidden rounded-[10px] bg-white"
        >
          {img ? (
            <Image
              src={img.url}
              alt={img.alt}
              fill
              sizes="(max-width: 768px) 50vw, 300px"
              className="object-contain p-5"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">Scentoria</div>
          )}
          {badges}
        </Link>
        <div className="mt-2 flex flex-col gap-1">
          <p className="font-[family-name:var(--font-tommy)] text-[18px] font-normal leading-[26px]">
            {product.brand}
          </p>
          <p className="font-[family-name:var(--font-tommy)] text-[17px] font-normal leading-6">
            {product.title}
          </p>
        </div>
        <p className="mt-1 font-[family-name:var(--font-tommy)] text-[14px] leading-[21px] text-fg">
          ★★★★★ <span>({product.reviewCount})</span>
        </p>
        <div className="mt-2 flex items-center justify-between">
          <p className="font-[family-name:var(--font-tommy)] text-base font-medium leading-[26px]">
            {formatPriceRange(product.minPrice, product.maxPrice, locale)}
          </p>
          {heart}
        </div>
        <div className="flex justify-center pt-2">
          <Link
            href={path(locale, `/products/${product.handle}`)}
            className="flex h-[50px] w-full items-center justify-center rounded-[14px] bg-gold px-4 font-[family-name:var(--font-tommy)] text-[17px] font-medium uppercase text-white hover:bg-gold-2"
          >
            {t.viewPerfume}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative rounded-2xl bg-bg-2 p-3">
      {heart}
      <Link href={path(locale, `/products/${product.handle}`)} className="block">
        <div className="relative overflow-hidden rounded-xl bg-white">
          <div className="relative aspect-square">
            {img ? (
              <Image
                src={img.url}
                alt={img.alt}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-contain p-4 transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted">Scentoria</div>
            )}
          </div>
          <div className="absolute left-3 top-3 flex flex-col gap-1">
            {product.featured ? (
              <span className="rounded-full bg-black px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
                Best seller
              </span>
            ) : null}
            {product.isNew ? (
              <span className="rounded-full bg-black px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
                New
              </span>
            ) : null}
            {product.onSale ? (
              <span className="rounded-full bg-sale px-2 py-0.5 text-[10px] text-white">
                {product.discountLabel ?? "Sale"}
              </span>
            ) : null}
          </div>
        </div>
        <div className="px-1 pb-3 pt-3">
          <p className="text-xs font-bold uppercase tracking-wide">{product.brand}</p>
          <h3 className="mt-1 font-serif text-lg">{product.title}</h3>
          <p className="mt-1 text-sm text-star">
            ★★★★★ <span className="text-muted">({product.reviewCount})</span>
          </p>
          <p className="mt-1 text-sm font-medium">
            {formatPriceRange(product.minPrice, product.maxPrice, locale)}
          </p>
          <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-gold group-hover:underline">
            {t.viewPerfume}
          </p>
        </div>
      </Link>
    </div>
  );
}

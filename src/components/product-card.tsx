"use client";

import { useEffect, useState } from "react";
import { useWishlist } from "@/components/wishlist-provider";
import { formatPriceRange } from "@/lib/format";
import { showWishlistNotice } from "@/lib/wishlist-notice";
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
  variant?: "grid" | "slider" | "feature" | "catalog";
}) {
  const t = getDict(locale);
  const img = product.images[0];
  const { has, toggle } = useWishlist();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const saved = ready && has(product.handle);
  const slider = variant === "slider";
  const feature = variant === "feature";
  const catalog = variant === "catalog";

  function onHeartClick(event: React.MouseEvent<HTMLButtonElement>) {
    const adding = !saved;
    toggle({
      handle: product.handle,
      title: product.title,
      brand: product.brand,
      image: img?.url,
    });
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      event.currentTarget.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }],
        { duration: 320, easing: "ease" },
      );
    }
    if (adding) showWishlistNotice(t.addedToWishlist);
  }

  const badges = (
    <div className="absolute left-2 top-2 z-[1] flex flex-col items-start gap-1.5">
      {product.featured ? (
        <span className="inline-flex min-h-5 items-center rounded-l-md bg-black px-1.5 text-[10px] font-medium leading-4 text-white md:px-2 md:text-[14px] md:leading-[22px]">
          Best seller
        </span>
      ) : null}
      {product.isNew ? (
        <span className="inline-flex min-h-5 items-center rounded-l-md bg-black px-1.5 text-[10px] font-medium leading-4 text-white md:px-2 md:text-[14px] md:leading-[22px]">
          New
        </span>
      ) : null}
      {product.onSale ? (
        <span className="inline-flex min-h-5 items-center rounded-l-md bg-[#c53030] px-1.5 text-[10px] font-medium leading-4 text-white md:px-2 md:text-[14px] md:leading-[22px]">
          {product.discountLabel ?? "Sale"}
        </span>
      ) : null}
    </div>
  );

  const heart = (
    <button
      type="button"
      aria-label={t.wishlist}
      onClick={onHeartClick}
          className={
        slider
          ? "flex h-8 w-8 items-center justify-center text-[#f7f2ea]"
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
        className={saved ? "h-3.5 w-3.5 text-sale md:h-5 md:w-5" : "h-3.5 w-3.5 text-fg md:h-5 md:w-5"}
      >
        <path d="M458.4 64.3C400.6 15.7 311.3 23 256 79.3 200.7 23 111.4 15.6 53.6 64.3-21.6 127.6-10.6 230.8 43 285.5l175.4 178.7c10 10.2 23.4 15.9 37.6 15.9 14.3 0 27.6-5.6 37.6-15.8L469 285.6c53.5-54.7 64.7-157.9-10.6-221.3zm-23.6 187.5L259.4 430.5c-2.4 2.4-4.4 2.4-6.8 0L77.2 251.8c-36.5-37.2-43.9-107.6 7.3-150.7 38.9-32.7 98.9-27.8 136.5 10.5l35 35.7 35-35.7c37.8-38.5 97.8-43.2 136.5-10.6 51.1 43.1 43.5 113.9 7.3 150.8z" />
      </svg>
    </button>
  );

  if (catalog) {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-md border border-[#D8D0C4] bg-[#F7F2EA] text-[#083534]">
        <Link href={path(locale, `/products/${product.handle}`)} className="relative block aspect-square overflow-hidden bg-white">
          {img ? (
            <Image src={img.url} alt={img.alt} fill sizes="220px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#083534]/50">Scentoria</div>
          )}
        </Link>
        <div className="flex flex-1 flex-col px-3 pb-3 pt-3">
          <h3 className="line-clamp-2 font-serif text-base font-medium leading-5">
            {product.brand} {product.title}
          </h3>
          <div className="mt-auto pt-3">
            <p className="text-xs tracking-[0.08em] text-[#c5a059]">
              ★★★★★ <span className="tracking-normal text-[#083534]/70">({product.reviewCount})</span>
            </p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-sm">{formatPriceRange(product.minPrice, product.maxPrice, locale)}</p>
              <button
                type="button"
                aria-label={t.wishlist}
                onClick={onHeartClick}
                className="shrink-0"
              >
                <svg width="18" height="16" viewBox="0 0 25 22" fill="none" aria-hidden>
                  <path
                    d="M22.5737 1.49585C19.8979 -0.784421 15.9185 -0.374265 13.4624 2.15991L12.5005 3.15112L11.5386 2.15991C9.0874 -0.374265 5.10303 -0.784421 2.42725 1.49585C-0.63916 4.11304 -0.800293 8.8103 1.94385 11.6472L11.3921 21.4031C12.0024 22.033 12.9937 22.033 13.604 21.4031L23.0522 11.6472C25.8013 8.8103 25.6401 4.11304 22.5737 1.49585Z"
                    fill={saved ? "#c5a059" : "#083534"}
                  />
                </svg>
              </button>
            </div>
            <div className="mt-3 flex justify-center">
              <Link
                href={path(locale, `/products/${product.handle}`)}
                className="inline-flex rounded-[2px] bg-[#c5a059] px-3 py-1.5 text-xs font-semibold text-[#083534]"
              >
                {t.viewProduct}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (feature) {
    return (
      <div className="flex h-full w-full flex-col text-left text-[#f7f2ea]">
        <Link
          href={path(locale, `/products/${product.handle}`)}
          className="relative block aspect-square overflow-hidden"
        >
          {img ? (
            <Image
              src={img.url}
              alt={img.alt}
              fill
              sizes="260px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[#0e4544] text-[#f7f2ea]/70">
              Scentoria
            </div>
          )}
        </Link>
        <div className="flex flex-1 flex-col bg-[#284747] px-3 pb-4 pt-3 md:px-4 md:pb-5 md:pt-4">
          <h3 className="font-serif text-lg font-medium leading-6 md:min-h-14 md:text-[22px] md:leading-7">
            {product.brand} {product.title}
          </h3>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.08em] text-[#c5a059] md:text-sm md:tracking-[0.12em]">
                ★★★★★{" "}
                <span className="tracking-normal text-[#f7f2ea]/80">({product.reviewCount})</span>
              </p>
              <p className="mt-1 text-sm text-[#f7f2ea] md:text-[15px]">
                {formatPriceRange(product.minPrice, product.maxPrice, locale)}
              </p>
            </div>
            <button
              type="button"
              aria-label={t.wishlist}
              onClick={onHeartClick}
              className="shrink-0"
            >
              <svg width="25" height="22" viewBox="0 0 25 22" fill="none" aria-hidden>
                <path
                  d="M22.5737 1.49585C19.8979 -0.784421 15.9185 -0.374265 13.4624 2.15991L12.5005 3.15112L11.5386 2.15991C9.0874 -0.374265 5.10303 -0.784421 2.42725 1.49585C-0.63916 4.11304 -0.800293 8.8103 1.94385 11.6472L11.3921 21.4031C12.0024 22.033 12.9937 22.033 13.604 21.4031L23.0522 11.6472C25.8013 8.8103 25.6401 4.11304 22.5737 1.49585Z"
                  fill={saved ? "#c5a059" : "#F5F5F5"}
                />
              </svg>
            </button>
          </div>
          <div className="mt-auto flex justify-center pt-4">
            <Link
              href={path(locale, `/products/${product.handle}`)}
              className="inline-flex rounded-[2px] bg-[#c5a059] px-5 py-[6.5px] text-sm font-semibold text-[#083534]"
            >
              {t.viewProduct}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (slider) {
    return (
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-white/20 bg-white/5 text-left text-[#f7f2ea]">
        <Link
          href={path(locale, `/products/${product.handle}`)}
          className="relative block aspect-square overflow-hidden bg-[#083534]"
        >
          {img ? (
            <Image
              src={img.url}
              alt={img.alt}
              fill
              sizes="(max-width: 768px) 50vw, 300px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">Scentoria</div>
          )}
          {badges}
        </Link>
        <span className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#083534]/55">
          {heart}
        </span>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-serif text-xl font-medium leading-7">
            {product.brand} {product.title}
          </h3>
          <p className="mt-1.5 text-sm tracking-[0.12em] text-[#c5a059]">
            ★★★★★ <span className="tracking-normal text-[#f7f2ea]/70">({product.reviewCount})</span>
          </p>
          <p className="mt-2 text-lg font-semibold text-[#c5a059]">
            {formatPriceRange(product.minPrice, product.maxPrice, locale)}
          </p>
          <Link
            href={path(locale, `/products/${product.handle}`)}
            className="btn-green mt-3.5 w-full"
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

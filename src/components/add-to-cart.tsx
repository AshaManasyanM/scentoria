"use client";

import { showCartNotice } from "@/lib/cart-notice";
import { useCart } from "./cart-provider";
import { ProductPrice, useProductSelection } from "./product-selection";
import { sizeWithOz } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { BottleColor, Locale, ProductVariant } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const RANDOM_BOTTLE_COLOR = "random";

function normalizeBottleSize(value: string) {
  const compact = value.toLowerCase().replace(/\s+/g, "");
  const ml = compact.match(/(\d+(?:\.\d+)?)ml/);
  return ml ? `${ml[1]}ml` : compact;
}

function colorsForSize(colors: BottleColor[], variantTitle: string) {
  const title = normalizeBottleSize(variantTitle);
  if (!title) return [];
  return colors.filter((color) => {
    if (!color.sizes.length || !color.image) return false;
    return color.sizes.some((size) => normalizeBottleSize(size) === title);
  });
}

function stockText(variant: ProductVariant, t: ReturnType<typeof getDict>) {
  if (variant.available) return null;
  return t.outOfStock;
}

function withCheckoutDiscount(url: string, code: string) {
  if (!code.trim()) return url;
  try {
    const next = new URL(url);
    next.searchParams.set("discount", code.trim());
    return next.toString();
  } catch {
    return url;
  }
}

function savedPromoCode(cartCodes?: { code: string; applicable: boolean }[]) {
  const active = cartCodes?.find((item) => item.applicable)?.code;
  if (active) return active;
  try {
    return (localStorage.getItem("scentoria_subscribe_code") || "").trim();
  } catch {
    return "";
  }
}

export function AddToCart({
  locale,
  bottleColors = [],
}: {
  locale: Locale;
  bottleColors?: BottleColor[];
}) {
  const t = getDict(locale);
  const { cart, addItem } = useCart();
  const { product, index, select } = useProductSelection();
  const selected = product.variants[index] ?? product.variants[0];
  const colors = useMemo(
    () => (selected ? colorsForSize(bottleColors, selected.title) : []),
    [bottleColors, selected],
  );
  const [colorKey, setColorKey] = useState(RANDOM_BOTTLE_COLOR);
  const [colorsOpen, setColorsOpen] = useState(Boolean(bottleColors.length));
  const [busy, setBusy] = useState<"cart" | "buy" | null>(null);
  const colorsRef = useRef<HTMLDivElement>(null);
  const inCart = selected ? cart.lines.some((line) => line.merchandiseId === selected.id && line.quantity > 0) : false;

  useEffect(() => {
    setColorKey(RANDOM_BOTTLE_COLOR);
  }, [selected?.id, colors.length]);

  useEffect(() => {
    if (!colorsOpen || !colors.length) return;
    colorsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [colorsOpen, selected?.id, colors.length]);

  if (!selected) return null;

  const pickSize = (i: number) => {
    select(i);
    if (bottleColors.length) setColorsOpen(true);
  };

  const resolveBottleColor = () => {
    if (!colors.length) return undefined;
    return colorKey === RANDOM_BOTTLE_COLOR
      ? RANDOM_BOTTLE_COLOR
      : colors.find((color) => color.key === colorKey)?.label || colorKey;
  };

  const ensureColorChoice = () => {
    if (colors.length && !colorsOpen) {
      setColorsOpen(true);
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#111]">{t.selectSize}</p>
        <div className="flex flex-wrap gap-3">
          {product.variants.map((variant, i) => {
            const active = i === index;
            const stock = stockText(variant, t);
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => pickSize(i)}
                className={`min-w-[118px] rounded-xl border-2 bg-white px-3 py-3 ${
                  active ? "border-black" : "border-[#e6e6e6]"
                }`}
              >
                <span className="block text-center text-xs font-medium leading-4 text-[#111]">
                  {sizeWithOz(variant.title)}
                </span>
                {stock ? (
                  <span className="mt-0.5 block text-center text-[11px] leading-4 text-[#9a6b6b]">{stock}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {colorsOpen && colors.length ? (
        <div ref={colorsRef}>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#111]">{t.selectColor}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setColorKey(RANDOM_BOTTLE_COLOR)}
              className={`flex w-[118px] flex-col items-center rounded-xl border-2 bg-white px-2 pb-3 pt-2 ${
                colorKey === RANDOM_BOTTLE_COLOR ? "border-black" : "border-[#e6e6e6]"
              }`}
            >
              <span className="flex aspect-square w-full items-center justify-center rounded-lg bg-[conic-gradient(from_90deg,#c5a059,#083534,#d8d0c4,#c5a059)] px-2 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
                {t.randomColor}
              </span>
              <span className="mt-1 block text-center text-[11px] leading-4 text-[#6b635c]">{t.randomColorHint}</span>
            </button>
            {colors.map((color) => {
              const active = colorKey === color.key;
              return (
                <button
                  key={color.key}
                  type="button"
                  onClick={() => setColorKey(color.key)}
                  className={`w-[118px] overflow-hidden rounded-xl border-2 bg-white px-2 pb-3 pt-2 ${
                    active ? "border-black" : "border-[#e6e6e6]"
                  }`}
                >
                  <span className="relative block aspect-square overflow-hidden rounded-lg bg-[#f7f7f7]">
                    <Image src={color.image} alt={color.label} fill className="object-cover" sizes="118px" />
                  </span>
                  <span className="mt-1 block text-center text-xs leading-4 text-[#111]">{color.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {selected.available ? <ProductPrice locale={locale} /> : null}
      {selected.available ? null : (
        <p className="rounded-md bg-[#f3efe8] px-4 py-3 text-sm text-muted">{t.outOfStock}</p>
      )}
      <div className="space-y-3">
        <div className={inCart ? "flex gap-3" : ""}>
          <button
            type="button"
            disabled={!selected.available || busy !== null}
            onClick={async () => {
              if (!selected.available || busy) return;
              if (!ensureColorChoice()) return;
              setBusy("cart");
              const added = await addItem(selected.id, 1, resolveBottleColor());
              setBusy(null);
              if (added) showCartNotice(t.addedToCart);
            }}
            className="btn-green w-full disabled:opacity-60"
          >
            {selected.available ? t.addToCart : t.outOfStock}
          </button>
          {inCart ? (
            <Link href={path(locale, "/cart")} className="btn-green w-full !bg-[#083534] !text-[#f7f2ea] hover:!bg-[#284747]">
              {t.goToCart}
            </Link>
          ) : null}
        </div>
        <button
          type="button"
          disabled={!selected.available || busy !== null}
          onClick={async () => {
            if (!selected.available || busy) return;
            if (!ensureColorChoice()) return;
            setBusy("buy");
            const next = await addItem(selected.id, 1, resolveBottleColor());
            setBusy(null);
            if (!next?.checkoutUrl) {
              showCartNotice(t.buyNowUnavailable);
              return;
            }
            window.location.href = withCheckoutDiscount(next.checkoutUrl, savedPromoCode(next.discountCodes));
          }}
          className="btn-green w-full !border-[#083534] !bg-[#f7f2ea] !text-[#083534] hover:!border-[#c5a059] hover:!bg-[#c5a059] hover:!text-[#083534] disabled:opacity-60"
        >
          {busy === "buy" ? "…" : t.buyNow}
        </button>
      </div>
    </div>
  );
}

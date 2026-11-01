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
import { useEffect, useMemo, useState } from "react";

const RANDOM_BOTTLE_COLOR = "random";

function colorsForSize(colors: BottleColor[], variantTitle: string) {
  const title = variantTitle.toLowerCase();
  return colors.filter((color) => {
    if (!color.sizes.length) return true;
    return color.sizes.some((size) => title.includes(size));
  });
}

function stockText(variant: ProductVariant, t: ReturnType<typeof getDict>) {
  if (variant.available) return null;
  return t.outOfStock;
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
  const inCart = selected ? cart.lines.some((line) => line.merchandiseId === selected.id && line.quantity > 0) : false;

  useEffect(() => {
    setColorKey(RANDOM_BOTTLE_COLOR);
  }, [selected?.id, colors.length]);

  if (!selected) return null;

  const colorLabel =
    colorKey === RANDOM_BOTTLE_COLOR
      ? t.randomColor
      : colors.find((color) => color.key === colorKey)?.label || colorKey;

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#111]">{t.selectSize}</p>
        <div className="flex flex-wrap gap-3">
          {product.variants.map((variant, i) => {
            const image = variant.image ?? product.images[0];
            const active = i === index;
            const stock = stockText(variant, t);
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => select(i)}
                className={`w-[118px] overflow-hidden rounded-xl border-2 bg-white px-2 pb-3 pt-2 ${
                  active ? "border-black" : "border-[#e6e6e6]"
                }`}
              >
                <span className="relative block aspect-square">
                  {image ? (
                    <Image src={image.url} alt="" fill className="object-contain" sizes="118px" />
                  ) : null}
                </span>
                <span className="mt-1 block text-center text-xs leading-4 text-[#111]">{sizeWithOz(variant.title)}</span>
                {stock ? (
                  <span className="mt-0.5 block text-center text-[11px] leading-4 text-[#9a6b6b]">{stock}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {colors.length ? (
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#111]">{t.selectColor}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setColorKey(RANDOM_BOTTLE_COLOR)}
              className={`flex w-[118px] flex-col items-center rounded-xl border-2 bg-white px-2 pb-3 pt-2 ${
                colorKey === RANDOM_BOTTLE_COLOR ? "border-black" : "border-[#e6e6e6]"
              }`}
            >
              <span className="flex aspect-square w-full items-center justify-center rounded-lg bg-[conic-gradient(from_90deg,#c5a059,#083534,#d8d0c4,#c5a059)] text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
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
                  <span className="relative block aspect-square">
                    <Image src={color.image} alt="" fill className="object-contain" sizes="118px" />
                  </span>
                  <span className="mt-1 block text-center text-xs leading-4 text-[#111]">{color.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <ProductPrice locale={locale} />
      {selected.available ? null : (
        <p className="rounded-md bg-[#f3efe8] px-4 py-3 text-sm text-muted">{t.deliveryStock}</p>
      )}
      <div className={inCart ? "flex gap-3" : ""}>
        <button
          type="button"
          disabled={!selected.available}
          onClick={async () => {
            if (!selected.available) return;
            const bottleColor = !colors.length
              ? undefined
              : colorKey === RANDOM_BOTTLE_COLOR
                ? RANDOM_BOTTLE_COLOR
                : colors.find((color) => color.key === colorKey)?.label || colorKey;
            const added = await addItem(selected.id, 1, bottleColor);
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
      {colors.length ? (
        <p className="text-xs text-[#6b635c]">
          {t.selectColor}: {colorLabel}
        </p>
      ) : null}
    </div>
  );
}

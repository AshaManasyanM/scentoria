"use client";

import { showCartNotice } from "@/lib/cart-notice";
import { useCart } from "./cart-provider";
import { ProductPrice, useProductSelection } from "./product-selection";
import { AUTH_EVENT, isLoggedIn, refreshSession } from "@/lib/auth";
import { sizeWithOz } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { BottleColor, Locale, ProductVariant } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export function AddToCart({
  locale,
  bottleColors = [],
}: {
  locale: Locale;
  bottleColors?: BottleColor[];
}) {
  const t = getDict(locale);
  const router = useRouter();
  const { cart, addItem } = useCart();
  const { product, index, select } = useProductSelection();
  const selected = product.variants[index] ?? product.variants[0];
  const colors = useMemo(
    () => (selected ? colorsForSize(bottleColors, selected.title) : []),
    [bottleColors, selected],
  );
  const [colorKey, setColorKey] = useState(RANDOM_BOTTLE_COLOR);
  const [colorsOpen, setColorsOpen] = useState(Boolean(bottleColors.length));
  const [loggedIn, setLoggedIn] = useState(false);
  const colorsRef = useRef<HTMLDivElement>(null);
  const inCart = selected ? cart.lines.some((line) => line.merchandiseId === selected.id && line.quantity > 0) : false;
  const loginHref = path(locale, `/login?next=${encodeURIComponent(path(locale, `/products/${product.handle}`))}`);

  useEffect(() => {
    const sync = () => setLoggedIn(isLoggedIn());
    void refreshSession().then(sync);
    window.addEventListener(AUTH_EVENT, sync);
    return () => window.removeEventListener(AUTH_EVENT, sync);
  }, []);

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

  const requireLogin = () => {
    router.push(loginHref);
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

      <ProductPrice locale={locale} />
      {selected.available ? null : (
        <p className="rounded-md bg-[#f3efe8] px-4 py-3 text-sm text-muted">{t.deliveryStock}</p>
      )}
      {!loggedIn ? <p className="text-sm text-[#6b635c]">{t.loginToOrder}</p> : null}
      <div className={inCart && loggedIn ? "flex gap-3" : ""}>
        <button
          type="button"
          disabled={!selected.available}
          onClick={async () => {
            if (!selected.available) return;
            if (!loggedIn) {
              requireLogin();
              return;
            }
            if (colors.length && !colorsOpen) {
              setColorsOpen(true);
              return;
            }
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
          {!loggedIn ? t.signIn : selected.available ? t.addToCart : t.outOfStock}
        </button>
        {inCart && loggedIn ? (
          <Link href={path(locale, "/cart")} className="btn-green w-full !bg-[#083534] !text-[#f7f2ea] hover:!bg-[#284747]">
            {t.goToCart}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

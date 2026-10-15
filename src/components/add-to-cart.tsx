"use client";

import { showCartNotice } from "@/lib/cart-notice";
import { useCart } from "./cart-provider";
import { ProductPrice, useProductSelection } from "./product-selection";
import { sizeWithOz } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale, ProductVariant } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

function stockText(variant: ProductVariant, t: ReturnType<typeof getDict>) {
  if (variant.available) return null;
  return t.outOfStock;
}

export function AddToCart({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const { cart, addItem } = useCart();
  const { product, index, select } = useProductSelection();
  const selected = product.variants[index] ?? product.variants[0];
  const inCart = selected ? cart.lines.some((line) => line.merchandiseId === selected.id && line.quantity > 0) : false;

  if (!selected) return null;

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
            const added = await addItem(selected.id);
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
    </div>
  );
}

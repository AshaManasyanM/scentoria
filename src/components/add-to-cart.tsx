"use client";

import { useCart } from "./cart-provider";
import { getDict } from "@/lib/i18n";
import type { Locale, Product } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { useMemo, useState } from "react";

export function AddToCart({ product, locale }: { product: Product; locale: Locale }) {
  const t = getDict(locale);
  const { addItem } = useCart();
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const selected = useMemo(
    () => product.variants.find((v) => v.id === variantId) ?? product.variants[0],
    [product.variants, variantId],
  );

  if (!selected) return null;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs tracking-[0.2em] uppercase text-muted mb-2">{t.selectSize}</p>
        <div className="flex flex-wrap gap-2">
          {product.variants.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVariantId(v.id)}
              className={`border px-3 py-2 text-sm ${
                v.id === selected.id ? "border-gold text-gold" : "border-line text-muted"
              }`}
            >
              {v.title} · {formatMoney(v.price, locale)}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => addItem(selected.id)}
        className="w-full bg-gold text-bg py-3 tracking-[0.22em] uppercase text-sm"
      >
        {t.addToCart}
      </button>
    </div>
  );
}

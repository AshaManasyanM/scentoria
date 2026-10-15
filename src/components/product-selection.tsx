"use client";

import { discountPercent, formatMoney } from "@/lib/format";
import type { Locale, Product } from "@/lib/types";
import { createContext, useContext, useMemo, useState } from "react";

type Selection = {
  product: Product;
  index: number;
  select: (index: number) => void;
};

const ProductSelectionContext = createContext<Selection | null>(null);

export function ProductSelection({
  product,
  children,
}: {
  product: Product;
  children: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const value = useMemo(
    () => ({
      product,
      index,
      select: (next: number) => {
        if (next === index || next < 0 || next >= product.variants.length) return;
        setIndex(next);
      },
    }),
    [product, index],
  );

  return <ProductSelectionContext.Provider value={value}>{children}</ProductSelectionContext.Provider>;
}

export function useProductSelection() {
  const value = useContext(ProductSelectionContext);
  if (!value) throw new Error("Product selection is missing");
  return value;
}

export function ProductPrice({ locale }: { locale: Locale }) {
  const { product, index } = useProductSelection();
  const variant = product.variants[index];
  const price = variant?.price ?? product.minPrice;
  const compare = variant?.compareAtPrice;
  const percent = discountPercent(price, compare);

  if (!percent || !compare) {
    return (
      <p key={variant?.id ?? "price"} className="text-2xl font-medium text-[#111]">
        {formatMoney(price, locale)}
      </p>
    );
  }

  return (
    <p key={variant?.id ?? "price"} className="flex flex-wrap items-center gap-3">
      <span className="text-2xl font-medium text-[#b5b5b5] line-through decoration-[#b5b5b5]">{formatMoney(compare, locale)}</span>
      <span className="rounded-full bg-[#8d8d8d] px-2.5 py-1 text-sm font-semibold text-white">-{percent}%</span>
      <span className="text-3xl font-bold text-[#e24b4b]">{formatMoney(price, locale)}</span>
    </p>
  );
}

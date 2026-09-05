"use client";

import type { Product } from "@/lib/types";
import Image from "next/image";
import { useState } from "react";

export function ProductGallery({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const current = product.images[index] ?? product.images[0];

  return (
    <div>
      <div className="relative aspect-[3/4] bg-bg-2">
        {current ? (
          <Image
            src={current.url}
            alt={current.alt}
            fill
            className="object-cover"
            sizes="50vw"
            priority
          />
        ) : null}
        {product.onSale && product.discountLabel ? (
          <span className="absolute left-3 top-3 rounded-l-md bg-[#c53030] px-2 py-1 text-[10px] font-medium text-white md:text-sm">
            {product.discountLabel}
          </span>
        ) : null}
      </div>
      {product.images.length > 1 ? (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {product.images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative aspect-square overflow-hidden border ${
                i === index ? "border-gold" : "border-line"
              }`}
            >
              <Image src={img.url} alt="" fill className="object-cover" sizes="12vw" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

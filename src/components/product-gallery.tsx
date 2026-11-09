"use client";

import { discountPercent } from "@/lib/format";
import { useProductSelection } from "./product-selection";
import Image from "next/image";
import { useState } from "react";

function samePicture(a: string, b: string) {
  return a.split("?")[0] === b.split("?")[0];
}

export function ProductGallery() {
  const { product, index } = useProductSelection();
  const selected = product.variants[index];
  const percent = selected ? discountPercent(selected.price, selected.compareAtPrice) : null;
  const media = product.images;
  const [active, setActive] = useState(0);
  const current = media[Math.min(active, Math.max(media.length - 1, 0))] ?? null;

  return (
    <div className="mx-auto w-full max-w-[520px] md:mx-0">
      <div className="relative">
        <div className="relative aspect-square w-full overflow-hidden rounded-[28px] border border-[#e6e6e6] bg-white">
          {percent ? (
            <span className="absolute left-4 top-4 z-10 rounded-full bg-[#e10600] px-2.5 py-1 text-sm font-semibold text-white">
              -{percent}%
            </span>
          ) : null}
          {current?.url ? (
            <Image
              src={current.url}
              alt={current.alt || product.title}
              fill
              className="object-contain p-3 sm:p-4"
              sizes="(max-width: 768px) 100vw, 520px"
              priority
            />
          ) : null}
        </div>
      </div>
      {media.length > 1 ? (
        <div className="mt-4 flex justify-center gap-2.5">
          {media.map((image, i) => {
            const isActive = current ? samePicture(image.url, current.url) : i === active;
            return (
              <button
                key={`${image.url}-${i}`}
                type="button"
                aria-label={image.alt || `${product.title} ${i + 1}`}
                onClick={() => setActive(i)}
                className={`relative h-[72px] w-[72px] overflow-hidden rounded-2xl border bg-white ${
                  isActive ? "border-[#c5c5c5]" : "border-[#e6e6e6]"
                }`}
              >
                <Image src={image.url} alt="" fill className="object-contain p-1.5" sizes="72px" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

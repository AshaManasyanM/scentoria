"use client";

import { discountPercent, sizeWithOz } from "@/lib/format";
import { useProductSelection } from "./product-selection";
import type { Product } from "@/lib/types";
import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";

type Frame = { src: string; alt: string };

function picture(product: Product, index: number): Frame {
  const variant = product.variants[index];
  const image = variant?.image ?? product.images[0] ?? null;
  return {
    src: image?.url ?? "",
    alt: image?.alt || variant?.title || product.title,
  };
}

function samePicture(a: string, b: string) {
  return a.split("?")[0] === b.split("?")[0];
}

export function ProductGallery() {
  const { product, index, select } = useProductSelection();
  const selected = product.variants[index];
  const percent = selected ? discountPercent(selected.price, selected.compareAtPrice) : null;
  const initial = picture(product, 0);
  const [current, setCurrent] = useState(initial);
  const [outgoing, setOutgoing] = useState<Frame | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  const indexRef = useRef(0);
  const currentRef = useRef(initial);

  useLayoutEffect(() => {
    if (index === indexRef.current) return;
    const next = picture(product, index);
    const direction: 1 | -1 = index > indexRef.current ? 1 : -1;
    indexRef.current = index;
    if (!next.src || samePicture(next.src, currentRef.current.src)) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setDir(direction);
    if (!reduce) setOutgoing(currentRef.current);
    setCurrent(next);
    currentRef.current = next;
  }, [index, product]);

  return (
    <div className="w-full max-w-[741px]">
      <div className="relative">
        <div className="relative aspect-[741/650] w-full overflow-hidden rounded-xl border border-[#e6e6e6] bg-white">
          {percent ? (
            <span className="absolute left-4 top-4 z-10 bg-[#e10600] px-2.5 py-1 text-sm font-semibold text-white">
              -{percent}%
            </span>
          ) : null}
          {outgoing?.src ? (
            <div
              className="gallery-out absolute inset-0"
              style={{ ["--dir" as string]: dir }}
              onAnimationEnd={() => setOutgoing(null)}
            >
              <Image src={outgoing.src} alt="" fill className="object-contain p-6" sizes="741px" />
            </div>
          ) : null}
          <div
            key={current.src}
            className={outgoing ? "gallery-in absolute inset-0" : "absolute inset-0"}
            style={outgoing ? { ["--dir" as string]: dir } : undefined}
          >
            {current.src ? (
              <Image
                src={current.src}
                alt={current.alt}
                fill
                className="object-contain p-6"
                sizes="741px"
                priority
              />
            ) : null}
          </div>
        </div>
      </div>
      {product.variants.length > 1 ? (
        <div className="mt-5 flex justify-center gap-3">
          {product.variants.map((variant, i) => {
            const image = variant.image ?? product.images[0];
            const active = i === index;
            return (
              <button
                key={variant.id}
                type="button"
                aria-label={sizeWithOz(variant.title)}
                onClick={() => select(i)}
                className={`relative h-[92px] w-[92px] overflow-hidden rounded-xl border bg-white ${
                  active ? "border-[#c5c5c5]" : "border-[#e6e6e6]"
                }`}
              >
                {image ? (
                  <Image src={image.url} alt="" fill className="object-contain p-2" sizes="92px" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

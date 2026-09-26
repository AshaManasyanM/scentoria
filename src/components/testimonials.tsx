"use client";

import type { Testimonial } from "@/lib/types";
import { useState } from "react";

export function Testimonials({
  eyebrow,
  heading,
  items,
}: {
  eyebrow: string;
  heading: string;
  items: Testimonial[];
}) {
  const [index, setIndex] = useState(0);
  const count = items.length;
  const visible = items.map((_, offset) => items[(index + offset) % count]);

  function shift(direction: -1 | 1) {
    setIndex((current) => (current + direction + count) % count);
  }

  return (
    <section className="mx-auto w-full max-w-[1320px] px-4 py-10 md:py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a059]">{eyebrow}</p>
      <h2 className="mt-4 max-w-[1280px] font-serif text-[28px] font-medium leading-[1.2] text-[#083534] md:text-[clamp(32px,4vw,44px)] md:leading-[1.15]">
        {heading}
      </h2>
      <div className="relative mt-10">
        <button
          type="button"
          aria-label="Previous"
          onClick={() => shift(-1)}
          className="absolute left-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#083534] text-[#f7f2ea] md:flex"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M15 5 8 12l7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={() => shift(1)}
          className="absolute right-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#083534] text-[#f7f2ea] md:flex"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="grid gap-5 md:grid-cols-3 md:px-14">
          {visible.map((item, card) => (
            <blockquote
              key={item.name + item.product}
              className={`rounded-md border border-[#e4ddd2] px-5 py-6 text-[#083534] md:px-6 md:py-7 ${card === 0 ? "" : "hidden md:block"}`}
            >
              <p className="text-[15px] leading-7">
                “{item.product}” – “{item.text}”
              </p>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.08em]">{item.name}</p>
            </blockquote>
          ))}
        </div>
      </div>
      <div className="mt-8 flex justify-center gap-2">
        {items.map((item, dot) => (
          <button
            key={item.name}
            type="button"
            aria-label={`Testimonial ${dot + 1}`}
            onClick={() => setIndex(dot)}
            className={`h-2 w-2 rounded-full ${dot === index ? "bg-[#083534]" : "bg-[#d8d0c4]"}`}
          />
        ))}
      </div>
    </section>
  );
}

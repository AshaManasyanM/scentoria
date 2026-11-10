"use client";

import type { Testimonial } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

export function Testimonials({
  eyebrow,
  heading,
  items,
  width = "max-w-[min(100%,82.5rem)]",
}: {
  eyebrow: string;
  heading?: string;
  items: Testimonial[];
  width?: string;
}) {
  const [index, setIndex] = useState(0);
  const [desktop, setDesktop] = useState(false);
  const dragStart = useRef(0);
  const count = items.length;
  const perView = desktop ? (count >= 4 ? 3 : Math.max(count, 1)) : 1;
  const gap = perView > 1 ? 20 : 0;
  const maxIndex = Math.max(0, count - perView);
  const safeIndex = Math.min(index, maxIndex);
  const slides = count > perView;

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const apply = () => setDesktop(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  function shift(direction: -1 | 1) {
    setIndex((current) => Math.min(maxIndex, Math.max(0, current + direction)));
  }

  return (
    <section className={`mx-auto w-full px-[clamp(1rem,2.5vw,2rem)] py-[clamp(2rem,4vw,3.25rem)] ${width}`}>
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c5a059]">{eyebrow}</p>
        {heading ? (
          <h2 className="mt-3 font-serif text-[clamp(1.5rem,1.1rem+1.2vw,2rem)] font-medium leading-[1.2] text-[#083534]">
            {heading}
          </h2>
        ) : null}
      </div>
      <div className={`relative ${heading ? "mt-8" : "mt-6"}`}>
        {slides ? (
          <>
            <button
              type="button"
              aria-label="Previous"
              disabled={safeIndex === 0}
              onClick={() => shift(-1)}
              className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#083534] text-[#f7f2ea] disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <path d="M15 5 8 12l7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next"
              disabled={safeIndex === maxIndex}
              onClick={() => shift(1)}
              className="absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#083534] text-[#f7f2ea] disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        ) : null}
        <div className={`overflow-hidden ${slides ? "mx-14" : ""}`}>
          <div
            className={`transition-transform duration-300 ease-out ${
              slides ? "flex" : count === 3 ? "grid gap-3 md:grid-cols-3 md:gap-4" : count === 2 ? "grid gap-3 md:grid-cols-2 md:gap-4" : "grid grid-cols-1"
            }`}
            style={
              slides
                ? {
                    transform: `translateX(calc(${-safeIndex} * ((100% - ${(perView - 1) * gap}px) / ${perView} + ${gap}px)))`,
                  }
                : undefined
            }
            onPointerDown={(event) => {
              dragStart.current = event.clientX;
            }}
            onPointerUp={(event) => {
              if (!slides) return;
              const delta = event.clientX - dragStart.current;
              if (delta > 40) shift(-1);
              if (delta < -40) shift(1);
            }}
          >
            {items.map((item, card) => (
              <blockquote
                key={`${item.name}-${item.product}-${card}`}
                className="h-full rounded-2xl border border-[#e4ddd2] bg-white px-5 py-5 text-[#083534] md:px-6 md:py-6"
                style={slides ? { flex: `0 0 calc((100% - ${(perView - 1) * gap}px) / ${perView})` } : undefined}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#083534]/70">{item.product}</p>
                <p className="mt-3 text-sm leading-6 md:text-[15px] md:leading-7">“{item.text}”</p>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#c5a059]">{item.name}</p>
              </blockquote>
            ))}
          </div>
        </div>
      </div>
      {slides ? (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: maxIndex + 1 }, (_, dot) => (
            <button
              key={dot}
              type="button"
              aria-label={`Testimonial ${dot + 1}`}
              onClick={() => setIndex(dot)}
              className={`h-2 w-2 rounded-full ${dot === safeIndex ? "bg-[#083534]" : "bg-[#d8d0c4]"}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

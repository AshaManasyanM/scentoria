"use client";

import { SiteNav } from "@/components/site-nav";
import type { Locale } from "@/lib/types";
import { useEffect, useState } from "react";

export function HeroSlider({
  images,
  locale,
}: {
  images: { url: string; alt: string }[];
  locale: Locale;
}) {
  const [index, setIndex] = useState(0);
  const slides = images.length ? images : [];
  const slider = slides.length > 1;

  useEffect(() => {
    if (!slider) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [slider, slides.length]);

  return (
    <section className="relative h-[606px] overflow-hidden bg-transparent">
      {slides.map((image, i) => (
        <picture
          key={image.url + i}
          className={`absolute inset-0 block h-full w-full transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={image.url}
            alt={image.alt}
            className="h-full w-full object-cover object-center"
            decoding="async"
            fetchPriority={i === 0 ? "high" : "low"}
          />
        </picture>
      ))}
      {slider ? (
        <div className="absolute bottom-[20px] left-0 right-0 z-20 flex justify-center gap-2">
          {slides.map((image, i) => (
            <button
              key={image.url + i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-[4px] w-[30px] rounded-full transition-all ${
                i === index ? "bg-gold-2" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      ) : null}
      <div className="absolute inset-x-0 top-0 z-20">
        <SiteNav locale={locale} variant="overlay" />
      </div>
    </section>
  );
}

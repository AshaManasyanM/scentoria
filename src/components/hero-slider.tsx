"use client";

import { SiteNav } from "@/components/site-nav";
import { path } from "@/lib/path";
import type { HeroSlide } from "@/lib/shopify/catalog";
import type { Locale } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

function slideHref(locale: Locale, href?: string) {
  const raw = href?.trim() || "/products";
  if (/^https?:\/\//i.test(raw)) return raw;
  return path(locale, raw.startsWith("/") ? raw : `/${raw}`);
}

function slideColors(theme: HeroSlide["theme"]) {
  if (theme === "light") {
    return {
      eyebrow: "#c5a059",
      title: "#f7f2ea",
      description: "rgba(247,242,234,0.9)",
      buttonBg: "#f7f2ea",
      buttonText: "#083534",
    };
  }
  return {
    eyebrow: "#c5a059",
    title: "#083534",
    description: "rgba(8,53,52,0.9)",
    buttonBg: "#083534",
    buttonText: "#f7f2ea",
  };
}

export function HeroSlider({
  images,
  locale,
  hiddenNav = [],
}: {
  images: HeroSlide[];
  locale: Locale;
  hiddenNav?: string[];
}) {
  const [index, setIndex] = useState(0);
  const slides = images.length ? images : [];
  const slider = slides.length > 1;
  const active = slides[index];
  const showCopy = Boolean(active?.title || active?.description || active?.buttonText);
  const colors = active ? slideColors(active.theme) : null;

  useEffect(() => {
    if (!slider) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [slider, slides.length]);

  return (
    <section className="relative h-[clamp(240px,48vw,606px)] overflow-hidden bg-[#f7f2ea]">
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

      {showCopy && active && colors ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center">
          <div className="pointer-events-auto mx-auto w-full max-w-[min(100%,82.5rem)] px-[clamp(1rem,4vw,3rem)]">
            <div className="max-w-[min(100%,28rem)] md:max-w-[min(42%,34rem)]">
              <p
                className="font-serif text-[10px] font-medium uppercase tracking-[0.28em] sm:text-[11px] md:tracking-[0.32em]"
                style={{ color: colors.eyebrow }}
              >
                SCENTORIA PRIVÉ
              </p>
              {active.title ? (
                <h1
                  className="mt-3 font-serif text-[clamp(1.35rem,1rem+2.2vw,3.15rem)] font-medium leading-[1.15] sm:mt-4"
                  style={{ color: colors.title }}
                >
                  {active.title}
                </h1>
              ) : null}
              {active.description ? (
                <p
                  className="mt-3 max-w-[28rem] font-serif text-[clamp(0.85rem,0.75rem+0.55vw,1.2rem)] leading-snug sm:mt-4"
                  style={{ color: colors.description }}
                >
                  {active.description}
                </p>
              ) : null}
              {active.buttonText ? (
                <Link
                  href={slideHref(locale, active.buttonHref)}
                  className="mt-5 inline-flex items-center justify-center px-5 py-2.5 font-serif text-[clamp(0.75rem,0.7rem+0.25vw,0.95rem)] transition hover:opacity-90 sm:mt-6 sm:px-6 sm:py-3"
                  style={{ backgroundColor: colors.buttonBg, color: colors.buttonText }}
                >
                  {active.buttonText}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {slider ? (
        <div className="absolute bottom-[20px] left-0 right-0 z-20 flex justify-center gap-2">
          {slides.map((image, i) => (
            <button
              key={image.url + i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-[3px] w-4 rounded-full transition-all ${
                i === index ? "bg-gold-2" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      ) : null}
      <div className="absolute inset-x-0 top-0 z-30 hidden md:block">
        <SiteNav locale={locale} variant="overlay" hiddenNav={hiddenNav} />
      </div>
    </section>
  );
}

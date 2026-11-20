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
    <section className="relative h-[clamp(260px,48vw,606px)] overflow-hidden bg-[#f7f2ea] md:h-[clamp(240px,48vw,606px)]">
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
          {/* Mobile-only soft wash so copy stays readable over product bottles */}
          <div
            aria-hidden
            className={
              active.theme === "light"
                ? "absolute inset-y-0 left-0 w-[72%] bg-gradient-to-r from-[#083534]/55 via-[#083534]/22 to-transparent md:hidden"
                : "absolute inset-y-0 left-0 w-[72%] bg-gradient-to-r from-[#f7f2ea]/92 via-[#f7f2ea]/55 to-transparent md:hidden"
            }
          />
          <div className="pointer-events-auto relative mx-auto w-full max-w-[min(100%,82.5rem)] px-[clamp(0.875rem,4vw,3rem)]">
            <div className="max-w-[min(48%,11.75rem)] text-left sm:max-w-[min(46%,13rem)] md:max-w-[min(42%,34rem)]">
              <p
                className="font-serif text-[10px] font-medium uppercase tracking-[0.28em] sm:text-[11px] md:tracking-[0.32em]"
                style={{ color: colors.eyebrow }}
              >
                SCENTORIA PRIVÉ
              </p>
              {active.title ? (
                <h1
                  className="mt-2 font-serif text-[clamp(1.1rem,0.9rem+1.35vw,1.45rem)] font-medium leading-[1.2] sm:mt-3 md:mt-4 md:text-[clamp(1.35rem,1rem+2.2vw,3.15rem)] md:leading-[1.15]"
                  style={{ color: colors.title }}
                >
                  {active.title}
                </h1>
              ) : null}
              {active.description ? (
                <p
                  className="mt-2 max-w-[11.75rem] font-serif text-[clamp(0.75rem,0.7rem+0.35vw,0.9rem)] leading-snug sm:mt-3 md:mt-4 md:max-w-[28rem] md:text-[clamp(0.85rem,0.75rem+0.55vw,1.2rem)]"
                  style={{ color: colors.description }}
                >
                  {active.description}
                </p>
              ) : null}
              {active.buttonText ? (
                <Link
                  href={slideHref(locale, active.buttonHref)}
                  className="mt-3.5 inline-flex max-w-full shrink-0 items-center justify-center px-3.5 py-2 font-serif text-[clamp(0.7rem,0.66rem+0.2vw,0.82rem)] transition hover:opacity-90 sm:mt-5 sm:px-5 sm:py-2.5 md:mt-6 md:px-6 md:py-3 md:text-[clamp(0.75rem,0.7rem+0.25vw,0.95rem)]"
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

"use client";

import { ProductCard } from "@/components/product-card";
import { getDict } from "@/lib/i18n";
import type { Locale, Product } from "@/lib/types";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

const SLIDE_WIDTH = 300;

const chevronPrev = (
  <path d="M217.9 256L345 129c9.4-9.4 9.4-24.6 0-33.9-9.4-9.4-24.6-9.3-34 0L167 239c-9.1 9.1-9.3 23.7-.7 33.1L310.9 417c4.7 4.7 10.9 7 17 7s-12.3-2.3 17-7c-9.4-9.4 9.4-24.6 0-33.9L217.9 256z" />
);
const chevronNext = (
  <path d="M294.1 256L167 129c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.3 34 0L345 239c9.1 9.1 9.3 23.7.7 33.1L201.1 417c-4.7 4.7-10.9 7-17 7s-12.3-2.3-17-7c-9.4-9.4-9.4-24.6 0-33.9l127-127.1z" />
);

export function ProductSlider({
  products,
  locale,
}: {
  products: Product[];
  locale: Locale;
}) {
  const t = getDict(locale);

  if (!products.length) {
    return <p className="py-16 text-center text-white/80">{t.emptyCatalog}</p>;
  }

  return (
    <div className="bestsellers-nav relative w-full">
      <div className="bestsellers-swiper mx-auto w-[90%] max-w-[1699px]">
        <Swiper
          modules={[Navigation]}
          navigation={{
            prevEl: ".bestsellers-prev",
            nextEl: ".bestsellers-next",
          }}
          watchOverflow
          slidesPerView="auto"
          spaceBetween={15}
          breakpoints={{
            768: { spaceBetween: 25 },
          }}
        >
          {products.map((product) => (
            <SwiperSlide key={product.id} style={{ width: SLIDE_WIDTH }}>
              <ProductCard product={product} locale={locale} variant="slider" />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <button type="button" aria-label="Previous" className="bestsellers-prev">
        <svg viewBox="0 0 512 512" aria-hidden>
          {chevronPrev}
        </svg>
      </button>
      <button type="button" aria-label="Next" className="bestsellers-next">
        <svg viewBox="0 0 512 512" aria-hidden>
          {chevronNext}
        </svg>
      </button>
    </div>
  );
}

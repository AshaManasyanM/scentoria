"use client";

import { ProductCard } from "@/components/product-card";
import { getDict } from "@/lib/i18n";
import type { Locale, Product } from "@/lib/types";
import { useId } from "react";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";

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
  const uid = useId().replace(/:/g, "");

  if (!products.length) {
    return <p className="py-16 text-center text-white/80">{t.emptyCatalog}</p>;
  }

  return (
    <div className="product-slider-nav relative w-full">
      <div className="product-slider mx-auto w-full max-w-[1350px]">
        <Swiper
          modules={[Navigation, Pagination]}
          navigation={{
            prevEl: `.product-slider-prev-${uid}`,
            nextEl: `.product-slider-next-${uid}`,
          }}
          pagination={{
            el: `.product-slider-pag-${uid}`,
            clickable: true,
          }}
          watchOverflow
          slidesPerView={2}
          spaceBetween={10}
          breakpoints={{
            768: {
              slidesPerView: "auto",
              spaceBetween: 48,
            },
          }}
        >
          {products.map((product) => (
            <SwiperSlide key={product.id}>
              <ProductCard product={product} locale={locale} variant="slider" />
            </SwiperSlide>
          ))}
        </Swiper>
        <div
          className={`product-slider-pag product-slider-pag-${uid} md:hidden`}
        />
      </div>
      <button
        type="button"
        aria-label="Previous"
        className={`product-slider-prev product-slider-prev-${uid} max-md:hidden`}
      >
        <svg viewBox="0 0 512 512" aria-hidden>
          {chevronPrev}
        </svg>
      </button>
      <button
        type="button"
        aria-label="Next"
        className={`product-slider-next product-slider-next-${uid} max-md:hidden`}
      >
        <svg viewBox="0 0 512 512" aria-hidden>
          {chevronNext}
        </svg>
      </button>
    </div>
  );
}

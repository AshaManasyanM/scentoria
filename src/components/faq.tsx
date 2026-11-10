"use client";

import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { useState } from "react";

export function Faq({
  locale,
  items,
}: {
  locale: Locale;
  items: { question: string; answer: string }[];
}) {
  const t = getDict(locale);
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto w-full max-w-[min(100%,48rem)] px-[clamp(1rem,2.5vw,2rem)] py-[clamp(2rem,4vw,3.25rem)]">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-serif text-[clamp(1.5rem,1.1rem+1.2vw,2rem)] font-medium leading-[1.2] text-[#083534]">
          {t.faq}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#083534]/70 md:text-[15px]">{t.faqSub}</p>
      </div>
      <div className="mt-8 divide-y divide-[#e4ddd3] border-y border-[#e4ddd3]">
        {items.map((item, i) => (
          <button
            key={item.question}
            type="button"
            className="w-full py-4 text-left md:py-5"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <div className="flex justify-between gap-4">
              <span className="text-sm font-medium leading-snug text-[#083534] md:text-base">{item.question}</span>
              <span className="text-lg leading-none text-[#c5a059]">{open === i ? "–" : "+"}</span>
            </div>
            {open === i ? (
              <p className="mt-3 text-sm leading-6 text-[#083534]/70 md:text-[15px] md:leading-7">{item.answer}</p>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}

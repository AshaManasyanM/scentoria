"use client";

import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { useState } from "react";

export function Faq({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:py-20">
      <h2 className="font-serif text-[clamp(28px,6vw,48px)] text-center leading-snug">{t.faq}</h2>
      <p className="text-center text-[clamp(14px,3.4vw,22px)] text-muted mt-3 mb-8 md:mb-10">{t.faqSub}</p>
      <div className="divide-y divide-line border-y border-line">
        {t.faqs.map((item, i) => (
          <button
            key={item.q}
            type="button"
            className="w-full text-left py-5"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <div className="flex justify-between gap-4">
              <span className="text-base font-medium leading-snug md:text-lg">{item.q}</span>
              <span className="text-xl text-gold">{open === i ? "–" : "+"}</span>
            </div>
            {open === i ? <p className="mt-3 text-[15px] text-muted leading-relaxed md:text-base">{item.a}</p> : null}
          </button>
        ))}
      </div>
    </section>
  );
}

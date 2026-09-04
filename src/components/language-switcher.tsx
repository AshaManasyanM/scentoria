"use client";

import type { Locale } from "@/lib/types";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hy", label: "Հայերեն" },
];

function Flag({ locale }: { locale: Locale }) {
  if (locale === "hy") {
    return (
      <svg width="20" height="14" viewBox="0 0 21 14" aria-hidden className="overflow-hidden">
        <rect width="21" height="14" fill="#D90012" />
        <rect y="4.67" width="21" height="4.66" fill="#0033A0" />
        <rect y="9.33" width="21" height="4.67" fill="#F2A800" />
      </svg>
    );
  }

  return (
    <svg width="20" height="14" viewBox="0 0 60 30" aria-hidden className="overflow-hidden">
      <rect width="60" height="30" fill="#b22234" />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} y={(i * 2 + 1) * (30 / 13)} width="60" height={30 / 13} fill="#fff" />
      ))}
      <rect width="24" height={(7 * 30) / 13} fill="#3c3b6e" />
    </svg>
  );
}

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const current = LOCALES.find((item) => item.code === locale) ?? LOCALES[0];
  const hrefFor = (code: Locale) => pathname.replace(/^\/(en|hy)/, `/${code}`) || `/${code}`;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative z-50">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={current.label}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center transition-opacity hover:opacity-70"
      >
        <Flag locale={locale} />
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close language menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            className="absolute right-0 z-50 mt-2 flex flex-col gap-2 bg-white p-2 shadow-md"
          >
            {LOCALES.filter((item) => item.code !== locale).map((item) => (
              <li key={item.code} role="option">
                <button
                  type="button"
                  aria-label={item.label}
                  onClick={() => {
                    setOpen(false);
                    router.push(hrefFor(item.code));
                  }}
                  className="p-0"
                >
                  <Flag locale={item.code} />
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

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
      <svg viewBox="0 0 22 16" aria-hidden className="h-4 w-[22px]">
        <rect width="22" height="16" fill="#D90012" />
        <rect y="5.34" width="22" height="5.32" fill="#0033A0" />
        <rect y="10.66" width="22" height="5.34" fill="#F2A800" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 22 16" aria-hidden className="h-4 w-[22px]">
      <rect width="22" height="16" fill="#b22234" />
      <rect y="1.85" width="22" height="1.23" fill="#fff" />
      <rect y="4.3" width="22" height="1.23" fill="#fff" />
      <rect y="6.77" width="22" height="1.23" fill="#fff" />
      <rect y="9.23" width="22" height="1.23" fill="#fff" />
      <rect y="11.7" width="22" height="1.23" fill="#fff" />
      <rect y="14.15" width="22" height="1.23" fill="#fff" />
      <rect width="9.2" height="8.6" fill="#3c3b6e" />
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
        className="inline-flex h-5 items-center md:h-[22px]"
      >
        <span className="inline-flex overflow-hidden rounded-[2px] ring-1 ring-[#d8d0c4]">
          <Flag locale={locale} />
        </span>
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
                  className="inline-flex overflow-hidden rounded-[2px] ring-1 ring-[#d8d0c4]"
                >
                  <span className="inline-flex overflow-hidden rounded-[2px]">
                    <Flag locale={item.code} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

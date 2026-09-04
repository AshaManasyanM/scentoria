"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { QuoteBar } from "@/components/quote-bar";
import { NAV, SiteNav, hrefFor } from "@/components/site-nav";
import { useCart } from "./cart-provider";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export function Header({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const pathname = usePathname();
  const router = useRouter();
  const { count } = useCart();
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");

  const home = path(locale);
  const isHome = pathname === home || pathname === `${home}/`;

  return (

  <div className="">
    <QuoteBar />
    <header className="sticky top-0 z-40 bg-white">
      <div
        className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-4 text-black"
      >
        <form
          className="hidden md:block"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`${path(locale, "/search")}?q=${encodeURIComponent(q)}`);
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`${t.search}...`}
            className={`w-full max-w-xs rounded-full border px-4 py-2 text-sm outline-none focus:border-gold border-line placeholder:text-muted`}
          />
        </form>
        <div className="flex items-center gap-3 md:hidden">
          <button type="button" aria-label="Menu" onClick={() => setMenu((v) => !v)}>
            ☰
          </button>
        </div>
        <Link href={path(locale)} className="font-serif text-3xl font-bold tracking-[0.08em] uppercase">
          {t.brand}
        </Link>
        <div className="flex items-center justify-end gap-6">
          <Link
            href={path(locale, "/wishlist")}
            aria-label={t.wishlist}
            className="text-ink transition-opacity hover:opacity-55"
          >
            <svg
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 512 512"
              height="24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path d="M458.4 64.3C400.6 15.7 311.3 23 256 79.3 200.7 23 111.4 15.6 53.6 64.3-21.6 127.6-10.6 230.8 43 285.5l175.4 178.7c10 10.2 23.4 15.9 37.6 15.9 14.3 0 27.6-5.6 37.6-15.8L469 285.6c53.5-54.7 64.7-157.9-10.6-221.3zm-23.6 187.5L259.4 430.5c-2.4 2.4-4.4 2.4-6.8 0L77.2 251.8c-36.5-37.2-43.9-107.6 7.3-150.7 38.9-32.7 98.9-27.8 136.5 10.5l35 35.7 35-35.7c37.8-38.5 97.8-43.2 136.5-10.6 51.1 43.1 43.5 113.9 7.3 150.8z" />
            </svg>
          </Link>
          <Link
            href={path(locale, "/cart")}
            aria-label={t.cart}
            className="relative text-ink transition-opacity hover:opacity-55"
          >
            <svg
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 512 512"
              height="24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="32"
                d="M80 176a16 16 0 0 0-16 16v216c0 30.24 25.76 56 56 56h272c30.24 0 56-24.51 56-54.75V192a16 16 0 0 0-16-16zm80 0v-32a96 96 0 0 1 96-96h0a96 96 0 0 1 96 96v32"
              />
            </svg>
            {count > 0 ? (
              <span className="absolute -right-2.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-sale px-1 text-[10px] font-medium text-white">
                {count}
              </span>
            ) : null}
          </Link>
          <Link
            href={path(locale, "/account")}
            aria-label={t.account}
            className="text-ink transition-opacity hover:opacity-55"
          >
            <svg
              stroke="currentColor"
              fill="none"
              strokeWidth="0"
              viewBox="0 0 15 15"
              height="24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.877014 7.49988C0.877014 3.84219 3.84216 0.877045 7.49985 0.877045C11.1575 0.877045 14.1227 3.84219 14.1227 7.49988C14.1227 11.1575 11.1575 14.1227 7.49985 14.1227C3.84216 14.1227 0.877014 11.1575 0.877014 7.49988ZM7.49985 1.82704C4.36683 1.82704 1.82701 4.36686 1.82701 7.49988C1.82701 8.97196 2.38774 10.3131 3.30727 11.3213C4.19074 9.94119 5.73818 9.02499 7.50023 9.02499C9.26206 9.02499 10.8093 9.94097 11.6929 11.3208C12.6121 10.3127 13.1727 8.97172 13.1727 7.49988C13.1727 4.36686 10.6328 1.82704 7.49985 1.82704ZM10.9818 11.9787C10.2839 10.7795 8.9857 9.97499 7.50023 9.97499C6.01458 9.97499 4.71624 10.7797 4.01845 11.9791C4.97952 12.7272 6.18765 13.1727 7.49985 13.1727C8.81227 13.1727 10.0206 12.727 10.9818 11.9787ZM5.14999 6.50487C5.14999 5.207 6.20212 4.15487 7.49999 4.15487C8.79786 4.15487 9.84999 5.207 9.84999 6.50487C9.84999 7.80274 8.79786 8.85487 7.49999 8.85487C6.20212 8.85487 5.14999 7.80274 5.14999 6.50487ZM7.49999 5.10487C6.72679 5.10487 6.09999 5.73167 6.09999 6.50487C6.09999 7.27807 6.72679 7.90487 7.49999 7.90487C8.27319 7.90487 8.89999 7.27807 8.89999 6.50487C8.89999 5.73167 8.27319 5.10487 7.49999 5.10487Z"
                fill="currentColor"
              />
            </svg>
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>
      </div>
      {isHome ? null : <SiteNav locale={locale} />}
      <form
        className="border-b border-line px-4 py-2 md:hidden"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`${path(locale, "/search")}?q=${encodeURIComponent(q)}`);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`${t.search}...`}
          className="w-full rounded-full border border-line px-4 py-2 text-sm outline-none"
        />
      </form>
      {menu ? (
        <div className="flex flex-col gap-3 border-b border-line px-4 py-4 font-serif uppercase md:hidden">
          {NAV.map((key) => (
            <Link
              key={key}
              href={hrefFor(locale, key)}
              onClick={() => setMenu(false)}
              className={key === "sales" ? "text-sale" : "text-black"}
            >
              {t.nav[key]}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  </div>
  
  );
}

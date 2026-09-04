"use client";

import { AccountMenu } from "@/components/account-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { QuoteBar } from "@/components/quote-bar";
import { NAV, hrefFor } from "@/lib/nav";
import { SiteNav } from "@/components/site-nav";
import { useCart } from "./cart-provider";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function Header({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const pathname = usePathname();
  const router = useRouter();
  const { count } = useCart();
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");

  const home = path(locale);
  const isHome = pathname === home || pathname === `${home}/`;

  useEffect(() => {
    setMenu(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  const goSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setMenu(false);
    router.push(`${path(locale, "/search")}?q=${encodeURIComponent(q)}`);
  };

  return (
    <div>
      <QuoteBar />
      <header className="sticky top-0 z-40 bg-white">
        <div className="mx-auto grid max-w-[1350px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-3 text-black md:gap-4 md:px-4 md:py-4">
          <form
            className="hidden md:block"
            onSubmit={goSearch}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`${t.search}...`}
              className="w-full max-w-xs rounded-full border border-line px-4 py-2 text-sm outline-none placeholder:text-muted focus:border-gold"
            />
          </form>
          <div className="flex items-center md:hidden">
            <button
              type="button"
              aria-label={menu ? t.close : "Menu"}
              aria-expanded={menu}
              onClick={() => setMenu((v) => !v)}
              className="flex h-8 w-8 items-center justify-center"
            >
              {menu ? (
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
          <Link
            href={path(locale)}
            className="font-serif text-[22px] font-bold uppercase tracking-[0.08em] md:text-3xl"
            onClick={() => setMenu(false)}
          >
            {t.brand}
          </Link>
          <div className="flex items-center justify-end gap-2.5 md:gap-6">
            <Link
              href={path(locale, "/wishlist")}
              aria-label={t.wishlist}
              className="hidden text-ink transition-opacity hover:opacity-55 md:inline-flex"
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
                height="18"
                width="18"
                className="md:h-6 md:w-6"
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
            <AccountMenu locale={locale} />
            <span className="origin-center scale-90 md:scale-100">
              <LanguageSwitcher locale={locale} />
            </span>
          </div>
        </div>
        {isHome ? null : (
          <div className="hidden md:block">
            <SiteNav locale={locale} />
          </div>
        )}
        <div
          data-open={menu ? "true" : undefined}
          className="absolute inset-x-0 top-full z-50 h-[calc(100dvh-90px)] overflow-y-auto border-t border-line bg-white text-fg shadow-[0_16px_40px_rgba(9,54,35,0.18)] pointer-events-none -translate-y-3 opacity-0 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[open]:pointer-events-auto data-[open]:translate-y-0 data-[open]:opacity-100 md:hidden"
          aria-hidden={!menu}
        >
            <div className="mx-auto flex min-h-full max-w-[1350px] flex-col px-8 pb-10 pt-6">
              <form onSubmit={goSearch} className="mx-2 mb-5">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={`${t.search}...`}
                  className="h-9 w-full rounded-full border border-line bg-white px-4 text-sm text-fg outline-none placeholder:text-muted focus:border-gold"
                />
              </form>
              <nav className="flex flex-col">
                {NAV.map((key) => {
                  const href = hrefFor(locale, key);
                  const active =
                    pathname === href || (key !== "home" && pathname.startsWith(href));
                  const sales = key === "sales";
                  return (
                    <Link
                      key={key}
                      href={href}
                      onClick={() => setMenu(false)}
                      className={`border-b border-line py-3 text-center font-serif text-[18px] font-semibold uppercase tracking-[0.12em] ${
                        sales
                          ? "text-sale"
                          : active
                            ? "text-gold"
                            : "text-fg"
                      }`}
                    >
                      {t.nav[key]}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-8 flex flex-col items-center gap-4 text-center">
                <p className="font-serif text-base text-fg">{t.followUsShort}</p>
                <div className="flex items-center gap-5">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="text-fg hover:text-gold"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.7" />
                      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
                      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
                    </svg>
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="YouTube"
                    className="text-fg hover:text-gold"
                  >
                    <svg width="24" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M22 12.2s0-3.2-.4-4.6c-.2-.8-.9-1.5-1.7-1.7C18.4 5.5 12 5.5 12 5.5s-6.4 0-7.9.4c-.8.2-1.5.9-1.7 1.7C2 9 2 12.2 2 12.2s0 3.2.4 4.6c.2.8.9 1.5 1.7 1.7 1.5.4 7.9.4 7.9.4s6.4 0 7.9-.4c.8-.2 1.5-.9 1.7-1.7.4-1.4.4-4.6.4-4.6Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path d="M10 15.2V9.2l5.2 3-5.2 3Z" fill="currentColor" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
      </header>
    </div>
  );
}

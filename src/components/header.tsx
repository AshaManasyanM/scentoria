"use client";

import { AccountMenu } from "@/components/account-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { QuoteBar } from "@/components/quote-bar";
import { NAV, hrefFor } from "@/lib/nav";
import { SiteNav } from "@/components/site-nav";
import { useCart } from "./cart-provider";
import { useWishlist } from "./wishlist-provider";
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
  const { items: wishlist } = useWishlist();
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
      <header className="sticky top-0 z-40 bg-bg">
        <div className="mx-auto grid max-w-[1350px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-3 text-[#143028] md:gap-4 md:px-4 md:py-3.5">
          <form className="hidden md:block" onSubmit={goSearch}>
            <label className="relative block w-full max-w-[240px]">
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8a8178]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16.5 20 20.5" strokeLinecap="round" />
              </svg>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`${t.search}...`}
                className="h-10 w-full rounded-full border border-white bg-white pl-10 pr-4 text-sm text-fg shadow-[0_1px_2px_rgba(26,20,24,0.06)] outline-none placeholder:text-[#9a9188] focus:border-[#d9d0c6]"
              />
            </label>
          </form>
          <div className="hidden items-center max-md:flex">
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
            className="font-serif text-[28px] font-semibold tracking-tight text-[#143028] md:text-[34px]"
            onClick={() => setMenu(false)}
          >
            {t.brand}
          </Link>
          <div className="flex items-center justify-end gap-3 text-[#143028] md:gap-5">
            <Link
              href={path(locale, "/wishlist")}
              aria-label={t.wishlist}
              data-wishlist-target
              className="relative inline-flex"
            >
              <svg viewBox="0 0 25 22" className="h-[18px] w-5 md:h-5 md:w-[22px]" aria-hidden>
                <path
                  d="M22.5737 1.49585C19.8979 -0.784421 15.9185 -0.374265 13.4624 2.15991L12.5005 3.15112L11.5386 2.15991C9.0874 -0.374265 5.10303 -0.784421 2.42725 1.49585C-0.63916 4.11304 -0.800293 8.8103 1.94385 11.6472L11.3921 21.4031C12.0024 22.033 12.9937 22.033 13.604 21.4031L23.0522 11.6472C25.8013 8.8103 25.6401 4.11304 22.5737 1.49585Z"
                  fill="#ffffff"
                  stroke="#000000"
                  strokeWidth="1.2"
                />
              </svg>
              {wishlist.length > 0 ? (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c5a059] px-1 text-[10px] font-medium leading-none text-[#083534]">
                  {wishlist.length}
                </span>
              ) : null}
            </Link>
            <AccountMenu locale={locale} />
            <Link
              href={path(locale, "/cart")}
              aria-label={t.cart}
              className="relative inline-flex transition-colors hover:text-[#c5a059]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 md:h-[22px] md:w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.2 8h11.6l-.9 10.2a1.2 1.2 0 0 1-1.2 1.1H8.3a1.2 1.2 0 0 1-1.2-1.1L6.2 8Z" />
                <path strokeLinecap="round" d="M9 8V6.8A3 3 0 0 1 12 3.8 3 3 0 0 1 15 6.8V8" />
              </svg>
              {count > 0 ? (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c5a059] px-1 text-[10px] font-medium leading-none text-[#083534]">
                  {count}
                </span>
              ) : null}
            </Link>
            <LanguageSwitcher locale={locale} />
          </div>
        </div>
        {isHome ? null : (
          <div className="hidden md:block">
            <SiteNav locale={locale} />
          </div>
        )}
        <div
          data-open={menu ? "true" : undefined}
          className="absolute inset-x-0 top-full z-50 hidden h-[calc(100dvh-90px)] overflow-y-auto border-t border-line bg-white text-fg shadow-[0_16px_40px_rgba(9,54,35,0.18)] max-md:block max-md:pointer-events-none max-md:-translate-y-3 max-md:opacity-0 max-md:transition-[opacity,transform] max-md:duration-300 max-md:ease-[cubic-bezier(0.22,1,0.36,1)] max-md:data-[open]:pointer-events-auto max-md:data-[open]:translate-y-0 max-md:data-[open]:opacity-100"
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

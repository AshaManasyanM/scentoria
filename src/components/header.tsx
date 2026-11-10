"use client";

import { AccountMenu } from "@/components/account-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { QuoteBar } from "@/components/quote-bar";
import { SearchBox } from "@/components/search-box";
import { NAV, hrefFor } from "@/lib/nav";
import { SiteNav } from "@/components/site-nav";
import { useCart } from "./cart-provider";
import { useWishlist } from "./wishlist-provider";
import { AUTH_EVENT, isLoggedIn, refreshSession } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function Header({ locale, hiddenNav = [] }: { locale: Locale; hiddenNav?: string[] }) {
  const t = getDict(locale);
  const pathname = usePathname();
  const { count } = useCart();
  const { items: wishlist } = useWishlist();
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const quoteRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLElement>(null);
  const navSentinelRef = useRef<HTMLDivElement>(null);

  const home = path(locale);
  const isHome = pathname === home || pathname === `${home}/`;

  useEffect(() => {
    setMenu(false);
  }, [pathname]);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const apply = () => setDesktop(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const sync = () => setLoggedIn(isLoggedIn());
    void refreshSession().then(sync);
    window.addEventListener(AUTH_EVENT, sync);
    return () => window.removeEventListener(AUTH_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!menu) return;

    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;

    html.classList.add("overflow-hidden");
    body.classList.add("overflow-hidden");
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    return () => {
      html.classList.remove("overflow-hidden");
      body.classList.remove("overflow-hidden");
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [menu]);

  // White header/menu as soon as the quote bar is gone.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const quoteHeight = quoteRef.current?.offsetHeight ?? 0;
      const y = window.scrollY;
      const enterAt = quoteHeight + 8;
      const exitAt = Math.max(0, quoteHeight - 2);
      setScrolled((current) => {
        const next = current ? y > exitAt : y > enterAt;
        return current === next ? current : next;
      });
      if (isHome) {
        const homeEnter = quoteHeight + 40;
        const homeExit = Math.max(0, quoteHeight + 8);
        setCompact((current) => {
          const next = current ? y > homeExit : y > homeEnter;
          return current === next ? current : next;
        });
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isHome]);

  // Other pages: logo → menu when the page nav has scrolled under the sticky bar.
  useEffect(() => {
    if (isHome) return;
    const sticky = stickyRef.current;
    const sentinel = navSentinelRef.current;
    if (!sticky || !sentinel) return;

    const observe = () => {
      const headerH = sticky.offsetHeight || 64;
      const io = new IntersectionObserver(
        ([entry]) => {
          const next = !entry.isIntersecting;
          setCompact((current) => (current === next ? current : next));
        },
        {
          root: null,
          threshold: 0,
          rootMargin: `-${headerH + 2}px 0px 0px 0px`,
        },
      );
      io.observe(sentinel);
      return io;
    };

    let io = observe();
    const onResize = () => {
      io.disconnect();
      io = observe();
    };
    window.addEventListener("resize", onResize);
    return () => {
      io.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [isHome, pathname]);

  return (
    <>
      <div ref={quoteRef}>
        <QuoteBar />
      </div>

      {/* Sticky bar keeps a fixed height — only opacity/color animate.
          When the mobile menu is open, pin the bar to the viewport so the close
          control stays reachable after body scroll-lock shifts the document. */}
      <header
        ref={stickyRef}
        className={`overflow-visible transition-[background-color,box-shadow] duration-[350ms] ease-out ${
          menu
            ? "fixed inset-x-0 top-0 z-[70] bg-white shadow-[0_8px_24px_rgba(8,53,52,0.12)]"
            : scrolled
              ? "sticky top-0 z-50 bg-white shadow-[0_8px_24px_rgba(8,53,52,0.12)]"
              : "sticky top-0 z-50 bg-bg shadow-none"
        }`}
      >
        <div className="relative z-[60] mx-auto grid h-[3.75rem] max-w-[min(100%,82.5rem)] grid-cols-[auto_1fr_auto] items-center gap-2 overflow-visible px-[clamp(0.75rem,2vw,1rem)] text-[#143028] sm:grid-cols-[1fr_auto_1fr] md:h-16 md:gap-4">
          <div className="relative z-50 hidden overflow-visible md:block">
            {desktop ? <SearchBox locale={locale} value={q} onChange={setQ} /> : null}
          </div>
          <div className="flex items-center md:hidden">
            <button
              type="button"
              aria-label={menu ? t.close : "Menu"}
              aria-expanded={menu}
              onClick={() => setMenu((v) => !v)}
              className="relative z-[80] flex h-11 w-11 shrink-0 items-center justify-center"
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
            aria-label={t.brand}
            onClick={() => setMenu(false)}
            className="justify-self-center md:hidden"
          >
            <Image
              src="/brand/scentoria-prive.png"
              alt={t.brand}
              width={220}
              height={180}
              priority
              unoptimized
              className="h-9 w-auto object-contain drop-shadow-[0_1px_1px_rgba(8,53,52,0.25)] sm:h-10"
            />
          </Link>

          <div className="relative hidden h-14 w-[min(70vw,36rem)] justify-self-center md:block">
            <Link
              href={path(locale)}
              aria-label={t.brand}
              onClick={() => setMenu(false)}
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-[350ms] ease-out ${
                compact ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
            >
              <Image
                src="/brand/scentoria-prive.png"
                alt={t.brand}
                width={220}
                height={180}
                priority
                unoptimized
                className="h-12 w-auto object-contain drop-shadow-[0_1px_1px_rgba(8,53,52,0.25)] xl:h-14"
              />
            </Link>
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-[350ms] ease-out ${
                compact ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <SiteNav locale={locale} variant="inline" hiddenNav={hiddenNav} />
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 text-[#143028] sm:gap-3.5 md:gap-4 xl:gap-5">
            <Link
              href={path(locale, loggedIn ? "/wishlist" : "/login")}
              aria-label={t.wishlist}
              data-wishlist-target
              className="relative inline-flex pr-1.5"
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
                <span className="absolute -right-0.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c5a059] px-1 text-[10px] font-medium leading-none text-[#083534]">
                  {wishlist.length}
                </span>
              ) : null}
            </Link>
            <AccountMenu locale={locale} />
            <Link
              href={path(locale, "/cart")}
              aria-label={t.cart}
              className="relative inline-flex pr-1.5 transition-colors hover:text-[#c5a059]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 md:h-[22px] md:w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.2 8h11.6l-.9 10.2a1.2 1.2 0 0 1-1.2 1.1H8.3a1.2 1.2 0 0 1-1.2-1.1L6.2 8Z" />
                <path strokeLinecap="round" d="M9 8V6.8A3 3 0 0 1 12 3.8 3 3 0 0 1 15 6.8V8" />
              </svg>
              {count > 0 ? (
                <span className="absolute -right-0.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c5a059] px-1 text-[10px] font-medium leading-none text-[#083534]">
                  {count}
                </span>
              ) : null}
            </Link>
            <LanguageSwitcher locale={locale} />
          </div>
        </div>

        <div
          data-open={menu ? "true" : undefined}
          className="fixed inset-x-0 top-[3.75rem] z-[65] hidden h-[calc(100dvh-3.75rem)] overflow-y-auto overscroll-contain border-t border-[#e4ddd3] bg-white text-[#083534] max-md:block max-md:pointer-events-none max-md:invisible max-md:opacity-0 max-md:transition-[opacity,visibility] max-md:duration-200 max-md:data-[open]:pointer-events-auto max-md:data-[open]:visible max-md:data-[open]:opacity-100"
          aria-hidden={!menu}
        >
          <div className="mx-auto flex min-h-full w-full max-w-[min(100%,84.375rem)] flex-col px-5 pb-10 pt-5 sm:px-8 sm:pt-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                {!desktop && menu ? (
                  <SearchBox locale={locale} value={q} onChange={setQ} onNavigate={() => setMenu(false)} compact />
                ) : null}
              </div>
              <button
                type="button"
                aria-label={t.close}
                onClick={() => setMenu(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e4ddd3] text-[#083534] md:hidden"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col">
              {NAV.filter((key) => !hiddenNav.includes(key)).map((key) => {
                const href = hrefFor(locale, key);
                const active = pathname === href || (key !== "home" && pathname.startsWith(href));
                const sales = key === "sales";
                return (
                  <Link
                    key={key}
                    href={href}
                    onClick={() => setMenu(false)}
                    className={`border-b border-[#e4ddd3] py-3.5 text-center font-serif text-[18px] font-semibold uppercase tracking-[0.12em] ${
                      sales ? "text-sale" : active ? "text-gold" : "text-[#083534]"
                    }`}
                  >
                    {t.nav[key]}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto flex flex-col items-center gap-4 pt-10 text-center">
              <p className="font-serif text-base text-[#083534]">{t.followUsShort}</p>
              <div className="flex items-center gap-5">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="text-[#083534] hover:text-gold"
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
                  className="text-[#083534] hover:text-gold"
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

      {/* Page nav scrolls away under the sticky bar; no height animation on sticky */}
      {isHome ? null : (
        <div
          ref={navSentinelRef}
          className={`relative z-30 hidden transition-colors duration-[350ms] ease-out md:block ${
            scrolled ? "bg-white" : "bg-bg"
          }`}
        >
          <SiteNav locale={locale} hiddenNav={hiddenNav} />
        </div>
      )}
    </>
  );
}

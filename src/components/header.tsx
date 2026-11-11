"use client";

import { AccountMenu } from "@/components/account-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { QuoteBar } from "@/components/quote-bar";
import { SearchBox } from "@/components/search-box";
import { NAV, hrefFor } from "@/lib/nav";
import { SiteNav } from "@/components/site-nav";
import { useCart } from "./cart-provider";
import { useWishlist } from "./wishlist-provider";
import { AUTH_EVENT, clearProfile, isLoggedIn, loadProfile, refreshSession } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function Header({ locale, hiddenNav = [] }: { locale: Locale; hiddenNav?: string[] }) {
  const t = getDict(locale);
  const pathname = usePathname();
  const router = useRouter();
  const { count } = useCart();
  const { items: wishlist } = useWishlist();
  const [menu, setMenu] = useState(false);
  const [menuShown, setMenuShown] = useState(false);
  const [menuIn, setMenuIn] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchShown, setSearchShown] = useState(false);
  const [searchIn, setSearchIn] = useState(false);
  const [overlayQuoteTop, setOverlayQuoteTop] = useState(0);
  const [q, setQ] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const quoteRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLElement>(null);
  const navSentinelRef = useRef<HTMLDivElement>(null);
  const menuTimer = useRef<number | null>(null);
  const searchTimer = useRef<number | null>(null);

  const home = path(locale);
  const isHome = pathname === home || pathname === `${home}/`;
  const overlayOpen = menu || searchOpen || menuShown || searchShown;

  function measureQuoteTop() {
    const quoteVisible = !scrolled && (quoteRef.current?.getBoundingClientRect().bottom ?? 0) > 0;
    return quoteVisible ? quoteRef.current?.offsetHeight ?? 0 : 0;
  }

  function clearTimer(ref: { current: number | null }) {
    if (ref.current != null) {
      window.clearTimeout(ref.current);
      ref.current = null;
    }
  }

  function closeOverlays() {
    clearTimer(menuTimer);
    clearTimer(searchTimer);
    setMenu(false);
    setMenuIn(false);
    setMenuShown(false);
    setSearchOpen(false);
    setSearchIn(false);
    setSearchShown(false);
    setOverlayQuoteTop(0);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchIn(false);
    clearTimer(searchTimer);
    searchTimer.current = window.setTimeout(() => {
      setSearchShown(false);
      if (!menu && !menuShown) setOverlayQuoteTop(0);
    }, 300);
  }

  function closeMenu() {
    setMenu(false);
    setMenuIn(false);
    clearTimer(menuTimer);
    menuTimer.current = window.setTimeout(() => {
      setMenuShown(false);
      if (!searchOpen && !searchShown) setOverlayQuoteTop(0);
    }, 300);
  }

  function openSearch() {
    clearTimer(menuTimer);
    setMenu(false);
    setMenuIn(false);
    setMenuShown(false);
    clearTimer(searchTimer);
    setOverlayQuoteTop(measureQuoteTop());
    setSearchShown(true);
    setSearchIn(false);
    setSearchOpen(true);
  }

  function openMenu() {
    clearTimer(searchTimer);
    setSearchOpen(false);
    setSearchIn(false);
    setSearchShown(false);
    clearTimer(menuTimer);
    setOverlayQuoteTop(measureQuoteTop());
    setMenuShown(true);
    setMenuIn(false);
    setMenu(true);
  }

  function toggleSearch() {
    if (searchOpen) closeSearch();
    else openSearch();
  }

  function toggleMenu() {
    if (menu) closeMenu();
    else openMenu();
  }

  useEffect(() => {
    closeOverlays();
  }, [pathname]);

  useEffect(() => {
    if (!menuShown || !menu) return;
    const frame = requestAnimationFrame(() => setMenuIn(true));
    return () => cancelAnimationFrame(frame);
  }, [menuShown, menu]);

  useEffect(() => {
    if (!searchShown || !searchOpen) return;
    const frame = requestAnimationFrame(() => setSearchIn(true));
    return () => cancelAnimationFrame(frame);
  }, [searchShown, searchOpen]);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const apply = () => setDesktop(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const sync = () => {
      const signedIn = isLoggedIn();
      setLoggedIn(signedIn);
      setUserName(signedIn ? loadProfile().name.trim() : "");
    };
    void refreshSession().then(sync);
    window.addEventListener(AUTH_EVENT, sync);
    return () => window.removeEventListener(AUTH_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!overlayOpen) return;

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
  }, [overlayOpen]);

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
      <div ref={quoteRef} className={overlayOpen && overlayQuoteTop > 0 ? "max-md:invisible" : undefined}>
        <QuoteBar />
      </div>

      {/* Sticky bar keeps a fixed height — only opacity/color animate.
          When a mobile overlay is open, pin the bar to the viewport so the close
          control stays reachable after body scroll-lock shifts the document. */}
      {overlayOpen && overlayQuoteTop > 0 ? (
        <div className="fixed inset-x-0 top-0 z-[72] md:hidden" aria-hidden>
          <QuoteBar />
        </div>
      ) : null}

      <header
        ref={stickyRef}
        style={overlayOpen ? { top: overlayQuoteTop } : undefined}
        className={`overflow-visible transition-[background-color,box-shadow,border-color] duration-[350ms] ease-out ${
          overlayOpen
            ? "fixed inset-x-0 z-[70] border-b-2 border-[#C9BEB0] bg-white shadow-[0_8px_24px_rgba(8,53,52,0.12)]"
            : scrolled
              ? "sticky top-0 z-50 border-b-2 border-[#C9BEB0] bg-white shadow-[0_8px_24px_rgba(8,53,52,0.12)]"
              : "sticky top-0 z-50 border-b-2 border-transparent bg-bg shadow-none"
        }`}
      >
        <div className="relative z-[60] mx-auto grid h-[3.75rem] max-w-[min(100%,82.5rem)] grid-cols-[auto_1fr_auto] items-center gap-2 overflow-visible px-[clamp(0.75rem,2vw,1rem)] text-[#143028] sm:grid-cols-[1fr_auto_1fr] md:h-16 md:gap-4">
          <div className="relative z-50 hidden overflow-visible md:block">
            {desktop ? <SearchBox locale={locale} value={q} onChange={setQ} bordered={scrolled || menu} /> : null}
          </div>
          <div className="flex items-center gap-0.5 md:hidden">
            <button
              type="button"
              aria-label={menu ? t.close : "Menu"}
              aria-expanded={menu}
              onClick={toggleMenu}
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
            <button
              type="button"
              aria-label={t.search}
              aria-expanded={searchOpen}
              onClick={toggleSearch}
              className="relative z-[80] flex h-11 w-11 shrink-0 items-center justify-center"
            >
              {searchOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="M16 16.5 20 20.5" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>

          <Link
            href={path(locale)}
            aria-label={t.brand}
            onClick={closeOverlays}
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

          <div className="flex shrink-0 items-center justify-end gap-1 text-[#143028] sm:gap-1.5 md:gap-2 xl:gap-2.5">
            <Link
              href={path(locale, loggedIn ? "/wishlist" : "/login")}
              aria-label={t.wishlist}
              data-wishlist-target
              className="relative hidden h-10 w-10 items-center justify-center md:inline-flex"
            >
              <svg viewBox="0 0 25 22" className="h-5 w-[22px]" aria-hidden>
                <path
                  d="M22.5737 1.49585C19.8979 -0.784421 15.9185 -0.374265 13.4624 2.15991L12.5005 3.15112L11.5386 2.15991C9.0874 -0.374265 5.10303 -0.784421 2.42725 1.49585C-0.63916 4.11304 -0.800293 8.8103 1.94385 11.6472L11.3921 21.4031C12.0024 22.033 12.9937 22.033 13.604 21.4031L23.0522 11.6472C25.8013 8.8103 25.6401 4.11304 22.5737 1.49585Z"
                  fill="#ffffff"
                  stroke="#000000"
                  strokeWidth="1.2"
                />
              </svg>
              {wishlist.length > 0 ? (
                <span className="absolute right-0.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c5a059] px-1 text-[10px] font-medium leading-none text-[#083534]">
                  {wishlist.length}
                </span>
              ) : null}
            </Link>
            <AccountMenu locale={locale} />
            <Link
              href={path(locale, "/cart")}
              aria-label={t.cart}
              className="relative inline-flex h-10 w-10 items-center justify-center transition-colors hover:text-[#c5a059]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.2 8h11.6l-.9 10.2a1.2 1.2 0 0 1-1.2 1.1H8.3a1.2 1.2 0 0 1-1.2-1.1L6.2 8Z" />
                <path strokeLinecap="round" d="M9 8V6.8A3 3 0 0 1 12 3.8 3 3 0 0 1 15 6.8V8" />
              </svg>
              {count > 0 ? (
                <span className="absolute right-0.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c5a059] px-1 text-[10px] font-medium leading-none text-[#083534]">
                  {count}
                </span>
              ) : null}
            </Link>
            <LanguageSwitcher locale={locale} />
          </div>
        </div>

        {searchShown ? (
        <div
          style={{
            top: `calc(${overlayQuoteTop}px + 3.75rem)`,
            height: `calc(100dvh - ${overlayQuoteTop}px - 3.75rem)`,
            transform: searchIn ? "translate3d(0,0,0)" : "translate3d(100%,0,0)",
          }}
          className="fixed inset-x-0 z-[66] flex flex-col overflow-hidden border-t border-[#e4ddd3] bg-white text-[#083534] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden"
          aria-hidden={!searchOpen}
        >
          <div className="mx-auto flex h-full w-full max-w-[min(100%,84.375rem)] flex-col px-5 pt-5 sm:px-8">
            <h2 className="mb-4 shrink-0 font-serif text-[26px] font-medium leading-tight text-[#1a1a1a]">{t.searchPerfumes}</h2>
            {!desktop ? (
              <SearchBox
                locale={locale}
                value={q}
                onChange={setQ}
                onNavigate={closeSearch}
                panelLayout
                autoFocus={searchIn}
              />
            ) : null}
          </div>
        </div>
        ) : null}

        {menuShown ? (
        <div
          style={{
            top: `calc(${overlayQuoteTop}px + 3.75rem)`,
            height: `calc(100dvh - ${overlayQuoteTop}px - 3.75rem)`,
            transform: menuIn ? "translate3d(0,0,0)" : "translate3d(-100%,0,0)",
          }}
          className="fixed inset-x-0 z-[65] overflow-y-auto overscroll-contain border-t border-[#e4ddd3] bg-white text-[#083534] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden"
          aria-hidden={!menu}
        >
          <div className="mx-auto flex min-h-full w-full max-w-[min(100%,84.375rem)] flex-col px-5 pb-10 pt-5 sm:px-8 sm:pt-6">
            <nav className="flex flex-col">
              {NAV.filter((key) => !hiddenNav.includes(key)).map((key) => {
                const href = hrefFor(locale, key);
                const active = pathname === href || (key !== "home" && pathname.startsWith(href));
                const sales = key === "sales";
                return (
                  <Link
                    key={key}
                    href={href}
                    onClick={closeMenu}
                    className={`border-b border-[#e4ddd3] py-3.5 text-center font-serif text-[18px] font-semibold uppercase tracking-[0.12em] ${
                      sales ? "text-sale" : active ? "text-gold" : "text-[#083534]"
                    }`}
                  >
                    {t.nav[key]}
                  </Link>
                );
              })}
            </nav>

            {loggedIn ? (
              <div className="mt-6 border-y border-[#e4ddd3] py-5 text-center">
                <p className="text-base font-semibold text-[#1a1a1a]">
                  {userName ? `${t.hi} ${userName}` : t.hi}
                </p>
                <div className="mt-4 flex items-center justify-center gap-6 sm:gap-8">
                  <Link
                    href={path(locale, "/account")}
                    onClick={closeMenu}
                    className="inline-flex items-center gap-1.5 text-sm text-[#1a1a1a]"
                  >
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                      <circle cx="12" cy="8" r="3.1" />
                      <path strokeLinecap="round" d="M5.6 19.2c1-2.7 3.3-4.1 6.4-4.1s5.4 1.4 6.4 4.1" />
                    </svg>
                    {t.account}
                  </Link>
                  <Link
                    href={path(locale, "/account/orders")}
                    onClick={closeMenu}
                    className="inline-flex items-center gap-1.5 text-sm text-[#1a1a1a]"
                  >
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.2 8h11.6l-.9 10.2a1.2 1.2 0 0 1-1.2 1.1H8.3a1.2 1.2 0 0 1-1.2-1.1L6.2 8Z" />
                      <path strokeLinecap="round" d="M9 8V6.8A3 3 0 0 1 12 3.8 3 3 0 0 1 15 6.8V8" />
                    </svg>
                    {t.orders}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      void clearProfile().then(() => router.push(path(locale)));
                    }}
                    className="inline-flex items-center gap-1.5 text-sm text-[#ef4444]"
                  >
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <path d="M16 17l5-5-5-5" />
                      <path d="M21 12H9" />
                    </svg>
                    {t.logout}
                  </button>
                </div>
              </div>
            ) : null}

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
              </div>
            </div>
          </div>
        </div>
        ) : null}
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

"use client";

import { CommunityModal } from "@/components/community-modal";
import { useCart } from "./cart-provider";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV = ["home", "about", "brands", "perfumes", "blog", "sales"] as const;

function hrefFor(locale: Locale, key: (typeof NAV)[number]) {
  if (key === "home") return path(locale);
  if (key === "perfumes") return path(locale, "/products");
  return path(locale, `/${key}`);
}

export function Header({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const other: Locale = locale === "en" ? "hy" : "en";
  const pathname = usePathname();
  const router = useRouter();
  const { count, setOpen } = useCart();
  const [menu, setMenu] = useState(false);
  const [community, setCommunity] = useState(false);
  const [q, setQ] = useState("");

  const switchLocale = pathname.replace(/^\/(en|hy)/, `/${other}`) || `/${other}`;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-muted">
          <button type="button" onClick={() => setCommunity(true)} className="hover:text-gold">
            {t.joinCommunity}
          </button>
          <Link href={path(locale, "/account")} className="hover:text-gold">
            {t.account}
          </Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <button
          type="button"
          className="md:hidden text-gold-2"
          aria-label="Menu"
          onClick={() => setMenu((v) => !v)}
        >
          ☰
        </button>
        <Link href={path(locale)} className="font-serif text-2xl tracking-[0.28em] uppercase">
          {t.brand}
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-[11px] tracking-[0.22em] uppercase text-muted">
          {NAV.map((key) => {
            const href = hrefFor(locale, key);
            const active = pathname === href || (key !== "home" && pathname.startsWith(href));
            return (
              <Link
                key={key}
                href={href}
                className={active ? "text-gold" : "hover:text-fg"}
              >
                {t.nav[key]}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <Link href={switchLocale} className="text-[11px] tracking-[0.18em] uppercase text-muted hover:text-gold">
            {other}
          </Link>
          <Link href={path(locale, "/cart")} className="hidden sm:inline text-[11px] uppercase tracking-[0.16em] text-muted hover:text-gold">
            {t.viewCart}
          </Link>
          <button type="button" onClick={() => setOpen(true)} className="tracking-wide">
            {t.cart} ({count})
          </button>
        </div>
      </div>
      <form
        className="mx-auto max-w-6xl px-4 pb-3"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`${path(locale, "/search")}?q=${encodeURIComponent(q)}`);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.search}
          className="w-full border border-line bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-gold"
        />
      </form>
      {menu ? (
        <div className="border-t border-line px-4 py-4 md:hidden flex flex-col gap-3 uppercase tracking-[0.18em] text-sm">
          {NAV.map((key) => (
            <Link key={key} href={hrefFor(locale, key)} onClick={() => setMenu(false)}>
              {t.nav[key]}
            </Link>
          ))}
          <Link href={path(locale, "/contact")} onClick={() => setMenu(false)}>
            {t.contact}
          </Link>
        </div>
      ) : null}
      <CommunityModal locale={locale} open={community} onClose={() => setCommunity(false)} />
    </header>
  );
}

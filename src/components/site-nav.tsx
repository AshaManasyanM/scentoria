"use client";

import { getDict } from "@/lib/i18n";
import { NAV, hrefFor } from "@/lib/nav";
import type { Locale } from "@/lib/types";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteNav({
  locale,
  variant = "default",
  onNavigate,
  hiddenNav = [],
}: {
  locale: Locale;
  variant?: "default" | "overlay" | "inline";
  onNavigate?: () => void;
  hiddenNav?: string[];
}) {
  const t = getDict(locale);
  const pathname = usePathname();
  const overlay = variant === "overlay";
  const inline = variant === "inline";

  const links = NAV.filter((key) => !hiddenNav.includes(key)).map((key) => {
    const href = hrefFor(locale, key);
    const active = pathname === href || (key !== "home" && pathname.startsWith(href));
    const sales = key === "sales";

    let className: string;
    if (overlay) {
      className = sales
        ? "font-bold text-[rgb(236,8,8)] [text-shadow:0_2px_10px_rgba(0,0,0,0.55),0_1px_2px_rgba(0,0,0,0.8)]"
        : "font-semibold text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.55),0_1px_2px_rgba(0,0,0,0.8)]";
    } else if (inline) {
      className = sales
        ? "text-sale"
        : active
          ? "text-[#083534]"
          : "text-[#083534]/80 hover:text-[#083534]";
    } else {
      className = sales ? "text-sale" : active ? "text-black" : "text-black hover:opacity-70";
    }

    return (
      <Link key={key} href={href} onClick={onNavigate} className={`shrink-0 ${className}`}>
        {t.nav[key]}
      </Link>
    );
  });

  if (inline) {
    return (
      <nav
        aria-label="Primary"
        className="flex max-w-full items-center justify-center gap-[clamp(0.65rem,1.8vw,1.75rem)] overflow-x-auto whitespace-nowrap font-serif text-[clamp(0.7rem,0.55rem+0.45vw,0.95rem)] font-bold uppercase tracking-wide"
      >
        {links}
      </nav>
    );
  }

  return (
    <nav className={overlay ? "" : "bg-inherit"}>
      <div
        className={`mx-auto flex max-w-[min(100%,82.5rem)] items-center justify-center gap-[clamp(0.75rem,3vw,4.375rem)] overflow-x-auto px-[clamp(0.75rem,2vw,2rem)] text-[clamp(0.8125rem,0.7rem+0.45vw,1.125rem)] font-serif font-bold uppercase tracking-wide ${
          overlay
            ? "bg-transparent py-[clamp(1rem,2vw,1.5rem)] text-white"
            : "border-t border-[#ece6dc]/80 bg-inherit py-[clamp(0.75rem,1.5vw,1.25rem)] text-black"
        }`}
      >
        {links}
      </div>
    </nav>
  );
}

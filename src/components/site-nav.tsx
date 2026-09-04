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
}: {
  locale: Locale;
  variant?: "default" | "overlay";
  onNavigate?: () => void;
}) {
  const t = getDict(locale);
  const pathname = usePathname();
  const overlay = variant === "overlay";

  return (
    <nav
      className={
        overlay
          ? ""
          : "bg-white shadow-[0_4px_8px_rgba(24,24,27,0.1)]"
      }
    >
      <div
        className={`mx-auto flex max-w-[1350px] items-center justify-center gap-3 overflow-x-auto px-3 py-4 text-[15px] font-serif font-bold uppercase tracking-wide md:gap-[70px] md:px-8 md:py-7 md:text-[18px] ${
          overlay ? "text-white" : "text-black"
        }`}
      >
        {NAV.map((key) => {
          const href = hrefFor(locale, key);
          const active = pathname === href || (key !== "home" && pathname.startsWith(href));
          const sales = key === "sales";

          let className: string;
          if (overlay) {
            className = sales
              ? "font-bold text-[rgb(236,8,8)] [text-shadow:0_2px_10px_rgba(0,0,0,0.55),0_1px_2px_rgba(0,0,0,0.8)]"
              : "font-semibold text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.55),0_1px_2px_rgba(0,0,0,0.8)]";
          } else {
            className = sales ? "text-sale" : active ? "text-black" : "text-black hover:opacity-70";
          }

          return (
            <Link key={key} href={href} onClick={onNavigate} className={`shrink-0 ${className}`}>
              {t.nav[key]}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

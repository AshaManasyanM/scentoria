"use client";

import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV = ["home", "about", "brands", "perfumes", "blog", "sales"] as const;

export function hrefFor(locale: Locale, key: (typeof NAV)[number]) {
  if (key === "home") return path(locale);
  if (key === "perfumes") return path(locale, "/products");
  return path(locale, `/${key}`);
}

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
        className={`mx-auto flex max-w-7xl items-center justify-center gap-5 overflow-x-auto px-8 py-7 text-[18px] font-serif font-bold uppercase tracking-wide md:gap-[70px] ${
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
            <Link key={key} href={href} onClick={onNavigate} className={className}>
              {t.nav[key]}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

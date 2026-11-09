"use client";

import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/account", key: "profile" as const },
  { href: "/account/addresses", key: "addresses" as const },
  { href: "/account/orders", key: "orders" as const },
  { href: "/wishlist", key: "wishlist" as const },
  { href: "/cart", key: "cart" as const },
];

export function AccountShell({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const t = getDict(locale);
  const pathname = usePathname();

  return (
    <div className="section-pad-y bg-white">
      <div className="mx-auto flex max-w-[min(100%,82.5rem)] flex-col gap-8 px-[clamp(1rem,2.5vw,2rem)] md:flex-row md:gap-10 xl:gap-16">
        <aside className="w-full shrink-0 md:w-44">
          <nav className="flex flex-col items-start gap-1">
            {ITEMS.map((item) => {
              const href = path(locale, item.href);
              const active = pathname === href || pathname === `${href}/`;
              return (
                <Link
                  key={item.key}
                  href={href}
                  className={`rounded-full px-4 py-2 text-sm ${
                    active ? "bg-[#083534] text-[#f7f2ea]" : "text-[#4d5856] hover:text-[#083534]"
                  }`}
                >
                  {t[item.key]}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

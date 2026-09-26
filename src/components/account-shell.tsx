"use client";

import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/account", key: "profile" as const },
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
    <div className="bg-white py-10 md:py-14">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-8 px-4 md:flex-row md:gap-16 md:px-8">
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

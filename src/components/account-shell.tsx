"use client";

import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/account", key: "account" as const },
  { href: "/account/orders", key: "orders" as const },
  { href: "/wishlist", key: "wishlist" as const },
  { href: "/cart", key: "shoppingCart" as const },
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
    <div className="bg-[#fafafa] py-10 md:py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 md:flex-row md:gap-12">
        <aside className="w-full shrink-0 md:w-52">
          <nav className="flex flex-col gap-2">
            {ITEMS.map((item) => {
              const href = path(locale, item.href);
              const active = pathname === href || pathname === `${href}/`;
              return (
                <Link
                  key={item.key}
                  href={href}
                  className={`rounded-lg px-4 py-2.5 text-sm transition-colors duration-300 ${
                    active ? "bg-zinc-800 hover:bg-teal-600 font-medium text-white" : "text-fg hover:bg-[#f4f4f5]"
                  }`}
                >
                  {t[item.key]}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex min-h-[420px] min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

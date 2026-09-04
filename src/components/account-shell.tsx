"use client";

import { AUTH_EVENT, isLoggedIn } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ITEMS = [
  { href: "/account", key: "account" as const, auth: true },
  { href: "/account/orders", key: "orders" as const, auth: true },
  { href: "/wishlist", key: "wishlist" as const, auth: false },
  { href: "/cart", key: "shoppingCart" as const, auth: false },
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
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const sync = () => setLoggedIn(isLoggedIn());
    sync();
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <div className="bg-[#fafafa] py-10 md:py-14">
      <div className="mx-auto flex max-w-[1350px] flex-col gap-8 px-4 md:flex-row md:gap-12">
        <aside className="w-full shrink-0 md:w-52">
          <nav className="flex flex-col gap-2">
            {ITEMS.filter((item) => !item.auth || loggedIn).map((item) => {
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

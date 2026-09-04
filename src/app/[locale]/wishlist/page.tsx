"use client";

import { AccountEmptyState, CartBagIcon } from "@/components/account-empty-state";
import { AccountShell } from "@/components/account-shell";
import { useWishlist } from "@/components/wishlist-provider";
import { getDict, isLocale } from "@/lib/i18n";
import { path } from "@/lib/path";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function WishlistPage() {
  const params = useParams<{ locale: string }>();
  const locale = isLocale(params.locale) ? params.locale : "en";
  const t = getDict(locale);
  const { items, toggle } = useWishlist();

  return (
    <AccountShell locale={locale}>
      {items.length === 0 ? (
        <AccountEmptyState
          icon={<CartBagIcon className="h-14 w-14" />}
          title={t.emptyWishlist}
          hint={t.emptyWishlistHint}
          href={path(locale, "/products")}
        />
      ) : (
        <>
          <h1 className="font-serif text-3xl">{t.wishlist}</h1>
          <div className="mt-8 space-y-6">
            {items.map((item) => (
              <div key={item.handle} className="flex gap-4 rounded-xl bg-white p-4 shadow-sm">
                {item.image ? (
                  <Image src={item.image} alt="" width={96} height={128} className="object-cover" />
                ) : null}
                <div className="flex-1">
                  <p className="text-sm text-muted">{item.brand}</p>
                  <Link href={path(locale, `/products/${item.handle}`)} className="font-serif text-2xl">
                    {item.title}
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggle(item)}
                    className="mt-3 text-sm text-sale"
                  >
                    {t.remove}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AccountShell>
  );
}

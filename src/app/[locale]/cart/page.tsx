"use client";

import { AccountEmptyState, CartBagIcon } from "@/components/account-empty-state";
import { AccountShell } from "@/components/account-shell";
import { useCart } from "@/components/cart-provider";
import { formatMoney } from "@/lib/format";
import { getDict, isLocale } from "@/lib/i18n";
import { path } from "@/lib/path";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CartPage() {
  const params = useParams<{ locale: string }>();
  const locale = isLocale(params.locale) ? params.locale : "en";
  const t = getDict(locale);
  const { cart, updateQty } = useCart();
  const subtotal = cart.lines.reduce(
    (sum, line) => sum + Number(line.price.amount) * line.quantity,
    0,
  );
  const currency = cart.lines[0]?.price.currencyCode ?? "AMD";

  return (
    <AccountShell locale={locale}>
      {cart.lines.length === 0 ? (
        <AccountEmptyState
          icon={<CartBagIcon className="h-14 w-14" />}
          title={t.emptyCart}
          hint={t.emptyCartHint}
          href={path(locale, "/products")}
        />
      ) : (
    <div>
      <h1 className="font-serif text-3xl">{t.shoppingCart}</h1>
        <div className="mt-8 space-y-6">
          {cart.lines.map((line) => (
            <div key={line.id} className="flex gap-4 rounded-xl bg-white p-4 shadow-sm">
              {line.image ? (
                <Image src={line.image} alt="" width={96} height={128} className="object-cover" />
              ) : null}
              <div className="flex-1">
                <Link href={path(locale, `/products/${line.handle}`)} className="font-serif text-2xl">
                  {line.title}
                </Link>
                <p className="text-sm text-muted">{line.variantTitle}</p>
                <p className="mt-2">{formatMoney(line.price, locale)}</p>
                <div className="mt-3 flex items-center gap-3">
                  <button type="button" onClick={() => updateQty(line.id, line.quantity - 1)}>
                    −
                  </button>
                  <span>{line.quantity}</span>
                  <button type="button" onClick={() => updateQty(line.id, line.quantity + 1)}>
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
          <p className="flex justify-between text-lg">
            <span>{t.subtotal}</span>
            <span>
              {formatMoney({ amount: String(subtotal), currencyCode: currency }, locale)}
            </span>
          </p>
          {cart.checkoutUrl ? (
            <a
              href={cart.checkoutUrl}
              className="btn-green mt-4 w-full"
            >
              {t.checkout}
            </a>
          ) : (
            <p className="text-sm text-muted">
              Connect the Shopify Storefront token to enable checkout. See ADMIN.md.
            </p>
          )}
        </div>
    </div>
      )}
    </AccountShell>
  );
}

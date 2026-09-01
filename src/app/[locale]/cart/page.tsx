"use client";

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
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="font-serif text-5xl text-center">{t.cart}</h1>
      {cart.lines.length === 0 ? (
        <p className="mt-12 text-center text-muted">
          {t.emptyCart}{" "}
          <Link href={path(locale, "/products")} className="text-gold">
            {t.continueShopping}
          </Link>
        </p>
      ) : (
        <div className="mt-12 space-y-6">
          {cart.lines.map((line) => (
            <div key={line.id} className="flex gap-4 border-b border-line pb-6">
              {line.image ? (
                <Image src={line.image} alt="" width={96} height={128} className="object-cover" />
              ) : null}
              <div className="flex-1">
                <Link href={path(locale, `/products/${line.handle}`)} className="font-serif text-2xl">
                  {line.title}
                </Link>
                <p className="text-sm text-muted">{line.variantTitle}</p>
                <p className="mt-2 text-gold">{formatMoney(line.price, locale)}</p>
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
            <span className="text-gold">
              {formatMoney({ amount: String(subtotal), currencyCode: currency }, locale)}
            </span>
          </p>
          {cart.checkoutUrl ? (
            <a
              href={cart.checkoutUrl}
              className="block bg-gold py-3 text-center text-sm uppercase tracking-[0.2em] text-bg"
            >
              {t.checkout}
            </a>
          ) : (
            <p className="text-sm text-muted">
              Connect the Shopify Storefront token to enable checkout. See ADMIN.md.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

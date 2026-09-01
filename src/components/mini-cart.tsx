"use client";

import { useCart } from "./cart-provider";
import { formatMoney } from "@/lib/format";
import { path } from "@/lib/path";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

export function MiniCart({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const { cart, open, setOpen, updateQty } = useCart();
  if (!open) return null;

  const subtotal = cart.lines.reduce(
    (sum, line) => sum + Number(line.price.amount) * line.quantity,
    0,
  );
  const currency = cart.lines[0]?.price.currencyCode ?? "AMD";

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close cart"
        onClick={() => setOpen(false)}
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-bg border-l border-line p-6 flex flex-col">
        <div className="flex justify-between items-center">
          <h2 className="font-serif text-3xl">{t.cart}</h2>
          <button type="button" onClick={() => setOpen(false)} className="text-muted">
            Close
          </button>
        </div>
        <div className="mt-6 flex-1 overflow-auto space-y-4">
          {cart.lines.length === 0 ? (
            <p className="text-muted">{t.emptyCart}</p>
          ) : (
            cart.lines.map((line) => (
              <div key={line.id} className="flex gap-3 border-b border-line pb-4">
                {line.image ? (
                  <Image src={line.image} alt="" width={72} height={96} className="object-cover" />
                ) : null}
                <div className="flex-1">
                  <Link href={path(locale, `/products/${line.handle}`)} onClick={() => setOpen(false)}>
                    {line.title}
                  </Link>
                  <p className="text-xs text-muted">{line.variantTitle}</p>
                  <p className="text-gold text-sm mt-1">{formatMoney(line.price, locale)}</p>
                  <div className="mt-2 flex items-center gap-2 text-sm">
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
            ))
          )}
        </div>
        <div className="pt-4 border-t border-line">
          <p className="flex justify-between">
            <span>{t.subtotal}</span>
            <span className="text-gold">
              {formatMoney({ amount: String(subtotal), currencyCode: currency }, locale)}
            </span>
          </p>
          {cart.checkoutUrl ? (
            <a
              href={cart.checkoutUrl}
              className="mt-4 block bg-gold text-bg text-center py-3 tracking-[0.2em] uppercase text-sm"
            >
              {t.checkout}
            </a>
          ) : (
            <p className="mt-4 text-xs text-muted">
              Connect the Shopify Storefront token to enable checkout. Cart is saved locally for now.
            </p>
          )}
          <Link
            href={path(locale, "/cart")}
            onClick={() => setOpen(false)}
            className="mt-3 block text-center text-sm text-muted"
          >
            {t.cart}
          </Link>
        </div>
      </aside>
    </div>
  );
}

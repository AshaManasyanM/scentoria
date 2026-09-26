"use client";

import { CartBagIcon } from "@/components/account-empty-state";
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

  if (cart.lines.length === 0) {
    return (
      <section className="bg-white px-4 py-16 md:py-24">
        <div className="mx-auto flex min-h-[320px] max-w-[760px] flex-col items-center justify-center text-center">
          <CartBagIcon className="h-14 w-14 text-[#9a9188]" />
          <h1 className="mt-5 font-serif text-[28px] font-medium text-[#083534] md:text-[32px]">{t.shoppingCart}</h1>
          <p className="mt-3 text-[15px] leading-7 text-[#083534]">{t.emptyCart}</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#6b7280]">{t.emptyCartHint}</p>
          <Link
            href={path(locale, "/products")}
            className="mt-6 inline-flex rounded-[2px] bg-[#083534] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#f7f2ea]"
          >
            {t.viewAllProducts}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white px-4 py-10 md:px-8 md:py-16">
      <div className="mx-auto max-w-[760px]">
        <h1 className="text-center font-serif text-[28px] font-medium text-[#083534] md:text-[32px]">
          {t.shoppingCart}
        </h1>
        <div className="mt-8 space-y-4">
          {cart.lines.map((line) => (
            <div key={line.id} className="flex gap-4 rounded-md border border-[#e6ddd2] bg-[#f7f2ea] p-4">
              {line.image ? (
                <Image src={line.image} alt="" width={88} height={110} className="h-[110px] w-[88px] rounded-sm object-cover" />
              ) : null}
              <div className="min-w-0 flex-1 text-center">
                <Link href={path(locale, `/products/${line.handle}`)} className="font-serif text-xl text-[#083534]">
                  {line.title}
                </Link>
                <p className="mt-1 text-sm text-[#6b7280]">{line.variantTitle}</p>
                <p className="mt-2 text-sm text-[#083534]">{formatMoney(line.price, locale)}</p>
                <div className="mt-3 flex items-center justify-center gap-3 text-[#083534]">
                  <button
                    type="button"
                    onClick={() => updateQty(line.id, line.quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-[2px] border border-[#d8d0c4]"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="min-w-6">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(line.id, line.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-[2px] border border-[#d8d0c4]"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 flex items-center justify-center gap-6 text-lg text-[#083534]">
          <span>{t.subtotal}</span>
          <span>{formatMoney({ amount: String(subtotal), currencyCode: currency }, locale)}</span>
        </p>
        {cart.checkoutUrl ? (
          <a
            href={cart.checkoutUrl}
            className="mx-auto mt-6 flex w-full max-w-xs items-center justify-center rounded-[2px] bg-[#083534] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#f7f2ea]"
          >
            {t.checkout}
          </a>
        ) : (
          <p className="mx-auto mt-6 max-w-md text-center text-sm leading-6 text-[#6b7280]">
            Connect the Shopify Storefront token to enable checkout. See ADMIN.md.
          </p>
        )}
      </div>
    </section>
  );
}

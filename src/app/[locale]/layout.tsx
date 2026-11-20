import { CartProvider } from "@/components/cart-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SubscribeDiscountWidget } from "@/components/subscribe-discount-widget";
import { WishlistProvider } from "@/components/wishlist-provider";
import { isLocale, locales } from "@/lib/i18n";
import { getSectionVisibility } from "@/lib/shopify/catalog";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || `/${locale}`;
  const pathWithoutLocale = pathname.replace(/^\/(en|hy|es)/, "") || "";
  const languages = Object.fromEntries(
    locales.map((code) => [code, `/${code}${pathWithoutLocale}`]),
  ) as Record<string, string>;
  languages["x-default"] = `/en${pathWithoutLocale}`;

  return {
    alternates: {
      languages,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const sections = await getSectionVisibility();
  const hiddenNav = [
    ...(!sections.about ? ["about"] : []),
    ...(!sections.brands ? ["brands"] : []),
    ...(!sections.sale ? ["sales"] : []),
  ];

  return (
    <CartProvider>
      <WishlistProvider>
        <Header locale={locale} hiddenNav={hiddenNav} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale} hiddenNav={hiddenNav} />
        <SubscribeDiscountWidget locale={locale} />
      </WishlistProvider>
    </CartProvider>
  );
}

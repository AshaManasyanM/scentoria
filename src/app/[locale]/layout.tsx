import { CartProvider } from "@/components/cart-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { WishlistProvider } from "@/components/wishlist-provider";
import { isLocale, locales } from "@/lib/i18n";
import { getSectionVisibility } from "@/lib/shopify/catalog";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
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
      </WishlistProvider>
    </CartProvider>
  );
}

import { CartProvider } from "@/components/cart-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { MiniCart } from "@/components/mini-cart";
import { isLocale } from "src/lib/i18n";
import { notFound } from "next/navigation";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <CartProvider>
      <Header locale={locale} />
      <MiniCart locale={locale} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} />
    </CartProvider>
  );
}

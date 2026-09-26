import { AccountShell } from "@/components/account-shell";
import { WishlistItems } from "@/components/wishlist-items";
import { localeFrom } from "@/lib/locale-params";
import { getCatalog } from "@/lib/shopify/catalog";

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);
  const { products } = await getCatalog();

  return (
    <>
      <AccountShell locale={locale}>
        <WishlistItems locale={locale} products={products} />
      </AccountShell>
    </>
  );
}

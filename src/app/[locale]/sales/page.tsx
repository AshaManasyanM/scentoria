import { CatalogBanner } from "@/components/catalog-banner";
import { PageEnd } from "@/components/page-end";
import { PageHero } from "@/components/page-hero";
import { ProductGrid } from "@/components/product-grid";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { filterProducts, getCatalog } from "@/lib/shopify/catalog";

export default async function SalesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);
  const t = getDict(locale);
  const { products, source } = await getCatalog();
  const list = filterProducts(products, { sale: true });

  return (
    <>
      <PageHero title={t.salesHero} subtitle={t.salesSub} />
      <CatalogBanner locale={locale} source={source} />
      <div className="mx-auto max-w-[1350px] px-4 py-10 md:py-14">
        <ProductGrid products={list} locale={locale} />
      </div>
      <PageEnd locale={locale} />
    </>
  );
}

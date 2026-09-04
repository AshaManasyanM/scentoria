import { CatalogBanner } from "@/components/catalog-banner";
import { PageEnd } from "@/components/page-end";
import { ProductGrid } from "@/components/product-grid";
import { SectionHeading } from "@/components/section-heading";
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
      <CatalogBanner locale={locale} source={source} />
      <div className="mx-auto max-w-[1350px] px-4 py-16">
        <SectionHeading title={t.salesHero} subtitle={t.salesSub} />
        <ProductGrid products={list} locale={locale} />
      </div>
      <PageEnd locale={locale} />
    </>
  );
}

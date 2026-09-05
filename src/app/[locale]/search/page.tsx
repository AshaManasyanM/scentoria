import { CatalogBanner } from "@/components/catalog-banner";
import { PageEnd } from "@/components/page-end";
import { PageHero } from "@/components/page-hero";
import { ProductGrid } from "@/components/product-grid";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { getCatalog, searchProducts } from "@/lib/shopify/catalog";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const locale = await localeFrom(params);
  const { q = "" } = await searchParams;
  const t = getDict(locale);
  const { source } = await getCatalog();
  const products = await searchProducts(q);

  return (
    <>
      <PageHero title={t.search} subtitle={q || undefined} />
      <CatalogBanner locale={locale} source={source} />
      <div className="mx-auto max-w-[1350px] px-4 py-10 md:py-14">
        <ProductGrid products={products} locale={locale} />
      </div>
      <PageEnd locale={locale} />
    </>
  );
}

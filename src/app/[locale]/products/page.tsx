import { CatalogBanner } from "@/components/catalog-banner";
import { PageEnd } from "@/components/page-end";
import { PageHero } from "@/components/page-hero";
import { ProductFilters } from "@/components/product-filters";
import { ProductGrid } from "@/components/product-grid";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { filterProducts, getCatalog, uniqueBrands } from "@/lib/shopify/catalog";
import { noteKeys } from "@/lib/shopify/mock";
import { Suspense } from "react";

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    gender?: string | string[];
    note?: string | string[];
    brand?: string | string[];
    sort?: string;
    new?: string;
  }>;
}) {
  const locale = await localeFrom(params);
  const query = await searchParams;
  const t = getDict(locale);
  const { products, source } = await getCatalog();
  const brands = uniqueBrands(products);
  const list = filterProducts(products, {
    gender: query.gender,
    note: query.note,
    brand: query.brand,
    isNew: query.new === "1",
    sort: query.sort,
  });

  return (
    <>
      <PageHero title={t.perfumesHero} subtitle={t.perfumesSub} />
      <CatalogBanner locale={locale} source={source} />
      <div className="mx-auto max-w-[1350px] px-4 py-10 md:flex md:gap-10 md:py-14">
        <Suspense fallback={null}>
          <ProductFilters locale={locale} brands={brands} notes={[...noteKeys]} />
        </Suspense>
        <div className="min-w-0 flex-1">
          <ProductGrid products={list} locale={locale} />
        </div>
      </div>
      <PageEnd locale={locale} />
    </>
  );
}

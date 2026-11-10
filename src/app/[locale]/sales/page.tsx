import { CatalogBanner } from "@/components/catalog-banner";
import { CatalogPageHero } from "@/components/catalog-page-hero";
import { CatalogPagination } from "@/components/catalog-pagination";
import { ProductFilters } from "@/components/product-filters";
import { ProductGrid } from "@/components/product-grid";
import { catalogHref, catalogQuery, catalogSlice } from "@/lib/catalog-page";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { catalogFilterGroups, catalogPriceBounds, filterProducts, getCatalog, getPageBanner, getShopFilters, isSectionVisible } from "@/lib/shopify/catalog";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function SalesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    gender?: string | string[];
    note?: string | string[];
    season?: string | string[];
    brand?: string | string[];
    size?: string | string[];
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    new?: string;
    page?: string;
  }>;
}) {
  const locale = await localeFrom(params);
  if (!(await isSectionVisible("sale"))) redirect(`/${locale}`);
  const query = await searchParams;
  const t = getDict(locale);
  const { products, source } = await getCatalog();
  const saleProducts = filterProducts(products, { sale: true });
  const shopFilters = await getShopFilters();
  const groups = catalogFilterGroups(
    shopFilters,
    {
      note: t.filterNote,
      gender: t.filterGender,
      season: t.filterSeason,
      size: t.size,
    },
    {
      season: [
        { value: "winter", label: t.seasons.winter },
        { value: "spring", label: t.seasons.spring },
        { value: "summer", label: t.seasons.summer },
        { value: "autumn", label: t.seasons.autumn },
      ],
    },
  );
  const priceBounds = catalogPriceBounds(saleProducts);
  const banner = await getPageBanner("sales");
  const list = filterProducts(products, {
    gender: query.gender,
    note: query.note,
    season: query.season,
    brand: query.brand,
    size: query.size,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    isNew: query.new === "1",
    sort: query.sort,
    sale: true,
  });
  const paging = catalogSlice(list, query.page);
  if (paging.needsRedirect) redirect(catalogHref(locale, "/sales", query, paging.page));

  return (
    <>
      <CatalogPageHero
        eyebrow={t.nav.sales}
        title={t.salesHero}
        subtitle={t.salesSub}
        image={banner.url}
        alt={banner.alt}
      />
      <CatalogBanner locale={locale} source={source} />

      <section id="catalog" className="bg-[#f7f2ea] px-4 py-10 md:px-8 md:py-16">
        <div className="mx-auto flex max-w-[min(100%,82.5rem)] flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          <Suspense fallback={null}>
            <ProductFilters locale={locale} groups={groups} priceBounds={priceBounds} basePath="/sales" />
          </Suspense>
          <div className="min-w-0 flex-1">
            <ProductGrid products={paging.items} locale={locale} variant="catalog" />
            <CatalogPagination
              locale={locale}
              page={paging.page}
              totalPages={paging.totalPages}
              basePath="/sales"
              query={catalogQuery(query)}
            />
          </div>
        </div>
      </section>
    </>
  );
}

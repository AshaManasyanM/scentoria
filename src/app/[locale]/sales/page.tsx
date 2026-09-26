import { CatalogBanner } from "@/components/catalog-banner";
import { ProductFilters } from "@/components/product-filters";
import { ProductGrid } from "@/components/product-grid";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { filterProducts, getCatalog, uniqueBrands } from "@/lib/shopify/catalog";
import { noteKeys } from "@/lib/shopify/mock";
import { Suspense } from "react";

export default async function SalesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    gender?: string | string[];
    note?: string | string[];
    brand?: string | string[];
    size?: string | string[];
    discount?: string | string[];
    sort?: string;
    new?: string;
  }>;
}) {
  const locale = await localeFrom(params);
  const query = await searchParams;
  const t = getDict(locale);
  const { products, source } = await getCatalog();
  const saleProducts = filterProducts(products, { sale: true });
  const brands = uniqueBrands(saleProducts);
  const list = filterProducts(products, {
    gender: query.gender,
    note: query.note,
    brand: query.brand,
    size: query.size,
    discount: query.discount,
    isNew: query.new === "1",
    sort: query.sort,
    sale: true,
  });

  return (
    <>
      <section className="relative h-[clamp(280px,45vw,520px)] overflow-hidden bg-[#083534]">
        <img src="/hero/amber.jpg" alt="" className="h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#083534]/60" />
        <div className="absolute inset-0 flex items-end px-4 pb-8 md:px-8 md:pb-14">
          <div className="mx-auto w-full max-w-[1320px]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a059]">{t.nav.sales}</p>
            <h1 className="mt-3 max-w-3xl font-serif text-[32px] font-medium leading-[1.15] text-[#f7f2ea] md:text-[clamp(40px,4.5vw,56px)]">
              {t.salesHero}
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#f7f2ea]/90">{t.salesSub}</p>
          </div>
        </div>
      </section>
      <CatalogBanner locale={locale} source={source} />

      <section className="bg-[#f7f2ea] px-4 py-10 md:px-8 md:py-16">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          <Suspense fallback={null}>
            <ProductFilters locale={locale} brands={brands} notes={[...noteKeys]} basePath="/sales" />
          </Suspense>
          <div className="min-w-0 flex-1">
            <ProductGrid products={list} locale={locale} variant="catalog" />
          </div>
        </div>
      </section>
    </>
  );
}

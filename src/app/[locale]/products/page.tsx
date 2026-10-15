import { CatalogBanner } from "@/components/catalog-banner";
import { CatalogPagination } from "@/components/catalog-pagination";
import { ProductFilters } from "@/components/product-filters";
import { ProductGrid } from "@/components/product-grid";
import { catalogHref, catalogQuery, catalogSlice } from "@/lib/catalog-page";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { brandHandle, catalogFilterGroups, filterProducts, getBrands, getCatalog, getNotes, getShopFilters, standardFilterFallback, uniqueBrands } from "@/lib/shopify/catalog";
import { redirect } from "next/navigation";
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
    size?: string | string[];
    discount?: string | string[];
    sort?: string;
    new?: string;
    page?: string;
  }>;
}) {
  const locale = await localeFrom(params);
  const query = await searchParams;
  const t = getDict(locale);
  const { products, source } = await getCatalog();
  const shopBrands = await getBrands();
  const selectedBrands = Array.isArray(query.brand) ? query.brand : query.brand ? [query.brand] : [];
  const focusBrand = selectedBrands.length === 1 ? selectedBrands[0] : null;
  const storyKey = focusBrand ? brandHandle(focusBrand) : "";
  const shopStory = shopBrands.find(
    (brand) => brand.handle === storyKey || brand.name.toLowerCase() === focusBrand?.toLowerCase(),
  )?.description;
  const brandStory =
    shopStory ||
    (focusBrand && storyKey in t.brandStories
      ? t.brandStories[storyKey as keyof typeof t.brandStories]
      : focusBrand
        ? t.brandAbout.replace("{brand}", focusBrand)
        : null);
  const brands = [...new Set([...shopBrands.map((brand) => brand.name), ...uniqueBrands(products), ...selectedBrands])];
  const notes = (await getNotes()).map((note) => ({
    key: note.key,
    label: note.label || (note.key in t.notes ? t.notes[note.key as keyof typeof t.notes] : note.key),
  }));
  const shopFilters = await getShopFilters();
  const groups = catalogFilterGroups(
    shopFilters,
    {
      brand: t.filterBrand,
      note: t.filterNote,
      gender: t.filterGender,
      size: t.size,
      discount: t.filterDiscount,
    },
    standardFilterFallback({
      brands,
      notes,
      men: t.men,
      women: t.women,
      unisex: t.unisex,
      sizeTravel: t.sizeTravel,
      sizeMedium: t.sizeMedium,
      sizeLarge: t.sizeLarge,
    }),
  );
  const list = filterProducts(products, {
    gender: query.gender,
    note: query.note,
    brand: query.brand,
    size: query.size,
    discount: query.discount,
    isNew: query.new === "1",
    sort: query.sort,
  });
  const paging = catalogSlice(list, query.page);
  if (paging.needsRedirect) redirect(catalogHref(locale, "/products", query, paging.page));

  return (
    <>
      <section className="relative h-[clamp(280px,45vw,520px)] overflow-hidden bg-[#083534]">
        <img src="/hero/citrus.jpg" alt="" className="h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#083534]/60" />
        <div className="absolute inset-0 flex items-end px-4 pb-8 md:px-8 md:pb-14">
          <div className="mx-auto w-full max-w-[1320px]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a059]">{t.nav.perfumes}</p>
            <h1 className="mt-3 max-w-3xl font-serif text-[32px] font-medium leading-[1.15] text-[#f7f2ea] md:text-[clamp(40px,4.5vw,56px)]">
              {focusBrand ?? t.perfumesHero}
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#f7f2ea]/90">{brandStory ?? t.perfumesSub}</p>
          </div>
        </div>
      </section>
      <CatalogBanner locale={locale} source={source} />

      <section id="catalog" className="bg-[#f7f2ea] px-4 py-10 md:px-8 md:py-16">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          <Suspense fallback={null}>
            <ProductFilters locale={locale} groups={groups} />
          </Suspense>
          <div className="min-w-0 flex-1">
            <ProductGrid products={paging.items} locale={locale} variant="catalog" />
            <CatalogPagination
              locale={locale}
              page={paging.page}
              totalPages={paging.totalPages}
              basePath="/products"
              query={catalogQuery(query)}
            />
          </div>
        </div>
      </section>
    </>
  );
}

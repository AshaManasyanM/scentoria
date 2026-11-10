import { CatalogBanner } from "@/components/catalog-banner";
import { CatalogPageHero } from "@/components/catalog-page-hero";
import { CatalogPagination } from "@/components/catalog-pagination";
import { ProductFilters } from "@/components/product-filters";
import { ProductGrid } from "@/components/product-grid";
import { catalogHref, catalogQuery, catalogSlice } from "@/lib/catalog-page";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { brandHandle, catalogFilterGroups, catalogPriceBounds, exactSearchFacet, filterProducts, getBrands, getCatalog, getNotes, getPageBanner, getShopFilters, uniqueBrands } from "@/lib/shopify/catalog";
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
    season?: string | string[];
    brand?: string | string[];
    size?: string | string[];
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    new?: string;
    page?: string;
    q?: string;
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
  const textQuery = (Array.isArray(query.q) ? query.q[0] : query.q)?.trim() ?? "";
  const facet = textQuery
    ? exactSearchFacet(textQuery, brands, notes, [
        { value: "men", label: t.men },
        { value: "women", label: t.women },
        { value: "unisex", label: t.unisex },
      ])
    : null;
  if (facet?.brand) redirect(catalogHref(locale, "/products", { ...query, q: undefined, brand: facet.brand }, 1));
  if (facet?.note) redirect(catalogHref(locale, "/products", { ...query, q: undefined, note: facet.note }, 1));
  if (facet?.gender) redirect(catalogHref(locale, "/products", { ...query, q: undefined, gender: facet.gender }, 1));
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
  const priceBounds = catalogPriceBounds(products);
  const banner = await getPageBanner("products");
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
    query: facet ? "" : textQuery,
  });
  const paging = catalogSlice(list, query.page);
  if (paging.needsRedirect) redirect(catalogHref(locale, "/products", query, paging.page));

  return (
    <>
      <CatalogPageHero
        eyebrow={t.nav.perfumes}
        title={focusBrand ?? (textQuery || t.perfumesHero)}
        subtitle={brandStory ?? t.perfumesSub}
        image={banner.url}
        alt={banner.alt}
      />
      <CatalogBanner locale={locale} source={source} />

      <section id="catalog" className="bg-[#f7f2ea] px-4 py-10 md:px-8 md:py-16">
        <div className="mx-auto flex max-w-[min(100%,82.5rem)] flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          <Suspense fallback={null}>
            <ProductFilters key={catalogQuery(query)} locale={locale} groups={groups} priceBounds={priceBounds} />
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

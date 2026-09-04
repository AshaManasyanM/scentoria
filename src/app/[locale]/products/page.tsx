import { CatalogBanner } from "@/components/catalog-banner";
import { PageEnd } from "@/components/page-end";
import { ProductGrid } from "@/components/product-grid";
import { SectionHeading } from "@/components/section-heading";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { path } from "@/lib/path";
import { filterProducts, getCatalog, uniqueBrands } from "@/lib/shopify/catalog";
import { noteKeys } from "@/lib/shopify/mock";
import Link from "next/link";

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    gender?: string;
    note?: string;
    brand?: string;
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

  const qs = (next: Record<string, string | undefined>) => {
    const merged = { ...query, ...next };
    const params = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const s = params.toString();
    return path(locale, `/products${s ? `?${s}` : ""}`);
  };

  return (
    <>
      <CatalogBanner locale={locale} source={source} />
      <div className="mx-auto max-w-7xl px-4 py-16">
        <SectionHeading title={t.perfumesHero} subtitle={t.perfumesSub} />
        <div className="mb-10 grid gap-6 rounded-2xl bg-bg-2 p-4 text-xs uppercase tracking-[0.16em] text-muted md:grid-cols-4">
          <div>
            <p className="mb-2 text-gold">{t.filter}</p>
            <div className="flex flex-col gap-2">
              <Link href={qs({ gender: undefined })}>{t.allFragrances}</Link>
              <Link href={qs({ gender: "men" })}>{t.men}</Link>
              <Link href={qs({ gender: "women" })}>{t.women}</Link>
              <Link href={qs({ gender: "unisex" })}>{t.unisex}</Link>
            </div>
          </div>
          <div>
            <p className="mb-2 text-gold">{t.nav.brands}</p>
            <div className="flex flex-col gap-2">
              {brands.map((brand) => (
                <Link key={brand} href={qs({ brand })}>
                  {brand}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-gold">{t.shopByNote}</p>
            <div className="flex flex-col gap-2">
              {noteKeys.map((note) => (
                <Link key={note} href={qs({ note })}>
                  {t.notes[note]}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-gold">{t.sortBy}</p>
            <div className="flex flex-col gap-2">
              <Link href={qs({ sort: "price-asc" })}>{t.sortPriceAsc}</Link>
              <Link href={qs({ sort: "price-desc" })}>{t.sortPriceDesc}</Link>
              <Link href={qs({ sort: "name" })}>{t.sortName}</Link>
            </div>
          </div>
        </div>
        <ProductGrid products={list} locale={locale} />
      </div>
      <PageEnd locale={locale} />
    </>
  );
}

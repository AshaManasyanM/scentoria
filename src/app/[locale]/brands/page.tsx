import { CatalogBanner } from "@/components/catalog-banner";
import { PageEnd } from "@/components/page-end";
import { SectionHeading } from "@/components/section-heading";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { path } from "@/lib/path";
import { brandHandle, getCatalog, uniqueBrands } from "@/lib/shopify/catalog";
import Link from "next/link";

export default async function BrandsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);
  const t = getDict(locale);
  const { products, source } = await getCatalog();
  const brands = uniqueBrands(products);

  return (
    <>
      <CatalogBanner locale={locale} source={source} />
      <div className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading title={t.brandsHero} subtitle={t.brandsSub} />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {brands.map((brand) => (
            <Link
              key={brand}
              href={path(locale, `/brands/${brandHandle(brand)}`)}
              className="border border-line px-4 py-12 text-center font-serif text-2xl hover:border-gold"
            >
              {brand}
            </Link>
          ))}
        </div>
      </div>
      <PageEnd locale={locale} />
    </>
  );
}

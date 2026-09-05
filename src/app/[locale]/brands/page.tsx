import { CatalogBanner } from "@/components/catalog-banner";
import { PageEnd } from "@/components/page-end";
import { PageHero } from "@/components/page-hero";
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
      <PageHero title={t.brandsHero} subtitle={t.brandsSub} />
      <CatalogBanner locale={locale} source={source} />
      <div className="mx-auto max-w-[1350px] px-4 py-10 md:py-14">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {brands.map((brand) => (
            <Link
              key={brand}
              href={path(locale, `/brands/${brandHandle(brand)}`)}
              className="rounded-2xl border border-line px-4 py-12 text-center font-serif text-2xl hover:border-gold hover:text-gold"
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

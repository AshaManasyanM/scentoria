import { CatalogBanner } from "@/components/catalog-banner";
import { CatalogPageHero } from "@/components/catalog-page-hero";
import { PageEnd } from "@/components/page-end";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { path } from "@/lib/path";
import { getBrands, getCatalog, getPageBanner, isSectionVisible } from "@/lib/shopify/catalog";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function BrandsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);
  if (!(await isSectionVisible("brands"))) redirect(`/${locale}`);
  const t = getDict(locale);
  const { source } = await getCatalog();
  const brands = await getBrands();
  const banner = await getPageBanner("brands");

  return (
    <>
      <CatalogPageHero
        eyebrow={t.nav.brands}
        title={t.brandsHero}
        subtitle={t.brandsSub}
        image={banner.url}
        alt={banner.alt}
      />
      <CatalogBanner locale={locale} source={source} />

      <section className="bg-[#f7f2ea] section-pad-y">
        <div className="mx-auto w-full max-w-[min(100%,82.5rem)] px-4 min-[1352px]:px-0">
          <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 min-[1352px]:grid-cols-[repeat(4,312px)] min-[1352px]:justify-start min-[1352px]:gap-6">
            {brands.map((brand) => (
              <Link
                key={brand.handle}
                href={path(locale, `/products?brand=${encodeURIComponent(brand.name)}`)}
                className="flex h-[clamp(7.5rem,12vw,11.25rem)] w-full items-center justify-center rounded-lg border border-[#D8D0C4] bg-[#F7F2EA] px-6 xl:max-w-[19.5rem]"
              >
                {brand.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brand.logo}
                    alt={`${brand.name} perfume brand logo`}
                    className="w-auto max-w-[70%] object-contain"
                  />
                ) : (
                  <span className="text-center font-serif text-xl font-medium text-[#083534] md:text-2xl">
                    {brand.name}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PageEnd locale={locale} />
    </>
  );
}

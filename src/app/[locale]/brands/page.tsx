import { CatalogBanner } from "@/components/catalog-banner";
import { PageEnd } from "@/components/page-end";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { path } from "@/lib/path";
import { popularBrands } from "@/lib/popular-brands";
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
  const logos = new Map<string, string>(popularBrands.map((brand) => [brand.handle, brand.logo]));
  const listed = new Set<string>(popularBrands.map((brand) => brand.handle));
  const brands = [
    ...popularBrands.map((brand) => ({
      name: brand.name,
      handle: brand.handle,
      logo: brand.logo,
    })),
    ...uniqueBrands(products)
      .map((name) => ({ name, handle: brandHandle(name), logo: logos.get(brandHandle(name)) }))
      .filter((brand) => !listed.has(brand.handle)),
  ];

  return (
    <>
      <section className="relative h-[clamp(280px,45vw,520px)] overflow-hidden bg-[#083534]">
        <img src="/hero/amber.jpg" alt="" className="h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#083534]/60" />
        <div className="absolute inset-0 flex items-end px-4 pb-8 md:px-8 md:pb-14">
          <div className="mx-auto w-full max-w-[1320px]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a059]">{t.nav.brands}</p>
            <h1 className="mt-3 max-w-3xl font-serif text-[32px] font-medium leading-[1.15] text-[#f7f2ea] md:text-[clamp(40px,4.5vw,56px)]">
              {t.brandsHero}
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#f7f2ea]/90">{t.brandsSub}</p>
          </div>
        </div>
      </section>
      <CatalogBanner locale={locale} source={source} />

      <section className="bg-[#f7f2ea] py-10 md:py-20">
        <div className="mx-auto w-full max-w-[1320px] px-4 min-[1352px]:px-0">
          <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 min-[1352px]:grid-cols-[repeat(4,312px)] min-[1352px]:justify-start min-[1352px]:gap-6">
            {brands.map((brand) => (
              <Link
                key={brand.handle}
                href={path(locale, `/products?brand=${encodeURIComponent(brand.name)}`)}
                className="flex h-[140px] w-full items-center justify-center rounded-lg border border-[#D8D0C4] bg-[#F7F2EA] px-6 min-[1352px]:h-[180px] min-[1352px]:w-[312px]"
              >
                {brand.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brand.logo}
                    alt={`${brand.name} perfume brand logo`}
                    className="max-h-16 w-auto max-w-[70%] object-contain"
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

import { CatalogBanner } from "@/components/catalog-banner";
import { PageEnd } from "@/components/page-end";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { path } from "@/lib/path";
import { getBrands, getCatalog, isSectionVisible } from "@/lib/shopify/catalog";
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

  return (
    <>
      <section className="relative h-[clamp(280px,45vw,520px)] overflow-hidden bg-[#083534]">
        <img src="/hero/amber.jpg" alt="" className="h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#083534]/60" />
        <div className="absolute inset-0 flex items-end px-4 pb-8 md:px-8 md:pb-14">
          <div className="mx-auto w-full max-w-[min(100%,82.5rem)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a059]">{t.nav.brands}</p>
            <h1 className="mt-3 max-w-3xl heading-display font-serif font-medium text-[#f7f2ea]">
              {t.brandsHero}
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#f7f2ea]/90">{t.brandsSub}</p>
          </div>
        </div>
      </section>
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

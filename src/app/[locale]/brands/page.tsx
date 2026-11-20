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
  const { source } = await getCatalog(locale);
  const brands = await getBrands(locale);
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

      <section className="bg-[#f7f2ea] px-[clamp(1rem,2.5vw,2rem)] py-[clamp(2rem,4vw,3.5rem)]">
        <div className="mx-auto w-full max-w-[min(100%,82.5rem)]">
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 min-[480px]:gap-4 md:gap-5 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6">
            {brands.map((brand) => (
              <Link
                key={brand.handle}
                href={path(locale, `/products?brand=${encodeURIComponent(brand.name)}`)}
                className="group flex aspect-[5/3] w-full items-center justify-center rounded-xl border border-[#D8D0C4] bg-[#fbf8f2] px-6 py-7 transition duration-300 hover:-translate-y-0.5 hover:border-[#c5a059]/65 hover:bg-white hover:shadow-[0_12px_28px_rgba(8,53,52,0.08)] sm:px-8 sm:py-8 md:rounded-2xl md:px-10"
              >
                {brand.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brand.logo}
                    alt={`${brand.name} perfume brand logo`}
                    title={`${brand.name} perfume brand`}
                    className="max-h-[58%] w-auto max-w-[72%] object-contain transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="max-w-[90%] text-center font-serif text-[clamp(1.15rem,0.9rem+1.1vw,1.65rem)] font-medium leading-snug tracking-wide text-[#083534]">
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

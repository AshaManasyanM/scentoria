import { BrandLogoGrid } from "@/components/brand-logo-grid";
import { CatalogBanner } from "@/components/catalog-banner";
import { CatalogPageHero } from "@/components/catalog-page-hero";
import { PageEnd } from "@/components/page-end";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { getBrands, getCatalog, getPageBanner, isSectionVisible } from "@/lib/shopify/catalog";
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

      <section className="bg-[#083534] px-[clamp(1rem,2.5vw,2rem)] py-[clamp(2rem,4vw,3.5rem)]">
        <div className="mx-auto w-full max-w-[min(100%,82.5rem)]">
          <BrandLogoGrid
            locale={locale}
            brands={brands}
            previousLabel={t.previousPage}
            nextLabel={t.nextPage}
            pageSizeMobile={6}
            pageSizeDesktop={12}
            className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 min-[420px]:gap-4 md:gap-5 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6"
          />
        </div>
      </section>

      <PageEnd locale={locale} />
    </>
  );
}

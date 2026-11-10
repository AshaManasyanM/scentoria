import { CatalogBanner } from "@/components/catalog-banner";
import { HeroSlider } from "@/components/hero-slider";
import { HomeSectionHeading } from "@/components/home-section-heading";
import { NoteGrid } from "@/components/note-grid";
import { PageEnd } from "@/components/page-end";
import { ProductSlider } from "@/components/product-slider";
import { SiteNav } from "@/components/site-nav";
import { Testimonials } from "@/components/testimonials";
import { catalogHref } from "@/lib/catalog-page";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { path } from "@/lib/path";
import { filterProducts, getBrands, getCatalog, getHeroSlides, getHomeReviews, getNotes, getSectionVisibility } from "@/lib/shopify/catalog";
import Link from "next/link";

const typeTiles = [
  {
    key: "all",
    query: "",
    image: "/collections/all.png",
    body: "typeAllBody" as const,
    cta: "viewAllProducts" as const,
  },
  {
    key: "men",
    query: "?gender=men",
    image: "/collections/men.png",
    body: "typeMenBody" as const,
    cta: "shopMen" as const,
  },
  {
    key: "women",
    query: "?gender=women",
    image: "/collections/women.png",
    body: "typeWomenBody" as const,
    cta: "shopWomen" as const,
  },
  {
    key: "unisex",
    query: "?gender=unisex",
    image: "/collections/unisex.png",
    body: "typeUnisexBody" as const,
    cta: "shopUnisex" as const,
  },
];

const sectionShell = "px-[clamp(1rem,2.5vw,2rem)] py-[clamp(2rem,4vw,3.25rem)]";
const ctaGold =
  "mt-8 inline-flex rounded-full bg-[#c5a059] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#083534] transition hover:bg-[#a9884a]";
const ctaDark =
  "mt-8 inline-flex rounded-full bg-[#083534] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#f7f2ea] transition hover:bg-[#0e4544]";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);
  const t = getDict(locale);
  const { products, source } = await getCatalog();
  const sections = await getSectionVisibility();
  const heroSlides = sections.hero ? await getHeroSlides() : [];
  const brands = sections.brands ? (await getBrands()).slice(0, 8) : [];
  const testimonials = sections.testimonials ? await getHomeReviews(products) : [];
  const notes = sections.notes
    ? (await getNotes()).map((note) => ({
        key: note.key,
        href: catalogHref(locale, "/products", { note: note.key }, 1),
        image: note.image,
        label: note.label || (note.key in t.notes ? t.notes[note.key as keyof typeof t.notes] : note.key),
      }))
    : [];
  const featured = sections.bestsellers ? filterProducts(products, { featured: true }).slice(0, 8) : [];
  const newest = sections.arrivals ? filterProducts(products, { isNew: true }).slice(0, 8) : [];
  const sale = sections.sale ? filterProducts(products, { sale: true }).slice(0, 8) : [];

  const typeLabels: Record<string, string> = {
    all: t.allFragrances,
    men: t.men,
    women: t.women,
    unisex: t.unisex,
  };

  const hiddenNav = [
    ...(!sections.about ? ["about"] : []),
    ...(!sections.brands ? ["brands"] : []),
    ...(!sections.sale ? ["sales"] : []),
  ];

  return (
    <>
      {sections.hero ? (
        <HeroSlider images={heroSlides} locale={locale} hiddenNav={hiddenNav} />
      ) : (
        <div className="hidden md:block">
          <SiteNav locale={locale} hiddenNav={hiddenNav} />
        </div>
      )}
      <CatalogBanner locale={locale} source={source} />

      {sections.types ? (
        <section className="bg-[#f7f2ea] px-[clamp(1rem,2.5vw,2rem)] py-[clamp(1.25rem,2.5vw,2rem)] lg:py-[clamp(2rem,4vw,3.25rem)]">
          <div className="mx-auto max-w-[min(100%,72rem)] text-center">
            <HomeSectionHeading eyebrow={t.shopByType} title={t.shopByTypeSub} compact />
            <div className="mt-3 grid grid-cols-2 gap-2 text-left md:mt-4 md:gap-3 lg:mt-8 lg:grid-cols-4 lg:gap-4">
              {typeTiles.map((tile) => (
                <Link
                  key={tile.key}
                  href={path(locale, `/products${tile.query}`)}
                  className="group relative flex h-[5.5rem] items-end overflow-hidden rounded-lg bg-[#083534] text-[#f7f2ea] shadow-[0_10px_30px_rgba(8,53,52,0.12)] sm:h-28 md:h-32 lg:h-auto lg:aspect-[4/5] lg:rounded-2xl"
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                    style={{ backgroundImage: `url("${tile.image}")` }}
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-[#083534] via-[#083534]/55 to-[#083534]/10"
                  />
                  <span className="relative z-10 flex w-full flex-col gap-1 p-2.5 sm:p-3 md:p-3.5 lg:gap-2 lg:p-5">
                    <span className="flex items-center justify-between gap-2 lg:block">
                      <span className="font-serif text-sm font-medium leading-none sm:text-base md:text-lg lg:text-[1.35rem]">
                        {typeLabels[tile.key]}
                      </span>
                      <span
                        aria-hidden
                        className="text-xs text-[#c5a059] transition-transform duration-300 group-hover:translate-x-1 lg:hidden"
                      >
                        →
                      </span>
                    </span>
                    <span className="hidden max-w-[16rem] text-xs leading-5 text-[#f7f2ea]/75 lg:block">
                      {t[tile.body]}
                    </span>
                    <span className="mt-1 hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#c5a059] lg:inline-flex">
                      {t[tile.cta]}
                      <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {sections.bestsellers ? (
        <section className={`bg-[#083534] ${sectionShell}`}>
          <div className="mx-auto max-w-[min(100%,72rem)] text-center">
            <HomeSectionHeading eyebrow={t.bestSellers} title={t.bestSellersSub} light />
            <div className="mt-8">
              <ProductSlider products={featured} locale={locale} variant="feature" />
            </div>
            <Link href={path(locale, "/products")} className={ctaGold}>
              {t.viewAllProducts}
            </Link>
          </div>
        </section>
      ) : null}

      {sections.brands ? (
        <section className={`bg-[#f7f2ea] ${sectionShell}`}>
          <div className="mx-auto max-w-[min(100%,72rem)]">
            <HomeSectionHeading eyebrow={t.popularBrands} title={t.popularBrandsSub} />
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {brands.map((brand) => (
                <Link
                  key={brand.handle}
                  href={path(locale, `/products?brand=${encodeURIComponent(brand.name)}`)}
                  className="group flex aspect-[5/3] items-center justify-center rounded-2xl border border-[#e4ddd3] bg-white px-5 transition duration-300 hover:-translate-y-0.5 hover:border-[#c5a059]/70 hover:shadow-[0_12px_28px_rgba(8,53,52,0.1)]"
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
                    <span className="text-center font-serif text-lg font-medium text-[#083534] md:text-xl">
                      {brand.name}
                    </span>
                  )}
                </Link>
              ))}
            </div>
            <div className="text-center">
              <Link href={path(locale, "/brands")} className={ctaDark}>
                {t.viewAllBrands}
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {sections.arrivals ? (
        <section className={`bg-[#083534] ${sectionShell}`}>
          <div className="mx-auto max-w-[min(100%,72rem)] text-center">
            <HomeSectionHeading eyebrow={t.newArrivals} title={t.newArrivalsSub} light />
            <div className="mt-8">
              <ProductSlider products={newest} locale={locale} variant="feature" />
            </div>
            <Link href={path(locale, "/products?new=1")} className={ctaGold}>
              {t.viewAllNew}
            </Link>
          </div>
        </section>
      ) : null}

      {sections.notes ? (
        <section id="shop-by-note" className={`bg-[#f7f2ea] ${sectionShell}`}>
          <div className="mx-auto max-w-[min(100%,72rem)]">
            <HomeSectionHeading eyebrow={t.shopByNote} title={t.shopByNoteSub} />
            <NoteGrid notes={notes} viewAllLabel={t.viewAllNotes} showLessLabel={t.showLess} />
          </div>
        </section>
      ) : null}

      {sections.sale ? (
        <section className={`bg-[#083534] ${sectionShell}`}>
          <div className="mx-auto max-w-[min(100%,72rem)] text-center">
            <HomeSectionHeading eyebrow={t.onSale} title={t.onSaleSub} light />
            <div className="mt-8">
              <ProductSlider products={sale} locale={locale} variant="feature" />
            </div>
            <Link href={path(locale, "/sales")} className={ctaGold}>
              {t.viewAllSale}
            </Link>
          </div>
        </section>
      ) : null}

      {sections.testimonials && testimonials.length ? (
        <Testimonials
          eyebrow={t.testimonials}
          heading={t.testimonialsSub.replace(/\.$/, "")}
          items={testimonials}
        />
      ) : null}

      <PageEnd locale={locale} />
    </>
  );
}

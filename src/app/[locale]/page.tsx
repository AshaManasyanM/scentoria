import { CatalogBanner } from "@/components/catalog-banner";
import { HeroSlider } from "@/components/hero-slider";
import { PageEnd } from "@/components/page-end";
import { ProductSlider } from "@/components/product-slider";
import { Testimonials } from "@/components/testimonials";
import { NoteTile } from "@/components/note-tile";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { noteTiles } from "@/lib/note-tiles";
import { path } from "@/lib/path";
import { popularBrands } from "@/lib/popular-brands";
import { filterProducts, getCatalog } from "@/lib/shopify/catalog";
import { mockTestimonials } from "@/lib/shopify/mock";
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

const heroSlides = [
  { url: "/hero/citrus.jpg", alt: "Solune Citrus Mist" },
  { url: "/hero/amber.jpg", alt: "Noirvale Amber Wood" },
  { url: "/hero/rose.jpg", alt: "Aurelia Rose Velour" },
];

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);
  const t = getDict(locale);
  const { products, source } = await getCatalog();
  const featured = filterProducts(products, { featured: true }).slice(0, 8);
  const newest = filterProducts(products, { isNew: true }).slice(0, 8);
  const sale = filterProducts(products, { sale: true }).slice(0, 8);

  const typeLabels: Record<string, string> = {
    all: t.allFragrances,
    men: t.men,
    women: t.women,
    unisex: t.unisex,
  };

  return (
    <>
      <HeroSlider images={heroSlides} locale={locale} />
      <CatalogBanner locale={locale} source={source} />

      <section className="bg-[#f7f2ea] px-4 py-10 md:px-8 md:py-20">
        <div className="mx-auto max-w-[1320px]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a059]">
            {t.shopByType}
          </p>
          <h2 className="mt-4 max-w-4xl font-serif text-[28px] font-medium leading-[1.2] text-[#083534] md:text-[clamp(32px,4.2vw,48px)] md:leading-[1.15]">
            {t.shopByTypeSub}
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {typeTiles.map((tile) => (
              <Link
                key={tile.key}
                href={path(locale, `/products${tile.query}`)}
                className="group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-md p-5 text-[#f7f2ea] md:min-h-[300px] md:p-8"
                style={{
                  backgroundColor: "#083534",
                  backgroundImage: `linear-gradient(180deg, rgba(8,53,52,0.72), rgba(8,53,52,0.82)), url("${tile.image}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c5a059]">
                    {typeLabels[tile.key]}
                  </p>
                  <p className="mt-3 max-w-md font-serif text-xl font-medium leading-snug md:text-[clamp(22px,2.4vw,30px)]">
                    {t[tile.body]}
                  </p>
                </div>
                <span className="mt-8 flex items-center justify-between text-sm font-semibold">
                  <span>{t[tile.cta]}</span>
                  <span aria-hidden className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#083534] px-4 py-10 md:px-8 md:py-20">
        <div className="mx-auto max-w-[1180px]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a059]">
            {t.bestSellers}
          </p>
          <h2 className="mt-4 max-w-3xl font-serif text-[28px] font-medium leading-[1.2] text-[#f7f2ea] md:text-[clamp(32px,4vw,44px)] md:leading-[1.15]">
            {t.bestSellersSub}
          </h2>
          <div className="mt-10">
            <ProductSlider products={featured} locale={locale} variant="feature" />
          </div>
          <Link
            href={path(locale, "/products")}
            className="mt-10 inline-flex rounded-[2px] bg-[#c5a059] px-8 py-[14px] text-xs font-semibold uppercase tracking-[0.12em] text-[#083534]"
          >
            {t.viewAllProducts}
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1320px] px-4 py-10 min-[1352px]:px-0 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a059]">
          {t.popularBrands}
        </p>
        <h2 className="mt-4 max-w-3xl font-serif text-[28px] font-medium leading-[1.2] text-[#083534] md:text-[clamp(32px,4vw,44px)] md:leading-[1.15]">
          {t.popularBrandsSub}
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 min-[1352px]:grid-cols-[repeat(4,312px)] min-[1352px]:justify-start min-[1352px]:gap-6">
          {popularBrands.map((brand) => (
            <Link
              key={brand.handle}
              href={path(locale, `/products?brand=${encodeURIComponent(brand.name)}`)}
              className="flex h-[140px] w-full items-center justify-center rounded-lg border border-[#D8D0C4] bg-[#F7F2EA] px-6 min-[1352px]:h-[180px] min-[1352px]:w-[312px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brand.logo}
                alt={`${brand.name} perfume brand logo`}
                title={`${brand.name} perfume brand`}
                className="max-h-16 w-auto max-w-[70%] object-contain"
              />
            </Link>
          ))}
        </div>
        <Link
          href={path(locale, "/brands")}
          className="mt-8 inline-flex rounded-[2px] bg-[#083534] px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#f7f2ea]"
        >
          {t.viewAllBrands}
        </Link>
      </section>

      <section className="bg-[#083534] px-4 py-10 md:px-8 md:py-20">
        <div className="mx-auto max-w-[1180px]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a059]">
            {t.newArrivals}
          </p>
          <h2 className="mt-4 max-w-3xl font-serif text-[28px] font-medium leading-[1.2] text-[#f7f2ea] md:text-[clamp(32px,4vw,44px)] md:leading-[1.15]">
            {t.newArrivalsSub}
          </h2>
          <div className="mt-10">
            <ProductSlider products={newest} locale={locale} variant="feature" />
          </div>
          <Link
            href={path(locale, "/products?new=1")}
            className="mt-10 inline-flex rounded-[2px] bg-[#c5a059] px-8 py-[14px] text-xs font-semibold uppercase tracking-[0.12em] text-[#083534]"
          >
            {t.viewAllNew}
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1320px] px-4 py-10 min-[1352px]:px-0 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a059]">
          {t.shopByNote}
        </p>
        <h2 className="mt-4 font-serif text-[28px] font-medium leading-[1.2] text-[#083534] md:text-[clamp(32px,4vw,44px)] md:leading-[1.15]">
          {t.shopByNoteSub}
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          {noteTiles
            .filter((note) => !note.hiddenOnHome)
            .map((note) => (
              <NoteTile
                key={note.key}
                href={path(locale, `/notes/${note.key}`)}
                image={note.image}
                label={t.notes[note.key]}
                variant="home"
              />
            ))}
        </div>
        <Link
          href={path(locale, "/notes")}
          className="mt-8 inline-flex rounded-[2px] bg-[#083534] px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#f7f2ea]"
        >
          {t.viewAllNotes}
        </Link>
      </section>

      <section className="bg-[#083534] px-4 py-10 md:px-8 md:py-20">
        <div className="mx-auto max-w-[1180px]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a059]">
            {t.onSale}
          </p>
          <h2 className="mt-4 max-w-3xl font-serif text-[28px] font-medium leading-[1.2] text-[#f7f2ea] md:text-[clamp(32px,4vw,44px)] md:leading-[1.15]">
            {t.onSaleSub}
          </h2>
          <div className="mt-10">
            <ProductSlider products={sale} locale={locale} variant="feature" />
          </div>
          <Link
            href={path(locale, "/sales")}
            className="mt-10 inline-flex rounded-[2px] bg-[#c5a059] px-8 py-[14px] text-xs font-semibold uppercase tracking-[0.12em] text-[#083534]"
          >
            {t.viewAllSale}
          </Link>
        </div>
      </section>

      <Testimonials
        eyebrow={t.testimonials}
        heading={t.testimonialsSub.replace(/\.$/, "")}
        items={mockTestimonials}
      />

      <PageEnd locale={locale} />
    </>
  );
}

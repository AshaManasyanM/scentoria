import { CatalogBanner } from "@/components/catalog-banner";
import { HeroSlider } from "@/components/hero-slider";
import { PageEnd } from "@/components/page-end";
import { ProductSlider } from "@/components/product-slider";
import { SectionHeading } from "@/components/section-heading";
import { NoteTile } from "@/components/note-tile";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { noteTiles } from "@/lib/note-tiles";
import { path } from "@/lib/path";
import { popularBrands } from "@/lib/popular-brands";
import { filterProducts, getCatalog } from "@/lib/shopify/catalog";
import { mockTestimonials } from "@/lib/shopify/mock";
import Link from "next/link";

const typeScene = "/fregrance.webp";

const typeTiles = [
  { key: "all", query: "", className: "max-md:col-span-3 max-md:h-[160px] md:col-span-2 md:row-span-2" },
  { key: "men", query: "?gender=men", className: "max-md:h-[100px]" },
  { key: "women", query: "?gender=women", className: "max-md:h-[100px]" },
  { key: "unisex", query: "?gender=unisex", className: "max-md:h-[100px] md:col-span-2" },
];

const heroSlides = [
  { url: "/hero/01.webp", alt: "Amouage fragrances" },
  { url: "/hero/02.jpg", alt: "Kilian Paris Good Girl Gone Bad" },
  { url: "/hero/03.jpg", alt: "Kilian Paris The Liquors" },
  { url: "/hero/04.webp", alt: "Jean Paul Gaultier Le Male" },
  { url: "/hero/05.webp", alt: "Clive Christian Original Collection" },
  { url: "/hero/06.webp", alt: "Louis Vuitton Myriad" },
  { url: "/hero/07.jpg", alt: "Yves Saint Laurent Libre" },
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

      <section className="mx-auto max-w-[1350px] px-4 py-5">
        <SectionHeading title={t.shopByType} subtitle={t.shopByTypeSub} />
        <div className="mb-6 grid h-[600px] grid-cols-4 grid-rows-2 gap-2 max-md:mb-[18px] max-md:h-auto max-md:grid-cols-3 max-md:grid-rows-[160px_100px]">
          {typeTiles.map((tile) => (
            <Link
              key={tile.key}
              href={path(locale, `/products${tile.query}`)}
              className={`relative flex items-center justify-center overflow-hidden rounded-[20px] bg-cover bg-center bg-no-repeat bg-fixed hover:opacity-90 ${tile.className}`}
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("${typeScene}")`,
              }}
            >
              <h2 className="relative z-10 px-2 text-center font-serif text-[clamp(15px,4.2vw,40px)] font-medium uppercase leading-tight tracking-wide text-white">
                {typeLabels[tile.key]}
              </h2>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-center">
          <Link href={path(locale, "/products")} className="btn-green">
            {t.viewAllProducts}
          </Link>
        </p>
      </section>

      <section className="product-band">
        <SectionHeading title={t.bestSellers} subtitle={t.bestSellersSub} light />
        <ProductSlider products={featured} locale={locale} />
        <p className="mt-4 md:mt-[42px]">
          <Link href={path(locale, "/products")} className="btn-white">
            {t.viewAllProducts}
          </Link>
        </p>
      </section>

      <section className="mx-auto max-w-[1350px] px-4 py-5">
        <SectionHeading title={t.popularBrands} subtitle={t.popularBrandsSub} />
        <div className="grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-4">
          {popularBrands.map((brand) => (
            <Link
              key={brand.handle}
              href={path(locale, `/brands/${brand.handle}`)}
              className={`flex min-h-[104px] items-center justify-center rounded-[5px] border border-[#b79e9e] bg-white p-4 shadow-md transition duration-300 hover:scale-105 hover:shadow-2xl md:min-h-[120px] md:rounded-[20px] ${
                "desktopOnly" in brand && brand.desktopOnly ? "max-md:hidden" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brand.logo}
                alt={`${brand.name} perfume brand logo`}
                title={`${brand.name} perfume brand`}
                className="h-auto w-full object-contain"
              />
            </Link>
          ))}
        </div>
        <p className="mt-10 text-center">
          <Link href={path(locale, "/brands")} className="btn-green">
            {t.viewAllBrands}
          </Link>
        </p>
      </section>

      <section className="product-band">
        <SectionHeading title={t.newArrivals} subtitle={t.newArrivalsSub} light />
        <ProductSlider products={newest} locale={locale} />
        <p className="mt-4 md:mt-[42px]">
          <Link href={path(locale, "/products?new=1")} className="btn-white">
            {t.viewAllNew}
          </Link>
        </p>
      </section>

      <section className="mx-auto max-w-[1350px] px-4 py-5">
        <SectionHeading title={t.shopByNote} subtitle={t.shopByNoteSub} />
        <div className="grid grid-cols-3 gap-1 md:grid-cols-4 md:gap-4">
          {noteTiles
            .filter((note) => !note.hiddenOnHome)
            .map((note) => (
              <NoteTile
                key={note.key}
                href={path(locale, `/notes/${note.key}`)}
                image={note.image}
                label={t.notes[note.key]}
                className={note.mdOnly ? "max-md:hidden" : ""}
              />
            ))}
        </div>
        <p className="mt-10 text-center">
          <Link href={path(locale, "/notes")} className="btn-green">
            {t.viewAllNotes}
          </Link>
        </p>
      </section>

      <section className="product-band">
        <SectionHeading title={t.onSale} subtitle={t.onSaleSub} light />
        <ProductSlider products={sale} locale={locale} />
        <p className="mt-4 md:mt-[42px]">
          <Link href={path(locale, "/sales")} className="btn-white">
            {t.viewAllSale}
          </Link>
        </p>
      </section>

      <section className="mx-auto max-w-[1350px] px-4 py-5">
        <SectionHeading title={t.testimonials} subtitle={t.testimonialsSub} />
        <div className="grid gap-6 md:grid-cols-3">
          {mockTestimonials.map((item) => (
            <blockquote key={item.name + item.product} className="rounded-2xl bg-bg-2 p-5 md:p-6">
              <p className="font-serif text-xl leading-snug">{item.product}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-muted md:text-sm">{item.text}</p>
              <p className="mt-4 text-sm uppercase tracking-[0.16em] text-gold">{item.name}</p>
              <p className="mt-1 text-sm text-muted">{item.date}</p>
            </blockquote>
          ))}
        </div>
      </section>

      <PageEnd locale={locale} />
    </>
  );
}

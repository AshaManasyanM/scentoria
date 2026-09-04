import { CatalogBanner } from "@/components/catalog-banner";
import { HeroSlider } from "@/components/hero-slider";
import { PageEnd } from "@/components/page-end";
import { ProductGrid } from "@/components/product-grid";
import { ProductSlider } from "@/components/product-slider";
import { SectionHeading } from "@/components/section-heading";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { path } from "@/lib/path";
import {
  brandHandle,
  filterProducts,
  getArticles,
  getCatalog,
  uniqueBrands,
} from "@/lib/shopify/catalog";
import { mockTestimonials, noteKeys } from "@/lib/shopify/mock";
import Link from "next/link";

const typeScene = "/fregrance.webp";

const typeTiles = [
  { key: "all", query: "", className: "max-md:col-span-3 max-md:h-[150px] md:col-span-2 md:row-span-2" },
  { key: "men", query: "?gender=men", className: "max-md:h-[88px]" },
  { key: "women", query: "?gender=women", className: "max-md:h-[88px]" },
  { key: "unisex", query: "?gender=unisex", className: "max-md:h-[88px] md:col-span-2" },
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
  const articles = await getArticles();
  const brands = uniqueBrands(products);
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

      <section className="mx-auto max-w-7xl px-4 py-5">
        <SectionHeading title={t.shopByType} subtitle={t.shopByTypeSub} />
        <div className="mb-6 grid h-[600px] grid-cols-4 grid-rows-2 gap-2 max-md:mb-[18px] max-md:h-auto max-md:grid-cols-3 max-md:grid-rows-[150px_88px]">
          {typeTiles.map((tile) => (
            <Link
              key={tile.key}
              href={path(locale, `/products${tile.query}`)}
              className={`relative flex items-center justify-center overflow-hidden rounded-[20px] bg-cover bg-center bg-no-repeat bg-fixed hover:opacity-90 ${tile.className}`}
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("${typeScene}")`,
              }}
            >
              <h2 className="relative z-10 px-4 text-center font-serif text-[2.7vw] font-medium uppercase tracking-wide text-white">
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

      <section className="relative flex flex-col items-center gap-[5px] bg-gold-2 px-[5px] py-5 text-center">
        <SectionHeading title={t.bestSellers} subtitle={t.bestSellersSub} light />
        <ProductSlider products={featured} locale={locale} />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-5">
        <SectionHeading title={t.popularBrands} subtitle={t.popularBrandsSub} />
        <div className="flex flex-wrap justify-center gap-4">
          {brands.map((brand) => (
            <Link
              key={brand}
              href={path(locale, `/brands/${brandHandle(brand)}`)}
              className="rounded-full border border-line px-5 py-3 text-xs uppercase tracking-[0.16em] hover:border-gold hover:text-gold"
            >
              {brand}
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gold-2 py-5">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading title={t.newArrivals} subtitle={t.newArrivalsSub} light />
          <ProductGrid products={newest} locale={locale} />
          <p className="mt-10 text-center">
            <Link href={path(locale, "/products?new=1")} className="btn-green">
              {t.viewAllNew}
            </Link>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-5">
        <SectionHeading title={t.shopByNote} subtitle={t.shopByNoteSub} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {noteKeys.map((note) => (
            <Link
              key={note}
              href={path(locale, `/notes/${note}`)}
              className="rounded-2xl bg-bg-2 px-3 py-10 text-center font-serif text-sm uppercase tracking-wide hover:bg-gold hover:text-white"
            >
              {t.notes[note]}
            </Link>
          ))}
        </div>
        <p className="mt-8 text-center">
          <Link href={path(locale, "/notes")} className="btn-green">
            {t.viewAllNotes}
          </Link>
        </p>
      </section>

      <section className="bg-gold-2 py-5">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading title={t.onSale} subtitle={t.onSaleSub} light />
          <ProductGrid products={sale} locale={locale} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-5">
        <SectionHeading title={t.testimonials} subtitle={t.testimonialsSub} />
        <div className="grid gap-6 md:grid-cols-3">
          {mockTestimonials.map((item) => (
            <blockquote key={item.name + item.product} className="rounded-2xl bg-bg-2 p-6">
              <p className="font-serif text-xl">{item.product}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.text}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-gold">{item.name}</p>
              <p className="mt-1 text-xs text-muted">{item.date}</p>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-5">
        <SectionHeading title={t.blogTitle} subtitle={t.blogSub} />
        <div className="grid gap-8 md:grid-cols-3">
          {articles.slice(0, 3).map((article) => (
            <Link key={article.handle} href={path(locale, `/blog/${article.handle}`)} className="block">
              {article.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={article.image} alt="" className="aspect-[16/10] w-full rounded-2xl object-cover" />
              ) : null}
              <h3 className="mt-4 font-serif text-2xl">{article.title}</h3>
              <p className="mt-2 text-sm text-muted line-clamp-3">{article.excerpt}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-gold">{t.readMore}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gold-2 py-5 text-center text-white">
        <h2 className="font-serif text-4xl">{t.youtube}</h2>
        <p className="mt-3 text-white/80">{t.youtubeSub}</p>
        <a href="https://www.youtube.com" target="_blank" rel="noreferrer" className="btn-green mt-8">
          YouTube
        </a>
      </section>

      <PageEnd locale={locale} />
    </>
  );
}

import { CatalogBanner } from "@/components/catalog-banner";
import { PageEnd } from "@/components/page-end";
import { ProductGrid } from "@/components/product-grid";
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

const quotes = [
  {
    quote: "A woman without perfume is like a flower without scent.",
    by: "Coco Chanel",
  },
  {
    quote: "Perfume is the art of transforming simple emotions into scents.",
    by: "Jean-Paul Gaultier",
  },
  {
    quote: "Scent is poetry in the air.",
    by: "Jean-Claude Ellena",
  },
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

  const types = [
    { href: path(locale, "/products"), label: t.allFragrances },
    { href: path(locale, "/products?gender=men"), label: t.men },
    { href: path(locale, "/products?gender=women"), label: t.women },
    { href: path(locale, "/products?gender=unisex"), label: t.unisex },
  ];

  return (
    <>
      <CatalogBanner locale={locale} source={source} />
      <section className="border-b border-line bg-[radial-gradient(ellipse_at_top,_#1c1812,_#0b0a09)]">
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <p className="text-[11px] tracking-[0.4em] uppercase text-gold">{t.tagline}</p>
          <h1 className="mt-6 font-serif text-5xl md:text-7xl tracking-[0.12em] uppercase">
            {t.brand}
          </h1>
          <div className="mt-10 space-y-8">
            {quotes.map((item) => (
              <div key={item.by}>
                <p className="font-serif text-xl md:text-2xl leading-snug text-gold-2">
                  “{item.quote}”
                </p>
                <p className="mt-2 text-sm text-muted">— {item.by}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading title={t.shopByType} subtitle={t.shopByTypeSub} />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {types.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="border border-line px-4 py-10 text-center text-xs tracking-[0.22em] uppercase hover:border-gold hover:text-gold"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <SectionHeading title={t.bestSellers} subtitle={t.bestSellersSub} />
        <ProductGrid products={featured} locale={locale} />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading title={t.popularBrands} subtitle={t.popularBrandsSub} />
        <div className="flex flex-wrap justify-center gap-4">
          {brands.map((brand) => (
            <Link
              key={brand}
              href={path(locale, `/brands/${brandHandle(brand)}`)}
              className="border border-line px-5 py-3 text-xs tracking-[0.18em] uppercase hover:border-gold"
            >
              {brand}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <SectionHeading title={t.newArrivals} subtitle={t.newArrivalsSub} />
        <ProductGrid products={newest} locale={locale} />
        <p className="mt-10 text-center">
          <Link
            href={path(locale, "/products?new=1")}
            className="text-xs tracking-[0.22em] uppercase text-gold"
          >
            {t.viewAllNew}
          </Link>
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading title={t.shopByNote} subtitle={t.shopByNoteSub} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {noteKeys.map((note) => (
            <Link
              key={note}
              href={path(locale, `/notes/${note}`)}
              className="border border-line px-3 py-6 text-center text-[11px] tracking-[0.2em] uppercase hover:border-gold"
            >
              {t.notes[note]}
            </Link>
          ))}
        </div>
        <p className="mt-8 text-center">
          <Link
            href={path(locale, "/notes")}
            className="text-xs tracking-[0.22em] uppercase text-gold"
          >
            {t.viewAllNotes}
          </Link>
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <SectionHeading title={t.onSale} subtitle={t.onSaleSub} />
        <ProductGrid products={sale} locale={locale} />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading title={t.testimonials} subtitle={t.testimonialsSub} />
        <div className="grid gap-6 md:grid-cols-3">
          {mockTestimonials.map((item) => (
            <blockquote key={item.name + item.product} className="border border-line bg-bg-2 p-6">
              <p className="font-serif text-xl">{item.product}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.text}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-gold">{item.name}</p>
              <p className="mt-1 text-xs text-muted">{item.date}</p>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <SectionHeading title={t.blogTitle} subtitle={t.blogSub} />
        <div className="grid gap-8 md:grid-cols-3">
          {articles.slice(0, 3).map((article) => (
            <Link key={article.handle} href={path(locale, `/blog/${article.handle}`)} className="block">
              {article.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={article.image} alt="" className="aspect-[16/10] w-full object-cover" />
              ) : null}
              <h3 className="mt-4 font-serif text-2xl">{article.title}</h3>
              <p className="mt-2 text-sm text-muted line-clamp-3">{article.excerpt}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-gold">{t.readMore}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-line py-20 text-center">
        <h2 className="font-serif text-4xl">{t.youtube}</h2>
        <p className="mt-3 text-muted">{t.youtubeSub}</p>
        <a
          href="https://www.youtube.com"
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-block border border-gold px-8 py-3 text-xs uppercase tracking-[0.22em] text-gold"
        >
          YouTube
        </a>
      </section>

      <PageEnd locale={locale} />
    </>
  );
}

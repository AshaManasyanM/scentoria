import { AddToCart } from "@/components/add-to-cart";
import { PageEnd } from "@/components/page-end";
import { ProductGallery } from "@/components/product-gallery";
import { ProductGrid } from "@/components/product-grid";
import { SectionHeading } from "@/components/section-heading";
import { StatBars } from "@/components/stat-bars";
import { TrustRow } from "@/components/trust-row";
import { formatPriceRange } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { path } from "@/lib/path";
import { brandHandle, getCatalog, getProduct } from "@/lib/shopify/catalog";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const { handle } = await params;
  const locale = await localeFrom(params);
  const product = await getProduct(handle);
  if (!product) notFound();
  const t = getDict(locale);
  const { products } = await getCatalog();
  const related = products
    .filter((p) => p.brand === product.brand && p.handle !== product.handle)
    .slice(0, 4);

  return (
    <>
      <div className="mx-auto grid max-w-[1350px] gap-12 px-4 py-16 md:grid-cols-2">
        <ProductGallery product={product} />
        <div>
          <Link
            href={path(locale, `/brands/${brandHandle(product.brand)}`)}
            className="text-xs uppercase tracking-[0.2em] text-gold"
          >
            {t.allBrand.replace("{brand}", product.brand)}
          </Link>
          <p className="mt-4 font-[family-name:var(--font-tommy)] text-xs uppercase tracking-[0.22em] text-muted">
            {product.brand}
          </p>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">{product.title}</h1>
          <p className="mt-3 text-sm text-muted">
            ★ {product.rating.toFixed(1)} ({product.reviewCount} {t.reviews})
          </p>
          <p className="mt-4 text-xl">
            {formatPriceRange(product.minPrice, product.maxPrice, locale)}
          </p>
          <p className="mt-3 text-xs text-muted">{t.availability}</p>
          <div className="mt-8">
            <AddToCart product={product} locale={locale} />
          </div>
          <div className="mt-8">
            <TrustRow locale={locale} />
          </div>
          <div className="mt-8">
            <h2 className="text-xs uppercase tracking-[0.2em] text-gold">{t.mainAccords}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.accords.map((accord) => (
                <span
                  key={accord}
              className="mt-3 rounded-xl bg-white px-3 py-1 text-[11px] uppercase tracking-[0.16em]"
                >
                  {accord}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-16">
        <h2 className="font-serif text-3xl">{t.description}</h2>
        <p className="mt-4 leading-relaxed text-muted whitespace-pre-line">{product.description}</p>
        <div className="mt-12 grid gap-10 md:grid-cols-2">
          <StatBars title={t.longevityTitle} items={product.longevity} />
          <StatBars title={t.seasonTitle} items={product.season} />
          <StatBars title={t.sillageTitle} items={product.sillage} />
          <StatBars title={t.timeOfDayTitle} items={product.timeOfDay} />
        </div>
        <div className="mt-12 border border-line p-6">
          <h3 className="font-serif text-2xl">{t.reviews}</h3>
          <p className="mt-3 text-sm text-muted">{t.writeReview}</p>
        </div>
      </div>

      {related.length ? (
        <div className="mx-auto max-w-[1350px] px-4 pb-10">
          <SectionHeading title={t.related} />
          <ProductGrid products={related} locale={locale} />
        </div>
      ) : null}

      <PageEnd locale={locale} />
    </>
  );
}

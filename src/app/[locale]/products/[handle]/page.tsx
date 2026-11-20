import { AccordBars, topMainAccordLabel } from "@/components/accord-bars";
import { AddToCart } from "@/components/add-to-cart";
import { AuthenticityBadge } from "@/components/authenticity-badge";
import { ProductGallery } from "@/components/product-gallery";
import { ProductReviews } from "@/components/product-reviews";
import { ProductWishlistButton } from "@/components/product-wishlist-button";
import { Testimonials } from "@/components/testimonials";
import { ProductGrid } from "@/components/product-grid";
import { ProductSelection } from "@/components/product-selection";
import { SectionHeading } from "@/components/section-heading";
import { StatBars } from "@/components/stat-bars";
import { TrustRow } from "@/components/trust-row";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { path } from "@/lib/path";
import { getBottleColors, getCatalog, getProduct } from "@/lib/shopify/catalog";
import { publishedProductReviews } from "@/lib/shopify/reviews";
import { findUserBySession, statVoteCounts } from "@/lib/users-db";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const { handle } = await params;
  const locale = await localeFrom(params);
  const product = await getProduct(handle, locale);
  if (!product) notFound();
  const t = getDict(locale);
  const bottleColors = await getBottleColors();
  const { products } = await getCatalog(locale);
  const related = product.brand
    ? products.filter((p) => p.brand === product.brand && p.handle !== product.handle).slice(0, 4)
    : [];
  const user = await findUserBySession((await cookies()).get("scentoria_session")?.value ?? "");
  const comments = await publishedProductReviews(product.handle);
  const votes = await statVoteCounts(product.handle);

  return (
    <>
      <ProductSelection product={product}>
      <div className="mx-auto grid max-w-[min(100%,78rem)] gap-8 px-[clamp(1rem,2.5vw,1.25rem)] py-[clamp(2rem,4vw,4rem)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start md:gap-10 xl:gap-12">
        <ProductGallery />
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {product.brand ? (
                <Link
                  href={path(locale, `/products?brand=${encodeURIComponent(product.brand)}`)}
                  className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#083534]/55 transition-colors hover:text-[#c5a059]"
                >
                  {product.brand}
                </Link>
              ) : null}
              <h1
                className={`min-w-0 font-serif text-[clamp(1.45rem,1.15rem+1.1vw,2.2rem)] font-medium leading-[1.18] text-[#083534] ${
                  product.brand ? "mt-1.5" : ""
                }`}
              >
                {(() => {
                  const title = product.title.trim();
                  const brand = product.brand.trim();
                  if (!brand || !title.toLowerCase().startsWith(brand.toLowerCase())) return title;
                  return title.slice(brand.length).replace(/^[\s\-–—|:]+/, "").trim() || title;
                })()}
              </h1>
              {(() => {
                const accords = topMainAccordLabel(product.accords) || product.fragranceCategory;
                const parts = [product.concentration, accords].filter(Boolean);
                if (!parts.length) return null;
                return (
                  <p className="mt-2 text-sm leading-6 text-[#083534]/55">{parts.join(" · ")}</p>
                );
              })()}
              <p className="mt-2.5 text-sm text-muted">
                ★ {product.rating.toFixed(1)} ({product.reviewCount} {t.reviews})
              </p>
            </div>
            <ProductWishlistButton locale={locale} />
          </div>
          <div className="mt-5">
            <AddToCart locale={locale} bottleColors={bottleColors} />
          </div>
          <AccordBars title={t.mainAccords} accords={product.accords} />
        </div>
      </div>
      </ProductSelection>

      <div className="mx-auto grid max-w-[min(100%,84.375rem)] items-start gap-4 px-[clamp(1rem,2.5vw,1.25rem)] pb-[clamp(2rem,4vw,4rem)] md:grid-cols-2">
        <div className="space-y-4">
          <TrustRow locale={locale} />
          <div className="rounded-xl border border-[#e6e6e6] bg-white px-6 py-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#111]">{t.description}</h2>
            <p className="mt-4 text-sm leading-7 text-[#333] whitespace-pre-line">{product.description}</p>
          </div>
          <ProductReviews
            locale={locale}
            handle={product.handle}
            rating={product.rating}
            count={product.reviewCount}
            mine={0}
            author={user?.name ?? ""}
            loggedIn={Boolean(user)}
          />
        </div>
        <div className="space-y-4">
          <StatBars title={t.longevityTitle} handle={product.handle} category="longevity" items={product.longevity} counts={votes.longevity} />
          <StatBars title={t.seasonTitle} handle={product.handle} category="season" items={product.season} counts={votes.season} />
          <StatBars title={t.sillageTitle} handle={product.handle} category="sillage" items={product.sillage} counts={votes.sillage} />
          <StatBars title={t.timeOfDayTitle} handle={product.handle} category="time" items={product.timeOfDay} counts={votes.time} />
          <AuthenticityBadge locale={locale} />
        </div>
      </div>
      {comments.length ? (
        <Testimonials
          eyebrow={t.reviews}
          width="max-w-[min(100%,84.375rem)]"
          items={comments.map((comment) => ({
            name: comment.name,
            product: product.title,
            text: comment.body,
            date: comment.createdAt,
          }))}
        />
      ) : null}
      {related.length ? (
        <div className="mx-auto max-w-[min(100%,84.375rem)] px-[clamp(1rem,2.5vw,1.25rem)] pb-10">
          <SectionHeading title={t.related} />
          <ProductGrid products={related} locale={locale} />
        </div>
      ) : null}

    </>
  );
}

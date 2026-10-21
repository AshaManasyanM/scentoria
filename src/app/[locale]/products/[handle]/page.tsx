import { AccordBars } from "@/components/accord-bars";
import { AddToCart } from "@/components/add-to-cart";
import { ProductGallery } from "@/components/product-gallery";
import { ProductReviews } from "@/components/product-reviews";
import { Testimonials } from "@/components/testimonials";
import { ProductGrid } from "@/components/product-grid";
import { ProductSelection } from "@/components/product-selection";
import { SectionHeading } from "@/components/section-heading";
import { StatBars } from "@/components/stat-bars";
import { TrustRow } from "@/components/trust-row";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { path } from "@/lib/path";
import { getCatalog, getProduct } from "@/lib/shopify/catalog";
import { publishedProductReviews } from "@/lib/shopify/reviews";
import { findUserBySession, statVoteCounts } from "@/lib/users-db";
import { cookies } from "next/headers";
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
  const related = product.brand
    ? products.filter((p) => p.brand === product.brand && p.handle !== product.handle).slice(0, 4)
    : [];
  const user = await findUserBySession((await cookies()).get("scentoria_session")?.value ?? "");
  const comments = await publishedProductReviews(product.handle);
  const votes = await statVoteCounts(product.handle);

  return (
    <>
      <ProductSelection product={product}>
      <div className="mx-auto grid max-w-[1350px] gap-12 px-4 py-16 md:grid-cols-[minmax(0,741px)_minmax(0,1fr)]">
        <ProductGallery />
        <div>
          {product.brand ? (
            <p className="text-2xl font-bold uppercase tracking-wide md:text-3xl">{product.brand}</p>
          ) : null}
          <h1 className={`font-serif text-3xl md:text-4xl ${product.brand ? "mt-1" : ""}`}>{product.title}</h1>
          {product.brand ? (
            <Link
              href={path(locale, `/products?brand=${encodeURIComponent(product.brand)}`)}
              className="mt-2 inline-block text-sm text-gold underline"
            >
              {t.allBrand.replace("{brand}", product.brand)}
            </Link>
          ) : null}
          <p className="mt-3 text-sm text-muted">
            ★ {product.rating.toFixed(1)} ({product.reviewCount} {t.reviews})
          </p>
          <div className="mt-8">
            <AddToCart locale={locale} />
          </div>
          <AccordBars title={t.mainAccords} accords={product.accords} />
        </div>
      </div>
      </ProductSelection>

      <div className="mx-auto grid max-w-[1350px] items-start gap-4 px-4 pb-16 md:grid-cols-2">
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
        </div>
      </div>
      {comments.length ? (
        <Testimonials
          eyebrow={t.reviews}
          width="max-w-[1350px]"
          items={comments.map((comment) => ({
            name: comment.name,
            product: product.title,
            text: comment.body,
            date: comment.createdAt,
          }))}
        />
      ) : null}
      {related.length ? (
        <div className="mx-auto max-w-[1350px] px-4 pb-10">
          <SectionHeading title={t.related} />
          <ProductGrid products={related} locale={locale} />
        </div>
      ) : null}

    </>
  );
}

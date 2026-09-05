import { CatalogBanner } from "@/components/catalog-banner";
import { PageEnd } from "@/components/page-end";
import { PageHero } from "@/components/page-hero";
import { ProductGrid } from "@/components/product-grid";
import { localeFrom } from "@/lib/locale-params";
import { brandHandle, getCatalog, uniqueBrands } from "@/lib/shopify/catalog";

export default async function BrandPage({
  params,
}: {
  params: Promise<{ locale: string; brand: string }>;
}) {
  const locale = await localeFrom(params);
  const { brand } = await params;
  const { products, source } = await getCatalog();
  const name =
    uniqueBrands(products).find((b) => brandHandle(b) === brand) ??
    brand
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  const list = products.filter((p) => brandHandle(p.brand) === brand);

  return (
    <>
      <PageHero title={name} />
      <CatalogBanner locale={locale} source={source} />
      <div className="mx-auto max-w-[1350px] px-4 py-10 md:py-14">
        <ProductGrid products={list} locale={locale} />
      </div>
      <PageEnd locale={locale} />
    </>
  );
}

import { CatalogBanner } from "@/components/catalog-banner";
import { PageEnd } from "@/components/page-end";
import { ProductGrid } from "@/components/product-grid";
import { SectionHeading } from "@/components/section-heading";
import { localeFrom } from "@/lib/locale-params";
import { brandHandle, getCatalog, uniqueBrands } from "@/lib/shopify/catalog";
import { notFound } from "next/navigation";

export default async function BrandPage({
  params,
}: {
  params: Promise<{ locale: string; brand: string }>;
}) {
  const locale = await localeFrom(params);
  const { brand } = await params;
  const { products, source } = await getCatalog();
  const name = uniqueBrands(products).find((b) => brandHandle(b) === brand);
  if (!name) notFound();
  const list = products.filter((p) => p.brand === name);

  return (
    <>
      <CatalogBanner locale={locale} source={source} />
      <div className="mx-auto max-w-7xl px-4 py-16">
        <SectionHeading title={name} />
        <ProductGrid products={list} locale={locale} />
      </div>
      <PageEnd locale={locale} />
    </>
  );
}

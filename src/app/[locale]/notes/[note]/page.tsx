import { CatalogBanner } from "@/components/catalog-banner";
import { PageEnd } from "@/components/page-end";
import { ProductGrid } from "@/components/product-grid";
import { SectionHeading } from "@/components/section-heading";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { filterProducts, getCatalog } from "@/lib/shopify/catalog";
import { noteKeys } from "@/lib/shopify/mock";
import { notFound } from "next/navigation";

export default async function NotePage({
  params,
}: {
  params: Promise<{ locale: string; note: string }>;
}) {
  const locale = await localeFrom(params);
  const { note } = await params;
  if (!noteKeys.includes(note as (typeof noteKeys)[number])) notFound();
  const t = getDict(locale);
  const { products, source } = await getCatalog();
  const list = filterProducts(products, { note });
  const label = t.notes[note as keyof typeof t.notes];

  return (
    <>
      <CatalogBanner locale={locale} source={source} />
      <div className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading title={label} />
        <ProductGrid products={list} locale={locale} />
      </div>
      <PageEnd locale={locale} />
    </>
  );
}

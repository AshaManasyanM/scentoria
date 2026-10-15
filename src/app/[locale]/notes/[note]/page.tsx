import { CatalogBanner } from "@/components/catalog-banner";
import { PageHero } from "@/components/page-hero";
import { ProductGrid } from "@/components/product-grid";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { filterProducts, getCatalog, getNotes } from "@/lib/shopify/catalog";
import { notFound } from "next/navigation";

export default async function NotePage({
  params,
}: {
  params: Promise<{ locale: string; note: string }>;
}) {
  const locale = await localeFrom(params);
  const { note } = await params;
  const t = getDict(locale);
  const match = (await getNotes()).find((item) => item.key === note);
  if (!match) notFound();
  const { products, source } = await getCatalog();
  const list = filterProducts(products, { note });
  const label = match.label || (note in t.notes ? t.notes[note as keyof typeof t.notes] : note);

  return (
    <>
      <PageHero title={label} />
      <CatalogBanner locale={locale} source={source} />
      <div className="mx-auto max-w-[1350px] px-4 py-10 md:py-14">
        <ProductGrid products={list} locale={locale} />
      </div>
    </>
  );
}

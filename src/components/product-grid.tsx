import { getDict } from "@/lib/i18n";
import type { Locale, Product } from "@/lib/types";
import { ProductCard } from "./product-card";

export function ProductGrid({
  products,
  locale,
}: {
  products: Product[];
  locale: Locale;
}) {
  const t = getDict(locale);
  if (!products.length) {
    return <p className="py-16 text-center text-muted">{t.emptyCatalog}</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 md:gap-10">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} locale={locale} />
      ))}
    </div>
  );
}

import { getDict } from "@/lib/i18n";
import type { Locale, Product } from "@/lib/types";
import { ProductCard } from "./product-card";

export function ProductGrid({
  products,
  locale,
  variant = "grid",
}: {
  products: Product[];
  locale: Locale;
  variant?: "grid" | "feature" | "catalog";
}) {
  const t = getDict(locale);
  if (!products.length) {
    return <p className="py-16 text-center text-[#083534]/70">{t.emptyCatalog}</p>;
  }
  return (
    <div
      className={
        variant === "catalog"
          ? "grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
          : variant === "feature"
            ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
            : "grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-10 lg:grid-cols-4"
      }
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          locale={locale}
          variant={variant === "grid" ? "grid" : variant}
        />
      ))}
    </div>
  );
}

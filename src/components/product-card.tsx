import { formatPriceRange } from "@/lib/format";
import { path } from "@/lib/path";
import type { Locale, Product } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

export function ProductCard({
  product,
  locale,
}: {
  product: Product;
  locale: Locale;
}) {
  const img = product.images[0];
  return (
    <Link href={path(locale, `/products/${product.handle}`)} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-bg-2">
        {img ? (
          <Image
            src={img.url}
            alt={img.alt}
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">Scentoria</div>
        )}
        {product.onSale ? (
          <span className="absolute left-3 top-3 bg-gold px-2 py-1 text-[10px] tracking-[0.2em] uppercase text-bg">
            Sale
          </span>
        ) : null}
      </div>
      <div className="mt-3 text-center">
        <p className="text-[10px] tracking-[0.22em] uppercase text-muted">{product.brand}</p>
        <h3 className="font-serif text-xl mt-1">{product.title}</h3>
        <p className="text-xs text-muted mt-1">
          ★ {product.rating.toFixed(1)} ({product.reviewCount})
        </p>
        <p className="mt-1 text-gold text-sm">
          {formatPriceRange(product.minPrice, product.maxPrice, locale)}
        </p>
      </div>
    </Link>
  );
}

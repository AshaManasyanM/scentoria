import type { Product } from "../types";
import { hasStorefrontToken } from "./config";
import { storefrontFetch } from "./fetch";
import { mapProduct } from "./map";
import { mockProducts } from "./mock";
import {
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCTS_QUERY,
  SEARCH_QUERY,
} from "./queries";

export type CatalogSource = "shopify" | "sample" | "empty";

export type Catalog = {
  products: Product[];
  source: CatalogSource;
};

type ProductsData = {
  products: { nodes: Parameters<typeof mapProduct>[0][] };
};

export async function getCatalog(): Promise<Catalog> {
  if (hasStorefrontToken()) {
    const data = await storefrontFetch<ProductsData>(PRODUCTS_QUERY, { first: 80 });
    if (data?.products?.nodes) {
      const products = data.products.nodes.map(mapProduct);
      return { products, source: products.length ? "shopify" : "empty" };
    }
  }
  return { products: mockProducts, source: "sample" };
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  const { products, source } = await getCatalog();
  const local = products.find((p) => p.handle === handle);
  if (local) return local;
  if (source === "sample") return undefined;

  const data = await storefrontFetch<{
    product: Parameters<typeof mapProduct>[0] | null;
  }>(PRODUCT_BY_HANDLE_QUERY, { handle });
  if (!data?.product) return undefined;
  return mapProduct(data.product);
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  if (hasStorefrontToken()) {
    const data = await storefrontFetch<{
      search: { edges: { node: Parameters<typeof mapProduct>[0] }[] };
    }>(SEARCH_QUERY, { query: q });
    if (data?.search?.edges) {
      return data.search.edges
        .map((e) => e.node)
        .filter(Boolean)
        .map(mapProduct);
    }
  }

  const { products } = await getCatalog();
  return products.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)),
  );
}

export function uniqueBrands(products: Product[]) {
  return [...new Set(products.map((p) => p.brand))].sort();
}

function asList(value?: string | string[]) {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).flatMap((item) => item.split(",")).filter(Boolean);
}

function variantMl(title: string) {
  const match = title.match(/(\d+(?:\.\d+)?)\s*ml/i);
  return match ? Number(match[1]) : null;
}

export function productSizeKeys(product: Product) {
  const sizes = new Set<string>();
  for (const variant of product.variants) {
    const ml = variantMl(variant.title);
    if (ml == null) continue;
    if (ml >= 5 && ml <= 10) sizes.add("travel");
    if (ml > 10 && ml < 100) sizes.add("medium");
    if (ml >= 100) sizes.add("large");
  }
  return sizes;
}

export function productDiscountBucket(product: Product) {
  const match = product.discountLabel?.match(/(\d+)/);
  const percent = match ? Number(match[1]) : product.onSale ? 10 : null;
  if (percent == null) return null;
  const buckets = [10, 20, 30, 40, 50, 60, 70];
  return buckets.find((bucket) => percent >= bucket && percent < bucket + 10) ?? (percent >= 70 ? 70 : null);
}

export function filterProducts(
  products: Product[],
  opts: {
    gender?: string | string[];
    brand?: string | string[];
    note?: string | string[];
    size?: string | string[];
    discount?: string | string[];
    sale?: boolean;
    isNew?: boolean;
    featured?: boolean;
    sort?: string;
  },
) {
  const genders = asList(opts.gender).filter((g) => g !== "all");
  const brands = asList(opts.brand);
  const notes = asList(opts.note);
  const sizes = asList(opts.size);
  const discounts = asList(opts.discount);

  let list = products.filter((p) => {
    if (
      genders.length &&
      !genders.some((g) => p.gender === g || p.gender === "all")
    ) {
      return false;
    }
    if (brands.length && !brands.some((b) => p.brand.toLowerCase() === b.toLowerCase())) {
      return false;
    }
    if (
      notes.length &&
      !notes.some(
        (note) => p.notes.includes(note) || p.tags.map((tag) => tag.toLowerCase()).includes(note),
      )
    ) {
      return false;
    }
    if (sizes.length && !sizes.some((size) => productSizeKeys(p).has(size))) return false;
    if (discounts.length) {
      const bucket = productDiscountBucket(p);
      if (bucket == null || !discounts.includes(String(bucket))) return false;
    }
    if (opts.sale && !p.onSale) return false;
    if (opts.isNew && !p.isNew) return false;
    if (opts.featured && !p.featured) return false;
    return true;
  });

  if (opts.sort === "price-asc") {
    list = [...list].sort((a, b) => Number(a.minPrice.amount) - Number(b.minPrice.amount));
  } else if (opts.sort === "price-desc") {
    list = [...list].sort((a, b) => Number(b.minPrice.amount) - Number(a.minPrice.amount));
  } else if (opts.sort === "name") {
    list = [...list].sort((a, b) => a.title.localeCompare(b.title));
  }
  return list;
}

export function brandHandle(brand: string) {
  return brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

import type { Article, Product } from "../types";
import { hasStorefrontToken } from "./config";
import { storefrontFetch } from "./fetch";
import { mapProduct } from "./map";
import { mockArticles, mockProducts } from "./mock";
import {
  ARTICLES_QUERY,
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

export async function getArticles(): Promise<Article[]> {
  if (hasStorefrontToken()) {
    const data = await storefrontFetch<{
      articles: {
        nodes: {
          handle: string;
          title: string;
          excerpt?: string;
          content?: string;
          publishedAt: string;
          image?: { url: string } | null;
        }[];
      };
    }>(ARTICLES_QUERY);
    if (data?.articles?.nodes?.length) {
      return data.articles.nodes.map((a) => ({
        handle: a.handle,
        title: a.title,
        excerpt: a.excerpt || "",
        date: a.publishedAt.slice(0, 10),
        image: a.image?.url,
        body: a.content || a.excerpt || "",
      }));
    }
  }
  return mockArticles;
}

export function uniqueBrands(products: Product[]) {
  return [...new Set(products.map((p) => p.brand))].sort();
}

function asList(value?: string | string[]) {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).flatMap((item) => item.split(",")).filter(Boolean);
}

export function filterProducts(
  products: Product[],
  opts: {
    gender?: string | string[];
    brand?: string | string[];
    note?: string | string[];
    sale?: boolean;
    isNew?: boolean;
    featured?: boolean;
    sort?: string;
  },
) {
  const genders = asList(opts.gender).filter((g) => g !== "all");
  const brands = asList(opts.brand);
  const notes = asList(opts.note);

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

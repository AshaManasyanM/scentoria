import { cache } from "react";
import type { Product, Testimonial } from "../types";
import { hasStorefrontToken } from "./config";
import { storefrontFetch } from "./fetch";
import { publishedReviewSummaries, publishedReviews } from "./reviews";
import { mapProduct } from "./map";
import { mockProducts, mockTestimonials } from "./mock";
import { noteTiles } from "../note-tiles";
import { popularBrands } from "../popular-brands";
import {
  COLLECTIONS_QUERY,
  NOTES_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCTS_QUERY,
  SEARCH_QUERY,
  TESTIMONIALS_QUERY,
} from "./queries";

async function attachReviews(products: Product[]) {
  const summaries = await publishedReviewSummaries(products.map((product) => product.handle));
  return products.map((product) => {
    const summary = summaries.get(product.handle);
    if (!summary?.count) return { ...product, rating: 0, reviewCount: 0 };
    return { ...product, rating: summary.rating, reviewCount: summary.count };
  });
}

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
      const products = await attachReviews(data.products.nodes.map(mapProduct));
      return { products, source: products.length ? "shopify" : "empty" };
    }
  }
  return { products: await attachReviews(mockProducts), source: "sample" };
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
  return (await attachReviews([mapProduct(data.product)]))[0];
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  if (hasStorefrontToken()) {
    const data = await storefrontFetch<{
      search: { edges: { node: Parameters<typeof mapProduct>[0] }[] };
    }>(SEARCH_QUERY, { query: q });
    if (data?.search?.edges) {
      return await attachReviews(
        data.search.edges
          .map((e) => e.node)
          .filter(Boolean)
          .map(mapProduct),
      );
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
  return [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();
}

export type ShopBrand = {
  name: string;
  handle: string;
  logo?: string;
  description: string;
};

const hiddenCollections = new Set(["frontpage"]);

export async function getBrands(): Promise<ShopBrand[]> {
  const localLogos = new Map<string, string>(popularBrands.map((brand) => [brand.handle, brand.logo]));
  const fallback = popularBrands.map((brand) => ({
    name: brand.name,
    handle: brand.handle,
    logo: brand.logo,
    description: "",
  }));

  if (!hasStorefrontToken()) return fallback;

  const data = await storefrontFetch<{
    collections: {
      nodes: { handle: string; title: string; description: string; image?: { url: string } | null }[];
    };
  }>(COLLECTIONS_QUERY, { first: 50 });

  const brands = (data?.collections?.nodes ?? [])
    .filter((collection) => collection.title.trim() && !hiddenCollections.has(collection.handle))
    .map((collection) => ({
      name: collection.title.trim(),
      handle: collection.handle,
      logo: collection.image?.url || localLogos.get(collection.handle),
      description: collection.description.trim(),
    }));

  return brands.length ? brands : fallback;
}

function metaValue(fields: { key: string; value: string }[], keys: string[]) {
  const wanted = new Set(keys.map((key) => key.toLowerCase()));
  const value = fields.find((field) => wanted.has(field.key.toLowerCase()))?.value?.trim();
  return value || "";
}

export async function getHomeReviews(products: Product[]): Promise<Testimonial[]> {
  const reviews = await publishedReviews();
  const titles = new Map(products.map((product) => [product.handle, product.title]));
  return reviews
    .filter((review) => review.body.trim())
    .map((review) => ({
      name: review.name || "Customer",
      product: titles.get(review.productHandle) || review.productHandle,
      text: review.body.trim(),
      date: review.createdAt,
    }));
}

export async function getTestimonials(): Promise<Testimonial[]> {
  if (!hasStorefrontToken()) return mockTestimonials;

  const data = await storefrontFetch<{
    metaobjects: { nodes: { handle: string; fields: { key: string; value: string }[] }[] };
  }>(TESTIMONIALS_QUERY, { type: "testimonial", first: 20 });

  const items = (data?.metaobjects?.nodes ?? [])
    .map((entry) => ({
      name: metaValue(entry.fields, ["name", "author", "customer"]),
      product: metaValue(entry.fields, ["product", "perfume", "parfume", "title"]),
      text: metaValue(entry.fields, ["text", "quote", "review", "opinion"]),
      date: metaValue(entry.fields, ["date"]),
    }))
    .filter((item) => item.text);

  return items.length ? items : mockTestimonials;
}

const sectionNames = ["types", "bestsellers", "brands", "arrivals", "notes", "sale", "testimonials", "share", "faq", "about"] as const;
export type SectionName = (typeof sectionNames)[number];

export const getSectionVisibility = cache(async () => {
  const visible = Object.fromEntries(sectionNames.map((name) => [name, true])) as Record<SectionName, boolean>;
  if (!hasStorefrontToken()) return visible;

  const named = await sectionEntries("section");
  for (const entry of named) {
    if (!sectionNames.includes(entry.handle as SectionName)) continue;
    const value = sectionFlag(entry);
    if (value !== null) visible[entry.handle as SectionName] = value;
  }

  await Promise.all(
    sectionNames.map(async (name) => {
      const entries = await sectionEntries(name === "faq" ? "faqs" : name);
      const value = entries.map(sectionFlag).find((item) => item !== null);
      if (value !== undefined && value !== null) visible[name] = value;
    }),
  );

  return visible;
});

export async function isSectionVisible(name: SectionName) {
  return (await getSectionVisibility())[name];
}

async function sectionEntries(type: string) {
  const data = await storefrontFetch<{
    metaobjects: { nodes: { handle: string; fields: { key: string; value: string }[] }[] };
  }>(TESTIMONIALS_QUERY, { type, first: 20 });
  return data?.metaobjects?.nodes ?? [];
}

function sectionFlag(entry: { fields: { key: string; value: string }[] }) {
  const value = metaValue(entry.fields, ["section", "visible", "show", "enabled"]).toLowerCase();
  if (!value) return null;
  return value === "true" || value === "yes" || value === "1";
}

const fallbackContactEmail = "scentoria.la@gmail.com";

export async function getContactEmail() {
  if (!hasStorefrontToken()) return fallbackContactEmail;
  const entries = await sectionEntries("contact");
  const email = entries
    .map((entry) => metaValue(entry.fields, ["email", "mail"]))
    .find((value) => value.includes("@"));
  return email || fallbackContactEmail;
}

export async function getFaqs(): Promise<{ question: string; answer: string }[]> {
  if (!hasStorefrontToken()) return [];

  const data = await storefrontFetch<{
    metaobjects: { nodes: { handle: string; fields: { key: string; value: string }[] }[] };
  }>(TESTIMONIALS_QUERY, { type: "faq", first: 50 });

  return (data?.metaobjects?.nodes ?? [])
    .map((entry) => ({
      question: metaValue(entry.fields, ["question", "q", "title"]),
      answer: metaValue(entry.fields, ["answer", "a", "text", "body"]),
    }))
    .filter((item) => item.question && item.answer);
}

export type ShopNote = {
  key: string;
  label: string;
  image: string;
};

type NoteField = {
  key: string;
  value: string;
  reference?: { image?: { url: string } | null; url?: string | null } | null;
};

function noteImage(fields: NoteField[]) {
  const imageKeys = new Set(["image", "photo", "picture"]);
  const field = fields.find((item) => imageKeys.has(item.key.toLowerCase()));
  return field?.reference?.image?.url || field?.reference?.url || (field?.value?.startsWith("http") ? field.value : "");
}

const fallbackHeroSlides = [
  { url: "/hero/citrus.jpg", alt: "Solune Citrus Mist" },
  { url: "/hero/amber.jpg", alt: "Noirvale Amber Wood" },
  { url: "/hero/rose.jpg", alt: "Aurelia Rose Velour" },
];

export async function getHeroSlides(): Promise<{ url: string; alt: string }[]> {
  if (!hasStorefrontToken()) return fallbackHeroSlides;

  const data = await storefrontFetch<{
    metaobjects: { nodes: { handle: string; fields: NoteField[] }[] };
  }>(NOTES_QUERY, { type: "slide", first: 20 });

  const entries = data?.metaobjects?.nodes ?? [];
  if (!entries.length) return fallbackHeroSlides;

  return entries
    .filter((entry) => sectionFlag(entry) !== false)
    .map((entry, index) => {
      const orderRaw = metaValue(entry.fields, ["order", "position", "sort"]);
      const order = Number(orderRaw);
      return {
        url: noteImage(entry.fields),
        alt: metaValue(entry.fields, ["alt", "title", "name", "caption"]) || "Scentoria",
        order: orderRaw && Number.isFinite(order) ? order : index,
      };
    })
    .filter((slide) => slide.url)
    .sort((a, b) => a.order - b.order)
    .map(({ url, alt }) => ({ url, alt }));
}

const filterGroupIds = ["brand", "note", "gender", "size", "discount"] as const;
export type FilterGroupId = (typeof filterGroupIds)[number];
export type FilterChoice = { value: string; label: string };
export type CatalogFilterGroup = { id: FilterGroupId; title: string; items: FilterChoice[] };
export type ShopFilterConfig = Partial<Record<FilterGroupId, { title: string; items: FilterChoice[] }>>;

const filterGroupAliases: Record<string, FilterGroupId> = {
  brand: "brand",
  brands: "brand",
  vendor: "brand",
  "բրենդ": "brand",
  "բրենդներ": "brand",
  note: "note",
  notes: "note",
  "նոտա": "note",
  "նոտաներ": "note",
  gender: "gender",
  genders: "gender",
  "սեռ": "gender",
  size: "size",
  sizes: "size",
  "չափս": "size",
  "չափսեր": "size",
  discount: "discount",
  discounts: "discount",
  sale: "discount",
  "զեղչ": "discount",
  "զեղչեր": "discount",
};

function filterShown(value: string) {
  if (!value) return true;
  return !["false", "no", "0", "off", "hide"].includes(value.toLowerCase());
}

function filterValue(group: FilterGroupId, value: string) {
  const text = value.trim();
  if (group === "gender") {
    const gender = text.toLowerCase();
    if (["men", "man", "male", "տղամարդ"].includes(gender)) return "men";
    if (["women", "woman", "female", "կին"].includes(gender)) return "women";
    if (["unisex", "յունիսեքս"].includes(gender)) return "unisex";
    return gender;
  }
  if (group === "size") {
    const size = text.toLowerCase();
    if (size === "travel" || /5\s*[-–]\s*10/.test(size)) return "travel";
    if (size === "medium" || /10\s*[-–]\s*100/.test(size)) return "medium";
    if (size === "large" || /100\s*ml\s*\+/.test(size)) return "large";
    return size;
  }
  if (group === "discount") return text.match(/\d+/)?.[0] ?? text;
  if (group === "note") return text.toLowerCase();
  return text;
}

export function shopFiltersFromEntries(
  entries: { handle: string; fields: { key: string; value: string }[] }[],
): ShopFilterConfig {
  const grouped = new Map<FilterGroupId, { value: string; label: string; order: number; title: string }[]>();
  const seen = new Set<FilterGroupId>();
  entries.forEach((entry, index) => {
    const group = filterGroupAliases[metaValue(entry.fields, ["group", "type", "category", "filter"]).toLowerCase()];
    if (!group) return;
    const shown = filterShown(metaValue(entry.fields, ["show", "visible", "enabled"]));
    const rawValue = metaValue(entry.fields, ["value", "key"]) || entry.handle;
    const value = filterValue(group, rawValue);
    if (!shown) {
      seen.add(group);
      return;
    }
    if (!value) return;
    seen.add(group);
    const orderRaw = metaValue(entry.fields, ["order", "position", "sort"]);
    const order = orderRaw && Number.isFinite(Number(orderRaw)) ? Number(orderRaw) : index;
    const items = grouped.get(group) ?? [];
    items.push({
      value,
      label: metaValue(entry.fields, ["label", "name", "title"]) || rawValue,
      order,
      title: metaValue(entry.fields, ["group_label", "heading"]),
    });
    grouped.set(group, items);
  });

  const config: ShopFilterConfig = {};
  for (const group of seen) {
    const items = grouped.get(group) ?? [];
    const sorted = [...items]
      .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
      .filter((item, index, list) => list.findIndex((other) => other.value === item.value) === index);
    config[group] = {
      title: sorted.find((item) => item.title)?.title ?? "",
      items: sorted.map(({ value, label }) => ({ value, label })),
    };
  }
  return config;
}

export const getShopFilters = cache(async (): Promise<ShopFilterConfig> => {
  if (!hasStorefrontToken()) return {};
  const data = await storefrontFetch<{
    metaobjects: { nodes: { handle: string; fields: { key: string; value: string }[] }[] };
  }>(TESTIMONIALS_QUERY, { type: "filter", first: 100 });
  const entries = data?.metaobjects?.nodes ?? [];
  if (!entries.length) return {};
  return shopFiltersFromEntries(entries);
});

export function catalogFilterGroups(
  shop: ShopFilterConfig,
  titles: Record<FilterGroupId, string>,
  fallback: Record<FilterGroupId, FilterChoice[]>,
): CatalogFilterGroup[] {
  return filterGroupIds.flatMap((id) => {
    const custom = shop[id];
    const items = custom ? custom.items : fallback[id];
    if (!items.length) return [];
    return [{ id, title: custom?.title || titles[id], items }];
  });
}

export function standardFilterFallback(input: {
  brands: string[];
  notes: { key: string; label: string }[];
  men: string;
  women: string;
  unisex: string;
  sizeTravel: string;
  sizeMedium: string;
  sizeLarge: string;
}): Record<FilterGroupId, FilterChoice[]> {
  return {
    brand: input.brands.map((brand) => ({ value: brand, label: brand })),
    note: input.notes.map((note) => ({ value: note.key, label: note.label || note.key })),
    gender: [
      { value: "men", label: input.men },
      { value: "women", label: input.women },
      { value: "unisex", label: input.unisex },
    ],
    size: [
      { value: "travel", label: input.sizeTravel },
      { value: "medium", label: input.sizeMedium },
      { value: "large", label: input.sizeLarge },
    ],
    discount: ["10", "20", "30", "40", "50", "60", "70"].map((value) => ({ value, label: `${value}%` })),
  };
}

export async function getNotes(): Promise<ShopNote[]> {
  const fallback = noteTiles.map((note) => ({
    key: note.key,
    label: "",
    image: note.image,
  }));

  if (!hasStorefrontToken()) return fallback;

  const data = await storefrontFetch<{
    metaobjects: { nodes: { handle: string; fields: NoteField[] }[] };
  }>(NOTES_QUERY, { type: "note", first: 50 });

  const notes = (data?.metaobjects?.nodes ?? [])
    .map((entry) => ({
      key: entry.handle,
      label: metaValue(entry.fields, ["name", "title", "label"]),
      image: noteImage(entry.fields) || fallback.find((note) => note.key === entry.handle)?.image || "",
    }))
    .filter((note) => note.label || note.key);

  return notes.length ? notes : fallback;
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
    query?: string;
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

  const needle = opts.query?.trim().toLowerCase() ?? "";
  if (needle) {
    list = list.filter((product) => {
      const haystack = [
        product.title,
        product.brand,
        ...product.tags,
        ...product.notes,
        ...product.accords.map((accord) => accord.name),
        ...product.variants.map((variant) => variant.title),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }

  if (opts.sort === "price-asc") {
    list = [...list].sort((a, b) => Number(a.minPrice.amount) - Number(b.minPrice.amount));
  } else if (opts.sort === "price-desc") {
    list = [...list].sort((a, b) => Number(b.minPrice.amount) - Number(a.minPrice.amount));
  } else if (opts.sort === "name") {
    list = [...list].sort((a, b) => a.title.localeCompare(b.title));
  }
  return list;
}

export function exactSearchFacet(
  raw: string,
  brands: string[],
  notes: { key: string; label: string }[],
  genders: { value: string; label: string }[],
) {
  const query = raw.trim().toLowerCase();
  if (!query) return null;
  const brand = brands.find((item) => item.toLowerCase() === query);
  if (brand) return { brand };
  const note = notes.find((item) => item.key.toLowerCase() === query || item.label.toLowerCase() === query);
  if (note) return { note: note.key };
  const gender = genders.find((item) => item.value.toLowerCase() === query || item.label.toLowerCase() === query);
  if (gender) return { gender: gender.value };
  return null;
}

export function brandHandle(brand: string) {
  return brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

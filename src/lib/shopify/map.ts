import { discountPercent } from "../format";
import type { Money, Product, StatBar } from "../types";
import {
  defaultLongevity,
  defaultSeason,
  defaultSillage,
  defaultTimeOfDay,
  noteKeys,
} from "./mock";

type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  vendor: string;
  tags: string[];
  featuredImage?: { url: string; altText?: string | null } | null;
  images?: { nodes: { url: string; altText?: string | null }[] };
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  variants: {
    nodes: {
      id: string;
      title: string;
      availableForSale: boolean;
      quantityAvailable?: number | null;
      price: Money;
      compareAtPrice?: Money | null;
      image?: { url: string; altText?: string | null } | null;
    }[];
  };
};

const storeVendors = new Set(["мой магазин", "my store"]);

export function brandFromVendor(vendor: string) {
  const name = vendor.trim();
  if (!name || storeVendors.has(name.toLowerCase())) return "";
  return name;
}

function genderFromTags(tags: string[]): Product["gender"] {
  const lower = tags.map((t) => t.toLowerCase());
  if (lower.includes("men") || lower.includes("male")) return "men";
  if (lower.includes("women") || lower.includes("female")) return "women";
  if (lower.includes("unisex")) return "unisex";
  return "all";
}

function bareTag(tag: string) {
  return tag.trim().toLowerCase().replace(/^note:/, "").replace(/:\d{1,3}$/, "");
}

function notesFromTags(tags: string[]): string[] {
  const lower = tags.map(bareTag);
  return noteKeys.filter((note) => lower.includes(note));
}

const systemTags = new Set(["men", "male", "women", "female", "unisex", "bestseller", "best-seller", "new", "sale"]);
const accordNames = new Set<string>([...noteKeys, "amber", "balsamic", "smoky", "warm spicy", "oud"]);

function accordsFromTags(tags: string[]) {
  const found: { name: string; level: number | null }[] = [];
  for (const tag of tags) {
    const raw = tag.trim().toLowerCase();
    const named = raw.startsWith("accord:") ? raw.slice("accord:".length).trim() : raw;
    const levelMatch = named.match(/^(.*):(\d{1,3})$/);
    const name = (levelMatch ? levelMatch[1] : named).trim().replace(/-/g, " ");
    const level = levelMatch ? Math.min(100, Math.max(12, Number(levelMatch[2]))) : null;
    if (!name || systemTags.has(name)) continue;
    if (!raw.startsWith("accord:") && !accordNames.has(name)) continue;
    const existing = found.find((item) => item.name === name);
    if (existing) {
      if (level !== null) existing.level = level;
      continue;
    }
    found.push({ name, level });
  }
  return found;
}

function statsFromTags(tags: string[], prefix: string, defaults: StatBar[]): StatBar[] {
  const values = new Map<string, number>();
  for (const tag of tags) {
    const parts = tag.split(":").map((part) => part.trim());
    if (parts.length < 3 || parts[0].toLowerCase() !== prefix) continue;
    const name = parts.slice(1, -1).join(" ").toLowerCase().replace(/-/g, " ");
    const level = Number(parts[parts.length - 1]);
    if (!name || !Number.isFinite(level)) continue;
    values.set(name, Math.min(100, Math.max(0, Math.round(level))));
  }
  if (!values.size) return defaults;
  return defaults.map((item) => ({
    ...item,
    value: values.get(item.label.toLowerCase()) ?? item.value,
  }));
}

export function mapProduct(p: ShopifyProduct): Product {
  const tags = p.tags ?? [];
  const images = (p.images?.nodes?.length
    ? p.images.nodes
    : p.featuredImage
      ? [p.featuredImage]
      : []
  ).map((img) => ({ url: img.url, alt: img.altText || p.title }));

  const lower = tags.map((t) => t.toLowerCase());
  const discounts = p.variants.nodes
    .map((variant) => (variant.compareAtPrice?.amount ? discountPercent(variant.price, variant.compareAtPrice) : null))
    .filter((percent): percent is number => percent != null && percent > 0);
  const maxDiscount = discounts.length ? Math.max(...discounts) : 0;

  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    brand: brandFromVendor(p.vendor),
    description: p.description || "",
    tags,
    gender: genderFromTags(tags),
    notes: notesFromTags(tags),
    accords: accordsFromTags(tags),
    images,
    variants: p.variants.nodes.map((v) => ({
      id: v.id,
      title: v.title,
      available: v.availableForSale,
      quantity: typeof v.quantityAvailable === "number" ? v.quantityAvailable : null,
      price: v.price,
      compareAtPrice: v.compareAtPrice?.amount ? v.compareAtPrice : null,
      image: v.image?.url ? { url: v.image.url, alt: v.image.altText || v.title } : null,
    })),
    minPrice: p.priceRange.minVariantPrice,
    maxPrice: p.priceRange.maxVariantPrice,
    rating: 5,
    reviewCount: 0,
    featured: lower.includes("bestseller") || lower.includes("best-seller"),
    isNew: lower.includes("new"),
    onSale: maxDiscount > 0 || lower.includes("sale"),
    discountLabel: maxDiscount > 0 ? `-${maxDiscount}%` : lower.includes("sale") ? "10%+" : undefined,
    longevity: statsFromTags(tags, "longevity", defaultLongevity),
    season: statsFromTags(tags, "season", defaultSeason),
    sillage: statsFromTags(tags, "sillage", defaultSillage),
    timeOfDay: statsFromTags(tags, "time", defaultTimeOfDay),
  };
}

import type { Money, Product } from "../types";
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
      price: Money;
    }[];
  };
};

function genderFromTags(tags: string[]): Product["gender"] {
  const lower = tags.map((t) => t.toLowerCase());
  if (lower.includes("men") || lower.includes("male")) return "men";
  if (lower.includes("women") || lower.includes("female")) return "women";
  if (lower.includes("unisex")) return "unisex";
  return "all";
}

function notesFromTags(tags: string[]): string[] {
  const lower = tags.map((t) => t.toLowerCase().replace(/^note:/, ""));
  return noteKeys.filter((note) => lower.includes(note));
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

  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    brand: p.vendor || "Scentoria",
    description: p.description || "",
    tags,
    gender: genderFromTags(tags),
    notes: notesFromTags(tags),
    accords: notesFromTags(tags),
    images,
    variants: p.variants.nodes.map((v) => ({
      id: v.id,
      title: v.title,
      available: v.availableForSale,
      price: v.price,
    })),
    minPrice: p.priceRange.minVariantPrice,
    maxPrice: p.priceRange.maxVariantPrice,
    rating: 5,
    reviewCount: 0,
    featured: lower.includes("bestseller") || lower.includes("best-seller"),
    isNew: lower.includes("new"),
    onSale: lower.includes("sale"),
    discountLabel: lower.includes("sale") ? "10%+" : undefined,
    longevity: defaultLongevity,
    season: defaultSeason,
    sillage: defaultSillage,
    timeOfDay: defaultTimeOfDay,
  };
}

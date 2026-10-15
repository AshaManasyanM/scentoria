export type Locale = "en" | "hy";

export type Money = {
  amount: string;
  currencyCode: string;
};

export type ProductVariant = {
  id: string;
  title: string;
  available: boolean;
  quantity: number | null;
  price: Money;
  compareAtPrice?: Money | null;
  image?: { url: string; alt: string } | null;
};

export type StatBar = {
  label: string;
  value: number;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  brand: string;
  description: string;
  tags: string[];
  gender: "men" | "women" | "unisex" | "all";
  notes: string[];
  accords: { name: string; level: number | null }[];
  images: { url: string; alt: string }[];
  variants: ProductVariant[];
  minPrice: Money;
  maxPrice: Money;
  rating: number;
  reviewCount: number;
  featured: boolean;
  isNew: boolean;
  onSale: boolean;
  discountLabel?: string;
  longevity: StatBar[];
  season: StatBar[];
  sillage: StatBar[];
  timeOfDay: StatBar[];
};

export type Testimonial = {
  name: string;
  product: string;
  text: string;
  date: string;
};

export type CartLine = {
  id: string;
  merchandiseId: string;
  handle: string;
  title: string;
  brand: string;
  variantTitle: string;
  image?: string;
  quantity: number;
  price: Money;
  compareAtPrice?: Money | null;
};

export type Cart = {
  id: string | null;
  checkoutUrl: string | null;
  lines: CartLine[];
};

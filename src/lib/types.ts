export type Locale = "en" | "hy";

export type Money = {
  amount: string;
  currencyCode: string;
};

export type ProductVariant = {
  id: string;
  title: string;
  available: boolean;
  price: Money;
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
  images: { url: string; alt: string }[];
  variants: ProductVariant[];
  minPrice: Money;
  maxPrice: Money;
  rating: number;
  reviewCount: number;
  featured: boolean;
  isNew: boolean;
  onSale: boolean;
};

export type Article = {
  handle: string;
  title: string;
  excerpt: string;
  date: string;
  image?: string;
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
  variantTitle: string;
  image?: string;
  quantity: number;
  price: Money;
};

export type Cart = {
  id: string | null;
  checkoutUrl: string | null;
  lines: CartLine[];
};

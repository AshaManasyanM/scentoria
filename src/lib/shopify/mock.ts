import type { Article, Product, StatBar, Testimonial } from "../types";

export const defaultLongevity: StatBar[] = [
  { label: "Weak", value: 5 },
  { label: "Moderate", value: 45 },
  { label: "Long lasting", value: 40 },
  { label: "Eternal", value: 10 },
];

export const defaultSeason: StatBar[] = [
  { label: "Winter", value: 20 },
  { label: "Spring", value: 25 },
  { label: "Summer", value: 25 },
  { label: "Autumn", value: 30 },
];

export const defaultSillage: StatBar[] = [
  { label: "Intimate", value: 10 },
  { label: "Moderate", value: 45 },
  { label: "Strong", value: 40 },
  { label: "Enormous", value: 5 },
];

export const defaultTimeOfDay: StatBar[] = [
  { label: "Day", value: 55 },
  { label: "Night", value: 45 },
];

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

function money(amount: string): Product["minPrice"] {
  return { amount, currencyCode: "AMD" };
}

function variant(
  id: string,
  title: string,
  amount: string,
): Product["variants"][number] {
  return {
    id,
    title,
    available: true,
    price: money(amount),
  };
}

function profile(notes: string[], accords?: string[]) {
  return {
    notes,
    accords: accords ?? notes,
    longevity: defaultLongevity,
    season: defaultSeason,
    sillage: defaultSillage,
    timeOfDay: defaultTimeOfDay,
  };
}

export const mockProducts: Product[] = [
  {
    id: "1",
    handle: "velvet-ember",
    title: "Velvet Ember",
    brand: "Maison Sillage",
    description:
      "A warm oriental with smoked woods, saffron, and a soft amber dry-down. Built for evening wear and cold air.",
    tags: ["women", "oriental", "vanilla", "bestseller"],
    gender: "women",
    ...profile(["oriental", "vanilla", "woody"], ["amber", "woody", "saffron", "vanilla"]),
    images: [
      { url: img("photo-1541643600914-78b084683601"), alt: "Velvet Ember" },
      { url: img("photo-1594035910387-fea47794261f"), alt: "Velvet Ember bottle" },
    ],
    variants: [
      variant("gid://shopify/ProductVariant/sample-1a", "10 ml decant", "11400"),
      variant("gid://shopify/ProductVariant/sample-1b", "100 ml", "130500"),
    ],
    minPrice: money("11400"),
    maxPrice: money("130500"),
    rating: 4.8,
    reviewCount: 8,
    featured: true,
    isNew: false,
    onSale: false,
  },
  {
    id: "2",
    handle: "ombre-grove",
    title: "Ombre Grove",
    brand: "Atelier Nocturne",
    description:
      "Leather, incense, and dark woods. A unisex signature with serious projection.",
    tags: ["unisex", "leather", "woody", "bestseller"],
    gender: "unisex",
    ...profile(["leather", "woody"], ["leather", "incense", "wood", "oud"]),
    images: [{ url: img("photo-1594035910387-fea47794261f"), alt: "Ombre Grove" }],
    variants: [
      variant("gid://shopify/ProductVariant/sample-2a", "5 ml decant", "18000"),
      variant("gid://shopify/ProductVariant/sample-2b", "75 ml", "209000"),
    ],
    minPrice: money("18000"),
    maxPrice: money("209000"),
    rating: 4.7,
    reviewCount: 7,
    featured: true,
    isNew: false,
    onSale: false,
  },
  {
    id: "3",
    handle: "citrus-veil",
    title: "Citrus Veil",
    brand: "Lumière",
    description: "Bright bergamot, neroli, and white musk. A clean daily scent for warm weather.",
    tags: ["women", "citrus", "floral", "new"],
    gender: "women",
    ...profile(["citrus", "floral"], ["citrus", "neroli", "musk", "floral"]),
    images: [{ url: img("photo-1615634260167-c8cdede054de"), alt: "Citrus Veil" }],
    variants: [
      variant("gid://shopify/ProductVariant/sample-3a", "10 ml decant", "11400"),
      variant("gid://shopify/ProductVariant/sample-3b", "50 ml", "153000"),
    ],
    minPrice: money("11400"),
    maxPrice: money("153000"),
    rating: 4.6,
    reviewCount: 6,
    featured: true,
    isNew: true,
    onSale: false,
  },
  {
    id: "4",
    handle: "red-tobacco-night",
    title: "Red Tobacco Night",
    brand: "Casa Fumo",
    description: "Sweet tobacco, spices, and a hint of vanilla. Bold and long-lasting.",
    tags: ["men", "tobacco", "spicy", "bestseller", "sale"],
    gender: "men",
    ...profile(["tobacco", "spicy", "vanilla"], ["tobacco", "spicy", "vanilla", "amber"]),
    images: [{ url: img("photo-1592945403244-b3fbafd7f539"), alt: "Red Tobacco Night" }],
    variants: [
      variant("gid://shopify/ProductVariant/sample-4a", "10 ml decant", "5400"),
      variant("gid://shopify/ProductVariant/sample-4b", "100 ml", "55250"),
    ],
    minPrice: money("5400"),
    maxPrice: money("55250"),
    rating: 4.5,
    reviewCount: 6,
    featured: true,
    isNew: false,
    onSale: true,
    discountLabel: "10–15%",
  },
  {
    id: "5",
    handle: "atlantic-pine",
    title: "Atlantic Pine",
    brand: "North Cape",
    description: "Crisp pine, sea air, and vetiver. Fresh, green, and quietly expensive.",
    tags: ["men", "woody", "aquatic", "bestseller"],
    gender: "men",
    ...profile(["woody", "aquatic"], ["aquatic", "woody", "ozonic", "green"]),
    images: [{ url: img("photo-1585386959984-a4155224a1ad"), alt: "Atlantic Pine" }],
    variants: [
      variant("gid://shopify/ProductVariant/sample-5a", "10 ml decant", "12000"),
      variant("gid://shopify/ProductVariant/sample-5b", "100 ml", "152000"),
    ],
    minPrice: money("12000"),
    maxPrice: money("152000"),
    rating: 4.4,
    reviewCount: 5,
    featured: true,
    isNew: false,
    onSale: false,
  },
  {
    id: "6",
    handle: "love-hibiscus",
    title: "Love Hibiscus",
    brand: "Jardin Rose",
    description: "Tropical hibiscus, peony, and a creamy sandalwood base.",
    tags: ["women", "floral", "fruity", "sweet", "new"],
    gender: "women",
    ...profile(["floral", "fruity", "sweet"], ["floral", "fruity", "sweet", "powdery"]),
    images: [{ url: img("photo-1563170351-be82bc888aa4"), alt: "Love Hibiscus" }],
    variants: [variant("gid://shopify/ProductVariant/sample-6a", "100 ml", "216000")],
    minPrice: money("216000"),
    maxPrice: money("216000"),
    rating: 4.9,
    reviewCount: 7,
    featured: false,
    isNew: true,
    onSale: false,
  },
  {
    id: "7",
    handle: "stellar-times",
    title: "Stellar Times",
    brand: "Atelier Nocturne",
    description: "Sparkling aldehydes, iris, and warm amber. A celestial floral.",
    tags: ["unisex", "floral", "oriental", "new"],
    gender: "unisex",
    ...profile(["floral", "oriental"], ["floral", "iris", "amber", "aldehydic"]),
    images: [{ url: img("photo-1523293182086-7651a12378bb"), alt: "Stellar Times" }],
    variants: [variant("gid://shopify/ProductVariant/sample-7a", "75 ml", "332500")],
    minPrice: money("332500"),
    maxPrice: money("332500"),
    rating: 4.5,
    reviewCount: 5,
    featured: false,
    isNew: true,
    onSale: false,
  },
  {
    id: "8",
    handle: "alive-absolu",
    title: "Alive Absolu",
    brand: "Lumière",
    description: "A richer take on a fresh floral, now with extra depth in the base.",
    tags: ["women", "floral", "sale"],
    gender: "women",
    ...profile(["floral"], ["floral", "fresh", "musk"]),
    images: [{ url: img("photo-1590735213920-68192a487bc2"), alt: "Alive Absolu" }],
    variants: [
      variant("gid://shopify/ProductVariant/sample-8a", "50 ml", "60300"),
      variant("gid://shopify/ProductVariant/sample-8b", "100 ml", "72250"),
    ],
    minPrice: money("60300"),
    maxPrice: money("72250"),
    rating: 4.2,
    reviewCount: 2,
    featured: false,
    isNew: false,
    onSale: true,
    discountLabel: "10%+",
  },
];

export const mockArticles: Article[] = [
  {
    handle: "summer-hits-2026",
    title: "Summer perfume hits: fragrances defining the season",
    excerpt:
      "Fresh, clean, and luminous compositions for heat, travel, and long evenings. Our edit of the scents people keep reaching for.",
    date: "2026-07-24",
    image: img("photo-1490481651871-ab68de25d43d"),
    body: "Summer is the season of lightness, travel, and unforgettable moments. During the warmer months, fragrances reveal their character in a unique way, making the choice of perfume more important than ever.\n\nFresh citrus, clean musks, and airy florals take center stage. We recommend starting with a 5 or 10 ml decant so you can live with a scent in heat before you commit to a full bottle.",
  },
  {
    handle: "long-lasting-womens",
    title: "Long-lasting women's perfumes with real sillage",
    excerpt:
      "High concentration, rich bases, and projection that lasts from morning coffee to midnight.",
    date: "2026-04-20",
    body: "If you want a fragrance that lasts, look at concentration (EDP and extrait), a rich base of woods, amber, or musk, and how it behaves on your skin. Decants are the honest way to test longevity before buying a full bottle at Scentoria.",
  },
  {
    handle: "mens-compliments",
    title: "Men's fragrances that actually get compliments",
    excerpt: "Everyday wear, dates, and formal nights — what works in 2026.",
    date: "2026-03-26",
    body: "Compliment-getting scents are rarely the loudest. Fresh woods, polished tobacco, and clean citrus with a warm dry-down tend to work for daily wear, dates, and evenings. Try a decant, then choose the size that fits how often you wear it.",
  },
];

export const mockTestimonials: Testimonial[] = [
  {
    name: "Anna K.",
    product: "Velvet Ember",
    text: "Arrived quickly, beautifully packed, and the scent is exactly as described. Already ordering a full bottle.",
    date: "2026-07-26",
  },
  {
    name: "David M.",
    product: "Atlantic Pine",
    text: "Finally a shop that explains notes clearly. The 10 ml decant was the perfect way to test before committing.",
    date: "2026-07-16",
  },
  {
    name: "Mariam S.",
    product: "Love Hibiscus",
    text: "Soft, floral, and so elegant. Scentoria’s recommendations were spot on.",
    date: "2026-07-16",
  },
];

export const noteKeys = [
  "floral",
  "woody",
  "tobacco",
  "vanilla",
  "spicy",
  "citrus",
  "leather",
  "oriental",
  "aquatic",
  "sweet",
  "fruity",
] as const;

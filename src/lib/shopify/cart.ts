import { browserCookieOptions } from "@/lib/security";
import { cookies } from "next/headers";
import type { Cart, CartLine, Money } from "../types";
import { hasStorefrontToken } from "./config";
import { storefrontFetch } from "./fetch";
import { CART_CREATE, CART_LINES_ADD, CART_LINES_UPDATE, CART_QUERY } from "./queries";
import { getCatalog } from "./catalog";
import { brandFromVendor } from "./map";

const CART_COOKIE = "scentoria_cart_id";
const LOCAL_COOKIE = "scentoria_local_cart";
const QTY_COOKIE = "scentoria_cart_qty";

type LocalLine = {
  merchandiseId: string;
  quantity: number;
};

async function readLocal(): Promise<LocalLine[]> {
  const jar = await cookies();
  const raw = jar.get(LOCAL_COOKIE)?.value;
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LocalLine[];
  } catch {
    return [];
  }
}

async function writeLocal(lines: LocalLine[]) {
  const jar = await cookies();
  jar.set(LOCAL_COOKIE, JSON.stringify(lines), browserCookieOptions(false));
}

async function readDesired(): Promise<Record<string, number>> {
  const raw = (await cookies()).get(QTY_COOKIE)?.value;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

async function writeDesired(quantities: Record<string, number>) {
  const jar = await cookies();
  jar.set(QTY_COOKIE, JSON.stringify(quantities), browserCookieOptions(true));
}

async function localCart(): Promise<Cart> {
  const { products } = await getCatalog();
  const stored = await readLocal();
  const lines: CartLine[] = [];
  for (const item of stored) {
    const product = products.find((p) => p.variants.some((v) => v.id === item.merchandiseId));
    const variant = product?.variants.find((v) => v.id === item.merchandiseId);
    if (!product || !variant) continue;
    lines.push({
      id: item.merchandiseId,
      merchandiseId: item.merchandiseId,
      handle: product.handle,
      title: product.title,
      brand: product.brand,
      variantTitle: variant.title,
      image: variant.image?.url || product.images[0]?.url,
      quantity: item.quantity,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
    });
  }
  return { id: "local", checkoutUrl: null, lines };
}

export async function getCart(): Promise<Cart> {
  if (!hasStorefrontToken()) return localCart();

  const jar = await cookies();
  const id = jar.get(CART_COOKIE)?.value;
  if (!id) return { id: null, checkoutUrl: null, lines: [] };

  const data = await storefrontFetch<{
    cart: {
      id: string;
      checkoutUrl: string;
      lines: {
        nodes: {
          id: string;
          quantity: number;
          merchandise: {
            id: string;
            title: string;
            price: Money;
            compareAtPrice?: Money | null;
            product: { title: string; handle: string; vendor: string; featuredImage?: { url: string } | null };
          };
        }[];
      };
    } | null;
  }>(CART_QUERY, { id }, { fresh: true });

  if (!data?.cart) return { id: null, checkoutUrl: null, lines: [] };

  const desired = await readDesired();
  return {
    id: data.cart.id,
    checkoutUrl: data.cart.checkoutUrl,
    lines: data.cart.lines.nodes.flatMap((line) => {
      const quantity = line.quantity > 0 ? line.quantity : desired[line.merchandise.id] ?? 0;
      if (quantity <= 0) return [];
      return [{
        id: line.id,
        merchandiseId: line.merchandise.id,
        handle: line.merchandise.product.handle,
        title: line.merchandise.product.title,
        brand: brandFromVendor(line.merchandise.product.vendor),
        variantTitle: line.merchandise.title,
        image: line.merchandise.product.featuredImage?.url,
        quantity,
        price: line.merchandise.price,
        compareAtPrice: line.merchandise.compareAtPrice?.amount ? line.merchandise.compareAtPrice : null,
      }];
    }),
  };
}

export async function addLine(merchandiseId: string, quantity: number): Promise<Cart> {
  if (!hasStorefrontToken()) {
    const stored = await readLocal();
    const existing = stored.find((l) => l.merchandiseId === merchandiseId);
    if (existing) existing.quantity += quantity;
    else stored.push({ merchandiseId, quantity });
    await writeLocal(stored);
    return localCart();
  }

  const desired = await readDesired();
  desired[merchandiseId] = (desired[merchandiseId] ?? 0) + quantity;
  await writeDesired(desired);

  const jar = await cookies();
  let cartId = jar.get(CART_COOKIE)?.value;
  const lines = [{ merchandiseId, quantity }];

  if (!cartId) {
    const created = await storefrontFetch<{
      cartCreate: { cart: { id: string } | null };
    }>(CART_CREATE, { lines }, { fresh: true });
    cartId = created?.cartCreate.cart?.id;
    if (cartId) jar.set(CART_COOKIE, cartId, browserCookieOptions(true));
  } else {
    await storefrontFetch(CART_LINES_ADD, { cartId, lines }, { fresh: true });
  }
  return getCart();
}

export async function setLineQuantity(lineId: string, quantity: number): Promise<Cart> {
  if (!hasStorefrontToken()) {
    const stored = await readLocal();
    const next =
      quantity <= 0
        ? stored.filter((l) => l.merchandiseId !== lineId)
        : stored.map((l) =>
            l.merchandiseId === lineId ? { ...l, quantity } : l,
          );
    await writeLocal(next);
    return localCart();
  }
  const current = await getCart();
  const line = current.lines.find((item) => item.id === lineId);
  if (line) {
    const desired = await readDesired();
    if (quantity <= 0) delete desired[line.merchandiseId];
    else desired[line.merchandiseId] = quantity;
    await writeDesired(desired);
  }
  const jar = await cookies();
  const cartId = jar.get(CART_COOKIE)?.value;
  if (!cartId) return getCart();
  await storefrontFetch(CART_LINES_UPDATE, {
    cartId,
    lines: [{ id: lineId, quantity }],
  }, { fresh: true });
  return getCart();
}

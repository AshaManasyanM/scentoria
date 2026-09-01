import { cookies } from "next/headers";
import type { Cart, CartLine, Money } from "../types";
import { hasStorefrontToken } from "./config";
import { storefrontFetch } from "./fetch";
import { CART_CREATE, CART_LINES_ADD, CART_QUERY } from "./queries";
import { getCatalog } from "./catalog";

const CART_COOKIE = "scentoria_cart_id";
const LOCAL_COOKIE = "scentoria_local_cart";

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
  jar.set(LOCAL_COOKIE, JSON.stringify(lines), { path: "/", httpOnly: false });
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
      variantTitle: variant.title,
      image: product.images[0]?.url,
      quantity: item.quantity,
      price: variant.price,
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
            product: { title: string; handle: string; featuredImage?: { url: string } | null };
          };
        }[];
      };
    } | null;
  }>(CART_QUERY, { id });

  if (!data?.cart) return { id: null, checkoutUrl: null, lines: [] };

  return {
    id: data.cart.id,
    checkoutUrl: data.cart.checkoutUrl,
    lines: data.cart.lines.nodes.map((line) => ({
      id: line.id,
      merchandiseId: line.merchandise.id,
      handle: line.merchandise.product.handle,
      title: line.merchandise.product.title,
      variantTitle: line.merchandise.title,
      image: line.merchandise.product.featuredImage?.url,
      quantity: line.quantity,
      price: line.merchandise.price,
    })),
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

  const jar = await cookies();
  let cartId = jar.get(CART_COOKIE)?.value;
  const lines = [{ merchandiseId, quantity }];

  if (!cartId) {
    const created = await storefrontFetch<{
      cartCreate: { cart: { id: string } | null };
    }>(CART_CREATE, { lines });
    cartId = created?.cartCreate.cart?.id;
    if (cartId) jar.set(CART_COOKIE, cartId, { path: "/", httpOnly: true });
  } else {
    await storefrontFetch(CART_LINES_ADD, { cartId, lines });
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
  return getCart();
}

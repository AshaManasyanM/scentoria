import { browserCookieOptions } from "@/lib/security";
import { cookies } from "next/headers";
import type { Cart, CartLine, Money } from "../types";
import { hasStorefrontToken } from "./config";
import { storefrontFetch } from "./fetch";
import {
  CART_CREATE,
  CART_DISCOUNT_CODES_UPDATE,
  CART_LINES_ADD,
  CART_LINES_UPDATE,
  CART_QUERY,
} from "./queries";
import { getCatalog } from "./catalog";
import { brandFromVendor } from "./map";

const CART_COOKIE = "scentoria_cart_id";
const LOCAL_COOKIE = "scentoria_local_cart";
const QTY_COOKIE = "scentoria_cart_qty";
const PROMO_COOKIE = "scentoria_promo_code";

export const BOTTLE_COLOR_ATTR = "Bottle color";
export const RANDOM_BOTTLE_COLOR = "random";
export const WELCOME_DISCOUNT_CODE = (process.env.NEXT_PUBLIC_SUBSCRIBE_DISCOUNT_CODE || "WELCOME10").trim();
export const WELCOME_DISCOUNT_PERCENT = Math.min(
  100,
  Math.max(0, Number(process.env.NEXT_PUBLIC_SUBSCRIBE_DISCOUNT_PERCENT || "10") || 10),
);

type LocalLine = {
  merchandiseId: string;
  quantity: number;
  bottleColor?: string;
};

function lineAttributes(bottleColor?: string) {
  const value = bottleColor?.trim();
  if (!value) return [];
  return [{ key: BOTTLE_COLOR_ATTR, value }];
}

function attributeColor(attributes?: { key: string; value: string }[] | null) {
  return attributes?.find((item) => item.key === BOTTLE_COLOR_ATTR)?.value?.trim() || undefined;
}

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

async function readPromoCode() {
  return ((await cookies()).get(PROMO_COOKIE)?.value || "").trim();
}

async function writePromoCode(code: string) {
  const jar = await cookies();
  if (!code) {
    jar.delete(PROMO_COOKIE);
    return;
  }
  jar.set(PROMO_COOKIE, code, browserCookieOptions(true));
}

function moneyOf(amount: number, currencyCode: string): Money {
  return { amount: String(Math.round(amount * 100) / 100), currencyCode };
}

function sumDiscount(allocations?: { discountedAmount: Money }[] | null) {
  if (!allocations?.length) return null;
  const currency = allocations[0]?.discountedAmount.currencyCode || "USD";
  const total = allocations.reduce((sum, item) => sum + Number(item.discountedAmount.amount || 0), 0);
  if (!(total > 0)) return null;
  return moneyOf(total, currency);
}

function withLocalPromo(cart: Cart, code: string): Cart {
  const normalized = code.trim();
  if (!normalized || !cart.lines.length) {
    return {
      ...cart,
      discountCodes: normalized ? [{ code: normalized, applicable: false }] : [],
      discountAmount: null,
      subtotal: null,
      total: null,
    };
  }
  const currency = cart.lines[0]?.price.currencyCode || "USD";
  const subtotal = cart.lines.reduce((sum, line) => sum + Number(line.price.amount) * line.quantity, 0);
  const welcome = normalized.toUpperCase() === WELCOME_DISCOUNT_CODE.toUpperCase();
  if (!welcome || !(WELCOME_DISCOUNT_PERCENT > 0)) {
    return {
      ...cart,
      discountCodes: [{ code: normalized, applicable: false }],
      discountAmount: null,
      subtotal: moneyOf(subtotal, currency),
      total: moneyOf(subtotal, currency),
    };
  }
  const discountAmount = (subtotal * WELCOME_DISCOUNT_PERCENT) / 100;
  return {
    ...cart,
    discountCodes: [{ code: normalized, applicable: true }],
    discountAmount: moneyOf(discountAmount, currency),
    subtotal: moneyOf(subtotal, currency),
    total: moneyOf(Math.max(0, subtotal - discountAmount), currency),
  };
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
      id: item.bottleColor ? `${item.merchandiseId}::${item.bottleColor}` : item.merchandiseId,
      merchandiseId: item.merchandiseId,
      handle: product.handle,
      title: product.title,
      brand: product.brand,
      variantTitle: variant.title,
      bottleColor: item.bottleColor,
      image: variant.image?.url || product.images[0]?.url,
      quantity: item.quantity,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
    });
  }
  const promo = await readPromoCode();
  return withLocalPromo({ id: "local", checkoutUrl: null, lines }, promo);
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
      discountCodes?: { code: string; applicable: boolean }[];
      cost?: {
        subtotalAmount?: Money | null;
        totalAmount?: Money | null;
      } | null;
      discountAllocations?: { discountedAmount: Money }[] | null;
      lines: {
        nodes: {
          id: string;
          quantity: number;
          attributes?: { key: string; value: string }[] | null;
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
  const mapped: Cart = {
    id: data.cart.id,
    checkoutUrl: data.cart.checkoutUrl,
    discountCodes: data.cart.discountCodes ?? [],
    subtotal: data.cart.cost?.subtotalAmount ?? null,
    total: data.cart.cost?.totalAmount ?? null,
    discountAmount: sumDiscount(data.cart.discountAllocations),
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
        bottleColor: attributeColor(line.attributes),
        image: line.merchandise.product.featuredImage?.url,
        quantity,
        price: line.merchandise.price,
        compareAtPrice: line.merchandise.compareAtPrice?.amount ? line.merchandise.compareAtPrice : null,
      }];
    }),
  };
  const promo = await readPromoCode();
  if (mapped.discountAmount || mapped.discountCodes?.some((item) => item.applicable)) return mapped;
  return withLocalPromo(mapped, promo || mapped.discountCodes?.[0]?.code || "");
}

export async function addLine(merchandiseId: string, quantity: number, bottleColor?: string): Promise<Cart> {
  const color = bottleColor?.trim() || undefined;
  if (!hasStorefrontToken()) {
    const stored = await readLocal();
    const existing = stored.find(
      (l) => l.merchandiseId === merchandiseId && (l.bottleColor || undefined) === color,
    );
    if (existing) existing.quantity += quantity;
    else stored.push({ merchandiseId, quantity, bottleColor: color });
    await writeLocal(stored);
    return localCart();
  }

  const desired = await readDesired();
  desired[merchandiseId] = (desired[merchandiseId] ?? 0) + quantity;
  await writeDesired(desired);

  const jar = await cookies();
  let cartId = jar.get(CART_COOKIE)?.value;
  const attributes = lineAttributes(color);
  const lines = [{ merchandiseId, quantity, ...(attributes.length ? { attributes } : {}) }];

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
        ? stored.filter((l) => {
            const id = l.bottleColor ? `${l.merchandiseId}::${l.bottleColor}` : l.merchandiseId;
            return id !== lineId;
          })
        : stored.map((l) => {
            const id = l.bottleColor ? `${l.merchandiseId}::${l.bottleColor}` : l.merchandiseId;
            return id === lineId ? { ...l, quantity } : l;
          });
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

export async function applyDiscountCode(code: string): Promise<{ cart: Cart; ok: boolean; message?: string }> {
  const normalized = code.trim();
  await writePromoCode(normalized);

  if (!hasStorefrontToken()) {
    const cart = await localCart();
    const applicable = Boolean(cart.discountCodes?.some((item) => item.applicable));
    return {
      cart,
      ok: applicable || !normalized,
      message: applicable || !normalized ? undefined : "invalid",
    };
  }

  const jar = await cookies();
  const cartId = jar.get(CART_COOKIE)?.value;
  if (!cartId) {
    const cart = await getCart();
    return { cart, ok: false, message: "empty" };
  }

  const codes = normalized ? [normalized] : [];
  const data = await storefrontFetch<{
    cartDiscountCodesUpdate: {
      cart: {
        id: string;
        checkoutUrl: string;
        discountCodes?: { code: string; applicable: boolean }[];
        cost?: { subtotalAmount?: Money | null; totalAmount?: Money | null } | null;
        discountAllocations?: { discountedAmount: Money }[] | null;
      } | null;
      userErrors: { message: string }[];
    };
  }>(CART_DISCOUNT_CODES_UPDATE, { cartId, discountCodes: codes }, { fresh: true });

  const errors = data?.cartDiscountCodesUpdate.userErrors ?? [];
  const updated = data?.cartDiscountCodesUpdate.cart;
  const cart = await getCart();
  if (errors.length) return { cart, ok: false, message: errors[0]?.message || "invalid" };

  const applicable = Boolean(
    updated?.discountCodes?.some((item) => item.code.toLowerCase() === normalized.toLowerCase() && item.applicable) ||
      cart.discountCodes?.some((item) => item.code.toLowerCase() === normalized.toLowerCase() && item.applicable) ||
      (cart.discountAmount && Number(cart.discountAmount.amount) > 0),
  );

  if (normalized && !applicable) {
    // Fallback preview for the known welcome code if Shopify rejects until checkout.
    const preview = withLocalPromo(cart, normalized);
    if (preview.discountCodes?.some((item) => item.applicable)) {
      return { cart: preview, ok: true };
    }
    return { cart, ok: false, message: "invalid" };
  }

  return { cart, ok: true };
}

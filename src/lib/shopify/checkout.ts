import { cookies } from "next/headers";
import { isCountryCode } from "@/lib/countries";
import { customerShippingChoices, type ShippingChoice } from "@/lib/shipping-choices";
import { isUsState } from "@/lib/us-states";
import { storefrontFetch, storefrontFetchDeferred } from "./fetch";

const CART_COOKIE = "scentoria_cart_id";
const QTY_COOKIE = "scentoria_cart_qty";

export type DeliveryDraft = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address1: string;
  city: string;
  zip: string;
  countryCode: string;
  provinceCode?: string;
};

export type ShippingOption = ShippingChoice;

type CartNode = {
  id: string;
  checkoutUrl: string;
  lines: { nodes: { id: string; quantity: number; merchandise: { id: string } }[] };
  deliveryGroups?: {
    nodes: {
      id: string;
      deliveryOptions: { handle: string; title: string; estimatedCost: { amount: string; currencyCode: string } }[];
    }[];
  };
};

const CART_FIELDS = `
  id
  checkoutUrl
  lines(first: 50) {
    nodes {
      id
      quantity
      merchandise { ... on ProductVariant { id } }
    }
  }
  deliveryGroups(first: 5) {
    nodes {
      id
      deliveryOptions {
        handle
        title
        estimatedCost { amount currencyCode }
      }
    }
  }
`;

async function cartId() {
  return (await cookies()).get(CART_COOKIE)?.value ?? null;
}

async function desiredQuantities() {
  const raw = (await cookies()).get(QTY_COOKIE)?.value;
  if (!raw) return {} as Record<string, number>;
  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {} as Record<string, number>;
  }
}

async function loadCart(id: string) {
  const data = await storefrontFetch<{ cart: CartNode | null }>(
    `query Cart($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`,
    { id },
    { fresh: true },
  );
  return data?.cart ?? null;
}

function optionsFrom(cart: CartNode): Omit<ShippingOption, "kind">[] {
  const options: Omit<ShippingOption, "kind">[] = [];
  for (const group of cart.deliveryGroups?.nodes ?? []) {
    for (const option of group.deliveryOptions) {
      options.push({
        groupId: group.id,
        handle: option.handle,
        title: option.title,
        amount: option.estimatedCost.amount,
        currencyCode: option.estimatedCost.currencyCode,
      });
    }
  }
  return options.sort((a, b) => Number(a.amount) - Number(b.amount));
}

function shopifyPhone(phone: string, countryCode: string) {
  const compact = phone.replace(/[^\d+]/g, "");
  if (!compact) return null;
  if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact;
  if (countryCode === "US" && /^\d{10}$/.test(compact)) return `+1${compact}`;
  return null;
}

async function variantSellable(ids: string[]) {
  if (!ids.length) return false;
  const data = await storefrontFetch<{
    nodes: ({ availableForSale: boolean; quantityAvailable: number | null } | null)[];
  }>(
    `query VariantStock($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on ProductVariant { availableForSale quantityAvailable }
      }
    }`,
    { ids },
    { fresh: true },
  );
  return (data?.nodes ?? []).some((node) => node?.availableForSale && node.quantityAvailable !== 0);
}

async function loadRatedCart(id: string) {
  const data = await storefrontFetchDeferred<{ cart: CartNode | null }>(
    `query CartRates($id: ID!) {
      cart(id: $id) {
        id
        checkoutUrl
        ...CarrierRates @defer
      }
    }
    fragment CarrierRates on Cart {
      deliveryGroups(first: 10, withCarrierRates: true) {
        nodes {
          id
          deliveryOptions {
            handle
            title
            estimatedCost { amount currencyCode }
          }
        }
      }
    }`,
    { id },
  );
  return data?.cart ?? null;
}

async function pushQuantities(id: string, cart: CartNode) {
  const desired = await desiredQuantities();
  const present = new Set(cart.lines.nodes.map((line) => line.merchandise.id));
  const updates: { id: string; quantity: number }[] = [];
  const dead: string[] = [];
  const adds: { merchandiseId: string; quantity: number }[] = [];

  for (const line of cart.lines.nodes) {
    const wanted = Math.max(line.quantity, desired[line.merchandise.id] ?? 0);
    if (wanted <= 0) continue;
    if (line.quantity <= 0) {
      dead.push(line.id);
      adds.push({ merchandiseId: line.merchandise.id, quantity: wanted });
    } else if (line.quantity !== wanted) {
      updates.push({ id: line.id, quantity: wanted });
    }
  }
  for (const [merchandiseId, quantity] of Object.entries(desired)) {
    if (quantity > 0 && !present.has(merchandiseId)) adds.push({ merchandiseId, quantity });
  }

  if (updates.length) {
    await storefrontFetch(
      `mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart { id }
          userErrors { message }
        }
      }`,
      { cartId: id, lines: updates },
      { fresh: true },
    );
  }
  if (dead.length) {
    await storefrontFetch(
      `mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart { id }
          userErrors { message }
        }
      }`,
      { cartId: id, lineIds: dead },
      { fresh: true },
    );
  }
  if (adds.length) {
    await storefrontFetch(
      `mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart { id }
          userErrors { message }
        }
      }`,
      { cartId: id, lines: adds },
      { fresh: true },
    );
  }
  if (!updates.length && !dead.length && !adds.length) return cart;
  return (await loadCart(id)) ?? cart;
}

export async function saveDelivery(input: DeliveryDraft) {
  const id = await cartId();
  const countryCode = input.countryCode.toUpperCase();
  const provinceCode = input.provinceCode?.trim().toUpperCase() ?? "";
  if (!id || !isCountryCode(countryCode)) return { ok: false as const, error: "save" as const };
  if (!input.email.includes("@") || !input.firstName.trim() || !input.lastName.trim() || !input.address1.trim() || !input.city.trim()) {
    return { ok: false as const, error: "address" as const };
  }
  if (countryCode === "US" && !isUsState(provinceCode)) return { ok: false as const, error: "address" as const };

  const identity = await storefrontFetch<{
    cartBuyerIdentityUpdate: { userErrors: { message: string }[] };
  }>(
    `mutation CartBuyer($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
      cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
        userErrors { message }
      }
    }`,
    {
      cartId: id,
      buyerIdentity: {
        email: input.email.trim(),
        phone: shopifyPhone(input.phone, countryCode),
        countryCode,
      },
    },
    { fresh: true },
  );
  if (!identity || identity.cartBuyerIdentityUpdate.userErrors.length) {
    return { ok: false as const, error: "address" as const };
  }

  const address = {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone: shopifyPhone(input.phone, countryCode),
    address1: input.address1.trim(),
    city: input.city.trim(),
    zip: input.zip.trim() || null,
    countryCode,
    ...(provinceCode ? { provinceCode } : {}),
  };
  const saved = await storefrontFetch<{
    cartDeliveryAddressesReplace: { userErrors: { message: string }[]; warnings: { message: string }[] };
  }>(
    `mutation CartAddress($cartId: ID!, $addresses: [CartSelectableAddressInput!]!) {
      cartDeliveryAddressesReplace(cartId: $cartId, addresses: $addresses) {
        userErrors { message }
        warnings { message }
      }
    }`,
    {
      cartId: id,
      addresses: [{ selected: true, oneTimeUse: true, validationStrategy: "COUNTRY_CODE_ONLY", address: { deliveryAddress: address } }],
    },
    { fresh: true },
  );
  if (!saved || saved.cartDeliveryAddressesReplace.userErrors.length) {
    return { ok: false as const, error: "address" as const };
  }

  const current = await loadCart(id);
  if (!current) return { ok: false as const, error: "save" as const };
  const synced = await pushQuantities(id, current);
  if (!synced.lines.nodes.some((line) => line.quantity > 0)) {
    const ids = [...new Set([
      ...synced.lines.nodes.map((line) => line.merchandise.id),
      ...Object.keys(await desiredQuantities()),
    ])];
    return { ok: false as const, error: (await variantSellable(ids)) ? "market" as const : "stock" as const };
  }

  const next = await loadRatedCart(id);
  if (!next) return { ok: false as const, error: "save" as const };
  const options = customerShippingChoices(optionsFrom(next));
  const cheapest = options[0];
  if (!cheapest) return { ok: false as const, error: "shipping" as const };
  await selectShipping(cheapest.groupId, cheapest.handle);
  const latest = options[0] ? await loadCart(id) : next;
  return {
    ok: true as const,
    checkoutUrl: latest?.checkoutUrl ?? next.checkoutUrl,
    options,
  };
}

export async function selectShipping(groupId: string, handle: string) {
  const id = await cartId();
  if (!id || !groupId || !handle) return { ok: false as const, error: "shipping" as const };
  const data = await storefrontFetch<{
    cartSelectedDeliveryOptionsUpdate: { cart: { checkoutUrl: string } | null; userErrors: { message: string }[] };
  }>(
    `mutation CartShipping($cartId: ID!, $selectedDeliveryOptions: [CartSelectedDeliveryOptionInput!]!) {
      cartSelectedDeliveryOptionsUpdate(cartId: $cartId, selectedDeliveryOptions: $selectedDeliveryOptions) {
        cart { checkoutUrl }
        userErrors { message }
      }
    }`,
    { cartId: id, selectedDeliveryOptions: [{ deliveryGroupId: groupId, deliveryOptionHandle: handle }] },
    { fresh: true },
  );
  const payload = data?.cartSelectedDeliveryOptionsUpdate;
  if (!payload?.cart || payload.userErrors.length) return { ok: false as const, error: "shipping" as const };
  return { ok: true as const, checkoutUrl: payload.cart.checkoutUrl };
}

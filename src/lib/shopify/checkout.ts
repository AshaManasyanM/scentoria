import { cookies } from "next/headers";
import { costWithCalculatedTax, type CartCostQuote } from "@/lib/checkout-quote";
import { isCountryCode } from "@/lib/countries";
import { customerShippingChoices, type ShippingChoice, type ShippingSelection } from "@/lib/shipping-choices";
import { isUsState } from "@/lib/us-states";
import { calculateSalesTax } from "./tax";
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

type DeliveryOptionNode = {
  handle: string;
  title: string | null;
  code: string | null;
  description: string | null;
  estimatedCost: { amount: string; currencyCode: string };
};

type CartNode = {
  id: string;
  checkoutUrl: string;
  lines: { nodes: { id: string; quantity: number; merchandise: { id: string } }[] };
  deliveryGroups?: {
    nodes: {
      id: string;
      deliveryOptions: DeliveryOptionNode[];
      selectedDeliveryOption?: DeliveryOptionNode | null;
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
        code
        description
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
    for (const option of group.deliveryOptions ?? []) {
      options.push({
        groupId: group.id,
        handle: option.handle,
        title: option.title?.trim() || option.code?.trim() || "",
        description: option.description?.trim() ?? "",
        amount: option.estimatedCost.amount,
        currencyCode: option.estimatedCost.currencyCode,
      });
    }
  }
  return options;
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
            code
            description
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

export async function saveDelivery(input: DeliveryDraft, preferred: ShippingSelection[] = []) {
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
  const quoted = customerShippingChoices(optionsFrom(next));
  if (!quoted.length) {
    return {
      ok: true as const,
      checkoutUrl: next.checkoutUrl,
      options: [],
      selection: [] as ShippingSelection[],
      selectionMissing: false,
      cost: null,
    };
  }

  const groups = new Map<string, ShippingOption[]>();
  for (const option of quoted) {
    const list = groups.get(option.groupId) ?? [];
    list.push(option);
    groups.set(option.groupId, list);
  }
  const picks: ShippingSelection[] = [];
  let selectionMissing = false;
  for (const [groupId, list] of groups) {
    const wanted = preferred.find((item) => item.groupId === groupId);
    if (wanted) {
      const still = list.find((option) => option.handle === wanted.handle);
      if (!still) {
        selectionMissing = true;
        continue;
      }
      picks.push({ groupId, handle: still.handle });
      continue;
    }
    const cheapest = list.find((option) => option.kind === "cheapest") ?? list[0];
    picks.push({ groupId, handle: cheapest.handle });
  }
  if (selectionMissing) {
    return { ok: true as const, checkoutUrl: next.checkoutUrl, options: quoted, selection: picks, selectionMissing: true, cost: null };
  }

  const applied = await applyDeliveryOptions(picks);
  if (!applied.ok) return { ok: false as const, error: "shipping" as const };
  return {
    ok: true as const,
    checkoutUrl: applied.checkoutUrl,
    options: withConfirmedAmounts(quoted, applied.confirmed),
    selection: picks,
    selectionMissing: false,
    cost: applied.cost,
  };
}

export async function selectShipping(selected: ShippingSelection[]) {
  const picks = selected.filter((item) => item.groupId && item.handle);
  if (!picks.length) return { ok: false as const, error: "shipping" as const };
  const applied = await applyDeliveryOptions(picks);
  if (!applied.ok) return applied;
  return { ok: true as const, checkoutUrl: applied.checkoutUrl, confirmed: applied.confirmed, cost: applied.cost };
}

function withConfirmedAmounts(
  options: ShippingOption[],
  confirmed: ConfirmedRate[],
) {
  return customerShippingChoices(options.map((option) => {
    const match = confirmed.find((item) => item.groupId === option.groupId && item.handle === option.handle);
    if (!match) return option;
    return {
      ...option,
      title: match.title || option.title,
      description: match.description || option.description,
      amount: match.amount,
      currencyCode: match.currencyCode,
    };
  }));
}

type ConfirmedRate = ShippingSelection & {
  title: string;
  description: string;
  amount: string;
  currencyCode: string;
};

function cartCost(cost: CartCostQuote | null | undefined): CartCostQuote | null {
  if (!cost) return null;
  return {
    subtotalAmount: cost.subtotalAmount ?? null,
    totalAmount: cost.totalAmount ?? null,
    totalAmountEstimated: cost.totalAmountEstimated ?? null,
    totalTaxAmount: cost.totalTaxAmount ?? null,
    totalTaxAmountEstimated: cost.totalTaxAmountEstimated ?? null,
  };
}

async function applyDeliveryOptions(picks: ShippingSelection[]) {
  const id = await cartId();
  if (!id || !picks.length) return { ok: false as const, error: "shipping" as const };
  const data = await storefrontFetch<{
    cartSelectedDeliveryOptionsUpdate: {
      cart: {
        checkoutUrl: string;
        cost?: CartCostQuote | null;
        deliveryGroups?: { nodes: { id: string; selectedDeliveryOption: DeliveryOptionNode | null }[] };
      } | null;
      userErrors: { message: string }[];
    };
  }>(
    `mutation CartShipping($cartId: ID!, $selectedDeliveryOptions: [CartSelectedDeliveryOptionInput!]!) {
      cartSelectedDeliveryOptionsUpdate(cartId: $cartId, selectedDeliveryOptions: $selectedDeliveryOptions) {
        cart {
          checkoutUrl
          cost {
            subtotalAmount { amount currencyCode }
            totalAmount { amount currencyCode }
            totalAmountEstimated
            totalTaxAmount { amount currencyCode }
            totalTaxAmountEstimated
          }
          deliveryGroups(first: 10) {
            nodes {
              id
              selectedDeliveryOption {
                handle
                title
                code
                description
                estimatedCost { amount currencyCode }
              }
            }
          }
        }
        userErrors { message }
      }
    }`,
    {
      cartId: id,
      selectedDeliveryOptions: picks.map((pick) => ({ deliveryGroupId: pick.groupId, deliveryOptionHandle: pick.handle })),
    },
    { fresh: true },
  );
  const payload = data?.cartSelectedDeliveryOptionsUpdate;
  if (!payload?.cart || payload.userErrors.length) return { ok: false as const, error: "unavailable" as const };
  const confirmed: ConfirmedRate[] = [];
  for (const pick of picks) {
    const group = payload.cart.deliveryGroups?.nodes.find((item) => item.id === pick.groupId);
    const selected = group?.selectedDeliveryOption;
    if (!selected || selected.handle !== pick.handle || selected.estimatedCost?.amount == null) {
      return { ok: false as const, error: "unavailable" as const };
    }
    confirmed.push({
      groupId: pick.groupId,
      handle: selected.handle,
      title: selected.title?.trim() || selected.code?.trim() || "",
      description: selected.description?.trim() ?? "",
      amount: selected.estimatedCost.amount,
      currencyCode: selected.estimatedCost.currencyCode,
    });
  }
  return { ok: true as const, checkoutUrl: payload.cart.checkoutUrl, confirmed, cost: await costWithSalesTax(cartCost(payload.cart.cost), confirmed) };
}

async function costWithSalesTax(cost: CartCostQuote | null, confirmed: ConfirmedRate[]) {
  if (!cost || !confirmed.length) return cost;
  const currency = confirmed[0]?.currencyCode;
  if (!currency || confirmed.some((item) => item.currencyCode !== currency)) return cost;
  const shippingCents = confirmed.reduce((sum, item) => sum + Math.round(Number(item.amount) * 100), 0);
  if (!Number.isFinite(shippingCents)) return cost;
  const context = await taxContext();
  if (!context) return cost;
  const tax = await calculateSalesTax({
    lines: context.lines,
    address: context.address,
    shipping: {
      title: confirmed.map((item) => item.title).filter(Boolean).join(", ") || "Shipping",
      amount: (shippingCents / 100).toFixed(2),
      currencyCode: currency,
    },
  });
  if (!tax) return cost;
  return costWithCalculatedTax(cost, tax, (shippingCents / 100).toFixed(2)) ?? cost;
}

async function taxContext() {
  const id = await cartId();
  if (!id) return null;
  const data = await storefrontFetch<{
    cart: {
      lines: { nodes: { quantity: number; merchandise: { id?: string } }[] };
      delivery?: {
        addresses: {
          selected?: boolean;
          address?: {
            firstName?: string | null;
            lastName?: string | null;
            address1?: string | null;
            address2?: string | null;
            city?: string | null;
            zip?: string | null;
            provinceCode?: string | null;
            countryCode?: string | null;
          } | null;
        }[];
      };
    } | null;
  }>(
    `query CartTax($id: ID!) {
      cart(id: $id) {
        lines(first: 50) { nodes { quantity merchandise { ... on ProductVariant { id } } } }
        delivery {
          addresses {
            selected
            address {
              ... on CartDeliveryAddress {
                firstName lastName address1 address2 city zip provinceCode countryCode
              }
            }
          }
        }
      }
    }`,
    { id },
    { fresh: true },
  );
  const cart = data?.cart;
  const selected = cart?.delivery?.addresses?.find((item) => item.selected) ?? cart?.delivery?.addresses?.[0];
  const address = selected?.address;
  if (!cart || !address?.address1 || !address.city || !address.countryCode) return null;
  const lines = cart.lines.nodes
    .filter((line) => line.merchandise.id && line.quantity > 0)
    .map((line) => ({ variantId: line.merchandise.id as string, quantity: line.quantity }));
  if (!lines.length) return null;
  return {
    lines,
    address: {
      firstName: address.firstName ?? "",
      lastName: address.lastName ?? "",
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      zip: address.zip ?? "",
      countryCode: address.countryCode,
      provinceCode: address.provinceCode,
    },
  };
}

import { shopDomain } from "./config";
import { adminToken, resetAdminToken } from "./admin";

const adminApi = `https://${shopDomain}/admin/api/2025-01/graphql.json`;

export type TaxAddress = {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string | null;
  city: string;
  zip: string;
  countryCode: string;
  provinceCode?: string | null;
};

export type TaxLine = { variantId: string; quantity: number };

type TaxMoney = { amount: string; currencyCode: string };

type Calculated = {
  totalTaxSet?: { shopMoney?: TaxMoney | null } | null;
};

const CALCULATE = `mutation CalculateTax($input: DraftOrderInput!) {
  draftOrderCalculate(input: $input) {
    calculatedDraftOrder {
      totalTaxSet { shopMoney { amount currencyCode } }
    }
    userErrors { message }
  }
}`;

async function calculateOnce(token: string, variables: Record<string, unknown>) {
  const res = await fetch(adminApi, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query: CALCULATE, variables }),
    cache: "no-store",
  });
  if (!res.ok) return { denied: false, tax: null as TaxMoney | null };
  const json = (await res.json()) as {
    errors?: { message?: string }[];
    data?: { draftOrderCalculate?: { calculatedDraftOrder?: Calculated | null; userErrors?: { message: string }[] } };
  };
  const denied = (json.errors ?? []).some((error) => /write_draft_orders|access denied/i.test(error.message ?? ""));
  const payload = json.data?.draftOrderCalculate;
  if (denied || !payload || payload.userErrors?.length) return { denied, tax: null };
  const tax = payload.calculatedDraftOrder?.totalTaxSet?.shopMoney;
  if (!tax?.currencyCode || !Number.isFinite(Number(tax.amount))) return { denied: false, tax: null };
  return { denied: false, tax };
}

/** Asks Shopify for sales tax. This does not create a draft order. */
export async function calculateSalesTax(input: {
  lines: TaxLine[];
  address: TaxAddress;
  shipping?: { title: string; amount: string; currencyCode: string } | null;
}): Promise<TaxMoney | null> {
  const lines = input.lines.filter((line) => line.variantId && line.quantity > 0);
  if (!lines.length || !input.address.address1 || !input.address.city || !input.address.countryCode) return null;
  const variables = {
    input: {
      taxExempt: false,
      lineItems: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
      shippingAddress: {
        firstName: input.address.firstName,
        lastName: input.address.lastName,
        address1: input.address.address1,
        address2: input.address.address2 || null,
        city: input.address.city,
        zip: input.address.zip || null,
        countryCode: input.address.countryCode,
        ...(input.address.provinceCode ? { provinceCode: input.address.provinceCode } : {}),
      },
      ...(input.shipping
        ? { shippingLine: { title: input.shipping.title || "Shipping", priceWithCurrency: { amount: input.shipping.amount, currencyCode: input.shipping.currencyCode } } }
        : {}),
    },
  };
  const token = await adminToken();
  if (!token) return null;
  const first = await calculateOnce(token, variables);
  if (!first.denied) return first.tax;
  resetAdminToken();
  const next = await adminToken();
  if (!next) return null;
  return (await calculateOnce(next, variables)).tax;
}

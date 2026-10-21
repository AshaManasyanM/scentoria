export type QuoteMoney = { amount: string; currencyCode: string };

export type CartCostQuote = {
  subtotalAmount?: QuoteMoney | null;
  totalAmount?: QuoteMoney | null;
  totalAmountEstimated?: boolean | null;
  totalTaxAmount?: QuoteMoney | null;
  totalTaxAmountEstimated?: boolean | null;
};

export type CheckoutQuote = {
  tax: QuoteMoney | null;
  total: QuoteMoney | null;
  estimatedTotal: QuoteMoney | null;
  verified: boolean;
};

function money(value?: QuoteMoney | null): QuoteMoney | null {
  if (!value?.currencyCode || !Number.isFinite(Number(value.amount))) return null;
  return { amount: value.amount, currencyCode: value.currencyCode };
}

function cents(amount: string | number) {
  const value = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

/** Shopify is the only source of tax. An estimated cart total is not the amount charged. */
export function checkoutQuote(
  cost: CartCostQuote | null | undefined,
  expected: { products: number; shipping: number; currency: string },
): CheckoutQuote {
  const tax = money(cost?.totalTaxAmount);
  const total = money(cost?.totalAmount);
  const subtotal = money(cost?.subtotalAmount);
  const currencyMatches = (value: QuoteMoney | null) => value == null || value.currencyCode === expected.currency;
  const taxCents = tax ? cents(tax.amount) : null;
  const totalCents = total ? cents(total.amount) : null;
  const subtotalCents = subtotal ? cents(subtotal.amount) : null;
  const productCents = cents(expected.products);
  const shippingCents = cents(expected.shipping);
  const taxFinal = tax != null && cost?.totalTaxAmountEstimated === false && currencyMatches(tax);
  const totalFinal = total != null && cost?.totalAmountEstimated === false && currencyMatches(total);
  const addsUp =
    productCents != null &&
    shippingCents != null &&
    taxCents != null &&
    totalCents != null &&
    productCents + shippingCents + taxCents === totalCents &&
    (subtotalCents == null || subtotalCents === productCents);
  const verified = Boolean(taxFinal && totalFinal && addsUp && currencyMatches(subtotal));
  return {
    tax,
    total: verified && total ? total : null,
    estimatedTotal: !verified && total && currencyMatches(total) ? total : null,
    verified,
  };
}

/** Adds Shopify's calculated tax onto the cart estimate. The result stays estimated. */
export function costWithCalculatedTax(
  cost: CartCostQuote,
  tax: QuoteMoney,
  shippingAmount: string,
): CartCostQuote | null {
  const subtotal = money(cost.subtotalAmount);
  const taxMoney = money(tax);
  const shippingCents = cents(shippingAmount);
  const subtotalCents = subtotal ? cents(subtotal.amount) : null;
  const taxCents = taxMoney ? cents(taxMoney.amount) : null;
  if (!subtotal || !taxMoney || subtotalCents == null || shippingCents == null || taxCents == null) return null;
  if (taxMoney.currencyCode !== subtotal.currencyCode) return null;
  const total = ((subtotalCents + shippingCents + taxCents) / 100).toFixed(2);
  return {
    ...cost,
    subtotalAmount: subtotal,
    totalTaxAmount: taxMoney,
    totalTaxAmountEstimated: true,
    totalAmount: { amount: total, currencyCode: subtotal.currencyCode },
    totalAmountEstimated: true,
  };
}

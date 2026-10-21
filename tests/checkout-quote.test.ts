import assert from "node:assert/strict";
import test from "node:test";
import { checkoutQuote, costWithCalculatedTax } from "../src/lib/checkout-quote.ts";

const expected = { products: 40, shipping: 6.18, currency: "USD" };

test("a missing Shopify tax stays estimated and is not treated as zero", () => {
  const quote = checkoutQuote(
    {
      subtotalAmount: { amount: "40.0", currencyCode: "USD" },
      totalAmount: { amount: "46.18", currencyCode: "USD" },
      totalAmountEstimated: true,
      totalTaxAmount: null,
      totalTaxAmountEstimated: true,
    },
    expected,
  );
  assert.equal(quote.tax, null);
  assert.equal(quote.total, null);
  assert.deepEqual(quote.estimatedTotal, { amount: "46.18", currencyCode: "USD" });
  assert.equal(quote.verified, false);
});

test("shows a final Shopify tax and uses Shopify's total", () => {
  const quote = checkoutQuote(
    {
      subtotalAmount: { amount: "40.00", currencyCode: "USD" },
      totalAmount: { amount: "50.05", currencyCode: "USD" },
      totalAmountEstimated: false,
      totalTaxAmount: { amount: "3.87", currencyCode: "USD" },
      totalTaxAmountEstimated: false,
    },
    expected,
  );
  assert.equal(quote.verified, true);
  assert.equal(quote.estimatedTotal, null);
  assert.deepEqual(quote.tax, { amount: "3.87", currencyCode: "USD" });
  assert.deepEqual(quote.total, { amount: "50.05", currencyCode: "USD" });
});

test("keeps an estimated Shopify tax out of the final total", () => {
  const quote = checkoutQuote(
    {
      subtotalAmount: { amount: "40.00", currencyCode: "USD" },
      totalAmount: { amount: "50.05", currencyCode: "USD" },
      totalAmountEstimated: true,
      totalTaxAmount: { amount: "3.87", currencyCode: "USD" },
      totalTaxAmountEstimated: true,
    },
    expected,
  );
  assert.deepEqual(quote.tax, { amount: "3.87", currencyCode: "USD" });
  assert.equal(quote.total, null);
  assert.deepEqual(quote.estimatedTotal, { amount: "50.05", currencyCode: "USD" });
  assert.equal(quote.verified, false);
});

test("rejects a total that does not equal products, shipping, and Shopify tax", () => {
  const quote = checkoutQuote(
    {
      subtotalAmount: { amount: "40.00", currencyCode: "USD" },
      totalAmount: { amount: "46.18", currencyCode: "USD" },
      totalAmountEstimated: false,
      totalTaxAmount: { amount: "3.87", currencyCode: "USD" },
      totalTaxAmountEstimated: false,
    },
    expected,
  );
  assert.equal(quote.verified, false);
  assert.equal(quote.total, null);
  assert.deepEqual(quote.estimatedTotal, { amount: "46.18", currencyCode: "USD" });
});

test("shows Shopify's calculated tax inside the estimated total", () => {
  const cost = costWithCalculatedTax(
    {
      subtotalAmount: { amount: "15.0", currencyCode: "USD" },
      totalAmount: { amount: "21.15", currencyCode: "USD" },
      totalAmountEstimated: true,
      totalTaxAmount: null,
      totalTaxAmountEstimated: true,
    },
    { amount: "1.65", currencyCode: "USD" },
    "6.15",
  );
  const quote = checkoutQuote(cost, { products: 15, shipping: 6.15, currency: "USD" });
  assert.deepEqual(quote.tax, { amount: "1.65", currencyCode: "USD" });
  assert.equal(quote.verified, false);
  assert.deepEqual(quote.estimatedTotal, { amount: "22.80", currencyCode: "USD" });
});

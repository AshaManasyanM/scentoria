import assert from "node:assert/strict";
import test from "node:test";
import { customerShippingChoices, selectedShippingTotal, shippingComparison, shippingFacts } from "../src/lib/shipping-choices.ts";

const ground = {
  groupId: "group-1",
  handle: "ground",
  title: "Ground Advantage",
  description: "",
  amount: "6.15",
  currencyCode: "USD",
};
const priority = {
  groupId: "group-1",
  handle: "priority",
  title: "Priority Mail",
  description: "",
  amount: "12.40",
  currencyCode: "USD",
};

test("keeps every Shopify rate and does not invent a price", () => {
  const choices = customerShippingChoices([ground]);
  assert.equal(choices.length, 1);
  assert.equal(choices[0]?.amount, "6.15");
  assert.equal(choices[0]?.title, "Ground Advantage");
  assert.equal(choices[0]?.kind, "cheapest");
});

test("sorts rates by price and labels only the lowest as cheapest", () => {
  const choices = customerShippingChoices([
    priority,
    { ...ground, title: "UPS Ground", handle: "ups", amount: "9.00" },
    ground,
  ]);
  assert.deepEqual(choices.map((choice) => [choice.handle, choice.kind]), [
    ["ground", "cheapest"],
    ["ups", "option"],
    ["priority", "option"],
  ]);
});

test("does not call a method faster from its name alone", () => {
  const choices = customerShippingChoices([ground, { ...priority, title: "Express Faster" }]);
  assert.equal(choices.find((choice) => choice.handle === "priority")?.kind, "option");
});

test("labels a method faster only when Shopify states an earlier delivery window", () => {
  const choices = customerShippingChoices([
    { ...ground, description: "5-8 business days" },
    { ...priority, description: "1 to 2 business days" },
    { groupId: "group-1", handle: "middle", title: "Priority Mail Express", description: "3-6 days", amount: "20.00", currencyCode: "USD" },
  ]);
  assert.equal(choices.find((choice) => choice.handle === "ground")?.kind, "cheapest");
  assert.equal(choices.find((choice) => choice.handle === "priority")?.kind, "faster");
  assert.equal(choices.find((choice) => choice.handle === "middle")?.kind, "option");
});

test("shows a free rate as zero instead of a replacement price", () => {
  const choices = customerShippingChoices([{ ...ground, amount: "0.00", title: "Free shipping" }]);
  assert.equal(choices[0]?.amount, "0.00");
  assert.equal(choices[0]?.kind, "cheapest");
});

test("compares price only when Shopify gives no delivery window", () => {
  const choices = customerShippingChoices([ground, priority]);
  assert.deepEqual(shippingComparison(choices[0], choices), { priceDifference: null, daysDifference: null });
  assert.deepEqual(shippingComparison(choices[1], choices), { priceDifference: "6.25", daysDifference: null });
});

test("compares delivery time only when both Shopify descriptions state a window", () => {
  const choices = customerShippingChoices([
    { ...ground, description: "5-8 business days" },
    { ...priority, description: "1 to 2 business days" },
    { ...priority, handle: "overlap", title: "Priority Mail Express", description: "4-6 days", amount: "9.00" },
    { ...priority, handle: "named", title: "Express", description: "", amount: "15.00" },
  ]);
  assert.equal(shippingComparison(choices.find((choice) => choice.handle === "priority")!, choices).daysDifference, 3);
  assert.equal(shippingComparison(choices.find((choice) => choice.handle === "overlap")!, choices).daysDifference, null);
  assert.equal(shippingComparison(choices.find((choice) => choice.handle === "named")!, choices).daysDifference, null);
  assert.equal(shippingComparison(choices.find((choice) => choice.handle === "ground")!, choices).priceDifference, null);
});

test("names the carrier and usual business days when Shopify omits them", () => {
  assert.deepEqual(shippingFacts({ title: "Ground Advantage", description: "" }), {
    carrier: "USPS",
    days: { min: 2, max: 5 },
  });
  assert.deepEqual(shippingFacts({ title: "Priority Mail", description: "" }), {
    carrier: "USPS",
    days: { min: 1, max: 3 },
  });
  assert.deepEqual(shippingFacts({ title: "Ground Advantage", description: "4-6 business days" }).days, { min: 4, max: 6 });
  assert.deepEqual(shippingFacts({ title: "Local courier", description: "" }), { carrier: "", days: null });
});

test("a single Shopify rate has no invented comparison", () => {
  const choices = customerShippingChoices([ground]);
  assert.deepEqual(shippingComparison(choices[0], choices), { priceDifference: null, daysDifference: null });
});

test("drops duplicate handles and keeps separate groups", () => {
  const choices = customerShippingChoices([
    ground,
    ground,
    { ...priority, groupId: "group-2", amount: "4.00" },
  ]);
  assert.equal(choices.length, 2);
  assert.equal(selectedShippingTotal(choices, [{ groupId: "group-1", handle: "ground" }]), null);
  assert.deepEqual(
    selectedShippingTotal(choices, [
      { groupId: "group-1", handle: "ground" },
      { groupId: "group-2", handle: "priority" },
    ]),
    { amount: "10.15", currencyCode: "USD" },
  );
});

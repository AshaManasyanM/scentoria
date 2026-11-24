import { adminFetch } from "./admin";

export type CustomerOrderSummary = {
  id: string;
  name: string;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  total: { amount: string; currencyCode: string };
  itemCount: number;
};

/**
 * Orders for a customer email via Admin API.
 * Guest checkouts placed with the same email are returned here once Shopify
 * has the order on file (Customer Account usually links them after sign-in).
 */
export async function ordersForEmail(email: string): Promise<CustomerOrderSummary[]> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) return [];

  const data = await adminFetch<{
    orders: {
      nodes: {
        id: string;
        name: string;
        processedAt: string;
        displayFinancialStatus: string | null;
        displayFulfillmentStatus: string | null;
        totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
        currentSubtotalLineItemsQuantity: number;
      }[];
    };
  }>(
    `query OrdersByEmail($query: String!) {
      orders(first: 25, query: $query, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          id
          name
          processedAt
          displayFinancialStatus
          displayFulfillmentStatus
          totalPriceSet { shopMoney { amount currencyCode } }
          currentSubtotalLineItemsQuantity
        }
      }
    }`,
    { query: `email:${normalized}` },
  );

  return (data?.orders.nodes ?? []).map((order) => ({
    id: order.id,
    name: order.name,
    processedAt: order.processedAt,
    financialStatus: order.displayFinancialStatus || "UNKNOWN",
    fulfillmentStatus: order.displayFulfillmentStatus || "UNFULFILLED",
    total: order.totalPriceSet.shopMoney,
    itemCount: order.currentSubtotalLineItemsQuantity,
  }));
}

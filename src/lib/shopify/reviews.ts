import { cache } from "react";
import { adminFetch } from "./admin";
import { storefrontFetch } from "./fetch";
import { REVIEWS_QUERY } from "./queries";

export type PublicReview = {
  id: string;
  userId: number;
  name: string;
  rating: number;
  body: string;
  createdAt: string;
  productHandle: string;
};

type ReviewNode = {
  handle: string;
  updatedAt: string;
  fields: { key: string; value: string }[];
};

function field(fields: { key: string; value: string }[], key: string) {
  return fields.find((item) => item.key === key)?.value ?? "";
}

export const publishedReviews = cache(async () => {
  const data = await storefrontFetch<{ metaobjects: { nodes: ReviewNode[] } }>(REVIEWS_QUERY, {
    type: "review",
    first: 100,
  });
  return (data?.metaobjects?.nodes ?? []).map((node) => ({
    id: node.handle,
    userId: 0,
    name: field(node.fields, "author"),
    rating: Number(field(node.fields, "rating")) || 0,
    body: field(node.fields, "body"),
    createdAt: node.updatedAt,
    productHandle: field(node.fields, "product_handle"),
  }));
});

export async function publishedReviewSummaries(handles: string[]) {
  const reviews = await publishedReviews();
  const summaries = new Map<string, { rating: number; count: number }>();
  for (const handle of handles) {
    const rows = reviews.filter((review) => review.productHandle === handle && review.rating >= 1);
    if (!rows.length) continue;
    const rating = rows.reduce((sum, review) => sum + review.rating, 0) / rows.length;
    summaries.set(handle, { rating, count: rows.length });
  }
  return summaries;
}

export async function publishedProductReviews(productHandle: string) {
  const reviews = await publishedReviews();
  return reviews.filter((review) => review.productHandle === productHandle && review.body.trim());
}

export async function createDraftReview(input: {
  productHandle: string;
  author: string;
  rating: number;
  body: string;
}) {
  const data = await adminFetch<{
    metaobjectCreate: { metaobject: { id: string } | null; userErrors: { message: string }[] };
  }>(
    `mutation CreateReview($metaobject: MetaobjectCreateInput!) {
      metaobjectCreate(metaobject: $metaobject) {
        metaobject { id }
        userErrors { message }
      }
    }`,
    {
      metaobject: {
        type: "review",
        capabilities: { publishable: { status: "DRAFT" } },
        fields: [
          { key: "product_handle", value: input.productHandle },
          { key: "author", value: input.author },
          { key: "rating", value: String(input.rating) },
          { key: "body", value: input.body },
        ],
      },
    },
  );
  const result = data?.metaobjectCreate;
  return Boolean(result?.metaobject && !result.userErrors.length);
}

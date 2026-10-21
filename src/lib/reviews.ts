"use server";

import { clientKey, consumeLimit } from "@/lib/rate-limit";
import { createDraftReview, publishedReviewSummaries } from "@/lib/shopify/reviews";
import { findUserBySession } from "@/lib/users-db";
import { cookies, headers } from "next/headers";

export async function submitReview(handle: string, rating: number, body: string) {
  const token = (await cookies()).get("scentoria_session")?.value ?? "";
  const user = await findUserBySession(token);
  if (!user) return { ok: false as const, error: "login" as const };
  const request = new Request("http://local", { headers: await headers() });
  if (!(await consumeLimit(clientKey(request, `review:${user.id}`), 10, 60 * 60 * 1000))) {
    return { ok: false as const, error: "save" as const };
  }
  const stars = Math.round(rating);
  if (!handle || stars < 1 || stars > 5) return { ok: false as const, error: "rating" as const };
  const saved = await createDraftReview({
    productHandle: handle,
    author: user.name,
    rating: stars,
    body: body.trim().slice(0, 2000),
  });
  if (!saved) return { ok: false as const, error: "save" as const };
  const summary = (await publishedReviewSummaries([handle])).get(handle) ?? { rating: 0, count: 0 };
  return { ok: true as const, rating: summary.rating, count: summary.count };
}

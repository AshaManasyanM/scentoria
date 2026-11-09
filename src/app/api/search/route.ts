import { clientKey, consumeLimit, tooManyRequests } from "@/lib/rate-limit";
import { suggestProducts } from "@/lib/shopify/catalog";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!(await consumeLimit(clientKey(request, "search-get"), 60, 60_000))) return tooManyRequests();
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) return NextResponse.json({ items: [] });
  const items = await suggestProducts(q.slice(0, 80), 8);
  return NextResponse.json({ items });
}

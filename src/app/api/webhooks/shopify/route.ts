import { ensureBrandFromVendor } from "@/lib/shopify/brand-sync";
import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function webhookSecret() {
  return process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_CLIENT_SECRET || "";
}

function verifyHmac(rawBody: string, hmacHeader: string | null) {
  const secret = webhookSecret();
  if (!secret || !hmacHeader) return false;
  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  try {
    const expected = Buffer.from(digest, "utf8");
    const received = Buffer.from(hmacHeader, "utf8");
    if (expected.length !== received.length) return false;
    return timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}

type ProductWebhook = {
  id?: number | string;
  admin_graphql_api_id?: string;
  vendor?: string;
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  if (!verifyHmac(rawBody, hmac)) {
    return NextResponse.json({ error: "invalid hmac" }, { status: 401 });
  }

  const topic = (request.headers.get("x-shopify-topic") || "").toLowerCase();
  if (topic !== "products/create" && topic !== "products/update") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  let payload: ProductWebhook = {};
  try {
    payload = JSON.parse(rawBody) as ProductWebhook;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const vendor = payload.vendor ?? "";
  const productGid =
    payload.admin_graphql_api_id ||
    (payload.id != null ? `gid://shopify/Product/${payload.id}` : undefined);

  try {
    await ensureBrandFromVendor(vendor, productGid);
  } catch {
    // Acknowledge so Shopify does not retry forever on transient Admin errors.
  }

  return NextResponse.json({ ok: true });
}

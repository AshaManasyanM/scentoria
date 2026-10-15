import { clientKey, consumeLimit, readJson, tooManyRequests } from "@/lib/rate-limit";
import { addLine, getCart, setLineQuantity } from "@/lib/shopify/cart";
import { saveDelivery, selectShipping, type DeliveryDraft } from "@/lib/shopify/checkout";
import { NextResponse } from "next/server";

export async function GET() {
  const cart = await getCart();
  return NextResponse.json(cart);
}

export async function POST(request: Request) {
  if (!(await consumeLimit(clientKey(request, "cart-post"), 40, 60_000))) return tooManyRequests();
  const body = await readJson<{
    action?: string;
    merchandiseId?: string;
    lineId?: string;
    quantity?: number;
    delivery?: DeliveryDraft;
    groupId?: string;
    handle?: string;
  }>(request, 16_000);
  if (!body) return NextResponse.json({ error: "Invalid cart payload" }, { status: 400 });
  if (body.action === "delivery" && body.delivery) {
    return NextResponse.json(await saveDelivery(body.delivery));
  }
  if (body.action === "shipping" && body.groupId && body.handle) {
    return NextResponse.json(await selectShipping(body.groupId, body.handle));
  }
  if (body.action === "update" && body.lineId) {
    const cart = await setLineQuantity(body.lineId, body.quantity ?? 0);
    return NextResponse.json(cart);
  }
  if (body.merchandiseId) {
    const cart = await addLine(body.merchandiseId, body.quantity ?? 1);
    return NextResponse.json(cart);
  }
  return NextResponse.json({ error: "Invalid cart payload" }, { status: 400 });
}

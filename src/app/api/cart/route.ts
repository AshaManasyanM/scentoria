import { addLine, getCart, setLineQuantity } from "@/lib/shopify/cart";
import { NextResponse } from "next/server";

export async function GET() {
  const cart = await getCart();
  return NextResponse.json(cart);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: string;
    merchandiseId?: string;
    lineId?: string;
    quantity?: number;
  };
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

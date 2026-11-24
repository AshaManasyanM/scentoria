import { ordersForEmail } from "@/lib/shopify/orders";
import { findUserBySession } from "@/lib/users-db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const jar = await cookies();
    const user = await findUserBySession(jar.get("scentoria_session")?.value ?? "");
    if (!user?.email) {
      return NextResponse.json({ ok: false, error: "login", orders: [] }, { status: 401 });
    }
    // Any signed-in account (email / Google / Shopify) sees orders for this email.
    const orders = await ordersForEmail(user.email);
    return NextResponse.json({
      ok: true,
      email: user.email,
      provider: user.provider,
      orders,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable", orders: [] }, { status: 503 });
  }
}

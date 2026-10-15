import { verifyGoogleCredential } from "@/lib/google-identity";
import { clientKey, consumeLimit, readJson, tooManyRequests } from "@/lib/rate-limit";
import { attachGoogleSub, findUserBySession } from "@/lib/users-db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION = "scentoria_session";

export async function POST(request: Request) {
  if (!(await consumeLimit(clientKey(request, "auth-google-link"), 10, 15 * 60 * 1000))) return tooManyRequests();
  const jar = await cookies();
  const user = findUserBySession(jar.get(SESSION)?.value ?? "");
  if (!user) return NextResponse.json({ error: "missing" }, { status: 401 });
  const body = await readJson<{ credential?: string }>(request, 8_000);
  const credential = body?.credential?.trim() ?? "";
  if (!credential) return NextResponse.json({ error: "missing" }, { status: 400 });
  const identity = await verifyGoogleCredential(credential);
  if (!identity || identity.email !== user.email) return NextResponse.json({ error: "google" }, { status: 401 });
  const linked = attachGoogleSub(user.id, identity.sub);
  if (!linked || linked.passwordHash !== user.passwordHash) return NextResponse.json({ error: "google" }, { status: 409 });
  return NextResponse.json({
    user: {
      name: linked.name,
      email: linked.email,
      image: linked.image || undefined,
      provider: linked.provider,
      googleLinked: Boolean(linked.googleSub),
    },
  });
}

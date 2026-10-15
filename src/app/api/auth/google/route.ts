import { verifyGoogleCredential, googleLinkPlan } from "@/lib/google-identity";
import { clientKey, consumeLimit, readJson, tooManyRequests } from "@/lib/rate-limit";
import { sessionCookieOptions, sessionLifetime } from "@/lib/security";
import { createSession, createUser, findUserByEmail, findUserByGoogleSub } from "@/lib/users-db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION = "scentoria_session";

function publicUser(user: {
  name: string;
  email: string;
  image: string | null;
  provider: "email" | "google";
  googleSub: string | null;
}) {
  return {
    name: user.name,
    email: user.email,
    image: user.image || undefined,
    provider: user.provider,
    googleLinked: Boolean(user.googleSub),
  };
}

async function startSession(userId: number) {
  const token = createSession(userId, sessionLifetime(true));
  const jar = await cookies();
  jar.set(SESSION, token, sessionCookieOptions(true));
}

export async function POST(request: Request) {
  if (!(await consumeLimit(clientKey(request, "auth-google"), 10, 15 * 60 * 1000))) return tooManyRequests();
  const body = await readJson<{ credential?: string }>(request, 8_000);
  const credential = body?.credential?.trim() ?? "";
  if (!credential) return NextResponse.json({ error: "missing" }, { status: 400 });
  const identity = await verifyGoogleCredential(credential);
  if (!identity) return NextResponse.json({ error: "google" }, { status: 401 });

  const plan = googleLinkPlan({
    sub: identity.sub,
    existingBySub: findUserByGoogleSub(identity.sub),
    existingByEmail: findUserByEmail(identity.email) ?? null,
  });
  if (plan.action === "confirm") return NextResponse.json({ error: "link" }, { status: 409 });
  if (plan.action === "reject") return NextResponse.json({ error: "google" }, { status: 409 });

  if (plan.action === "sign-in") {
    const user = findUserByGoogleSub(identity.sub);
    if (!user) return NextResponse.json({ error: "google" }, { status: 401 });
    await startSession(user.id);
    return NextResponse.json({ user: publicUser(user) });
  }

  const created = createUser({
    email: identity.email,
    name: identity.name,
    image: identity.picture ?? undefined,
    provider: "google",
    googleSub: identity.sub,
  });
  await startSession(created.id);
  return NextResponse.json({ user: publicUser(created) });
}

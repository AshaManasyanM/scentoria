import { clientKey, consumeLimit, readJson, tooManyRequests } from "@/lib/rate-limit";
import {
  googleLoginDisabled,
  loginPasswordAllowed,
  newPasswordError,
  sessionCookieOptions,
  sessionLifetime,
} from "@/lib/security";
import {
  createSession,
  createUser,
  deleteSession,
  findUserByEmail,
  findUserBySession,
  hashPassword,
  updateUser,
  verifyPassword,
} from "@/lib/users-db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION = "scentoria_session";
const AUTH_LIMIT = 10;
const AUTH_WINDOW_MS = 15 * 60 * 1000;

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

async function sessionToken() {
  const jar = await cookies();
  return jar.get(SESSION)?.value ?? "";
}

async function startSession(userId: number, remember = true) {
  const token = createSession(userId, sessionLifetime(remember));
  const jar = await cookies();
  jar.set(SESSION, token, sessionCookieOptions(remember));
}

export async function GET() {
  const user = findUserBySession(await sessionToken());
  return NextResponse.json({ user: user ? publicUser(user) : null });
}

export async function POST(request: Request) {
  if (!(await consumeLimit(clientKey(request, "auth-post"), AUTH_LIMIT, AUTH_WINDOW_MS))) return tooManyRequests();
  const body = await readJson<{
    action?: string;
    name?: string;
    email?: string;
    password?: string;
    image?: string;
    remember?: string;
  }>(request, 8_000);
  if (!body) return NextResponse.json({ error: "missing" }, { status: 400 });
  if (googleLoginDisabled(body.action)) return NextResponse.json({ error: "disabled" }, { status: 403 });

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  if (body.action === "login" && !loginPasswordAllowed(password)) {
    return NextResponse.json({ error: "password" }, { status: 401 });
  }

  if (body.action === "register") {
    const problem = newPasswordError(password);
    if (!email || email.length > 254 || problem) {
      return NextResponse.json({ error: problem === "short" ? "short" : "missing" }, { status: 400 });
    }
    if (findUserByEmail(email)) return NextResponse.json({ ok: true });
    const name = body.name?.trim().slice(0, 80) || email.split("@")[0] || email;
    createUser({ email, name, provider: "email", passwordHash: hashPassword(password) });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "login") {
    const user = email ? findUserByEmail(email) : undefined;
    if (!user || user.provider !== "email" || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "password" }, { status: 401 });
    }
    await startSession(user.id, body.remember === "1");
    return NextResponse.json({ user: publicUser(user) });
  }

  return NextResponse.json({ error: "missing" }, { status: 400 });
}

export async function PATCH(request: Request) {
  if (!(await consumeLimit(clientKey(request, "auth-patch"), AUTH_LIMIT, AUTH_WINDOW_MS))) return tooManyRequests();
  const user = findUserBySession(await sessionToken());
  if (!user) return NextResponse.json({ error: "missing" }, { status: 401 });
  const body = await readJson<{ name?: string; password?: string; currentPassword?: string }>(request, 8_000);
  if (!body) return NextResponse.json({ error: "missing" }, { status: 400 });
  const password = body.password?.trim() ?? "";
  if (password) {
    const problem = newPasswordError(password);
    if (problem) return NextResponse.json({ error: problem === "short" ? "short" : "missing" }, { status: 400 });
    if (user.passwordHash && !verifyPassword(body.currentPassword ?? "", user.passwordHash)) {
      return NextResponse.json({ error: "password" }, { status: 401 });
    }
  }
  const next = updateUser(user.id, {
    name: body.name?.trim().slice(0, 80) || user.name,
    passwordHash: password ? hashPassword(password) : undefined,
    provider: password && !user.passwordHash ? "email" : undefined,
  });
  if (!next) return NextResponse.json({ error: "missing" }, { status: 400 });
  return NextResponse.json({ user: publicUser(next) });
}

export async function DELETE() {
  const token = await sessionToken();
  if (token) deleteSession(token);
  const jar = await cookies();
  jar.delete(SESSION);
  return NextResponse.json({ user: null });
}

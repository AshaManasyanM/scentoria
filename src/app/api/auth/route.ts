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

function publicUser(user: { name: string; email: string; image: string | null; provider: "email" | "google" }) {
  return {
    name: user.name,
    email: user.email,
    image: user.image || undefined,
    provider: user.provider,
  };
}

async function sessionToken() {
  const jar = await cookies();
  return jar.get(SESSION)?.value ?? "";
}

async function startSession(userId: number) {
  const token = createSession(userId);
  const jar = await cookies();
  jar.set(SESSION, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function GET() {
  const user = findUserBySession(await sessionToken());
  return NextResponse.json({ user: user ? publicUser(user) : null });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: string;
    name?: string;
    email?: string;
    password?: string;
    image?: string;
  };
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (body.action === "register") {
    if (!email || !password) return NextResponse.json({ error: "missing" }, { status: 400 });
    if (findUserByEmail(email)) return NextResponse.json({ error: "exists" }, { status: 409 });
    const name = body.name?.trim() || email.split("@")[0] || email;
    const user = createUser({ email, name, provider: "email", passwordHash: hashPassword(password) });
    await startSession(user.id);
    return NextResponse.json({ user: publicUser(user) });
  }

  if (body.action === "login") {
    const user = email ? findUserByEmail(email) : undefined;
    if (!user || user.provider !== "email" || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "password" }, { status: 401 });
    }
    await startSession(user.id);
    return NextResponse.json({ user: publicUser(user) });
  }

  if (body.action === "google") {
    if (!email) return NextResponse.json({ error: "missing" }, { status: 400 });
    const existing = findUserByEmail(email);
    const name = body.name?.trim() || existing?.name || email.split("@")[0] || email;
    const user = existing
      ? updateUser(existing.id, { name, image: body.image || existing.image, provider: "google", passwordHash: null })
      : createUser({ email, name, image: body.image, provider: "google" });
    if (!user) return NextResponse.json({ error: "missing" }, { status: 400 });
    await startSession(user.id);
    return NextResponse.json({ user: publicUser(user) });
  }

  return NextResponse.json({ error: "missing" }, { status: 400 });
}

export async function PATCH(request: Request) {
  const user = findUserBySession(await sessionToken());
  if (!user) return NextResponse.json({ error: "missing" }, { status: 401 });
  const body = (await request.json()) as { name?: string; password?: string };
  const password = body.password?.trim();
  const next = updateUser(user.id, {
    name: body.name?.trim() || user.name,
    passwordHash: user.provider === "email" && password ? hashPassword(password) : undefined,
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

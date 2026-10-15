export const AUTH_EVENT = "scentoria-auth";

export type AuthProvider = "email" | "google";

export type Profile = {
  name: string;
  email: string;
  image?: string;
  provider: AuthProvider;
  googleLinked?: boolean;
};

let current: Profile = { name: "", email: "", provider: "email" };

function notifyAuth() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function applyUser(user: Profile | null) {
  current = user?.email ? user : { name: "", email: "", provider: "email" };
  notifyAuth();
  return current;
}

export function loadProfile(): Profile {
  return current;
}

export function isLoggedIn(): boolean {
  return Boolean(current.email.trim());
}

export function nameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "";
  const words = local.split(/[._+-]+/).filter(Boolean);
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export async function refreshSession() {
  const response = await fetch("/api/auth");
  const data = (await response.json()) as { user: Profile | null };
  return applyUser(data.user);
}

function authReason(error?: string) {
  if (error === "exists") return "exists" as const;
  if (error === "rate") return "rate" as const;
  if (error === "short") return "short" as const;
  return "password" as const;
}

async function postAuth(body: Record<string, string | undefined>) {
  const response = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as { user?: Profile; error?: string };
  if (!response.ok || !data.user) return { ok: false as const, reason: authReason(data.error) };
  applyUser(data.user);
  return { ok: true as const };
}

export async function signUp(input: { name: string; email: string; password: string }) {
  const response = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "register", name: input.name, email: input.email, password: input.password }),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) return { ok: false as const, reason: authReason(data.error) };
  return { ok: true as const };
}

export async function signInWithGoogleCredential(credential: string) {
  const response = await fetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  const data = (await response.json()) as { user?: Profile; error?: string };
  if (data.error === "link") return { ok: false as const, reason: "link" as const };
  if (data.error === "rate") return { ok: false as const, reason: "rate" as const };
  if (!response.ok || !data.user) return { ok: false as const, reason: "google" as const };
  applyUser(data.user);
  return { ok: true as const };
}

export async function connectGoogle(credential: string) {
  const response = await fetch("/api/auth/google/link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  const data = (await response.json()) as { user?: Profile };
  if (!response.ok || !data.user) return false;
  applyUser(data.user);
  return true;
}

export function signInWithEmail(input: { email: string; password: string; remember: boolean }) {
  return postAuth({
    action: "login",
    email: input.email,
    password: input.password,
    remember: input.remember ? "1" : "0",
  });
}

export async function saveProfile(input: { name: string; password?: string; currentPassword?: string }) {
  const response = await fetch("/api/auth", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as { user?: Profile; error?: string };
  if (!response.ok || !data.user) return authReason(data.error);
  applyUser(data.user);
  return "ok" as const;
}

export async function clearProfile() {
  await fetch("/api/auth", { method: "DELETE" });
  applyUser(null);
}

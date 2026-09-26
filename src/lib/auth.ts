export const AUTH_EVENT = "scentoria-auth";

export type AuthProvider = "email" | "google";

export type Profile = {
  name: string;
  email: string;
  image?: string;
  provider: AuthProvider;
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

async function postAuth(body: Record<string, string | undefined>) {
  const response = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as { user?: Profile; error?: string };
  if (!response.ok || !data.user) return { ok: false as const, reason: data.error === "exists" ? "exists" as const : "password" as const };
  applyUser(data.user);
  return { ok: true as const };
}

export function signUp(input: { name: string; email: string; password: string }) {
  return postAuth({ action: "register", name: input.name, email: input.email, password: input.password });
}

export function signInWithEmail(input: { email: string; password: string }) {
  return postAuth({ action: "login", email: input.email, password: input.password });
}

export function signInWithGoogle(input: { name: string; email: string; image?: string }) {
  return postAuth({ action: "google", name: input.name, email: input.email, image: input.image });
}

export async function saveProfile(input: { name: string; password?: string }) {
  const response = await fetch("/api/auth", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as { user?: Profile };
  if (!response.ok || !data.user) return false;
  applyUser(data.user);
  return true;
}

export async function clearProfile() {
  await fetch("/api/auth", { method: "DELETE" });
  applyUser(null);
}

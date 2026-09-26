export const PROFILE_KEY = "scentoria_profile";
export const USERS_KEY = "scentoria_users";
export const AUTH_EVENT = "scentoria-auth";

export type AuthProvider = "email" | "google";

export type Profile = {
  name: string;
  email: string;
  image?: string;
  provider: AuthProvider;
  password?: string;
};

export function emptyProfile(): Profile {
  return { name: "", email: "", provider: "email" };
}

function normalize(parsed: Partial<Profile> | null | undefined): Profile {
  if (!parsed) return emptyProfile();
  return {
    name: parsed.name ?? "",
    email: parsed.email ?? "",
    image: parsed.image || undefined,
    provider: parsed.provider === "google" ? "google" : "email",
    password: parsed.password,
  };
}

export function loadProfile(): Profile {
  if (typeof window === "undefined") return emptyProfile();
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return emptyProfile();
    return normalize(JSON.parse(raw) as Profile);
  } catch {
    return emptyProfile();
  }
}

function loadUsers(): Profile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Profile[];
    return Array.isArray(parsed) ? parsed.map((user) => normalize(user)) : [];
  } catch {
    return [];
  }
}

function findUser(email: string): Profile | undefined {
  const key = email.trim().toLowerCase();
  return loadUsers().find((user) => user.email.toLowerCase() === key);
}

export function nameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "";
  const words = local.split(/[._+-]+/).filter(Boolean);
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export function isLoggedIn(): boolean {
  const profile = loadProfile();
  return Boolean(profile.name.trim() || profile.email.trim());
}

function notifyAuth() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function saveProfile(profile: Profile) {
  const next = normalize(profile);
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  const users = loadUsers().filter((user) => user.email.toLowerCase() !== next.email.toLowerCase());
  users.push(next);
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  notifyAuth();
}

export function clearProfile() {
  window.localStorage.removeItem(PROFILE_KEY);
  notifyAuth();
}

export function signInWithEmail(input: {
  name: string;
  email: string;
  password: string;
}): { ok: true } | { ok: false; reason: "password" } {
  const email = input.email.trim();
  const existing = findUser(email);
  if (existing?.provider === "email" && existing.password && existing.password !== input.password) {
    return { ok: false, reason: "password" };
  }
  const google = existing?.provider === "google";
  saveProfile({
    name: input.name.trim() || existing?.name || nameFromEmail(email),
    email,
    image: existing?.image,
    provider: google ? "google" : "email",
    password: google ? undefined : input.password,
  });
  return { ok: true };
}

export function signInWithGoogle(input: { name: string; email: string; image?: string }) {
  const email = input.email.trim();
  const existing = findUser(email);
  saveProfile({
    name: input.name.trim() || existing?.name || nameFromEmail(email),
    email,
    image: input.image || existing?.image,
    provider: "google",
  });
}

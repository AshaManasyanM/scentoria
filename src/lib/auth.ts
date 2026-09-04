export const PROFILE_KEY = "scentoria_profile";
export const AUTH_EVENT = "scentoria-auth";

export type Profile = { name: string; email: string };

export function emptyProfile(): Profile {
  return { name: "", email: "" };
}

export function loadProfile(): Profile {
  if (typeof window === "undefined") return emptyProfile();
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return emptyProfile();
    const parsed = JSON.parse(raw) as Profile;
    return { name: parsed.name ?? "", email: parsed.email ?? "" };
  } catch {
    return emptyProfile();
  }
}

export function isLoggedIn(): boolean {
  const profile = loadProfile();
  return Boolean(profile.name.trim() || profile.email.trim());
}

function notifyAuth() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function saveProfile(profile: Profile) {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  notifyAuth();
}

export function clearProfile() {
  window.localStorage.removeItem(PROFILE_KEY);
  notifyAuth();
}

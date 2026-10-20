export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 256;
export const SESSION_REMEMBER_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_SHORT_MS = 4 * 60 * 60 * 1000;

export function newPasswordError(password: string) {
  if (!password) return "missing" as const;
  if (password.length < MIN_PASSWORD) return "short" as const;
  if (password.length > MAX_PASSWORD) return "long" as const;
  return null;
}

export function loginPasswordAllowed(password: string) {
  return password.length > 0 && password.length <= MAX_PASSWORD;
}

export function sessionLifetime(remember: boolean) {
  return remember ? SESSION_REMEMBER_MS : SESSION_SHORT_MS;
}

export function expiryFrom(now: number, lifetimeMs: number) {
  return new Date(now + lifetimeMs).toISOString();
}

export function preservedSessionExpiry(createdAt: string, now = Date.now()) {
  const created = Date.parse(createdAt);
  const fromCreated = (Number.isFinite(created) ? created : now) + SESSION_REMEMBER_MS;
  return new Date(Math.max(fromCreated, now + SESSION_REMEMBER_MS)).toISOString();
}

export function sessionIsExpired(expiresAt: string | null | undefined, now = Date.now()) {
  if (!expiresAt) return false;
  const time = Date.parse(expiresAt);
  return Number.isFinite(time) && time <= now;
}

export function sessionCookieOptions(remember: boolean) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    ...(remember ? { maxAge: SESSION_REMEMBER_MS / 1000 } : {}),
  };
}

export function browserCookieOptions(httpOnly: boolean) {
  return {
    httpOnly,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  };
}

export function googleLoginDisabled(action: string | undefined) {
  return action === "google";
}

export function contactFieldsValid(input: {
  fullName: string;
  email: string;
  subject: string;
  phone: string;
  details: string;
}) {
  if (input.fullName.length < 1 || input.fullName.length > 80) return false;
  if (!input.email.includes("@") || input.email.length > 254) return false;
  if (input.subject.length < 1 || input.subject.length > 120) return false;
  if (input.phone.length > 40) return false;
  if (input.details.length > 2000) return false;
  return true;
}

export function securityHeaders() {
  const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "frame-src https://accounts.google.com",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",
    "style-src 'self' 'unsafe-inline' https://accounts.google.com",
    "img-src 'self' data: blob: https://cdn.shopify.com https://images.unsplash.com https://*.googleusercontent.com https://www.gstatic.com https://accounts.google.com",
    "font-src 'self'",
    "connect-src 'self' https://accounts.google.com",
  ].join("; ");

  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ];
}

export function upstashCount(payload: unknown) {
  if (!Array.isArray(payload) || !payload.length) return null;
  const first = payload[0] as { result?: unknown; error?: unknown };
  if (!first || first.error) return null;
  const count = Number(first.result);
  return Number.isFinite(count) ? count : null;
}

export type GoogleIdentity = {
  sub: string;
  email: string;
  name: string;
  picture: string | null;
};

export type GoogleLinkPlan =
  | { action: "sign-in"; userId: number }
  | { action: "confirm"; userId: number }
  | { action: "create" }
  | { action: "reject" };

type ExistingAccount = { id: number; googleSub: string | null };

function googlePicture(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (!url.hostname.endsWith(".googleusercontent.com")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function googleIdentityFromPayload(payload: unknown, clientId: string, now = Date.now()): GoogleIdentity | null {
  if (!clientId || !payload || typeof payload !== "object") return null;
  const claim = payload as Record<string, unknown>;
  const issuer = claim.iss;
  if (issuer !== "https://accounts.google.com" && issuer !== "accounts.google.com") return null;
  const audience = claim.aud;
  const audiences = Array.isArray(audience) ? audience : [audience];
  if (!audiences.includes(clientId)) return null;
  const expires = Number(claim.exp);
  if (!Number.isFinite(expires) || expires * 1000 <= now) return null;
  if (claim.email_verified !== true && claim.email_verified !== "true") return null;
  const email = typeof claim.email === "string" ? claim.email.trim().toLowerCase() : "";
  const sub = typeof claim.sub === "string" ? claim.sub.trim() : "";
  if (!email.includes("@") || email.length > 254 || !sub || sub.length > 255) return null;
  const givenName = typeof claim.name === "string" ? claim.name.trim().slice(0, 80) : "";
  const picture = googlePicture(claim.picture);
  return { sub, email, name: givenName || email.split("@")[0] || email, picture };
}

export function googleLinkPlan(input: {
  sub: string;
  existingBySub: ExistingAccount | null;
  existingByEmail: ExistingAccount | null;
}): GoogleLinkPlan {
  if (input.existingBySub) return { action: "sign-in", userId: input.existingBySub.id };
  if (!input.existingByEmail) return { action: "create" };
  if (input.existingByEmail.googleSub === input.sub) return { action: "sign-in", userId: input.existingByEmail.id };
  if (!input.existingByEmail.googleSub) return { action: "confirm", userId: input.existingByEmail.id };
  return { action: "reject" };
}

export async function verifyGoogleCredential(credential: string): Promise<GoogleIdentity | null> {
  if (!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(credential)) return null;
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  if (!clientId) return null;
  try {
    const { createRemoteJWKSet, jwtVerify } = await import("jose");
    const keys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
    const verified = await jwtVerify(credential, keys, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: clientId,
    });
    return googleIdentityFromPayload(verified.payload, clientId);
  } catch {
    return null;
  }
}

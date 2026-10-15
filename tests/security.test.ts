import assert from "node:assert/strict";
import test from "node:test";
import { googleIdentityFromPayload, googleLinkPlan } from "../src/lib/google-identity.ts";
import {
  browserCookieOptions,
  contactFieldsValid,
  expiryFrom,
  googleLoginDisabled,
  loginPasswordAllowed,
  newPasswordError,
  preservedSessionExpiry,
  securityHeaders,
  sessionCookieOptions,
  sessionIsExpired,
  sessionLifetime,
  upstashCount,
} from "../src/lib/security.ts";

test("google login action is rejected before any account lookup", () => {
  assert.equal(googleLoginDisabled("google"), true);
  assert.equal(googleLoginDisabled("login"), false);
  assert.equal(googleLoginDisabled("register"), false);
});

test("new passwords need 8 to 256 characters and existing logins keep shorter passwords", () => {
  assert.equal(newPasswordError("short"), "short");
  assert.equal(newPasswordError("long-enough"), null);
  assert.equal(newPasswordError("x".repeat(257)), "long");
  assert.equal(loginPasswordAllowed("short"), true);
  assert.equal(loginPasswordAllowed("x".repeat(257)), false);
});

test("sessions expire and remembered cookies stay httpOnly", () => {
  assert.equal(sessionLifetime(true) > sessionLifetime(false), true);
  const remembered = sessionCookieOptions(true);
  assert.equal(remembered.httpOnly, true);
  assert.equal(remembered.sameSite, "lax");
  assert.equal(typeof remembered.maxAge, "number");
  const visiting = sessionCookieOptions(false);
  assert.equal("maxAge" in visiting, false);
  assert.equal(browserCookieOptions(true).sameSite, "lax");
  const past = expiryFrom(Date.now() - 60_000, 1_000);
  assert.equal(sessionIsExpired(past), true);
  assert.equal(sessionIsExpired(expiryFrom(Date.now(), 60_000)), false);
});

test("existing sessions keep at least thirty days from the migration", () => {
  const now = Date.parse("2026-10-12T00:00:00.000Z");
  const old = preservedSessionExpiry("2026-01-01T00:00:00.000Z", now);
  assert.equal(Date.parse(old) >= now + 30 * 24 * 60 * 60 * 1000, true);
});

test("security headers block framing and sniffing", () => {
  const headers = Object.fromEntries(securityHeaders().map((header) => [header.key, header.value]));
  assert.match(headers["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.match(headers["Content-Security-Policy"], /frame-src https:\/\/accounts\.google\.com/);
  assert.match(headers["Content-Security-Policy"], /style-src[^;]*https:\/\/accounts\.google\.com/);
  assert.match(headers["Content-Security-Policy"], /https:\/\/\*\.googleusercontent\.com/);
  assert.match(headers["Content-Security-Policy"], /https:\/\/cdn\.shopify\.com/);
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.match(headers["Strict-Transport-Security"], /max-age=63072000/);
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
});

test("contact fields reject oversized input", () => {
  assert.equal(
    contactFieldsValid({ fullName: "A", email: "a@b.co", subject: "Hi", phone: "", details: "" }),
    true,
  );
  assert.equal(
    contactFieldsValid({ fullName: "A", email: "a@b.co", subject: "Hi", phone: "", details: "x".repeat(2001) }),
    false,
  );
});

test("google identity is accepted only from a verified token payload", () => {
  const now = Date.parse("2026-10-12T00:00:00.000Z");
  const payload = {
    iss: "https://accounts.google.com",
    aud: "scentoria-client",
    exp: Math.floor(now / 1000) + 60,
    email: "Customer@Example.com",
    email_verified: true,
    sub: "google-subject",
    name: "Customer",
    picture: "https://lh3.googleusercontent.com/a/photo",
  };
  const identity = googleIdentityFromPayload(payload, "scentoria-client", now);
  assert.equal(identity?.email, "customer@example.com");
  assert.equal(identity?.sub, "google-subject");
  assert.equal(googleIdentityFromPayload({ ...payload, email_verified: false }, "scentoria-client", now), null);
  assert.equal(googleIdentityFromPayload({ ...payload, aud: "other-client" }, "scentoria-client", now), null);
  assert.equal(googleIdentityFromPayload({ ...payload, picture: "javascript:alert(1)" }, "scentoria-client", now)?.picture, null);
  assert.equal(
    googleIdentityFromPayload({ ...payload, picture: `https://lh3.googleusercontent.com/a/${"p".repeat(600)}` }, "scentoria-client", now)?.picture?.startsWith("https://lh3.googleusercontent.com/"),
    true,
  );
});

test("google sign-in does not attach itself to an existing password account", () => {
  assert.deepEqual(
    googleLinkPlan({ sub: "google-subject", existingBySub: null, existingByEmail: { id: 4, googleSub: null } }),
    { action: "confirm", userId: 4 },
  );
  assert.deepEqual(
    googleLinkPlan({ sub: "other-subject", existingBySub: null, existingByEmail: { id: 4, googleSub: "google-subject" } }),
    { action: "reject" },
  );
  assert.deepEqual(googleLinkPlan({ sub: "new-subject", existingBySub: null, existingByEmail: null }), { action: "create" });
});

test("upstash pipeline count is read from the first result", () => {
  assert.equal(upstashCount([{ result: 3 }, { result: 1 }]), 3);
  assert.equal(upstashCount([{ error: "NOAUTH" }]), null);
  assert.equal(upstashCount({}), null);
});

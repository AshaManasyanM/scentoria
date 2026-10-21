import assert from "node:assert/strict";
import mysql from "mysql2/promise";
import test from "node:test";

const base = process.env.SCENTORIA_BASE_URL ?? "http://127.0.0.1:3000";
const email = "security-regression@example.com";
const password = "correct-horse";
const replacement = "correct-horse-2";

async function send(method, path, payload, cookie = "") {
  const response = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : {}, headers: response.headers };
}

function post(path, payload, cookie = "") {
  return send("POST", path, payload, cookie);
}

async function removeTestAccount(target = email) {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_DATABASE || "scentoria",
  });
  const [rows] = await db.execute("SELECT id FROM users WHERE email = ?", [target]);
  const row = rows[0];
  if (row) {
    await db.execute("DELETE FROM addresses WHERE user_id = ?", [row.id]);
    await db.execute("DELETE FROM sessions WHERE user_id = ?", [row.id]);
    await db.execute("DELETE FROM reviews WHERE user_id = ?", [row.id]);
    await db.execute("DELETE FROM users WHERE id = ? AND email = ?", [row.id, target]);
  }
  await db.end();
}

test("live auth rejects google and protects email accounts", async () => {
  const google = await post("/api/auth", { action: "google", email, name: "Nope" });
  assert.equal(google.status, 403);
  assert.equal(google.body.error, "disabled");
  assert.equal(google.headers.get("set-cookie"), null);

  const short = await post("/api/auth", { action: "register", email, password: "short" });
  assert.equal(short.status, 400);
  assert.equal(short.body.error, "short");

  const created = await post("/api/auth", { action: "register", name: "Security Check", email, password });
  assert.equal(created.status, 200);
  const duplicate = await post("/api/auth", { action: "register", name: "Other", email, password: replacement });
  assert.equal(duplicate.status, 200);

  const login = await post("/api/auth", { action: "login", email, password, remember: "1" });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.email, email);
  assert.equal(login.body.user.googleLinked, false);
  const setCookie = login.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /scentoria_session=/);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Lax/i);
  const cookie = setCookie.split(";")[0];

  const fake = await post("/api/auth/google", { credential: "not-a-token" });
  assert.equal(fake.status, 401);
  assert.equal(fake.headers.get("set-cookie"), null);
  const linkMissing = await post("/api/auth/google/link", { credential: "not-a-token" });
  assert.equal(linkMissing.status, 401);
  const linkFake = await post("/api/auth/google/link", { credential: "not-a-token" }, cookie);
  assert.equal(linkFake.status, 401);
  assert.equal(linkFake.headers.get("set-cookie"), null);
  const hidden = await send("GET", "/api/addresses");
  assert.equal(hidden.status, 401);
  const saved = await send(
    "POST",
    "/api/addresses",
    {
      label: "Home",
      firstName: "A",
      lastName: "B",
      phone: "",
      address1: "714 E Palm Ave",
      city: "Burbank",
      zip: "91501",
      countryCode: "US",
      provinceCode: "CA",
      isDefault: true,
    },
    cookie,
  );
  assert.equal(saved.status, 200);
  assert.equal(saved.body.address.provinceCode, "CA");
  const rejected = await send("POST", "/api/addresses", { ...saved.body.address, provinceCode: "", id: undefined }, cookie);
  assert.equal(rejected.status, 400);
  const listed = await send("GET", "/api/addresses", undefined, cookie);
  assert.equal(listed.body.addresses.length, 1);
  const removed = await send("DELETE", `/api/addresses?id=${saved.body.address.id}`, undefined, cookie);
  assert.equal(removed.status, 200);
  assert.equal(removed.body.addresses.length, 0);

  const replaced = await post("/api/auth", { action: "login", email, password: replacement });
  assert.equal(replaced.status, 401);

  const missingCurrent = await send("PATCH", "/api/auth", { password: replacement }, cookie);
  assert.equal(missingCurrent.status, 401);
  const changed = await send("PATCH", "/api/auth", { password: replacement, currentPassword: password }, cookie);
  assert.equal(changed.status, 200);
  const nextLogin = await post("/api/auth", { action: "login", email, password: replacement, remember: "0" });
  assert.equal(nextLogin.status, 200);
  const visiting = nextLogin.headers.get("set-cookie") ?? "";
  assert.equal(/Max-Age=/i.test(visiting), false);

  await removeTestAccount();
  const gone = await post("/api/auth", { action: "login", email, password: replacement });
  assert.equal(gone.status, 401);
});

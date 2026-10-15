import type { AddressDraft, SavedAddress } from "@/lib/address-book";
import { expiryFrom, preservedSessionExpiry, sessionIsExpired, SESSION_REMEMBER_MS } from "@/lib/security";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { createRequire } from "module";
import fs from "fs";
import path from "path";

export type StoredUser = {
  id: number;
  email: string;
  name: string;
  image: string | null;
  provider: "email" | "google";
  passwordHash: string | null;
  googleSub: string | null;
};

type UserRow = {
  id: number;
  email: string;
  name: string;
  image: string | null;
  provider: "email" | "google";
  password_hash: string | null;
  google_sub: string | null;
};

type Statement = {
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
  run(...params: unknown[]): { lastInsertRowid: number | bigint };
};

type SqliteDatabase = {
  exec(sql: string): void;
  prepare(sql: string): Statement;
};

const require = createRequire(path.join(process.cwd(), "package.json"));

let db: SqliteDatabase | null = null;

function database() {
  if (db) return db;
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const { DatabaseSync } = require("node:sqlite") as {
    DatabaseSync: new (filename: string) => SqliteDatabase;
  };
  const next = new DatabaseSync(path.join(dir, "scentoria.sqlite"));
  next.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      image TEXT,
      provider TEXT NOT NULL,
      password_hash TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY,
      product_handle TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      UNIQUE(product_handle, user_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS stat_votes (
      id INTEGER PRIMARY KEY,
      product_handle TEXT NOT NULL,
      category TEXT NOT NULL,
      option_key TEXT NOT NULL,
      voter_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(product_handle, category, voter_id)
    );
  `);
  ensureSessionExpiry(next);
  ensureAccountColumns(next);
  db = next;
  return next;
}

function ensureSessionExpiry(connection: SqliteDatabase) {
  const columns = connection.prepare("PRAGMA table_info(sessions)").all() as { name: string }[];
  if (!columns.some((column) => column.name === "expires_at")) {
    connection.exec("ALTER TABLE sessions ADD COLUMN expires_at TEXT");
  }
  const open = connection
    .prepare("SELECT token, created_at FROM sessions WHERE expires_at IS NULL")
    .all() as { token: string; created_at: string }[];
  const update = connection.prepare("UPDATE sessions SET expires_at = ? WHERE token = ?");
  for (const row of open) update.run(preservedSessionExpiry(row.created_at), row.token);
}

function ensureAccountColumns(connection: SqliteDatabase) {
  const columns = connection.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!columns.some((column) => column.name === "google_sub")) {
    connection.exec("ALTER TABLE users ADD COLUMN google_sub TEXT");
  }
  connection.exec(
    "CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_unique ON users(google_sub) WHERE google_sub IS NOT NULL",
  );
  connection.exec(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      label TEXT NOT NULL DEFAULT '',
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      address1 TEXT NOT NULL,
      city TEXT NOT NULL,
      zip TEXT NOT NULL DEFAULT '',
      country_code TEXT NOT NULL,
      province_code TEXT NOT NULL DEFAULT '',
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

function mapUser(row: UserRow): StoredUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    image: row.image,
    provider: row.provider,
    passwordHash: row.password_hash,
    googleSub: row.google_sub,
  };
}

const MAX_PASSWORD = 256;

export function hashPassword(password: string) {
  if (password.length > MAX_PASSWORD) throw new Error("password-too-long");
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  if (password.length > MAX_PASSWORD) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 32);
  const previous = Buffer.from(hash, "hex");
  if (next.length !== previous.length) return false;
  return timingSafeEqual(next, previous);
}

export function findUserByEmail(email: string) {
  const row = database()
    .prepare("SELECT id, email, name, image, provider, password_hash, google_sub FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as UserRow | undefined;
  return row ? mapUser(row) : undefined;
}

export function findUserBySession(token: string) {
  const row = database()
    .prepare(
      `SELECT users.id, users.email, users.name, users.image, users.provider, users.password_hash,
              users.google_sub, sessions.expires_at
       FROM sessions JOIN users ON users.id = sessions.user_id
       WHERE sessions.token = ?`,
    )
    .get(token) as (UserRow & { expires_at: string | null }) | undefined;
  if (!row) return undefined;
  if (sessionIsExpired(row.expires_at)) {
    deleteSession(token);
    return undefined;
  }
  return mapUser(row);
}

export function findUserByGoogleSub(sub: string) {
  const row = database()
    .prepare("SELECT id, email, name, image, provider, password_hash, google_sub FROM users WHERE google_sub = ?")
    .get(sub) as UserRow | undefined;
  return row ? mapUser(row) : undefined;
}

export function attachGoogleSub(id: number, sub: string) {
  const current = database()
    .prepare("SELECT id, email, name, image, provider, password_hash, google_sub FROM users WHERE id = ?")
    .get(id) as UserRow | undefined;
  if (!current) return undefined;
  if (current.google_sub && current.google_sub !== sub) return undefined;
  const taken = findUserByGoogleSub(sub);
  if (taken && taken.id !== id) return undefined;
  database().prepare("UPDATE users SET google_sub = ? WHERE id = ?").run(sub, id);
  return findUserByEmail(current.email);
}

export function createUser(input: {
  email: string;
  name: string;
  image?: string;
  provider: "email" | "google";
  passwordHash?: string;
  googleSub?: string;
}) {
  const email = input.email.trim().toLowerCase();
  database()
    .prepare(
      "INSERT INTO users (email, name, image, provider, password_hash, google_sub, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(
      email,
      input.name.trim(),
      input.image ?? null,
      input.provider,
      input.passwordHash ?? null,
      input.googleSub ?? null,
      new Date().toISOString(),
    );
  const user = findUserByEmail(email);
  if (!user) throw new Error("Could not save the account");
  return user;
}

export function updateUser(
  id: number,
  input: { name?: string; image?: string | null; provider?: "email" | "google"; passwordHash?: string | null },
) {
  const current = database()
    .prepare("SELECT id, email, name, image, provider, password_hash, google_sub FROM users WHERE id = ?")
    .get(id) as UserRow | undefined;
  if (!current) return undefined;
  database()
    .prepare("UPDATE users SET name = ?, image = ?, provider = ?, password_hash = ? WHERE id = ?")
    .run(
      input.name ?? current.name,
      input.image === undefined ? current.image : input.image,
      input.provider ?? current.provider,
      input.passwordHash === undefined ? current.password_hash : input.passwordHash,
      id,
    );
  return findUserByEmail(current.email);
}

export function createSession(userId: number, lifetimeMs = SESSION_REMEMBER_MS) {
  const token = randomBytes(32).toString("hex");
  const now = new Date().toISOString();
  database()
    .prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .run(token, userId, now, expiryFrom(Date.now(), lifetimeMs));
  return token;
}

export function deleteSession(token: string) {
  database().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export type ReviewSummary = { rating: number; count: number };

export function reviewSummaries(handles: string[]) {
  const summaries = new Map<string, ReviewSummary>();
  if (!handles.length) return summaries;
  const rows = database()
    .prepare(
      `SELECT product_handle, COUNT(*) AS count, AVG(rating) AS rating
       FROM reviews WHERE product_handle IN (${handles.map(() => "?").join(",")})
       GROUP BY product_handle`,
    )
    .all(...handles) as { product_handle: string; count: number; rating: number | null }[];
  for (const row of rows) {
    summaries.set(row.product_handle, {
      count: Number(row.count) || 0,
      rating: row.count ? Number(row.rating) || 0 : 0,
    });
  }
  return summaries;
}

export type StoredReview = {
  id: number;
  userId: number;
  name: string;
  rating: number;
  body: string;
  createdAt: string;
};

export function listReviews(handle: string) {
  const rows = database()
    .prepare(
      `SELECT reviews.id, reviews.user_id AS userId, reviews.rating, reviews.body,
              reviews.created_at AS createdAt, users.name
       FROM reviews JOIN users ON users.id = reviews.user_id
       WHERE reviews.product_handle = ? AND trim(reviews.body) != ''
       ORDER BY reviews.created_at DESC`,
    )
    .all(handle) as StoredReview[];
  return rows.map((row) => ({
    id: Number(row.id),
    userId: Number(row.userId),
    name: row.name,
    rating: Number(row.rating),
    body: row.body,
    createdAt: row.createdAt,
  }));
}

export function findReview(handle: string, userId: number) {
  return database()
    .prepare("SELECT rating, body FROM reviews WHERE product_handle = ? AND user_id = ?")
    .get(handle, userId) as { rating: number; body: string } | undefined;
}

export function saveReview(handle: string, userId: number, rating: number, body: string) {
  database()
    .prepare(
      `INSERT INTO reviews (product_handle, user_id, rating, body, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(product_handle, user_id) DO UPDATE SET
         rating = excluded.rating,
         body = excluded.body,
         created_at = excluded.created_at`,
    )
    .run(handle, userId, rating, body, new Date().toISOString());
  return reviewSummaries([handle]).get(handle) ?? { rating: 0, count: 0 };
}

export type StatVoteCounts = Record<string, Record<string, number>>;

export function statVoteCounts(handle: string): StatVoteCounts {
  const counts: StatVoteCounts = { longevity: {}, season: {}, sillage: {}, time: {} };
  const rows = database()
    .prepare(
      `SELECT category, option_key, COUNT(*) AS count
       FROM stat_votes WHERE product_handle = ?
       GROUP BY category, option_key`,
    )
    .all(handle) as { category: string; option_key: string; count: number }[];
  for (const row of rows) {
    if (!counts[row.category]) continue;
    counts[row.category][row.option_key] = Number(row.count);
  }
  return counts;
}

type AddressRow = {
  id: number;
  label: string;
  first_name: string;
  last_name: string;
  phone: string;
  address1: string;
  city: string;
  zip: string;
  country_code: string;
  province_code: string;
  is_default: number;
};

function mapAddress(row: AddressRow): SavedAddress {
  return {
    id: Number(row.id),
    label: row.label,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    address1: row.address1,
    city: row.city,
    zip: row.zip,
    countryCode: row.country_code,
    provinceCode: row.province_code,
    isDefault: row.is_default === 1,
  };
}

export function listAddresses(userId: number) {
  const rows = database()
    .prepare(
      `SELECT id, label, first_name, last_name, phone, address1, city, zip, country_code, province_code, is_default
       FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id ASC`,
    )
    .all(userId) as AddressRow[];
  return rows.map(mapAddress);
}

export function countAddresses(userId: number) {
  const row = database().prepare("SELECT COUNT(*) AS count FROM addresses WHERE user_id = ?").get(userId) as { count: number };
  return Number(row.count) || 0;
}

function markDefault(userId: number, addressId: number) {
  database().prepare("UPDATE addresses SET is_default = 0 WHERE user_id = ?").run(userId);
  database().prepare("UPDATE addresses SET is_default = 1 WHERE user_id = ? AND id = ?").run(userId, addressId);
}

export function createAddress(userId: number, input: AddressDraft) {
  const inserted = database()
    .prepare(
      `INSERT INTO addresses
        (user_id, label, first_name, last_name, phone, address1, city, zip, country_code, province_code, is_default, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    )
    .run(
      userId,
      input.label,
      input.firstName,
      input.lastName,
      input.phone,
      input.address1,
      input.city,
      input.zip,
      input.countryCode,
      input.provinceCode,
      new Date().toISOString(),
    );
  const id = Number(inserted.lastInsertRowid);
  if (input.isDefault) markDefault(userId, id);
  return listAddresses(userId).find((address) => address.id === id);
}

export function updateAddress(userId: number, id: number, input: AddressDraft) {
  const owned = database().prepare("SELECT id FROM addresses WHERE id = ? AND user_id = ?").get(id, userId);
  if (!owned) return undefined;
  database()
    .prepare(
      `UPDATE addresses SET label = ?, first_name = ?, last_name = ?, phone = ?, address1 = ?, city = ?, zip = ?,
        country_code = ?, province_code = ? WHERE id = ? AND user_id = ?`,
    )
    .run(
      input.label,
      input.firstName,
      input.lastName,
      input.phone,
      input.address1,
      input.city,
      input.zip,
      input.countryCode,
      input.provinceCode,
      id,
      userId,
    );
  if (input.isDefault) markDefault(userId, id);
  return listAddresses(userId).find((address) => address.id === id);
}

export function deleteAddress(userId: number, id: number) {
  const owned = database().prepare("SELECT id FROM addresses WHERE id = ? AND user_id = ?").get(id, userId);
  if (!owned) return false;
  database().prepare("DELETE FROM addresses WHERE id = ? AND user_id = ?").run(id, userId);
  return true;
}

export function addStatVote(handle: string, category: string, optionKey: string, voterId: string) {
  const existing = database()
    .prepare("SELECT id FROM stat_votes WHERE product_handle = ? AND category = ? AND voter_id = ?")
    .get(handle, category, voterId);
  if (existing) return false;
  database()
    .prepare(
      `INSERT INTO stat_votes (product_handle, category, option_key, voter_id, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(handle, category, optionKey, voterId, new Date().toISOString());
  return true;
}

import type { AddressDraft, SavedAddress } from "@/lib/address-book";
import { expiryFrom, sessionIsExpired, SESSION_REMEMBER_MS } from "@/lib/security";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

export type StoredUser = {
  id: number;
  email: string;
  name: string;
  image: string | null;
  provider: "email" | "google";
  passwordHash: string | null;
  googleSub: string | null;
};

type UserRow = RowDataPacket & {
  id: number;
  email: string;
  name: string;
  image: string | null;
  provider: "email" | "google";
  password_hash: string | null;
  google_sub: string | null;
};

const boot = globalThis as typeof globalThis & { __scentoriaDevSessionsCleared?: boolean };

let pool: Pool | null = null;
let ready: Promise<void> | null = null;

function databaseName() {
  const name = process.env.DB_DATABASE || "scentoria";
  if (!/^[A-Za-z0-9_]+$/.test(name)) throw new Error("database");
  return name;
}

function connectionOptions(database?: string) {
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD ?? "",
    database,
    charset: "utf8mb4",
  };
}

async function database() {
  if (!ready) ready = openDatabase();
  try {
    await ready;
  } catch (error) {
    ready = null;
    pool = null;
    throw error;
  }
  if (!pool) throw new Error("database");
  return pool;
}

async function openDatabase() {
  const name = databaseName();
  const admin = await mysql.createConnection(connectionOptions());
  await admin.query(
    `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await admin.end();
  const next = mysql.createPool({ ...connectionOptions(name), waitForConnections: true, connectionLimit: 10 });
  await next.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT NOT NULL AUTO_INCREMENT,
      email VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      image TEXT NULL,
      provider VARCHAR(32) NOT NULL,
      password_hash TEXT NULL,
      google_sub VARCHAR(255) NULL,
      created_at VARCHAR(40) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY users_email_unique (email),
      UNIQUE KEY users_google_sub_unique (google_sub)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await next.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token VARCHAR(64) NOT NULL,
      user_id INT NOT NULL,
      created_at VARCHAR(40) NOT NULL,
      expires_at VARCHAR(40) NULL,
      PRIMARY KEY (token),
      KEY sessions_user_id (user_id),
      CONSTRAINT sessions_user_fk FOREIGN KEY (user_id) REFERENCES users (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await next.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT NOT NULL AUTO_INCREMENT,
      product_handle VARCHAR(255) NOT NULL,
      user_id INT NOT NULL,
      rating INT NOT NULL,
      body TEXT NOT NULL,
      created_at VARCHAR(40) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY reviews_product_user (product_handle, user_id),
      CONSTRAINT reviews_user_fk FOREIGN KEY (user_id) REFERENCES users (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await next.query(`
    CREATE TABLE IF NOT EXISTS stat_votes (
      id INT NOT NULL AUTO_INCREMENT,
      product_handle VARCHAR(255) NOT NULL,
      category VARCHAR(64) NOT NULL,
      option_key VARCHAR(64) NOT NULL,
      voter_id VARCHAR(255) NOT NULL,
      created_at VARCHAR(40) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY stat_votes_unique (product_handle, category, voter_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await next.query(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INT NOT NULL AUTO_INCREMENT,
      user_id INT NOT NULL,
      label VARCHAR(255) NOT NULL DEFAULT '',
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      phone VARCHAR(64) NOT NULL DEFAULT '',
      address1 VARCHAR(255) NOT NULL,
      city VARCHAR(255) NOT NULL,
      zip VARCHAR(32) NOT NULL DEFAULT '',
      country_code VARCHAR(8) NOT NULL,
      province_code VARCHAR(16) NOT NULL DEFAULT '',
      is_default TINYINT NOT NULL DEFAULT 0,
      created_at VARCHAR(40) NOT NULL,
      PRIMARY KEY (id),
      KEY addresses_user_id (user_id),
      CONSTRAINT addresses_user_fk FOREIGN KEY (user_id) REFERENCES users (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  if (process.env.NODE_ENV !== "production" && !boot.__scentoriaDevSessionsCleared) {
    boot.__scentoriaDevSessionsCleared = true;
    await next.query("DELETE FROM sessions");
  }
  pool = next;
}

type SqlValue = string | number | null;

async function rows<T extends RowDataPacket>(sql: string, params: SqlValue[] = []) {
  const [result] = await (await database()).execute<T[]>(sql, params);
  return result;
}

async function first<T extends RowDataPacket>(sql: string, params: SqlValue[] = []) {
  return (await rows<T>(sql, params))[0];
}

async function run(sql: string, params: SqlValue[] = []) {
  const [result] = await (await database()).execute<ResultSetHeader>(sql, params);
  return result;
}

const USER_COLUMNS = "id, email, name, image, provider, password_hash, google_sub";

function mapUser(row: UserRow): StoredUser {
  return {
    id: Number(row.id),
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

export async function findUserByEmail(email: string) {
  const row = await first<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE email = ?`, [email.trim().toLowerCase()]);
  return row ? mapUser(row) : undefined;
}

export async function findUserBySession(token: string) {
  const row = await first<UserRow & { expires_at: string | null }>(
    `SELECT users.id, users.email, users.name, users.image, users.provider, users.password_hash,
            users.google_sub, sessions.expires_at
     FROM sessions JOIN users ON users.id = sessions.user_id
     WHERE sessions.token = ?`,
    [token],
  );
  if (!row) return undefined;
  if (sessionIsExpired(row.expires_at)) {
    await deleteSession(token);
    return undefined;
  }
  return mapUser(row);
}

export async function findUserByGoogleSub(sub: string) {
  const row = await first<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE google_sub = ?`, [sub]);
  return row ? mapUser(row) : undefined;
}

export async function attachGoogleSub(id: number, sub: string) {
  const current = await first<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [id]);
  if (!current) return undefined;
  if (current.google_sub && current.google_sub !== sub) return undefined;
  const taken = await findUserByGoogleSub(sub);
  if (taken && taken.id !== id) return undefined;
  await run("UPDATE users SET google_sub = ? WHERE id = ?", [sub, id]);
  return findUserByEmail(current.email);
}

export async function createUser(input: {
  email: string;
  name: string;
  image?: string;
  provider: "email" | "google";
  passwordHash?: string;
  googleSub?: string;
}) {
  const email = input.email.trim().toLowerCase();
  await run(
    "INSERT INTO users (email, name, image, provider, password_hash, google_sub, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [email, input.name.trim(), input.image ?? null, input.provider, input.passwordHash ?? null, input.googleSub ?? null, new Date().toISOString()],
  );
  const user = await findUserByEmail(email);
  if (!user) throw new Error("Could not save the account");
  return user;
}

export async function updateUser(
  id: number,
  input: { name?: string; image?: string | null; provider?: "email" | "google"; passwordHash?: string | null },
) {
  const current = await first<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [id]);
  if (!current) return undefined;
  await run("UPDATE users SET name = ?, image = ?, provider = ?, password_hash = ? WHERE id = ?", [
    input.name ?? current.name,
    input.image === undefined ? current.image : input.image,
    input.provider ?? current.provider,
    input.passwordHash === undefined ? current.password_hash : input.passwordHash,
    id,
  ]);
  return findUserByEmail(current.email);
}

export async function createSession(userId: number, lifetimeMs = SESSION_REMEMBER_MS) {
  const token = randomBytes(32).toString("hex");
  const now = new Date().toISOString();
  await run("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)", [
    token,
    userId,
    now,
    expiryFrom(Date.now(), lifetimeMs),
  ]);
  return token;
}

export async function deleteSession(token: string) {
  await run("DELETE FROM sessions WHERE token = ?", [token]);
}

export type ReviewSummary = { rating: number; count: number };

export async function reviewSummaries(handles: string[]) {
  const summaries = new Map<string, ReviewSummary>();
  if (!handles.length) return summaries;
  const result = await rows<RowDataPacket & { product_handle: string; count: number; rating: number | null }>(
    `SELECT product_handle, COUNT(*) AS count, AVG(rating) AS rating
     FROM reviews WHERE product_handle IN (${handles.map(() => "?").join(",")})
     GROUP BY product_handle`,
    handles,
  );
  for (const row of result) {
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

export async function listReviews(handle: string) {
  const result = await rows<RowDataPacket & StoredReview>(
    `SELECT reviews.id, reviews.user_id AS userId, reviews.rating, reviews.body,
            reviews.created_at AS createdAt, users.name
     FROM reviews JOIN users ON users.id = reviews.user_id
     WHERE reviews.product_handle = ? AND TRIM(reviews.body) != ''
     ORDER BY reviews.created_at DESC`,
    [handle],
  );
  return result.map((row) => ({
    id: Number(row.id),
    userId: Number(row.userId),
    name: row.name,
    rating: Number(row.rating),
    body: row.body,
    createdAt: row.createdAt,
  }));
}

export async function findReview(handle: string, userId: number) {
  return first<RowDataPacket & { rating: number; body: string }>(
    "SELECT rating, body FROM reviews WHERE product_handle = ? AND user_id = ?",
    [handle, userId],
  );
}

export async function saveReview(handle: string, userId: number, rating: number, body: string) {
  await run(
    `INSERT INTO reviews (product_handle, user_id, rating, body, created_at)
     VALUES (?, ?, ?, ?, ?) AS incoming
     ON DUPLICATE KEY UPDATE rating = incoming.rating, body = incoming.body, created_at = incoming.created_at`,
    [handle, userId, rating, body, new Date().toISOString()],
  );
  return (await reviewSummaries([handle])).get(handle) ?? { rating: 0, count: 0 };
}

export type StatVoteCounts = Record<string, Record<string, number>>;

export async function statVoteCounts(handle: string): Promise<StatVoteCounts> {
  const counts: StatVoteCounts = { longevity: {}, season: {}, sillage: {}, time: {} };
  const result = await rows<RowDataPacket & { category: string; option_key: string; count: number }>(
    `SELECT category, option_key, COUNT(*) AS count
     FROM stat_votes WHERE product_handle = ?
     GROUP BY category, option_key`,
    [handle],
  );
  for (const row of result) {
    if (!counts[row.category]) continue;
    counts[row.category][row.option_key] = Number(row.count);
  }
  return counts;
}

type AddressRow = RowDataPacket & {
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
    isDefault: Number(row.is_default) === 1,
  };
}

export async function listAddresses(userId: number) {
  const result = await rows<AddressRow>(
    `SELECT id, label, first_name, last_name, phone, address1, city, zip, country_code, province_code, is_default
     FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id ASC`,
    [userId],
  );
  return result.map(mapAddress);
}

export async function countAddresses(userId: number) {
  const row = await first<RowDataPacket & { count: number }>("SELECT COUNT(*) AS count FROM addresses WHERE user_id = ?", [userId]);
  return Number(row?.count) || 0;
}

async function markDefault(userId: number, addressId: number) {
  await run("UPDATE addresses SET is_default = 0 WHERE user_id = ?", [userId]);
  await run("UPDATE addresses SET is_default = 1 WHERE user_id = ? AND id = ?", [userId, addressId]);
}

export async function createAddress(userId: number, input: AddressDraft) {
  const inserted = await run(
    `INSERT INTO addresses
      (user_id, label, first_name, last_name, phone, address1, city, zip, country_code, province_code, is_default, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [
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
    ],
  );
  const id = Number(inserted.insertId);
  if (input.isDefault) await markDefault(userId, id);
  return (await listAddresses(userId)).find((address) => address.id === id);
}

export async function updateAddress(userId: number, id: number, input: AddressDraft) {
  const owned = await first<RowDataPacket>("SELECT id FROM addresses WHERE id = ? AND user_id = ?", [id, userId]);
  if (!owned) return undefined;
  await run(
    `UPDATE addresses SET label = ?, first_name = ?, last_name = ?, phone = ?, address1 = ?, city = ?, zip = ?,
      country_code = ?, province_code = ? WHERE id = ? AND user_id = ?`,
    [
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
    ],
  );
  if (input.isDefault) await markDefault(userId, id);
  return (await listAddresses(userId)).find((address) => address.id === id);
}

export async function deleteAddress(userId: number, id: number) {
  const owned = await first<RowDataPacket>("SELECT id FROM addresses WHERE id = ? AND user_id = ?", [id, userId]);
  if (!owned) return false;
  await run("DELETE FROM addresses WHERE id = ? AND user_id = ?", [id, userId]);
  return true;
}

export async function addStatVote(handle: string, category: string, optionKey: string, voterId: string) {
  const existing = await first<RowDataPacket>(
    "SELECT id FROM stat_votes WHERE product_handle = ? AND category = ? AND voter_id = ?",
    [handle, category, voterId],
  );
  if (existing) return false;
  await run(
    `INSERT INTO stat_votes (product_handle, category, option_key, voter_id, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [handle, category, optionKey, voterId, new Date().toISOString()],
  );
  return true;
}

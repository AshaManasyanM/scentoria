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
};

type UserRow = {
  id: number;
  email: string;
  name: string;
  image: string | null;
  provider: "email" | "google";
  password_hash: string | null;
};

type Statement = {
  get(...params: unknown[]): unknown;
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
  `);
  db = next;
  return next;
}

function mapUser(row: UserRow): StoredUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    image: row.image,
    provider: row.provider,
    passwordHash: row.password_hash,
  };
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 32);
  const previous = Buffer.from(hash, "hex");
  if (next.length !== previous.length) return false;
  return timingSafeEqual(next, previous);
}

export function findUserByEmail(email: string) {
  const row = database()
    .prepare("SELECT id, email, name, image, provider, password_hash FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as UserRow | undefined;
  return row ? mapUser(row) : undefined;
}

export function findUserBySession(token: string) {
  const row = database()
    .prepare(
      `SELECT users.id, users.email, users.name, users.image, users.provider, users.password_hash
       FROM sessions JOIN users ON users.id = sessions.user_id
       WHERE sessions.token = ?`,
    )
    .get(token) as UserRow | undefined;
  return row ? mapUser(row) : undefined;
}

export function createUser(input: {
  email: string;
  name: string;
  image?: string;
  provider: "email" | "google";
  passwordHash?: string;
}) {
  const email = input.email.trim().toLowerCase();
  database()
    .prepare(
      "INSERT INTO users (email, name, image, provider, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(email, input.name.trim(), input.image ?? null, input.provider, input.passwordHash ?? null, new Date().toISOString());
  const user = findUserByEmail(email);
  if (!user) throw new Error("Could not save the account");
  return user;
}

export function updateUser(
  id: number,
  input: { name?: string; image?: string | null; provider?: "email" | "google"; passwordHash?: string | null },
) {
  const current = database()
    .prepare("SELECT id, email, name, image, provider, password_hash FROM users WHERE id = ?")
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

export function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  database()
    .prepare("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)")
    .run(token, userId, new Date().toISOString());
  return token;
}

export function deleteSession(token: string) {
  database().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

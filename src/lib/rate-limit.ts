import { upstashCount } from "@/lib/security";
import { NextResponse } from "next/server";

type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

export function clientKey(request: Request, scope: string) {
  const real = request.headers.get("x-real-ip")?.trim();
  const hops = request.headers.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean) ?? [];
  const ip = real || hops.at(-1) || "local";
  return `${scope}:${ip}`;
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 2000) {
    for (const [name, bucket] of buckets) {
      if (now >= bucket.reset) buckets.delete(name);
    }
  }
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function rateLimitBackend() {
  return process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? "upstash" : "memory";
}

export async function consumeLimit(key: string, limit: number, windowMs: number) {
  if (rateLimitBackend() === "upstash") {
    const allowed = await upstashLimit(key, limit, windowMs);
    if (allowed !== null) return allowed;
    if (process.env.NODE_ENV === "production") return false;
  }
  return rateLimit(key, limit, windowMs);
}

async function upstashLimit(key: string, limit: number, windowMs: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
  const redisKey = `scentoria:rl:${key}`;
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  try {
    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, windowSec, "NX"],
      ]),
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) return null;
    const count = upstashCount(await response.json());
    if (count === null) return null;
    return count <= limit;
  } catch {
    return null;
  }
}

export function tooManyRequests() {
  return NextResponse.json({ error: "rate" }, { status: 429 });
}

export async function readJson<T>(request: Request, maxBytes: number): Promise<T | null> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  const text = await request.text();
  if (text.length > maxBytes) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

import type { Locale } from "../types";
import { shopifyLanguage } from "../i18n";
import { storefrontApi, storefrontToken } from "./config";

export type StorefrontFetchOptions = {
  fresh?: boolean;
  /** App locale — maps to Shopify @inContext(language). Defaults to no language context. */
  locale?: Locale;
  language?: "EN" | "HY" | "ES";
};

function applyInContext(query: string, language?: "EN" | "HY" | "ES") {
  if (!language) return query;
  return query.replace(
    /(query\s+\w+(?:\s*\([^)]*\))?)\s*\{/,
    `$1 @inContext(language: ${language}) {`,
  );
}

function resolveLanguage(options?: StorefrontFetchOptions) {
  if (options?.language) return options.language;
  if (options?.locale) return shopifyLanguage(options.locale);
  return undefined;
}

export async function storefrontFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: StorefrontFetchOptions,
): Promise<T | null> {
  if (!storefrontToken) return null;

  try {
    const language = resolveLanguage(options);
    const res = await fetch(storefrontApi, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontToken,
      },
      body: JSON.stringify({
        query: applyInContext(query, language),
        variables,
      }),
      ...(options?.fresh ? { cache: "no-store" as const } : { next: { revalidate: 30 } }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T; errors?: unknown };
    if (json.errors) return null;
    return json.data ?? null;
  } catch {
    return null;
  }
}

type DeferredPart = {
  data?: Record<string, unknown>;
  errors?: unknown;
  incremental?: { path?: string[]; data?: Record<string, unknown> }[];
};

export async function storefrontFetchDeferred<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: StorefrontFetchOptions,
): Promise<T | null> {
  if (!storefrontToken) return null;

  try {
    const language = resolveLanguage(options);
    const res = await fetch(storefrontApi, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "multipart/mixed",
        "X-Shopify-Storefront-Access-Token": storefrontToken,
      },
      body: JSON.stringify({
        query: applyInContext(query, language),
        variables,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const merged = mergeDeferred(res.headers.get("content-type") ?? "", await res.text());
    if (!merged || merged.errors) return null;
    return (merged.data as T) ?? null;
  } catch {
    return null;
  }
}

function mergeDeferred(contentType: string, body: string): { data?: unknown; errors?: unknown } | null {
  if (!contentType.includes("multipart/mixed")) {
    return JSON.parse(body) as { data?: unknown; errors?: unknown };
  }
  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/)?.[1]
    ?? contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/)?.[2];
  if (!boundary) return null;

  const parts = body.split(`--${boundary}`).flatMap((chunk) => {
    const trimmed = chunk.trim();
    if (!trimmed || trimmed === "--") return [];
    const blank = trimmed.search(/\r?\n\r?\n/);
    if (blank < 0) return [];
    const raw = trimmed.slice(blank).trim();
    if (!raw.startsWith("{")) return [];
    return [JSON.parse(raw) as DeferredPart];
  });
  if (!parts.length || parts.some((part) => part.errors)) return { errors: true };

  const data = { ...(parts[0]?.data ?? {}) };
  for (const part of parts) {
    for (const update of part.incremental ?? []) {
      const path = update.path ?? [];
      const payload = update.data;
      if (!payload) continue;
      let cursor = data as Record<string, unknown>;
      for (let index = 0; index < path.length - 1; index += 1) {
        const step = path[index];
        const next = cursor[step];
        if (!next || typeof next !== "object") cursor[step] = {};
        cursor = cursor[step] as Record<string, unknown>;
      }
      const key = path[path.length - 1];
      if (!key) continue;
      const current = cursor[key];
      cursor[key] = {
        ...(current && typeof current === "object" ? current as Record<string, unknown> : {}),
        ...payload,
      };
    }
  }
  return { data };
}

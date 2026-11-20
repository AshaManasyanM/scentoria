/**
 * Manual Unisex → Men + Women tag sync (idempotent).
 *
 * Usage:
 *   UNISEX_TAGS_CONFIRM=YES npm run sync:unisex-tags
 *
 * If UNISEX_TAGS_SECRET is set in the environment, also pass it explicitly:
 *   UNISEX_TAGS_CONFIRM=YES UNISEX_TAGS_TOKEN="$UNISEX_TAGS_SECRET" npm run sync:unisex-tags
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function loadEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), name);
    if (!existsSync(path)) continue;
    for (const raw of readFileSync(path, "utf8").split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvFiles();

  if (process.env.UNISEX_TAGS_CONFIRM !== "YES") {
    console.error(
      "[sync-unisex-tags] Refusing to run. Set UNISEX_TAGS_CONFIRM=YES to add Men/Women tags to Unisex products.",
    );
    process.exit(1);
  }

  const configuredSecret = process.env.UNISEX_TAGS_SECRET?.trim();
  if (configuredSecret) {
    const token = process.env.UNISEX_TAGS_TOKEN?.trim();
    if (!token || token !== configuredSecret) {
      console.error(
        "[sync-unisex-tags] Refusing to run. UNISEX_TAGS_SECRET is configured — pass matching UNISEX_TAGS_TOKEN.",
      );
      process.exit(1);
    }
  }

  if (!process.env.SHOPIFY_CLIENT_ID || !process.env.SHOPIFY_CLIENT_SECRET) {
    console.error("[sync-unisex-tags] SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET are required.");
    process.exit(1);
  }

  const { syncAllUnisexGenderTags } = await import("../src/lib/shopify/unisex-tags.ts");
  const summary = await syncAllUnisexGenderTags();
  console.log(
    JSON.stringify(
      {
        productsScanned: summary.productsScanned,
        unisexFound: summary.unisexFound,
        updated: summary.updated,
        skipped: summary.skipped,
        failed: summary.failed,
        failures: summary.results.filter((item) => item.status === "failed"),
        updates: summary.results.filter((item) => item.status === "updated"),
      },
      null,
      2,
    ),
  );
  if (summary.failed > 0) process.exit(2);
}

main().catch((error) => {
  console.error("[sync-unisex-tags] fatal", error);
  process.exit(1);
});

/**
 * One-time / manual brand catalog sync (idempotent).
 *
 * Usage:
 *   BRAND_SYNC_CONFIRM=YES npm run sync:brands
 *
 * If BRAND_SYNC_SECRET is set in the environment, also pass it explicitly:
 *   BRAND_SYNC_CONFIRM=YES BRAND_SYNC_TOKEN="$BRAND_SYNC_SECRET" npm run sync:brands
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

  if (process.env.BRAND_SYNC_CONFIRM !== "YES") {
    console.error(
      "[sync-brands] Refusing to run. Set BRAND_SYNC_CONFIRM=YES to sync all existing vendors into brands.",
    );
    process.exit(1);
  }

  const configuredSecret = process.env.BRAND_SYNC_SECRET?.trim();
  if (configuredSecret) {
    const token = process.env.BRAND_SYNC_TOKEN?.trim();
    if (!token || token !== configuredSecret) {
      console.error(
        "[sync-brands] Refusing to run. BRAND_SYNC_SECRET is configured — pass matching BRAND_SYNC_TOKEN.",
      );
      process.exit(1);
    }
  }

  if (!process.env.SHOPIFY_CLIENT_ID || !process.env.SHOPIFY_CLIENT_SECRET) {
    console.error("[sync-brands] SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET are required.");
    process.exit(1);
  }

  const { syncAllExistingBrands } = await import("../src/lib/shopify/brand-sync.ts");
  const summary = await syncAllExistingBrands();
  console.log(JSON.stringify(summary, null, 2));
  if (summary.brandsFailed > 0) process.exit(2);
}

main().catch((error) => {
  console.error("[sync-brands] fatal", error);
  process.exit(1);
});

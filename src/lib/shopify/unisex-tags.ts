import { adminFetch } from "./admin";

const REQUIRED_GENDER_TAGS = ["Men", "Women"] as const;

export type UnisexTagEnsureResult = {
  productId: string;
  title?: string;
  status: "updated" | "skipped" | "failed";
  added: string[];
  error?: string;
};

export type UnisexTagSyncSummary = {
  productsScanned: number;
  unisexFound: number;
  updated: number;
  skipped: number;
  failed: number;
  results: UnisexTagEnsureResult[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logUnisex(message: string, detail?: unknown) {
  if (detail === undefined) {
    console.info(`[unisex-tags] ${message}`);
    return;
  }
  console.info(`[unisex-tags] ${message}`, detail);
}

/** Normalize Shopify REST (`"a, b"`) or GraphQL (`string[]`) tags. */
export function parseProductTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function hasTag(tags: string[], name: string) {
  const target = name.toLowerCase();
  return tags.some((tag) => tag.toLowerCase() === target);
}

export function hasUnisexTag(tags: string[]) {
  return hasTag(tags, "Unisex");
}

/** Tags still needed so a Unisex product also has Men + Women (no duplicates). */
export function missingUnisexGenderTags(tags: string[]): string[] {
  if (!hasUnisexTag(tags)) return [];
  return REQUIRED_GENDER_TAGS.filter((tag) => !hasTag(tags, tag));
}

async function tagsAdd(productId: string, tags: string[]) {
  const data = await adminFetch<{
    tagsAdd: {
      node: { id: string } | null;
      userErrors: { field?: string[] | null; message: string }[];
    } | null;
  }>(
    `mutation TagsAdd($id: ID!, $tags: [String!]!) {
      tagsAdd(id: $id, tags: $tags) {
        node { id }
        userErrors { field message }
      }
    }`,
    { id: productId, tags },
  );

  const result = data?.tagsAdd;
  if (!result) {
    throw new Error("tagsAdd returned no data");
  }
  if (result.userErrors?.length) {
    throw new Error(result.userErrors.map((error) => error.message).join("; "));
  }
  if (!result.node?.id) {
    throw new Error("tagsAdd did not return a product node");
  }
  return result.node.id;
}

/**
 * Idempotent: if the product has Unisex and is missing Men and/or Women, add only the missing tags.
 * No-op when Unisex is absent or both tags already exist (prevents webhook loops).
 */
export async function ensureUnisexGenderTags(
  productId: string | undefined,
  tagsInput: unknown,
  title?: string,
): Promise<UnisexTagEnsureResult | null> {
  if (!productId) return null;

  const tags = parseProductTags(tagsInput);
  const added = missingUnisexGenderTags(tags);

  if (!hasUnisexTag(tags)) {
    return { productId, title, status: "skipped", added: [] };
  }

  if (!added.length) {
    return { productId, title, status: "skipped", added: [] };
  }

  try {
    await tagsAdd(productId, added);
    logUnisex(`updated ${productId}${title ? ` "${title}"` : ""} +[${added.join(", ")}]`);
    return { productId, title, status: "updated", added };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[unisex-tags] failed ${productId}`, message);
    return { productId, title, status: "failed", added, error: message };
  }
}

type ProductTagsNode = {
  id: string;
  title: string;
  tags: string[];
};

/**
 * Manual full-catalog sync: paginate Admin products, add Men+Women to Unisex products only.
 * Does not change titles, descriptions, prices, variants, inventory, or images.
 */
export async function syncAllUnisexGenderTags(): Promise<UnisexTagSyncSummary> {
  let productsScanned = 0;
  let unisexFound = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const results: UnisexTagEnsureResult[] = [];
  let cursor: string | null = null;
  let page = 0;

  type ProductsPage = {
    products: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: ProductTagsNode[];
    };
  };

  for (;;) {
    page += 1;
    const after: string | null = cursor;
    const data: ProductsPage | null = await adminFetch<ProductsPage>(
      `query ProductsTagsPage($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          pageInfo { hasNextPage endCursor }
          nodes { id title tags }
        }
      }`,
      { first: 50, after },
    );

    if (!data?.products) {
      throw new Error("[unisex-tags] failed to fetch products page");
    }

    for (const node of data.products.nodes) {
      productsScanned += 1;
      if (!hasUnisexTag(node.tags)) {
        skipped += 1;
        continue;
      }

      unisexFound += 1;
      const result = await ensureUnisexGenderTags(node.id, node.tags, node.title);
      if (!result) {
        skipped += 1;
        continue;
      }

      results.push(result);
      if (result.status === "updated") updated += 1;
      else if (result.status === "failed") failed += 1;
      else skipped += 1;

      if (result.status === "updated") await sleep(350);
    }

    logUnisex(
      `scanned page ${page} (total ${productsScanned}, unisex ${unisexFound}, updated ${updated}, failed ${failed})`,
    );

    if (!data.products.pageInfo.hasNextPage) break;
    cursor = data.products.pageInfo.endCursor;
    await sleep(400);
  }

  const summary: UnisexTagSyncSummary = {
    productsScanned,
    unisexFound,
    updated,
    skipped,
    failed,
    results,
  };
  logUnisex("catalog sync complete", {
    productsScanned,
    unisexFound,
    updated,
    skipped,
    failed,
  });
  return summary;
}

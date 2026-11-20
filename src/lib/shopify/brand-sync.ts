import { adminFetch } from "./admin";
import { brandFromVendor, brandHandle } from "./map";

type CollectionNode = { id: string; handle: string; title: string };
type MetaobjectNode = { id: string; handle: string };
type PublicationNode = { id: string; name: string };

type RequiredChannel = "onlineStore" | "headless";

const REQUIRED_CHANNEL_KEYS: RequiredChannel[] = ["onlineStore", "headless"];

/** Only successful publication ID lookups are cached — failed lookups are retried. */
const publicationIdCache = new Map<RequiredChannel, string>();

function logBrandSync(message: string, detail?: unknown) {
  if (detail === undefined) {
    console.error(`[brand-sync] ${message}`);
    return;
  }
  console.error(`[brand-sync] ${message}`, detail);
}

async function findCollectionByHandle(handle: string): Promise<CollectionNode | null> {
  const data = await adminFetch<{
    collections: { nodes: CollectionNode[] };
  }>(
    `query CollectionByHandle($query: String!) {
      collections(first: 1, query: $query) {
        nodes { id handle title }
      }
    }`,
    { query: `handle:${handle}` },
  );
  return data?.collections?.nodes?.[0] ?? null;
}

async function createCollection(name: string, handle: string): Promise<CollectionNode | null> {
  const data = await adminFetch<{
    collectionCreate: {
      collection: CollectionNode | null;
      userErrors: { message: string }[];
    };
  }>(
    `mutation CollectionCreate($input: CollectionInput!) {
      collectionCreate(input: $input) {
        collection { id handle title }
        userErrors { message }
      }
    }`,
    {
      input: {
        title: name,
        handle,
      },
    },
  );
  const result = data?.collectionCreate;
  if (!result) {
    logBrandSync("collectionCreate returned no data", { name, handle });
    return null;
  }
  if (result.userErrors.length) {
    logBrandSync("collectionCreate userErrors", result.userErrors);
    return null;
  }
  return result.collection;
}

async function findBrandMetaobject(handle: string): Promise<MetaobjectNode | null> {
  const data = await adminFetch<{
    metaobjectByHandle: MetaobjectNode | null;
  }>(
    `query BrandByHandle($handle: MetaobjectHandleInput!) {
      metaobjectByHandle(handle: $handle) {
        id
        handle
      }
    }`,
    { handle: { type: "brand", handle } },
  );
  return data?.metaobjectByHandle ?? null;
}

async function createBrandMetaobject(name: string, handle: string): Promise<MetaobjectNode | null> {
  const data = await adminFetch<{
    metaobjectCreate: {
      metaobject: MetaobjectNode | null;
      userErrors: { message: string }[];
    };
  }>(
    `mutation CreateBrand($metaobject: MetaobjectCreateInput!) {
      metaobjectCreate(metaobject: $metaobject) {
        metaobject { id handle }
        userErrors { message }
      }
    }`,
    {
      metaobject: {
        type: "brand",
        handle,
        capabilities: { publishable: { status: "ACTIVE" } },
        fields: [{ key: "name", value: name }],
      },
    },
  );
  const result = data?.metaobjectCreate;
  if (result?.metaobject && !result.userErrors.length) return result.metaobject;
  if (result?.userErrors?.length) {
    logBrandSync("metaobjectCreate (publishable) userErrors", result.userErrors);
  }

  const fallback = await adminFetch<{
    metaobjectCreate: {
      metaobject: MetaobjectNode | null;
      userErrors: { message: string }[];
    };
  }>(
    `mutation CreateBrand($metaobject: MetaobjectCreateInput!) {
      metaobjectCreate(metaobject: $metaobject) {
        metaobject { id handle }
        userErrors { message }
      }
    }`,
    {
      metaobject: {
        type: "brand",
        handle,
        fields: [{ key: "name", value: name }],
      },
    },
  );
  const created = fallback?.metaobjectCreate;
  if (!created?.metaobject || created.userErrors.length) {
    logBrandSync("metaobjectCreate failed", created?.userErrors ?? "no data");
    return null;
  }
  return created.metaobject;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function addProductsToCollection(collectionId: string, productIds: string[]) {
  const unique = [...new Set(productIds.filter(Boolean))];
  const chunkSize = 50;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const data = await adminFetch<{
      collectionAddProducts: { userErrors: { message: string }[] } | null;
    }>(
      `mutation CollectionAddProducts($id: ID!, $productIds: [ID!]!) {
        collectionAddProducts(id: $id, productIds: $productIds) {
          userErrors { message }
        }
      }`,
      { id: collectionId, productIds: chunk },
    );
    const errors = data?.collectionAddProducts?.userErrors ?? [];
    // "already in collection" style errors are fine for idempotent reruns.
    if (errors.length) {
      logBrandSync("collectionAddProducts userErrors", errors);
    }
    if (i + chunkSize < unique.length) await sleep(250);
  }
}

async function listPublications(): Promise<PublicationNode[]> {
  const data = await adminFetch<{
    publications: { nodes: PublicationNode[] };
  }>(
    `query Publications {
      publications(first: 50) {
        nodes { id name }
      }
    }`,
  );
  return data?.publications?.nodes ?? [];
}

function pickPublicationId(nodes: PublicationNode[], channel: RequiredChannel): string | null {
  if (channel === "onlineStore") {
    const online =
      nodes.find((node) => node.name.trim().toLowerCase() === "online store") ||
      nodes.find((node) => node.name.trim().toLowerCase() === "online store channel");
    return online?.id ?? null;
  }

  const headless =
    nodes.find((node) => node.name.trim().toLowerCase() === "scentoria headless") ||
    nodes.find((node) => node.name.trim().toLowerCase().includes("scentoria headless"));
  return headless?.id ?? null;
}

async function getRequiredPublicationIds(): Promise<Record<RequiredChannel, string> | null> {
  const missing = REQUIRED_CHANNEL_KEYS.filter((key) => !publicationIdCache.has(key));
  if (missing.length === 0) {
    return {
      onlineStore: publicationIdCache.get("onlineStore")!,
      headless: publicationIdCache.get("headless")!,
    };
  }

  const nodes = await listPublications();
  if (!nodes.length) {
    logBrandSync("publications query returned no nodes");
    return null;
  }

  for (const key of REQUIRED_CHANNEL_KEYS) {
    if (publicationIdCache.has(key)) continue;
    const id = pickPublicationId(nodes, key);
    if (!id) {
      logBrandSync(`${key} publication not found`, nodes.map((node) => node.name));
      // Do not cache failure — allow retry on next webhook.
      return null;
    }
    publicationIdCache.set(key, id);
  }

  return {
    onlineStore: publicationIdCache.get("onlineStore")!,
    headless: publicationIdCache.get("headless")!,
  };
}

async function getPublishedPublicationIds(collectionId: string): Promise<Set<string> | null> {
  const data = await adminFetch<{
    collection: {
      resourcePublicationsV2: {
        nodes: { isPublished: boolean; publication: { id: string; name: string } | null }[];
      };
    } | null;
  }>(
    `query CollectionPublications($id: ID!) {
      collection(id: $id) {
        resourcePublicationsV2(first: 20) {
          nodes {
            isPublished
            publication { id name }
          }
        }
      }
    }`,
    { id: collectionId },
  );

  if (!data?.collection) {
    logBrandSync("collection publications query failed", { collectionId });
    return null;
  }

  const published = new Set<string>();
  for (const node of data.collection.resourcePublicationsV2.nodes) {
    if (node.isPublished && node.publication?.id) published.add(node.publication.id);
  }
  return published;
}

async function publishablePublish(collectionId: string, publicationIds: string[]): Promise<boolean> {
  if (!publicationIds.length) return true;

  const data = await adminFetch<{
    publishablePublish: {
      userErrors: { message: string; field?: string[] }[];
    } | null;
  }>(
    `mutation PublishCollection($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        userErrors { field message }
      }
    }`,
    {
      id: collectionId,
      input: publicationIds.map((publicationId) => ({ publicationId })),
    },
  );

  if (!data?.publishablePublish) {
    logBrandSync("publishablePublish returned no data", { collectionId, publicationIds });
    return false;
  }
  if (data.publishablePublish.userErrors.length) {
    logBrandSync("publishablePublish userErrors", data.publishablePublish.userErrors);
    return false;
  }
  return true;
}

/**
 * Ensure collection is published to Online Store + Scentoria Headless only.
 * Idempotent: skips channels already published; does not enable Shop/POS/etc.
 */
async function publishCollectionToRequiredChannels(collectionId: string): Promise<{
  onlineStore: boolean;
  headless: boolean;
}> {
  const publications = await getRequiredPublicationIds();
  if (!publications) {
    return { onlineStore: false, headless: false };
  }

  const published = await getPublishedPublicationIds(collectionId);
  if (!published) {
    return { onlineStore: false, headless: false };
  }

  const missing = (Object.entries(publications) as [RequiredChannel, string][])
    .filter(([, id]) => !published.has(id))
    .map(([, id]) => id);

  if (missing.length) {
    const ok = await publishablePublish(collectionId, missing);
    if (!ok) {
      return {
        onlineStore: published.has(publications.onlineStore),
        headless: published.has(publications.headless),
      };
    }
  }

  const after = await getPublishedPublicationIds(collectionId);
  if (!after) {
    return { onlineStore: false, headless: false };
  }

  const onlineStore = after.has(publications.onlineStore);
  const headless = after.has(publications.headless);
  if (!onlineStore || !headless) {
    logBrandSync("collection not fully published after publishablePublish", {
      collectionId,
      onlineStore,
      headless,
      publishedIds: [...after],
    });
  }

  return { onlineStore, headless };
}

export type BrandSyncResult = {
  brand: string;
  handle: string;
  collectionId?: string;
  metaobjectId?: string;
  createdCollection: boolean;
  createdMetaobject: boolean;
  publishedToOnlineStore: boolean;
  publishedToHeadless: boolean;
};

/** Ensure vendor brand exists as a Collection and a `brand` metaobject. */
export async function ensureBrandFromVendor(
  vendor: string,
  productGid?: string | string[],
): Promise<BrandSyncResult | null> {
  const brand = brandFromVendor(vendor);
  if (!brand) return null;

  const handle = brandHandle(brand);
  if (!handle) return null;

  let collection = await findCollectionByHandle(handle);
  let createdCollection = false;
  if (!collection) {
    collection = await createCollection(brand, handle);
    createdCollection = Boolean(collection);
  }

  if (!collection?.id) {
    throw new Error(`[brand-sync] failed to ensure collection for brand "${brand}" (${handle})`);
  }

  const channels = await publishCollectionToRequiredChannels(collection.id);
  if (!channels.onlineStore || !channels.headless) {
    throw new Error(
      `[brand-sync] collection "${handle}" (${collection.id}) not published to required channels ` +
        `(onlineStore=${channels.onlineStore}, headless=${channels.headless})`,
    );
  }

  let metaobject = await findBrandMetaobject(handle);
  let createdMetaobject = false;
  if (!metaobject) {
    metaobject = await createBrandMetaobject(brand, handle);
    createdMetaobject = Boolean(metaobject);
    if (!metaobject) {
      logBrandSync(`metaobject missing after create attempt for "${handle}"`);
    }
  }

  const productIds = (Array.isArray(productGid) ? productGid : productGid ? [productGid] : []).filter(Boolean);
  if (productIds.length) {
    await addProductsToCollection(collection.id, productIds);
  }

  return {
    brand,
    handle,
    collectionId: collection.id,
    metaobjectId: metaobject?.id,
    createdCollection,
    createdMetaobject,
    publishedToOnlineStore: channels.onlineStore,
    publishedToHeadless: channels.headless,
  };
}

export type BrandCatalogSyncSummary = {
  productsScanned: number;
  brandsFound: number;
  brandsSynced: number;
  brandsFailed: number;
  failures: { brand: string; error: string }[];
};

type ProductVendorNode = { id: string; vendor: string | null };

/** Paginate Admin products and group by normalized vendor brand. */
async function fetchProductsByBrand(): Promise<{
  productsScanned: number;
  byBrand: Map<string, { brand: string; productIds: string[] }>;
}> {
  const byBrand = new Map<string, { brand: string; productIds: string[] }>();
  let productsScanned = 0;
  let cursor: string | null = null;
  let page = 0;

  type ProductsPage = {
    products: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: ProductVendorNode[];
    };
  };

  for (;;) {
    page += 1;
    const after: string | null = cursor;
    const data: ProductsPage | null = await adminFetch<ProductsPage>(
      `query ProductsPage($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          pageInfo { hasNextPage endCursor }
          nodes { id vendor }
        }
      }`,
      { first: 50, after },
    );

    if (!data?.products) {
      throw new Error("[brand-sync] failed to fetch products page for catalog sync");
    }

    for (const node of data.products.nodes) {
      productsScanned += 1;
      const brand = brandFromVendor(node.vendor ?? "");
      if (!brand) continue;
      const key = brand.toLowerCase();
      const existing = byBrand.get(key);
      if (existing) {
        existing.productIds.push(node.id);
      } else {
        byBrand.set(key, { brand, productIds: [node.id] });
      }
    }

    console.info(
      `[brand-sync] scanned products page ${page} (total ${productsScanned}, brands ${byBrand.size})`,
    );

    if (!data.products.pageInfo.hasNextPage) break;
    cursor = data.products.pageInfo.endCursor;
    await sleep(400);
  }

  return { productsScanned, byBrand };
}

/**
 * One-time / manual full sync: all vendors → collections + metaobjects + product links + both channels.
 * Idempotent and safe to re-run. Does not change prices, inventory, or vendor names.
 */
export async function syncAllExistingBrands(): Promise<BrandCatalogSyncSummary> {
  const { productsScanned, byBrand } = await fetchProductsByBrand();
  const failures: { brand: string; error: string }[] = [];
  let brandsSynced = 0;

  const brands = [...byBrand.values()].sort((a, b) => a.brand.localeCompare(b.brand));
  console.info(`[brand-sync] syncing ${brands.length} unique brands from ${productsScanned} products`);

  for (let i = 0; i < brands.length; i += 1) {
    const entry = brands[i];
    try {
      const result = await ensureBrandFromVendor(entry.brand, entry.productIds);
      if (!result) {
        failures.push({ brand: entry.brand, error: "skipped (empty after normalize)" });
        continue;
      }
      brandsSynced += 1;
      console.info(
        `[brand-sync] (${i + 1}/${brands.length}) ok "${result.brand}" ` +
          `collection=${result.collectionId} products=${entry.productIds.length} ` +
          `createdCollection=${result.createdCollection} createdMetaobject=${result.createdMetaobject}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ brand: entry.brand, error: message });
      logBrandSync(`brand sync failed for "${entry.brand}"`, message);
    }
    await sleep(350);
  }

  const summary: BrandCatalogSyncSummary = {
    productsScanned,
    brandsFound: brands.length,
    brandsSynced,
    brandsFailed: failures.length,
    failures,
  };
  console.info("[brand-sync] catalog sync complete", summary);
  return summary;
}

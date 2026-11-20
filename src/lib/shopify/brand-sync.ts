import { adminFetch } from "./admin";
import { brandFromVendor, brandHandle } from "./map";

type CollectionNode = { id: string; handle: string; title: string };
type MetaobjectNode = { id: string; handle: string };

const HEADLESS_PUBLICATION_NAMES = ["scentoria headless", "headless"];

let cachedHeadlessPublicationId: string | null | undefined;

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

  // Retry without publishable capability if the definition is not publishable.
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

async function addProductToCollection(collectionId: string, productId: string) {
  const data = await adminFetch<{
    collectionAddProducts: { userErrors: { message: string }[] } | null;
  }>(
    `mutation CollectionAddProducts($id: ID!, $productIds: [ID!]!) {
      collectionAddProducts(id: $id, productIds: $productIds) {
        userErrors { message }
      }
    }`,
    { id: collectionId, productIds: [productId] },
  );
  const errors = data?.collectionAddProducts?.userErrors ?? [];
  if (errors.length) {
    logBrandSync("collectionAddProducts userErrors", errors);
  }
}

async function getHeadlessPublicationId(): Promise<string | null> {
  if (cachedHeadlessPublicationId !== undefined) return cachedHeadlessPublicationId;

  const data = await adminFetch<{
    publications: { nodes: { id: string; name: string }[] };
  }>(
    `query Publications {
      publications(first: 50) {
        nodes { id name }
      }
    }`,
  );

  const nodes = data?.publications?.nodes ?? [];
  const match =
    nodes.find((node) => node.name.trim().toLowerCase() === "scentoria headless") ||
    nodes.find((node) => HEADLESS_PUBLICATION_NAMES.some((name) => node.name.trim().toLowerCase().includes(name)));

  if (!match) {
    logBrandSync(
      "Scentoria Headless publication not found",
      nodes.map((node) => node.name),
    );
    cachedHeadlessPublicationId = null;
    return null;
  }

  cachedHeadlessPublicationId = match.id;
  return match.id;
}

async function isCollectionPublishedTo(collectionId: string, publicationId: string): Promise<boolean> {
  const data = await adminFetch<{
    collection: {
      resourcePublicationsV2: {
        nodes: { isPublished: boolean; publication: { id: string } | null }[];
      };
    } | null;
  }>(
    `query CollectionPublications($id: ID!) {
      collection(id: $id) {
        resourcePublicationsV2(first: 20) {
          nodes {
            isPublished
            publication { id }
          }
        }
      }
    }`,
    { id: collectionId },
  );

  return Boolean(
    data?.collection?.resourcePublicationsV2?.nodes?.some(
      (node) => node.isPublished && node.publication?.id === publicationId,
    ),
  );
}

/** Publish collection to Scentoria Headless only (idempotent). */
async function publishCollectionToHeadless(collectionId: string): Promise<boolean> {
  const publicationId = await getHeadlessPublicationId();
  if (!publicationId) return false;

  if (await isCollectionPublishedTo(collectionId, publicationId)) {
    return true;
  }

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
      input: [{ publicationId }],
    },
  );

  const errors = data?.publishablePublish?.userErrors ?? [];
  if (!data?.publishablePublish) {
    logBrandSync("publishablePublish returned no data", { collectionId, publicationId });
    return false;
  }
  if (errors.length) {
    logBrandSync("publishablePublish userErrors", errors);
    return false;
  }

  return true;
}

export type BrandSyncResult = {
  brand: string;
  handle: string;
  collectionId?: string;
  metaobjectId?: string;
  createdCollection: boolean;
  createdMetaobject: boolean;
  publishedToHeadless: boolean;
};

/** Ensure vendor brand exists as a Collection and a `brand` metaobject. */
export async function ensureBrandFromVendor(
  vendor: string,
  productGid?: string,
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

  const publishedToHeadless = await publishCollectionToHeadless(collection.id);
  if (!publishedToHeadless) {
    throw new Error(
      `[brand-sync] failed to publish collection "${handle}" (${collection.id}) to Scentoria Headless`,
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

  if (productGid) {
    await addProductToCollection(collection.id, productGid);
  }

  return {
    brand,
    handle,
    collectionId: collection.id,
    metaobjectId: metaobject?.id,
    createdCollection,
    createdMetaobject,
    publishedToHeadless,
  };
}

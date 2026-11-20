import { adminFetch } from "./admin";
import { brandFromVendor, brandHandle } from "./map";

type CollectionNode = { id: string; handle: string; title: string };
type MetaobjectNode = { id: string; handle: string };

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
  if (!result?.collection || result.userErrors.length) return null;
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
  if (!result?.metaobject || result.userErrors.length) {
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
    if (!created?.metaobject || created.userErrors.length) return null;
    return created.metaobject;
  }
  return result.metaobject;
}

async function addProductToCollection(collectionId: string, productId: string) {
  await adminFetch(
    `mutation CollectionAddProducts($id: ID!, $productIds: [ID!]!) {
      collectionAddProducts(id: $id, productIds: $productIds) {
        userErrors { message }
      }
    }`,
    { id: collectionId, productIds: [productId] },
  );
}

export type BrandSyncResult = {
  brand: string;
  handle: string;
  collectionId?: string;
  metaobjectId?: string;
  createdCollection: boolean;
  createdMetaobject: boolean;
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

  let metaobject = await findBrandMetaobject(handle);
  let createdMetaobject = false;
  if (!metaobject) {
    metaobject = await createBrandMetaobject(brand, handle);
    createdMetaobject = Boolean(metaobject);
  }

  if (collection?.id && productGid) {
    await addProductToCollection(collection.id, productGid);
  }

  return {
    brand,
    handle,
    collectionId: collection?.id,
    metaobjectId: metaobject?.id,
    createdCollection,
    createdMetaobject,
  };
}

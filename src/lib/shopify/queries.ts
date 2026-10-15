const PRODUCT_FIELDS = `
  id
  handle
  title
  description
  vendor
  tags
  featuredImage { url altText }
  images(first: 8) { nodes { url altText } }
  priceRange {
    minVariantPrice { amount currencyCode }
    maxVariantPrice { amount currencyCode }
  }
  variants(first: 30) {
    nodes {
      id
      title
      availableForSale
      quantityAvailable
      price { amount currencyCode }
      compareAtPrice { amount currencyCode }
      image { url altText }
    }
  }
`;

export const REVIEWS_QUERY = `
  query Reviews($type: String!, $first: Int!) {
    metaobjects(type: $type, first: $first) {
      nodes {
        handle
        updatedAt
        fields { key value }
      }
    }
  }
`;

export const TESTIMONIALS_QUERY = `
  query Testimonials($type: String!, $first: Int!) {
    metaobjects(type: $type, first: $first) {
      nodes {
        handle
        fields { key value }
      }
    }
  }
`;

export const NOTES_QUERY = `
  query Notes($type: String!, $first: Int!) {
    metaobjects(type: $type, first: $first) {
      nodes {
        handle
        fields {
          key
          value
          reference {
            ... on MediaImage {
              image { url }
            }
            ... on GenericFile {
              url
            }
          }
        }
      }
    }
  }
`;

export const COLLECTIONS_QUERY = `
  query Collections($first: Int!) {
    collections(first: $first, sortKey: TITLE) {
      nodes {
        handle
        title
        description
        image { url altText }
      }
    }
  }
`;

export const PRODUCTS_QUERY = `
  query Products($first: Int!) {
    products(first: $first) {
      nodes { ${PRODUCT_FIELDS} }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  query Product($handle: String!) {
    product(handle: $handle) { ${PRODUCT_FIELDS} }
  }
`;

export const SEARCH_QUERY = `
  query Search($query: String!) {
    search(query: $query, first: 24, types: PRODUCT) {
      edges {
        node {
          ... on Product { ${PRODUCT_FIELDS} }
        }
      }
    }
  }
`;

export const CART_CREATE = `
  mutation CartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart { id checkoutUrl }
      userErrors { message }
    }
  }
`;

export const CART_LINES_ADD = `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { id checkoutUrl }
      userErrors { message }
    }
  }
`;

export const CART_LINES_UPDATE = `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { id checkoutUrl }
      userErrors { message }
    }
  }
`;

export const CART_QUERY = `
  query Cart($id: ID!) {
    cart(id: $id) {
      id
      checkoutUrl
      lines(first: 50) {
        nodes {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              price { amount currencyCode }
              compareAtPrice { amount currencyCode }
              product { title handle vendor featuredImage { url } }
            }
          }
        }
      }
    }
  }
`;

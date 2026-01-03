import { gql } from "@apollo/client";
import { getClient } from "./apollo";

export interface WpCategory {
  name: string;
  slug: string;
  count?: number | null;
  description?: string | null;
}

export interface PageInfo {
  hasNextPage: boolean;
  endCursor?: string | null;
}

export interface WpPost {
  id: string;
  title: string;
  slug: string;
  date: string;
  excerpt?: string | null;
  featuredImage?: {
    node?: { sourceUrl?: string | null } | null;
  } | null;
  categories?: {
    nodes?: Array<{ name?: string | null; slug?: string | null }> | null;
  } | null;
  author?: {
    node?: { name?: string | null } | null;
  } | null;
}

const POST_FIELDS = gql`
  fragment PostFields on Post {
    id
    title
    slug
    date
    excerpt
    featuredImage { node { sourceUrl } }
    categories { nodes { name slug } }
    author { node { name } }
  }
`;

async function execQuery<T>(query: any, variables: Record<string, unknown> = {}) {
  const client = getClient();
  const { data } = await client.query<T>({ query, variables });
  return data;
}

export async function fetchLatestPosts(limit = 8): Promise<WpPost[]> {
  const data = await execQuery<{ posts: { nodes: WpPost[] } }>(
    gql`
      ${POST_FIELDS}
      query Latest($limit: Int!) {
        posts(first: $limit, where: { orderby: { field: DATE, order: DESC } }) {
          nodes { ...PostFields }
        }
      }
    `,
    { limit }
  );
  return data?.posts?.nodes ?? [];
}

export async function fetchCategoryPosts(slug: string, limit = 6): Promise<WpPost[]> {
  const data = await execQuery<{ posts: { nodes: WpPost[] } }>(
    gql`
      ${POST_FIELDS}
      query ByCategory($slug: String, $limit: Int!) {
        posts(
          first: $limit
          where: { categoryName: $slug, orderby: { field: DATE, order: DESC } }
        ) {
          nodes { ...PostFields }
        }
      }
    `,
    { slug, limit }
  );
  return data?.posts?.nodes ?? [];
}

export async function fetchCategoryInfo(slug: string) {
  const client = getClient();
  const { data } = await client.query<{ category: WpCategory | null }>({
    query: gql`
      query CategoryInfo($slug: ID!) {
        category(id: $slug, idType: SLUG) {
          name
          slug
          description
          count
        }
      }
    `,
    variables: { slug },
    fetchPolicy: "no-cache",
  });
  return data?.category ?? null;
}

export async function fetchCategoryPage(args: { slug: string; first: number; after?: string | null }) {
  const data = await execQuery<{
    posts: { nodes: WpPost[]; pageInfo: PageInfo };
  }>(
    gql`
      ${POST_FIELDS}
      query CategoryPosts($slug: String!, $first: Int!, $after: String) {
        posts(
          first: $first
          after: $after
          where: { categoryName: $slug, orderby: { field: DATE, order: DESC } }
        ) {
          nodes { ...PostFields }
          pageInfo { hasNextPage endCursor }
        }
      }
    `,
    { slug: args.slug, first: args.first, after: args.after ?? null }
  );
  return data?.posts ?? { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } };
}

function toDateParts(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export async function searchPosts(args: {
  q: string;
  first: number;
  after?: string | null;
  categorySlug?: string;
  order?: "DESC" | "ASC";
  dateAfter?: string;
  dateBefore?: string;
}) {
  const where: Record<string, unknown> = {
    search: args.q,
    orderby: { field: "DATE", order: args.order ?? "DESC" },
  };

  if (args.categorySlug) {
    where.categoryName = args.categorySlug;
  }

  const afterParts = toDateParts(args.dateAfter);
  const beforeParts = toDateParts(args.dateBefore);
  if (afterParts || beforeParts) {
    where.dateQuery = {
      inclusive: true,
      after: afterParts,
      before: beforeParts,
    };
  }

  const data = await execQuery<{
    posts: { nodes: WpPost[]; pageInfo: PageInfo };
  }>(
    gql`
      ${POST_FIELDS}
      query SearchPosts($first: Int!, $after: String, $where: RootQueryToPostConnectionWhereArgs) {
        posts(first: $first, after: $after, where: $where) {
          nodes { ...PostFields }
          pageInfo { hasNextPage endCursor }
        }
      }
    `,
    {
      first: args.first,
      after: args.after ?? null,
      where,
    }
  );

  return data?.posts ?? { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } };
}

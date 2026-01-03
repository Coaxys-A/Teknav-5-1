interface GraphqlResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export async function executeWpGraphql<T>(
  query: string,
  variables: Record<string, unknown> = {},
  token?: string,
): Promise<T> {
  const endpoint = process.env.WP_GRAPHQL_ENDPOINT;
  if (!endpoint) {
    throw new Error("WP_GRAPHQL_ENDPOINT is not configured");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`WPGraphQL request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as GraphqlResponse<T>;
  if (payload.errors && payload.errors.length) {
    throw new Error(payload.errors.map((err) => err.message).join("; "));
  }
  if (!payload.data) {
    throw new Error("WPGraphQL response had no data");
  }
  return payload.data;
}

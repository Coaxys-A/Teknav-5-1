import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

export function getClient() {
  return new ApolloClient({
    link: new HttpLink({
      uri: process.env.WP_GRAPHQL_ENDPOINT || "https://cms.teknav.ir/graphql",
      fetchOptions: { cache: "no-store" },
    }),
    cache: new InMemoryCache(),
    ssrMode: true,
    defaultOptions: {
      query: { fetchPolicy: "no-cache", errorPolicy: "all" },
    },
  });
}

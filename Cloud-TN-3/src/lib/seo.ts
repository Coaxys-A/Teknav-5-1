export const site = {
  name: "تکناو",
  url: "https://teknav.ir",
  tagline: "اخبار فناوری، امنیت سایبری و دنیای دیجیتال",
  logo: "https://teknav.ir/logo.png",
};

export function canonicalize(path: string) {
  const base = site.url.replace(/\/$/, "");
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${site.url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    logo: site.logo,
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function itemListJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: it.url,
    })),
  };
}

export function categoryCollectionJsonLd(args: {
  name: string;
  url: string;
  itemUrls: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: args.name,
    url: args.url,
    hasPart: args.itemUrls.slice(0, 20).map((u) => ({
      "@type": "WebPage",
      url: u,
    })),
  };
}

export function searchResultsJsonLd(args: {
  query: string;
  url: string;
  results: Array<{ name: string; url: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    name: `نتایج جستجو برای ${args.query}`,
    url: args.url,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: args.results.map((r, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: r.name,
        url: r.url,
      })),
    },
  };
}

export function newsArticleJsonLd(post: {
  headline: string;
  url: string;
  image?: string | null;
  datePublished: string;
  dateModified?: string;
  authorName?: string | null;
  description?: string;
}) {
  const articleUrl = post.url.startsWith("http") ? post.url : canonicalize(post.url);
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.headline,
    image: post.image ? [post.image] : undefined,
    datePublished: post.datePublished,
    dateModified: post.dateModified || post.datePublished,
    author: post.authorName
      ? { "@type": "Person", name: post.authorName }
      : { "@type": "Organization", name: site.name },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
      logo: { "@type": "ImageObject", url: site.logo },
    },
    url: articleUrl,
    description: post.description,
  };
}

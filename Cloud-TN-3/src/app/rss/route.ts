import { NextResponse } from "next/server";
import { fetchLatestPosts } from "@/lib/wp";
import { site } from "@/lib/seo";
import { stripHtml } from "@/lib/sanitize";

export async function GET() {
  const items = await fetchLatestPosts(20);

  const xmlItems = items
    .map((post) => {
      const link = `${site.url.replace(/\/$/, "")}/${post.slug}`;
      const pubDate = new Date(post.date).toUTCString();
      const description = stripHtml(post.excerpt ?? "");
      const image = post.featuredImage?.node?.sourceUrl;
      const enclosure = image ? `\n        <enclosure url="${image}" type="image/jpeg" />` : "";

      return `
      <item>
        <title><![CDATA[${post.title}]]></title>
        <link>${link}</link>
        <guid>${link}</guid>
        <pubDate>${pubDate}</pubDate>
        <description><![CDATA[${description}]]></description>${enclosure}
      </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title><![CDATA[${site.name}]]></title>
      <link>${site.url}</link>
      <description><![CDATA[${site.tagline}]]></description>
      ${xmlItems}
    </channel>
  </rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
    },
  });
}
export const dynamic = "force-dynamic";
export const revalidate = 0;

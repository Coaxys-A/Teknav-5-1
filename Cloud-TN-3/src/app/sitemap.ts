import type { MetadataRoute } from "next";
import { fetchLatestPosts } from "@/lib/wp";
import { site } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await fetchLatestPosts(50);
  const base = site.url.replace(/\/$/, "");

  return [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/news` },
    { url: `${base}/cyber` },
    { url: `${base}/tech` },
    { url: `${base}/tutorials` },
    { url: `${base}/analysis` },
    { url: `${base}/about` },
    { url: `${base}/contact` },
    { url: `${base}/submit` },
    ...posts.map((post) => ({ url: `${base}/${post.slug}`, lastModified: post.date })),
  ];
}
export const dynamic = "force-dynamic";
export const revalidate = 0;

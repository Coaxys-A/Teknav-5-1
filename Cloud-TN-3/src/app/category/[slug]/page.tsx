import type { Metadata } from "next";
import Link from "next/link";
import Section from "@/components/Section";
import Grid from "@/components/Grid";
import ArticleCard from "@/components/ArticleCard";
import ErrorBanner from "@/components/ErrorBanner";
import SeoJsonLd from "@/components/SeoJsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import { site, canonicalize, categoryCollectionJsonLd, breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { fetchCategoryInfo, fetchCategoryPage } from "@/lib/wp";
import { stripHtml } from "@/lib/sanitize";

interface Props {
  params: { slug: string };
  searchParams: { after?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await fetchCategoryInfo(params.slug).catch(() => null);
  const title = cat?.name ? `${cat.name} | ${site.name}` : `مطالب | ${site.name}`;
  const descBase = cat?.description ? stripHtml(cat.description) : undefined;
  const description = descBase && descBase.length > 0 ? descBase : `${site.tagline} — دسته ${cat?.name ?? ""}`;
  const url = canonicalize(`/category/${params.slug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: site.name,
      title,
      description,
      url,
      locale: "fa_IR",
    },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const slug = params.slug;
  const after = searchParams.after ?? null;

  const [cat, list] = await Promise.all([
    fetchCategoryInfo(slug).catch(() => null),
    fetchCategoryPage({ slug, first: 12, after }).catch(() => null),
  ]);

  const posts = list?.nodes ?? [];
  const hasNext = Boolean(list?.pageInfo?.hasNextPage);
  const nextCursor = list?.pageInfo?.endCursor ?? null;
  const canonical = canonicalize(`/category/${slug}`);

  const jsonLd = categoryCollectionJsonLd({
    name: cat?.name ?? "دسته",
    url: canonical,
    itemUrls: posts.map((p) => canonicalize(`/${p.slug}`)),
  });

  const itemList = itemListJsonLd(
    posts.map((p) => ({ name: p.title, url: canonicalize(`/${p.slug}`) }))
  );

  const crumbs = breadcrumbJsonLd([
    { name: "خانه", url: canonicalize("/") },
    { name: cat?.name ?? "دسته", url: canonical },
  ]);

  const noCategory = !cat;
  const descriptionText = cat?.description ? stripHtml(cat.description) : "";

  return (
    <>
      <SeoJsonLd id="ld-category" json={jsonLd} />
      <SeoJsonLd id="ld-category-items" json={itemList} />
      <SeoJsonLd id="ld-category-breadcrumbs" json={crumbs} />
      <Breadcrumbs items={[{ name: "خانه", href: "/" }, { name: cat?.name ?? slug }]} />
      <Section id="category" title={cat?.name ?? "دسته"}>
        {descriptionText && <p className="mb-4 text-slate-700">{descriptionText}</p>}
        {noCategory && <ErrorBanner text="این دسته‌بندی یافت نشد." />}
        <Grid cols={{ base: 1, sm: 2, lg: 3 }}>
          {posts.length ? (
            posts.map((post) => <ArticleCard key={post.id} post={post} />)
          ) : (
            <ErrorBanner text="مطلبی یافت نشد." />
          )}
        </Grid>
        {hasNext && nextCursor && (
          <div className="mt-8 flex justify-center">
            <Link
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-[color:var(--color-brand)] hover:text-[color:var(--color-brand)]"
              href={`/category/${slug}?after=${encodeURIComponent(nextCursor)}`}
            >
              مشاهده مطالب بیشتر
            </Link>
          </div>
        )}
      </Section>
    </>
  );
}

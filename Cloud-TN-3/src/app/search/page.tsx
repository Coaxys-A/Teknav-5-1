import type { Metadata } from "next";
import { Suspense } from "react";
import Section from "@/components/Section";
import Grid from "@/components/Grid";
import ArticleCard from "@/components/ArticleCard";
import ErrorBanner from "@/components/ErrorBanner";
import SeoJsonLd from "@/components/SeoJsonLd";
import SearchBar from "@/components/SearchBar";
import FiltersDrawer from "@/components/FiltersDrawer";
import { site, canonicalize, searchResultsJsonLd } from "@/lib/seo";
import { callBackend } from "@/lib/backend";

interface SearchParams {
  q?: string;
  category?: string;
  locale?: string;
  page?: string;
}

interface Props {
  searchParams: SearchParams;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = (searchParams.q ?? "").trim();
  const title = q ? `نتیجه جستجو برای "${q}" | ${site.name}` : `جستجو | ${site.name}`;
  const desc = q ? `جستجو برای عبارت "${q}" در ${site.name}.` : `جستجو در ${site.name}.`;
  const canonical = canonicalize(`/search${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: site.name,
      title,
      description: desc,
      url: canonical,
      locale: "fa_IR",
    },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const q = (searchParams.q ?? "").trim();
  const locale = (searchParams.locale ?? "").trim() || undefined;
  const category = (searchParams.category ?? "").trim() || undefined;

  const response = q
    ? await callBackend<any>({
        path: "/search",
        method: "GET",
        searchParams: new URLSearchParams({
          q,
          ...(locale ? { locale } : {}),
          ...(category ? { tags: category } : {}),
          limit: "30",
        }),
        cache: "no-store",
      }).catch(() => null)
    : null;

  const posts =
    response?.items?.map((r: any) => ({
      id: r.article?.id ?? r.articleId,
      title: r.title ?? r.article?.title,
      slug: r.article?.slug,
      excerpt: r.bodyExcerpt ?? "",
    })) ?? [];

  const canonical = canonicalize(`/search${q ? `?q=${encodeURIComponent(q)}` : ""}`);

  const jsonLd = q
    ? searchResultsJsonLd({
        query: q,
        url: canonical,
        results: posts.map((p: any) => ({ name: p.title, url: canonicalize(`/articles/${p.slug}`) })),
      })
    : null;

  return (
    <>
      {jsonLd && <SeoJsonLd id="ld-search" json={jsonLd} />}
      <Section title="جستجو">
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <Suspense fallback={null}>
            <SearchBar defaultQuery={q} />
          </Suspense>
          <Suspense fallback={null}>
            <FiltersDrawer defaultCategory={category} />
          </Suspense>
        </div>
        {q ? (
          <>
            <p className="mb-3 text-sm text-slate-600">نتیجه برای: <strong>{q}</strong></p>
            <Grid cols={{ base: 1, sm: 2, lg: 3 }}>
              {posts.length ? (
                posts.map((post: any) => (
                  <ArticleCard key={post.id} post={{ id: post.id, title: post.title, slug: post.slug, excerpt: post.excerpt, date: new Date().toISOString() }} />
                ))
              ) : (
                <ErrorBanner text="موردی یافت نشد." />
              )}
            </Grid>
          </>
        ) : (
          <p className="text-slate-600">عبارت جستجو را وارد کنید.</p>
        )}
      </Section>
    </>
  );
}

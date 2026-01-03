export const dynamic = "force-dynamic";
export const revalidate = 0;

import { fetchCategoryPosts } from "@/lib/wp";
import { AdSlot } from "@/components/ads/AdSlot";
import { PluginSlot } from "@/components/PluginSlot";

export const metadata = {
  title: "OOrO\"OO�",
};

export default async function NewsPage() {
  const posts = await fetchCategoryPosts("news", 12);
  return (
    <section className="mx-auto max-w-5xl space-y-6 px-6 py-10" dir="rtl">
      <header className="space-y-2 text-right">
        <h1 className="text-3xl font-bold">O�OrO�UOU+ OOrO\"OO� O�UcU+U^U,U^U~UO</h1>
        <p className="text-muted-foreground">U.O�U^O� O3O�UOO1 U.U�U.?OO�O�UOU+ OrO\"O�U�OUO U?U+OU^O�UO.</p>
      </header>
      <AdSlot slotKey="news_top" />
      <PluginSlot slot="news_sidebar" />
      <div className="grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <article key={post.id} className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">{post.title}</h2>
            <p className="mt-3 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: post.excerpt ?? "" }} />
          </article>
        ))}
      </div>
    </section>
  );
}

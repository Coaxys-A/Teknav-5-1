export const dynamic = "force-dynamic";
export const revalidate = 0;

import { fetchCategoryPosts } from "@/lib/wp";

export const metadata = {
  title: "امنیت سایبری",
};

export default async function CyberPage() {
  const posts = await fetchCategoryPosts("cyber", 12);
  return (
    <section className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <header className="space-y-2 text-right">
        <h1 className="text-3xl font-bold">راهنماهای امنیت سایبری</h1>
        <p className="text-muted-foreground">از مباحث مقدماتی تا سطح پیشرفته برای متخصصان حوزه امنیت.</p>
      </header>
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

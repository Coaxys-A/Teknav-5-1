import { promises as fs } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

async function loadPublished(slug: string) {
  try {
    const file = join(process.cwd(), "content", "articles", `${slug}.mdx`);
    return await fs.readFile(file, "utf8");
  } catch {
    return null;
  }
}

type Params = { params: { slug: string } };

export default async function Page({ params }: Params) {
  const content = await loadPublished(params.slug);
  if (!content) {
    return <div className="p-6 text-muted-foreground">Article not found</div>;
  }
  return (
    <article className="prose prose-neutral mx-auto max-w-3xl p-6">
      <pre className="whitespace-pre-wrap">{content}</pre>
    </article>
  );
}

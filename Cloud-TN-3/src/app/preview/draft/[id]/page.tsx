import { redisGet } from "@/lib/redis-rest";
import { callBackend } from "@/lib/backend";

export const dynamic = "force-dynamic";

async function loadDraft(id: string) {
  const cached = await redisGet(`draft:${id}`);
  if (cached) {
    try {
      return JSON.parse(cached as string);
    } catch {
      // ignore
    }
  }
  try {
    const article = await callBackend<any>({ path: `/articles/${id}`, cache: "no-store" });
    return article;
  } catch {
    return null;
  }
}

type Params = { params: { id: string } };

export default async function Page({ params }: Params) {
  const draft = await loadDraft(params.id);
  if (!draft) {
    return <div className="p-6 text-muted-foreground">Draft not found</div>;
  }
  return (
    <article className="prose prose-neutral mx-auto max-w-3xl p-6">
      <h1>{draft.meta?.title ?? "Draft"}</h1>
      <pre className="whitespace-pre-wrap">{draft.content}</pre>
    </article>
  );
}

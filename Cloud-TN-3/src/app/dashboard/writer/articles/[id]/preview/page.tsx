import { getDraftPreview } from "@/app/dashboard/_articles/actions";
import { SectionContent } from "../../../../owner/_components/section-wrapper";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export default async function Page({ params }: Params) {
  const res = await getDraftPreview(params.id);
  const draft = res.draft;

  return (
    <SectionContent title="Draft Preview" description="View the latest autosave">
      {!draft ? (
        <div className="text-muted-foreground">No draft available.</div>
      ) : (
        <article className="prose prose-neutral dark:prose-invert max-w-4xl">
          <h1>{draft.meta?.title ?? "Untitled"}</h1>
          {draft.meta?.seoDescription ? (
            <p className="text-muted-foreground">{draft.meta.seoDescription}</p>
          ) : null}
          <div className="mt-4 whitespace-pre-wrap rounded border bg-card p-4">
            {draft.content}
          </div>
        </article>
      )}
    </SectionContent>
  );
}

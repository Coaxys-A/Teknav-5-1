import { SectionContent } from "../../../../owner/_components/section-wrapper";
import { EditorClient } from "../../../../_articles/editor-client";
import { loadDraftAction } from "../../../../_articles/editor-actions";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export default async function Page({ params }: Params) {
  const draft = await loadDraftAction(params.id);
  return (
    <SectionContent title="Edit Article" description="Update your draft">
      <EditorClient articleId={params.id} initialContent={draft.draft?.content ?? ""} initialMeta={draft.draft?.meta ?? {}} />
    </SectionContent>
  );
}

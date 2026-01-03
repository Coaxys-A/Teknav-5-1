import { SectionContent } from "../../../owner/_components/section-wrapper";
import { EditorClient } from "../../../_articles/editor-client";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <SectionContent title="New Article" description="Create a draft">
      <EditorClient articleId="new" />
    </SectionContent>
  );
}

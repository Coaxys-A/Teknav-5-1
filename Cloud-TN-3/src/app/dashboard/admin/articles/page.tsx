import { SectionContent } from "../../owner/_components/section-wrapper";
import { ArticleTable } from "../../_articles/table";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <SectionContent title="Articles" description="Admin controls for articles">
      <ArticleTable role="admin" />
    </SectionContent>
  );
}

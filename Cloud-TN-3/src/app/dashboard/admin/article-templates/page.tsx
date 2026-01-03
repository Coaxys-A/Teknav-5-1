import { SectionContent } from "../../owner/_components/section-wrapper";
import { listTemplates, applyTemplateToDraft } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page() {
  const templates = await listTemplates();
  return (
    <SectionContent title="Article Templates" description="Predefined structures and SEO blocks">
      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((tmpl) => (
          <Card key={tmpl.key}>
            <CardHeader>
              <CardTitle>{tmpl.titlePattern}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">Tags: {tmpl.tags.join(", ")}</div>
              <div className="text-sm text-muted-foreground">SEO: {tmpl.seoKeywords.join(", ")}</div>
              <div className="text-sm">Sections: {tmpl.sections.join(" · ")}</div>
              <div className="text-xs text-muted-foreground">Disclaimer: {tmpl.disclaimer}</div>
              <div className="text-xs text-muted-foreground">Prerequisites: {tmpl.prerequisites}</div>
              <div className="flex gap-2">
                <Button size="sm" asChild>
                  <Link href={`/dashboard/writer/articles/new?template=${tmpl.key}`}>Use template</Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  formAction={async () => {
                    "use server";
                    await applyTemplateToDraft({ key: tmpl.key, articleId: "new" });
                  }}
                >
                  Apply to draft
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionContent>
  );
}

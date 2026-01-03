'use client';

import { EditorClient } from "../editor-client";

export function Editor({ articleId, initialContent, initialMeta }: { articleId: string; initialContent?: string; initialMeta?: any }) {
  return <EditorClient articleId={articleId} initialContent={initialContent} initialMeta={initialMeta} />;
}

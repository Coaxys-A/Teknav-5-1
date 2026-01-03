const entities: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&quot;": "\"",
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

export function stripHtml(value: string) {
  if (!value) return "";
  const withoutTags = value.replace(/<[^>]*>/g, " ");
  const decoded = withoutTags.replace(/&[a-zA-Z0-9#]+;/g, (entity) => entities[entity] ?? " ");
  return decoded.replace(/\s+/g, " ").trim();
}

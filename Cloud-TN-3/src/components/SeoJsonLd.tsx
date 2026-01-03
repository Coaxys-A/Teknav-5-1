interface SeoJsonLdProps {
  id: string;
  json: unknown;
}

export default function SeoJsonLd({ id, json }: SeoJsonLdProps) {
  return <script id={id} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}

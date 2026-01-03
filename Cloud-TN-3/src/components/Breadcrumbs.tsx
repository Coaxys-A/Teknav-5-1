import Link from "next/link";

interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items?.length) return null;
  return (
    <nav aria-label="ردیف راهنما" className="container-xl py-6 text-sm text-slate-600">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="flex items-center gap-2">
            {item.href ? (
              <Link href={item.href} className="hover:text-[color:var(--color-brand)] focus-visible:text-[color:var(--color-brand)]">
                {item.name}
              </Link>
            ) : (
              <span>{item.name}</span>
            )}
            {index < items.length - 1 && (
              <span aria-hidden="true" className="text-slate-400">
                /
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

import Image from "next/image";
import Link from "next/link";
import { formatFa } from "@/lib/dates";
import { cx, formatNumberFa } from "@/lib/utils";
import { stripHtml } from "@/lib/sanitize";
import CategoryPill from "./CategoryPill";
import type { WpPost } from "@/lib/wp";

function estimateReadingMinutes(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 130));
  return minutes;
}

export default function ArticleCard({ post, wide }: { post: WpPost; wide?: boolean }) {
  const excerpt = stripHtml(post?.excerpt ?? "");
  const date = post?.date ? formatFa(post.date) : "";
  const imageUrl = post?.featuredImage?.node?.sourceUrl ?? undefined;
  const href = post?.slug ? `/${post.slug}` : "#";
  const primaryCategory = post?.categories?.nodes?.[0]?.name ?? undefined;
  const readingMinutes = wide ? estimateReadingMinutes(excerpt || post.title) : null;

  const cardClass = cx(
    "grid h-full grid-rows-[auto,1fr] rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-[var(--shadow-soft)] focus-within:shadow-[var(--shadow-soft)] dark:border-slate-700 dark:bg-[#0f172a]",
    wide && "md:col-span-2"
  );

  return (
    <article className={cardClass}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={post?.title ?? ""}
          width={800}
          height={450}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="h-48 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-48 w-full bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900" aria-hidden="true" />
      )}
      <div className="flex flex-col gap-3 p-4">
        {primaryCategory && <CategoryPill name={primaryCategory} />}
        <h3 className="text-lg font-bold leading-7 text-slate-900 dark:text-slate-50">
          <Link href={href} aria-label={post?.title ?? ""} className="transition-colors hover:text-[color:var(--color-brand)] focus-visible:text-[color:var(--color-brand)]">
            {post?.title}
          </Link>
        </h3>
        {excerpt && <p className="text-sm text-slate-600 line-clamp-2 dark:text-slate-300">{excerpt}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>{date}</span>
          {wide && readingMinutes && (
            <span>زمان مطالعه: حدود {formatNumberFa(readingMinutes)} دقیقه</span>
          )}
        </div>
      </div>
    </article>
  );
}

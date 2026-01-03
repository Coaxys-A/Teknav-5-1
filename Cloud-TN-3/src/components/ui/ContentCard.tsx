import Image from "next/image";
import Link from "next/link";
import React from "react";

interface ContentCardProps {
  title: string;
  href: string;
  excerpt?: string;
  tag?: string;
  imageUrl?: string;
  meta?: string;
}

export function ContentCard({ title, href, excerpt, tag, imageUrl, meta }: ContentCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-sm shadow-cyan-500/10 transition hover:-translate-y-1 hover:shadow-cyan-400/20">
      {imageUrl ? (
        <Image src={imageUrl} alt={title} width={800} height={420} className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-gradient-to-br from-slate-800 to-slate-900" aria-hidden />
      )}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {tag && <span className="text-xs text-cyan-300">{tag}</span>}
        <h4 className="text-lg font-bold text-white">
          <Link href={href} className="hover:text-cyan-200">
            {title}
          </Link>
        </h4>
        {excerpt && <p className="line-clamp-2 text-sm text-slate-300">{excerpt}</p>}
        <div className="mt-auto text-xs text-slate-400">{meta}</div>
      </div>
    </article>
  );
}

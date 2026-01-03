export default function CategoryPill({ name }: { name?: string }) {
  if (!name) return null;
  return (
    <span className="inline-block rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600">
      {name}
    </span>
  );
}

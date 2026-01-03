export default function Skeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-48 animate-pulse rounded-2xl bg-slate-200" aria-hidden="true" />
      ))}
    </>
  );
}

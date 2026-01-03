import { cn } from "@/lib/utils";

export function ParticleOrbs({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute -left-10 top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(59,168,255,0.2),transparent_65%)] animate-[float_10s_ease-in-out_infinite]" />
      <div className="absolute right-6 top-14 h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.18),transparent_60%)] animate-[float_12s_ease-in-out_infinite_reverse]" />
      <div className="absolute left-1/3 bottom-6 h-16 w-16 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.16),transparent_65%)] animate-[float_14s_ease-in-out_infinite]" />
    </div>
  );
}

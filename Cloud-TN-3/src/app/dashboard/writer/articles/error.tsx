'use client';

type ErrorProps = { error: Error & { digest?: string }; reset: () => void };

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-3">
      <div className="text-sm font-semibold text-destructive">Error: {error.message}</div>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Retry
      </button>
    </div>
  );
}

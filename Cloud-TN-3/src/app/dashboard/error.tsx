'use client';

export default function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex items-center justify-center py-12" dir="rtl">
      <div className="space-y-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
        <p>خطایی در بارگذاری داشبورد رخ داد.</p>
        <p className="text-xs text-rose-600">{error.message}</p>
        <button onClick={reset} className="rounded-md bg-rose-600 px-3 py-1.5 text-white text-xs">تلاش مجدد</button>
      </div>
    </div>
  );
}

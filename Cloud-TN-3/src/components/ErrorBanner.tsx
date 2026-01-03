export default function ErrorBanner({ text }: { text: string }) {
  return (
    <div
      className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/30 dark:text-red-100"
      role="alert"
    >
      {text}
    </div>
  );
}

import React from "react";

type Props = { message?: string; action?: React.ReactNode };

export default function ErrorState({ message, action }: Props) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-700/40 dark:bg-rose-900/40 dark:text-rose-100">
      {message ?? "خطایی رخ داد."}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

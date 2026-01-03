"use client";

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 px-6 text-center">
      <div className="max-w-xl space-y-4">
        <h1 className="text-3xl font-bold">آفلاین هستید</h1>
        <p className="text-lg text-slate-200">
          اتصال اینترنت در دسترس نیست. می‌توانید مقالات کش‌شده اخیر را از منوی مرورگر یا پس از برقراری ارتباط دوباره بخوانید.
        </p>
      </div>
    </main>
  );
}

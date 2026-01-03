import React from "react";
import { cx } from "@/lib/utils";

export const Meteors = ({
  number,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const meteors = new Array(number || 20).fill(true);
  return (
    <>
      {meteors.map((_, idx) => (
        <span
          key={`meteor-${idx}`}
          className={cx(
            "animate-meteor absolute top-1/2 left-1/2 h-0.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-400 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] dark:bg-slate-200",
            "before:content-[''] before:absolute before:top-1/2 before:-translate-y-1/2 before:w-[60px] before:h-px before:bg-gradient-to-r before:from-slate-400 before:to-transparent dark:before:from-white/70",
            className,
          )}
          style={{
            top: "0%",
            left: `${Math.floor(Math.random() * (400 - -400) + -400)}px`,
            animationDelay: `${Math.random() * (0.8 - 0.2) + 0.2}s`,
            animationDuration: `${Math.floor(Math.random() * (10 - 2) + 2)}s`,
          }}
        />
      ))}
    </>
  );
};

export function MeteorsDemo() {
  return (
    <div className="relative max-w-xs">
      <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-blue-500 to-teal-500 scale-90 rounded-full blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 px-4 py-8 shadow-2xl">
        <div className="h-5 w-5 rounded-full border border-slate-600 flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="h-2 w-2 text-slate-200"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
          </svg>
        </div>

        <h3 className="font-bold text-lg text-white mb-2 relative z-10">موج‌های نور</h3>
        <p className="text-sm text-slate-300 relative z-10">
          افکت متئور برای بخش‌های هیرو و کارت‌های برجسته با ظاهری مینیمال و هماهنگ با تم سایت.
        </p>
        <div className="pointer-events-none absolute inset-0">
          <Meteors number={18} />
        </div>
      </div>
    </div>
  );
}

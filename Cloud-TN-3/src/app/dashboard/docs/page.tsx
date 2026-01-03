import Link from "next/link";
import { BreadcrumbsDash } from "@/components/dashboard/BreadcrumbsDash";

export default function DashboardDocsPage() {
  return (
    <div className="space-y-4" dir="rtl">
      <BreadcrumbsDash currentPath="/dashboard/docs" />
      <h1 className="text-2xl font-bold text-slate-900">مستندات و راهنما</h1>
      <p className="text-sm text-slate-600">لینک‌های سریع برای راه‌اندازی، API و الگوهای داشبورد.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {[{title:"API Auth",desc:"ورود/توکن"},{title:"پلاگین‌ها",desc:"ثبت و اجرا"},{title:"AI",desc:"Agent/Tools"},{title:"مقالات",desc:"CRUD + SEO"}].map((item)=> (
          <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="font-semibold text-slate-900">{item.title}</p>
            <p className="text-xs text-slate-500">{item.desc}</p>
            <Link href="#" className="text-xs text-blue-600">باز کردن</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

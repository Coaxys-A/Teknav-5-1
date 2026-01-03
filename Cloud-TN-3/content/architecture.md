# معماری سراسری Teknav (فاز ساخت Stage 2 و 3)

این سند خلاصه‌ی اسکلت و مسیر توسعه بک‌اند و فرانت‌اند طبق پرامپت اصلی است تا تیم بتواند ماژول‌ها را به‌صورت مرحله‌ای و قابل موازی‌سازی پیش ببرد.

## بک‌اند (NestJS + Prisma + PostgreSQL + Redis)
- لایه دامنه: User، Auth، Roles & Permissions، Article/Content، Media، AI، Security/Audit، Marketplace (Skeleton).
- امنیت: JWT + رفرش‌توکن (نشست)، نقش‌ها (Owner/Admin/Writer/Guest + Service)، Rate-limit، WAF/Helmet، ذخیره هش در DB + Redis، قلاب MFA/Device Fingerprint (در حال طراحی).
- داده: Prisma با مدل‌های User، Session، ApiToken، Article، AIReport، AuditLog؛ ایندکس روی userId/expiresAt برای نشست‌ها.
- API: REST + GraphQL (Apollo)، دسته‌بندی Public/Private/Internal، هدر CORS کنترل‌شده، آماده‌سازی WebSocket برای Real-time.
- صف و پردازش: Bull/Redis برای کارهای AI، رسانه و امنیت (در فاز بعدی وصل می‌شود)، Cron برای پاک‌سازی نشست‌ها و گزارش‌ها.
- مشاهده‌پذیری: AuditLog، هدر x-user-role، Health Endpoint، پیشنهاد ELK/Cloud Logging.
- تست/CI: prisma generate + lint + build در GitHub Actions (`.github/workflows/backend-ci.yml`)، مسیر ارتقای تست E2E با Supertest.

## فرانت‌اند (Next.js 14، RTL، طراحی فارسی)
- ساختار چندبخشی: Landing، صفحات محتوا، احراز هویت (ورود/ثبت‌نام/فراموشی)، داشبورد یکپارچه + زیرپنل‌های Writer/Admin/Owner/Security/AI/Docs.
- پوسته داشبورد: `AppShell` با ناوبری ثابت، کارت‌های آمار، فید فعالیت، پنل امنیت، AI Ops، و نقشه مستندات.
- UI/UX: Tailwind + فونت‌های Vazirmatn/Vazir، RTL سراسری، رنگ برند (`--color-brand`)، کارت و سایه نرم، توکن‌های طراحی در `src/styles/tokens.css`.
- امنیت کلاینت: middleware نقش‌محور، مسیرهای محافظت‌شده `/dashboard/*` و API، فرم‌های احراز هویت آماده اتصال به بک‌اند.
- مسیرهای آینده: Dashboard امنیت پیشرفته، Agent Studio، مرکز رسانه، مستندات تعاملی، SDK کلاینت، و صفحات Marketplace.

## مسیر توسعه بعدی (بر اساس پرامپت)
1. اتصال کامل Auth فرانت‌اند به بک‌اند NestJS (login/refresh/logout، MFA اختیاری).
2. افزودن صف Bull + Redis برای AI و رسانه، و WebSocket برای داشبورد زنده.
3. افزودن ماژول امنیت پویا: امتیاز رفتار، قفل حساب، اعلان لحظه‌ای.
4. تکمیل مستندات: پلی‌بوک عملیات، معماری داده، و راهنمای Agentها.
5. بهینه‌سازی عملکرد: CDN + ISR/SSG، کش کوئری، و پروفایلینگ پایگاه داده.

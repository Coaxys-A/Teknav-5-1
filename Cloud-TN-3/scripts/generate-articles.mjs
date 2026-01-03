#!/usr/bin/env node
import { mkdir, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";

const OUTPUT_DIR = join(process.cwd(), "content", "posts");

const seeds = [
  {
    title: "راهنمای عملی WebAssembly برای توسعه‌دهندگان فرانت‌اند",
    category: "tech",
    excerpt: "خلاصه: راهنمای عملی WebAssembly برای توسعه‌دهندگان فرانت‌اند — مروری سریع بر نکات کلیدی و کاربردی.",
    content:
      "راهنمای عملی WebAssembly برای توسعه‌دهندگان فرانت‌اند\n\nمقدمه:\nدر این مطلب به بررسی «راهنمای عملی WebAssembly برای توسعه‌دهندگان فرانت‌اند» می‌پردازیم و نکات مهم عملی را مرور می‌کنیم.\n\nمحورها:\n- تعریف و کاربردها\n- چالش‌های رایج\n- ابزارها و روش‌ها\n- سناریوهای واقعی\n- جمع‌بندی و منابع\n\n\n\nنتیجه‌گیری:\nبه صورت خلاصه آموختیم چگونه رویکرد درست را برای «راهنمای عملی WebAssembly برای توسعه‌دهندگان فرانت‌اند» اتخاذ کنیم.",
    tags: ["آموزش", "تحلیل", "فناوری"],
  },
  {
    title: "آشنایی با Edge Functions در Vercel و الگوهای کاربردی",
    category: "tech",
    excerpt: "خلاصه: آشنایی با Edge Functions در Vercel و الگوهای کاربردی — مروری سریع بر نکات کلیدی و کاربردی.",
    content:
      "آشنایی با Edge Functions در Vercel و الگوهای کاربردی\n\nمقدمه:\nدر این مطلب به بررسی «آشنایی با Edge Functions در Vercel و الگوهای کاربردی» می‌پردازیم و نکات مهم عملی را مرور می‌کنیم.\n\nمحورها:\n- تعریف و کاربردها\n- چالش‌های رایج\n- ابزارها و روش‌ها\n- سناریوهای واقعی\n- جمع‌بندی و منابع\n\n\n\nنتیجه‌گیری:\nبه صورت خلاصه آموختیم چگونه رویکرد درست را برای «آشنایی با Edge Functions در Vercel و الگوهای کاربردی» اتخاذ کنیم.",
    tags: ["آموزش", "تحلیل", "فناوری"],
  },
  {
    title: "مقایسه Bun و Node.js در پروژه‌های تولیدی",
    category: "tech",
    excerpt: "خلاصه: مقایسه Bun و Node.js در پروژه‌های تولیدی — مروری سریع بر نکات کلیدی و کاربردی.",
    content:
      "مقایسه Bun و Node.js در پروژه‌های تولیدی\n\nمقدمه:\nدر این مطلب به بررسی «مقایسه Bun و Node.js در پروژه‌های تولیدی» می‌پردازیم و نکات مهم عملی را مرور می‌کنیم.\n\nمحورها:\n- تعریف و کاربردها\n- چالش‌های رایج\n- ابزارها و روش‌ها\n- سناریوهای واقعی\n- جمع‌بندی و منابع\n\n\n\nنتیجه‌گیری:\nبه صورت خلاصه آموختیم چگونه رویکرد درست را برای «مقایسه Bun و Node.js در پروژه‌های تولیدی» اتخاذ کنیم.",
    tags: ["آموزش", "تحلیل", "فناوری"],
  },
  {
    title: "Deep Dive در Server Actions در Next.js 14",
    category: "tech",
    excerpt: "خلاصه: Deep Dive در Server Actions در Next.js 14 — مروری سریع بر نکات کلیدی و کاربردی.",
    content:
      "Deep Dive در Server Actions در Next.js 14\n\nمقدمه:\nدر این مطلب به بررسی «Deep Dive در Server Actions در Next.js 14» می‌پردازیم و نکات مهم عملی را مرور می‌کنیم.\n\nمحورها:\n- تعریف و کاربردها\n- چالش‌های رایج\n- ابزارها و روش‌ها\n- سناریوهای واقعی\n- جمع‌بندی و منابع\n\n\n\nنتیجه‌گیری:\nبه صورت خلاصه آموختیم چگونه رویکرد درست را برای «Deep Dive در Server Actions در Next.js 14» اتخاذ کنیم.",
    tags: ["آموزش", "تحلیل", "فناوری"],
  },
  {
    title: "بهینه‌سازی تصاویر وب با AVIF/WebP در مقیاس بالا",
    category: "tech",
    excerpt: "خلاصه: بهینه‌سازی تصاویر وب با AVIF/WebP در مقیاس بالا — مروری سریع بر نکات کلیدی و کاربردی.",
    content:
      "بهینه‌سازی تصاویر وب با AVIF/WebP در مقیاس بالا\n\nمقدمه:\nدر این مطلب به بررسی «بهینه‌سازی تصاویر وب با AVIF/WebP در مقیاس بالا» می‌پردازیم و نکات مهم عملی را مرور می‌کنیم.\n\nمحورها:\n- تعریف و کاربردها\n- چالش‌های رایج\n- ابزارها و روش‌ها\n- سناریوهای واقعی\n- جمع‌بندی و منابع\n\n\n\nنتیجه‌گیری:\nبه صورت خلاصه آموختیم چگونه رویکرد درست را برای «بهینه‌سازی تصاویر وب با AVIF/WebP در مقیاس بالا» اتخاذ کنیم.",
    tags: ["آموزش", "تحلیل", "فناوری"],
  },
  {
    title: "Design Systems در تیم‌های کوچک: روش‌های سبک اما مؤثر",
    category: "tech",
    excerpt: "خلاصه: Design Systems در تیم‌های کوچک: روش‌های سبک اما مؤثر — مروری سریع بر نکات کلیدی و کاربردی.",
    content:
      "Design Systems در تیم‌های کوچک: روش‌های سبک اما مؤثر\n\nمقدمه:\nدر این مطلب به بررسی «Design Systems در تیم‌های کوچک: روش‌های سبک اما مؤثر» می‌پردازیم و نکات مهم عملی را مرور می‌کنیم.\n\nمحورها:\n- تعریف و کاربردها\n- چالش‌های رایج\n- ابزارها و روش‌ها\n- سناریوهای واقعی\n- جمع‌بندی و منابع\n\n\n\nنتیجه‌گیری:\nبه صورت خلاصه آموختیم چگونه رویکرد درست را برای «Design Systems در تیم‌های کوچک: روش‌های سبک اما مؤثر» اتخاذ کنیم.",
    tags: ["آموزش", "تحلیل", "فناوری"],
  },
  {
    title: "State Management مدرن با Zustand و Signals",
    category: "tech",
    excerpt: "خلاصه: State Management مدرن با Zustand و Signals — مروری سریع بر نکات کلیدی و کاربردی.",
    content:
      "State Management مدرن با Zustand و Signals\n\nمقدمه:\nدر این مطلب به بررسی «State Management مدرن با Zustand و Signals» می‌پردازیم و نکات مهم عملی را مرور می‌کنیم.\n\nمحورها:\n- تعریف و کاربردها\n- چالش‌های رایج\n- ابزارها و روش‌ها\n- سناریوهای واقعی\n- جمع‌بندی و منابع\n\n\n\nنتیجه‌گیری:\nبه صورت خلاصه آموختیم چگونه رویکرد درست را برای «State Management مدرن با Zustand و Signals» اتخاذ کنیم.",
    tags: ["آموزش", "تحلیل", "فناوری"],
  },
  {
    title: "Testing E2E با Playwright در CI",
    category: "tech",
    excerpt: "خلاصه: Testing E2E با Playwright در CI — مروری سریع بر نکات کلیدی و کاربردی.",
    content:
      "Testing E2E با Playwright در CI\n\nمقدمه:\nدر این مطلب به بررسی «Testing E2E با Playwright در CI» می‌پردازیم و نکات مهم عملی را مرور می‌کنیم.\n\nمحورها:\n- تعریف و کاربردها\n- چالش‌های رایج\n- ابزارها و روش‌ها\n- سناریوهای واقعی\n- جمع‌بندی و منابع\n\n\n\nنتیجه‌گیری:\nبه صورت خلاصه آموختیم چگونه رویکرد درست را برای «Testing E2E با Playwright در CI» اتخاذ کنیم.",
    tags: ["آموزش", "تحلیل", "فناوری"],
  },
  {
    title: "Observability برای Frontend با Sentry و Web Vitals",
    category: "tech",
    excerpt: "خلاصه: Observability برای Frontend با Sentry و Web Vitals — مروری سریع بر نکات کلیدی و کاربردی.",
    content:
      "Observability برای Frontend با Sentry و Web Vitals\n\nمقدمه:\nدر این مطلب به بررسی «Observability برای Frontend با Sentry و Web Vitals» می‌پردازیم و نکات مهم عملی را مرور می‌کنیم.\n\nمحورها:\n- تعریف و کاربردها\n- چالش‌های رایج\n- ابزارها و روش‌ها\n- سناریوهای واقعی\n- جمع‌بندی و منابع\n\n\n\nنتیجه‌گیری:\nبه صورت خلاصه آموختیم چگونه رویکرد درست را برای «Observability برای Frontend با Sentry و Web Vitals» اتخاذ کنیم.",
    tags: ["آموزش", "تحلیل", "فناوری"],
  },
  {
    title: "Incremental Static Regeneration در پروژه‌های خبری",
    category: "tech",
    excerpt: "خلاصه: Incremental Static Regeneration در پروژه‌های خبری — مروری سریع بر نکات کلیدی و کاربردی.",
    content:
      "Incremental Static Regeneration در پروژه‌های خبری\n\nمقدمه:\nدر این مطلب به بررسی «Incremental Static Regeneration در پروژه‌های خبری» می‌پردازیم و نکات مهم عملی را مرور می‌کنیم.\n\nمحورها:\n- تعریف و کاربردها\n- چالش‌های رایج\n- ابزارها و روش‌ها\n- سناریوهای واقعی\n- جمع‌بندی و منابع\n\n\n\nنتیجه‌گیری:\nبه صورت خلاصه آموختیم چگونه رویکرد درست را برای «Incremental Static Regeneration در پروژه‌های خبری» اتخاذ کنیم.",
    tags: ["آموزش", "تحلیل", "فناوری"],
  },
  {
    title: "شناسایی سطح حمله (Attack Surface) در محیط‌های Cloud-Native",
    category: "cyber",
    excerpt: "خلاصه: شناسایی سطح حمله (Attack Surface) در محیط‌های Cloud-Native — مروری سریع بر نکات کلیدی و کاربردی.",
    content:
      "شناسایی سطح حمله (Attack Surface) در محیط‌های Cloud-Native\n\nمقدمه:\nدر این مطلب به بررسی «شناسایی سطح حمله (Attack Surface) در محیط‌های Cloud-Native» می‌پردازیم و نکات مهم عملی را مرور می‌کنیم.\n\nمحورها:\n- تعریف و کاربردها\n- چالش‌های رایج\n- ابزارها و روش‌ها\n- سناریوهای واقعی\n- جمع‌بندی و منابع\n\nیادداشت: این مطلب سطح پیشرفته دارد و حاوی تمرین‌های تخصصی است.\n\nنتیجه‌گیری:\nبه صورت خلاصه آموختیم چگونه رویکرد درست را برای «شناسایی سطح حمله (Attack Surface) در محیط‌های Cloud-Native» اتخاذ کنیم.",
    tags: ["امنیت", "شبکه", "آموزش", "پیشرفته"],
    advanced: true,
  },
  {
    title: "پیشگیری از تزریق SQL با ORMهای مدرن و WAF",
    category: "cyber",
    excerpt: "خلاصه: پیشگیری از تزریق SQL با ORMهای مدرن و WAF — مروری سریع بر نکات کلیدی و کاربردی.",
    content:
      "پیشگیری از تزریق SQL با ORMهای مدرن و WAF\n\nمقدمه:\nدر این مطلب به بررسی «پیشگیری از تزریق SQL با ORMهای مدرن و WAF» می‌پردازیم و نکات مهم عملی را مرور می‌کنیم.\n\nمحورها:\n- تعریف و کاربردها\n- چالش‌های رایج\n- ابزارها و روش‌ها\n- سناریوهای واقعی\n- جمع‌بندی و منابع\n\nیادداشت: این مطلب سطح پیشرفته دارد و حاوی تمرین‌های تخصصی است.\n\nنتیجه‌گیری:\nبه صورت خلاصه آموختیم چگونه رویکرد درست را برای «پیشگیری از تزریق SQL با ORMهای مدرن و WAF» اتخاذ کنیم.",
    tags: ["امنیت", "شبکه", "آموزش", "پیشرفته"],
    advanced: true,
  },
  {
    title: "تهدیدشناسی IoT: مدل‌ها، ابزارها و سناریوهای واقعی",
    category: "cyber",
    excerpt: "خلاصه: تهدیدشناسی IoT: مدل‌ها، ابزارها و سناریوهای واقعی — مروری سریع بر نکات کلیدی و کاربردی.",
    content:
      "تهدیدشناسی IoT: مدل‌ها، ابزارها و سناریوهای واقعی\n\nمقدمه:\nدر این مطلب به بررسی «تهدیدشناسی IoT: مدل‌ها، ابزارها و سناریوهای واقعی» می‌پردازیم و نکات مهم عملی را مرور می‌کنیم.\n\nمحورها:\n- تعریف و کاربردها\n- چالش‌های رایج\n- ابزارها و روش‌ها\n- سناریوهای واقعی\n- جمع‌بندی و منابع\n\nیادداشت: این مطلب سطح پیشرفته دارد و حاوی تمرین‌های تخصصی است.\n\nنتیجه‌گیری:\nبه صورت خلاصه آموختیم چگونه رویکرد درست را برای «تهدیدشناسی IoT: مدل‌ها، ابزارها و سناریوهای واقعی» اتخاذ کنیم.",
    tags: ["امنیت", "شبکه", "آموزش", "پیشرفته"],
    advanced: true,
  },
  {
    title: "آموزش پیکربندی Hardened Linux برای سرورها",
    category: "cyber",
    excerpt: "خلاصه: آموزش پیکربندی Hardened Linux برای سرورها — مروری سریع بر نکات کلیدی و کاربردی.",
    content:
      "آموزش پیکربندی Hardened Linux برای سرورها\n\nمقدمه:\nدر این مطلب به بررسی «آموزش پیکربندی Hardened Linux برای سرورها» می‌پردازیم و نکات مهم عملی را مرور می‌کنیم.\n\nمحورها:\n- تعریف و کاربردها\n- چالش‌های رایج\n- ابزارها و روش‌ها\n- سناریوهای واقعی\n- جمع‌بندی و منابع\n\nیادداشت: این مطلب سطح پیشرفته دارد و حاوی تمرین‌های تخصصی است.\n\nنتیجه‌گیری:\nبه صورت خلاصه آموختیم چگونه رویکرد درست را برای «آموزش پیکربندی Hardened Linux برای سرورها» اتخاذ کنیم.",
    tags: ["امنیت", "شبکه", "آموزش", "پیشرفته"],
    advanced: true,
  },
  {
    title: "تهدیدات Supply Chain در npm و روش‌های کاهش ریسک",
    category: "cyber",
    excerpt: "خلاصه: تهدیدات Supply Chain در npm و روش‌های کاهش ریسک — مروری سریع بر نکات کلیدی و کاربردی.",
    content:
      "تهدیدات Supply Chain در npm و روش‌های کاهش ریسک\n\nمقدمه:\nدر این مطلب به بررسی «تهدیدات Supply Chain در npm و روش‌های کاهش ریسک» می‌پردازیم و نکات مهم عملی را مرور می‌کنیم.\n\nمحورها:\n- تعریف و کاربردها\n- چالش‌های رایج\n- ابزارها و روش‌ها\n- سناریوهای واقعی\n- جمع‌بندی و منابع\n\nیادداشت: این مطلب سطح پیشرفته دارد و حاوی تمرین‌های تخصصی است.\n\nنتیجه‌گیری:\nبه صورت خلاصه آموختیم چگونه رویکرد درست را برای «تهدیدات Supply Chain در npm و روش‌های کاهش ریسک» اتخاذ کنیم.",
    tags: ["امنیت", "شبکه", "آموزش", "پیشرفته"],
    advanced: true,
  },
  {
    title: "تحلیل ترافیک مشکوک با Zeek و Suricata (راهنمای سریع)",
    category: "cyber",
    excerpt: "خلاصه: تحلیل ترافیک مشکوک با Zeek و Suricata (راهنمای سریع) — مروری سریع بر نکات کلیدی و کاربردی.",
    content:
      "تحلیل ترافیک مشکوک با Zeek و Suricata (راهنمای سریع)\n\nمقدمه:\nدر این مطلب به بررسی «تحلیل ترافیک مشکوک با Zeek و Suricata (راهنمای سریع)» می‌پردازیم و نکات مهم عملی را مرور می‌کنیم.\n\nمحورها:\n- تعریف و کاربردها\n- چالش‌های رایج\n- ابزارها و روش‌ها\n- سناریوهای واقعی\n- جمع‌بندی و منابع\n\n\n\nنتیجه‌گیری:\nبه صورت خلاصه آموختیم چگونه رویکرد درست را برای «تحلیل ترافیک مشکوک با Zeek و Suricata (راهنمای سریع)» اتخاذ کنیم.",
    tags: ["امنیت", "شبکه", "آموزش"],
  },
  {
    title: "Monitoring لاگ‌ها با OpenSearch برای تیم‌های SOC",
    category: "cyber",
    excerpt: "خلاصه: Monitoring لاگ‌ها با OpenSearch برای تیم‌های SOC — مروری سریع بر نکات کلیدی و کاربردی.",
    content:
      "Monitoring لاگ‌ها با OpenSearch برای تیم‌های SOC\n\nمقدمه:\nدر این مطلب به بررسی «Monitoring لاگ‌ها با OpenSearch برای تیم‌های SOC» می‌پردازیم و نکات مهم عملی را مرور می‌کنیم.\n\nمحورها:\n- تعریف و کاربردها\n- چالش‌های رایج\n- ابزارها و روش‌ها\n- سناریوهای واقعی\n- جمع‌بندی و منابع\n\n\n\nنتیجه‌گیری:\nبه صورت خلاصه آموختیم چگونه رویکرد درست را برای «Monitoring لاگ‌ها با OpenSearch برای تیم‌های SOC» اتخاذ کنیم.",
    tags: ["امنیت", "شبکه", "آموزش"],
  },
  {
    title: "آشنایی با YARA Rules و شناسایی بدافزار",
    category: "cyber",
    excerpt: "خلاصه: آشنایی با YARA Rules و شناسایی بدافزار — مروری سریع بر نکات کلیدی و کاربردی.",
    content:
      "آشنایی با YARA Rules و شناسایی بدافزار\n\nمقدمه:\nدر این مطلب به بررسی «آشنایی با YARA Rules و شناسایی بدافزار» می‌پردازیم و نکات مهم عملی را مرور می‌کنیم.\n\nمحورها:\n- تعریف و کاربردها\n- چالش‌های رایج\n- ابزارها و روش‌ها\n- سناریوهای واقعی\n- جمع‌بندی و منابع\n\n\n\nنتیجه‌گیری:\nبه صورت خلاصه آموختیم چگونه رویکرد درست را برای «آشنایی با YARA Rules و شناسایی بدافزار» اتخاذ کنیم.",
    tags: ["امنیت", "شبکه", "آموزش"],
  },
  {
    title: "ساخت Playbook حوادث امنیتی (IR) برای شرکت‌های کوچک",
    category: "cyber",
    excerpt: "خلاصه: ساخت Playbook حوادث امنیتی (IR) برای شرکت‌های کوچک — مروری سریع بر نکات کلیدی و کاربردی.",
    content:
      "ساخت Playbook حوادث امنیتی (IR) برای شرکت‌های کوچک\n\nمقدمه:\nدر این مطلب به بررسی «ساخت Playbook حوادث امنیتی (IR) برای شرکت‌های کوچک» می‌پردازیم و نکات مهم عملی را مرور می‌کنیم.\n\nمحورها:\n- تعریف و کاربردها\n- چالش‌های رایج\n- ابزارها و روش‌ها\n- سناریوهای واقعی\n- جمع‌بندی و منابع\n\n\n\nنتیجه‌گیری:\nبه صورت خلاصه آموختیم چگونه رویکرد درست را برای «ساخت Playbook حوادث امنیتی (IR) برای شرکت‌های کوچک» اتخاذ کنیم.",
    tags: ["امنیت", "شبکه", "آموزش"],
  },
  {
    title: "Email Security 101: SPF/DKIM/DMARC به زبان ساده",
    category: "cyber",
    excerpt: "خلاصه: Email Security 101: SPF/DKIM/DMARC به زبان ساده — مروری سریع بر نکات کلیدی و کاربردی.",
    content:
      "Email Security 101: SPF/DKIM/DMARC به زبان ساده\n\nمقدمه:\nدر این مطلب به بررسی «Email Security 101: SPF/DKIM/DMARC به زبان ساده» می‌پردازیم و نکات مهم عملی را مرور می‌کنیم.\n\nمحورها:\n- تعریف و کاربردها\n- چالش‌های رایج\n- ابزارها و روش‌ها\n- سناریوهای واقعی\n- جمع‌بندی و منابع\n\n\n\nنتیجه‌گیری:\nبه صورت خلاصه آموختیم چگونه رویکرد درست را برای «Email Security 101: SPF/DKIM/DMARC به زبان ساده» اتخاذ کنیم.",
    tags: ["امنیت", "شبکه", "آموزش"],
  },
];

function slugify(title) {
  return title
    .trim()
    .replace(/[\\/]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/["'«»().:]/g, "")
    .replace(/[\u200c]/g, "-")
    .toLowerCase();
}

async function fileExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function buildFrontmatter(seed, index) {
  const baseHour = 8 + index;
  const hour = baseHour % 24;
  const dayOffset = Math.floor(baseHour / 24);
  const day = 17 + dayOffset;
  const iso = `2025-10-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00+03:30`;
  const ogImage = `https://cdn.teknav.ir/og/${slugify(seed.title)}.jpg`;
  return {
    title: seed.title,
    description: seed.excerpt,
    summary: seed.excerpt,
    category: seed.category,
    tags: seed.tags,
    date: iso,
    ogImage,
    status: "scheduled",
    advanced: Boolean(seed.advanced ?? false),
  };
}

function toMarkdown(frontmatter, body) {
  const fm = Object.entries(frontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.map((item) => `"${item}"`).join(", ")}]`;
      }
      return `${key}: ${typeof value === "string" ? `"${value.replace(/"/g, '\\"')}"` : value}`;
    })
    .join("\n");
  return `---\n${fm}\n---\n\n${body}\n`;
}

(async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  for (const [index, seed] of seeds.entries()) {
    const slug = slugify(seed.title);
    const filepath = join(OUTPUT_DIR, `${slug}.md`);
    if (await fileExists(filepath)) {
      continue;
    }
    const frontmatter = buildFrontmatter(seed, index);
    const markdown = toMarkdown(frontmatter, seed.content);
    await writeFile(filepath, markdown, "utf8");
  }
})();

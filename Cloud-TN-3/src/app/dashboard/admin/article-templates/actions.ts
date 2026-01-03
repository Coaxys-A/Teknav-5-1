"use server";

import { z } from "zod";
import { redisDel, redisGet, redisSet } from "@/lib/redis-rest";
import { revalidatePath } from "next/cache";

const templateSchema = z.object({
  id: z.number().optional(),
  key: z.string(),
  titlePattern: z.string(),
  tags: z.array(z.string()),
  seoKeywords: z.array(z.string()),
  sections: z.array(z.string()),
  disclaimer: z.string(),
  prerequisites: z.string(),
  imagePlaceholders: z.array(z.string()).optional(),
});

const templates = [
  {
    key: "cyber-tutorial",
    titlePattern: "راهنمای گام‌به‌گام امنیت سایبری: {topic}",
    tags: ["امنیت", "آموزش", "سایبری"],
    seoKeywords: ["آموزش امنیت", "سایبری", "راهنما"],
    sections: ["H1: معرفی", "H2: پیش‌نیازها", "H2: گام‌ها", "H2: نکات امنیتی", "H2: جمع‌بندی"],
    disclaimer: "این مطلب آموزشی است و مسئولیت اجرا بر عهده خواننده است.",
    prerequisites: "آشنایی پایه با شبکه و لینوکس",
    imagePlaceholders: ["cover", "diagram", "code"],
  },
  {
    key: "cve-analysis",
    titlePattern: "تحلیل فنی CVE-{id}: {product}",
    tags: ["امنیت", "CVE", "تحلیل"],
    seoKeywords: ["CVE", "آسیب‌پذیری", "تحلیل"],
    sections: ["H1: معرفی آسیب‌پذیری", "H2: دامنه تاثیر", "H2: جزئیات فنی", "H2: اکسپلویت", "H2: راهکار"],
    disclaimer: "برای اهداف آموزشی؛ اجرای بدون مجوز ممنوع است.",
    prerequisites: "شناخت مفاهیم امنیت و CVSS",
    imagePlaceholders: ["vector", "exploit-flow"],
  },
  {
    key: "pentest-lab",
    titlePattern: "آزمایشگاه تست نفوذ: {scenario}",
    tags: ["امنیت", "تست نفوذ", "آزمایشگاه"],
    seoKeywords: ["تست نفوذ", "آزمایشگاه", "راهنما"],
    sections: ["H1: سناریو", "H2: پیش‌نیاز", "H2: راه‌اندازی", "H2: اکسپلویت", "H2: لاگ و پاکسازی"],
    disclaimer: "تنها در محیط مجاز آزمایش کنید.",
    prerequisites: "مجازی‌سازی و شبکه",
    imagePlaceholders: ["lab-topology"],
  },
  {
    key: "news",
    titlePattern: "خبر فوری: {headline}",
    tags: ["خبر", "تکنولوژی"],
    seoKeywords: ["خبر فناوری", "تکنولوژی روز"],
    sections: ["H1: تیتر", "H2: جزئیات", "H2: نقل قول", "H2: تاثیر"],
    disclaimer: "اطلاعات بر اساس منابع خبری اعلام شده.",
    prerequisites: "—",
    imagePlaceholders: ["cover"],
  },
  {
    key: "technical-analysis",
    titlePattern: "تحلیل فنی: {topic}",
    tags: ["تحلیل", "فنی"],
    seoKeywords: ["تحلیل فنی", "معماری", "سیستم"],
    sections: ["H1: مقدمه", "H2: معماری", "H2: مزایا/معایب", "H2: نتیجه‌گیری"],
    disclaimer: "تحلیل مبتنی بر داده‌های در دسترس است.",
    prerequisites: "آشنایی با معماری سیستم",
    imagePlaceholders: ["diagram"],
  },
  {
    key: "review",
    titlePattern: "بررسی تخصصی: {product}",
    tags: ["بررسی", "محصول"],
    seoKeywords: ["بررسی محصول", "نقد و بررسی"],
    sections: ["H1: معرفی", "H2: ویژگی‌ها", "H2: مزایا", "H2: معایب", "H2: نتیجه"],
    disclaimer: "ممکن است شامل نظر شخصی باشد.",
    prerequisites: "—",
    imagePlaceholders: ["product-shot"],
  },
  {
    key: "howto",
    titlePattern: "چطور {action} را انجام دهیم؟",
    tags: ["راهنما", "آموزش"],
    seoKeywords: ["راهنما", "How To", "آموزش"],
    sections: ["H1: مقدمه", "H2: پیش‌نیاز", "H2: مراحل", "H2: خطاهای رایج", "H2: جمع‌بندی"],
    disclaimer: "مرحله‌بندی باید با دقت دنبال شود.",
    prerequisites: "—",
    imagePlaceholders: ["steps", "result"],
  },
  {
    key: "programming-tutorial",
    titlePattern: "آموزش برنامه‌نویسی: {language} {topic}",
    tags: ["برنامه‌نویسی", "آموزش"],
    seoKeywords: ["آموزش برنامه‌نویسی", "کدنویسی"],
    sections: ["H1: مقدمه", "H2: محیط", "H2: کد نمونه", "H2: تمرین", "H2: جمع‌بندی"],
    disclaimer: "کد باید در محیط امن تست شود.",
    prerequisites: "دانش پایه زبان مقصد",
    imagePlaceholders: ["code", "output"],
  },
];

export type ArticleTemplate = (typeof templates)[number];

export async function listTemplates() {
  const key = "articleTemplates:list";
  const cached = await redisGet(key);
  if (cached) {
    try {
      return JSON.parse(cached as string) as ArticleTemplate[];
    } catch {
      // ignore
    }
  }
  await redisSet(key, templates, 300);
  return templates;
}

export async function createTemplate(input: z.infer<typeof templateSchema>) {
  templateSchema.parse(input);
  await redisDel("articleTemplates:list");
  revalidatePath("/dashboard/admin/article-templates");
  return { ok: true };
}

export async function editTemplate(input: z.infer<typeof templateSchema>) {
  templateSchema.parse(input);
  await redisDel("articleTemplates:list");
  revalidatePath("/dashboard/admin/article-templates");
  return { ok: true };
}

export async function deleteTemplate(input: { key: string }) {
  z.object({ key: z.string() }).parse(input);
  await redisDel("articleTemplates:list");
  revalidatePath("/dashboard/admin/article-templates");
  return { ok: true };
}

const applySchema = z.object({
  key: z.string(),
  articleId: z.string(),
});
export async function applyTemplateToDraft(input: z.infer<typeof applySchema>) {
  applySchema.parse(input);
  const tmpl = templates.find((t) => t.key === input.key);
  if (!tmpl) return { ok: false, error: "not_found" };
  await redisSet(`draft:${input.articleId}`, { articleId: input.articleId, content: tmpl.sections.join("\n\n"), meta: { title: tmpl.titlePattern } }, 3600);
  return { ok: true };
}

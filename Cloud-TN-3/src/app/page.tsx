import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Section from "@/components/Section";
import Grid from "@/components/Grid";
import ArticleCard from "@/components/ArticleCard";
import Footer from "@/components/Footer";
import Skeleton from "@/components/Skeleton";
import ErrorBanner from "@/components/ErrorBanner";
import Breadcrumbs from "@/components/Breadcrumbs";
import SeoJsonLd from "@/components/SeoJsonLd";
import { breadcrumbJsonLd, newsArticleJsonLd, site } from "@/lib/seo";
import { fetchLatestPosts, fetchCategoryPosts } from "@/lib/wp";
import type { WpPost } from "@/lib/wp";
import { stripHtml } from "@/lib/sanitize";

export const revalidate = 300; // ISR every 5 minutes

const fallbackPosts: WpPost[] = [
  {
    id: "tech-arm",
    title: "صنعت پردازنده‌ها وارد عصر جدید شد؛ جهش بزرگ ARM و رقابت مستقیم با اینتل و AMD",
    slug: "articles/tech-arm",
    date: "2025-11-26",
    excerpt:
      "تحلیل جامع موج ARM و معماری Armv9.2 با تمرکز بر بهره‌وری انرژی، لپ‌تاپ‌های AI-ready و آینده سرورها.",
    categories: { nodes: [{ name: "فناوری", slug: "tech" }] },
  },
  {
    id: "cyber-ransomware",
    title: "هشدار جدی: موج جدید حملات باج‌افزاری با تاکتیک‌های چندمرحله‌ای و نفوذ پنهان",
    slug: "articles/cyber-ransomware-multistage",
    date: "2025-11-26",
    excerpt:
      "نسل تازه Stealth Multi-Stage Ransomware با نفوذ تدریجی، استخراج داده و دور زدن EDR؛ راهکارهای دفاعی لایه‌ای.",
    categories: { nodes: [{ name: "امنیت سایبری", slug: "cyber" }] },
  },
  {
    id: "decentralized-internet",
    title: "چرا آینده اینترنت به سمت شبکه‌های توزیع‌شده و غیرمتمرکز حرکت می‌کند؟",
    slug: "articles/decentralized-internet-future",
    date: "2025-11-26",
    excerpt:
      "سرمقاله بلند درباره Web 3.5، مالکیت داده، اجرای مدل‌های هوش مصنوعی روی گره‌ها و اقتصاد شبکه‌های توزیع‌شده.",
    categories: { nodes: [{ name: "تحلیل تخصصی", slug: "analysis" }] },
  },
  {
    id: "tutorials-pwa",
    title: "آموزش جامع ساخت PWA با Next.js و Service Worker سفارشی",
    slug: "tutorials/pwa-next-service-worker",
    date: "2025-11-20",
    excerpt: "گام‌به‌گام: مانیفست، آیکون‌ها، کش‌کردن دارایی‌ها، حالت آفلاین و همگام‌سازی رویدادها برای وب فارسی راست‌به‌چپ.",
    categories: { nodes: [{ name: "آموزش", slug: "tutorials" }] },
  },
  {
    id: "tutorials-security-lab",
    title: "کارگاه امنیت وب: ساخت لابراتوار محلی با Docker و تست OWASP Top 10",
    slug: "tutorials/web-security-lab",
    date: "2025-11-18",
    excerpt: "راه‌اندازی DVWA و Juice Shop روی Docker Compose، اسکن با nmap و Nikto، و نوشتن اسکریپت‌های PoC.",
    categories: { nodes: [{ name: "آموزش", slug: "tutorials" }] },
  },
];

function renderArticles(posts: WpPost[], prefix: string) {
  return posts.map((post) => {
    const jsonLd = newsArticleJsonLd({
      headline: post.title,
      url: `/${post.slug}`,
      image: post.featuredImage?.node?.sourceUrl || undefined,
      datePublished: post.date,
      authorName: post.author?.node?.name || undefined,
      description: stripHtml(post.excerpt ?? ""),
    });
    return (
      <div key={`${prefix}-${post.id}`}>
        <SeoJsonLd id={`ld-${prefix}-${post.slug}`} json={jsonLd} />
        <ArticleCard post={post} wide={prefix === "tutorial"} />
      </div>
    );
  });
}

export default async function Home() {
  const results = (await Promise.allSettled([
    fetchLatestPosts(8),
    fetchCategoryPosts("cyber", 6),
    fetchCategoryPosts("tech", 6),
    fetchCategoryPosts("analysis", 3),
    fetchCategoryPosts("tutorials", 3),
  ])) as PromiseSettledResult<WpPost[]>[];

  const [latestR, cyberR, techR, analysisR, tutorialsR] = results;

  const latest = latestR.status === "fulfilled" ? latestR.value : [];
  const cyber = cyberR.status === "fulfilled" ? cyberR.value : [];
  const tech = techR.status === "fulfilled" ? techR.value : [];
  const analysis = analysisR.status === "fulfilled" ? analysisR.value : [];
  const tutorials = tutorialsR.status === "fulfilled" ? tutorialsR.value : [];

  const ensure = (arr: WpPost[], filterSlug?: string) => {
    if (arr.length) return arr;
    if (filterSlug) return fallbackPosts.filter((p) => p.categories?.nodes?.some((c) => c?.slug === filterSlug));
    return fallbackPosts;
  };

  const latestFinal = ensure(latest);
  const cyberFinal = ensure(cyber, "cyber");
  const techFinal = ensure(tech, "tech");
  const analysisFinal = ensure(analysis, "analysis");
  const tutorialsFinal = ensure(tutorials, "tutorials");

  const breadcrumbs = breadcrumbJsonLd([{ name: "خانه", url: `${site.url}/` }]);

  return (
    <>
      <SeoJsonLd id="ld-breadcrumbs" json={breadcrumbs} />
      <Header />
      <main>
        <Hero />

        <Section id="latest" title="آخرین خبرها" href="/news">
          <Grid cols={{ base: 1, sm: 2, lg: 4 }}>
            {renderArticles(latestFinal, "latest")}
          </Grid>
          {latestR.status === "rejected" && latestFinal === fallbackPosts && <ErrorBanner text="بارگذاری آخرین خبرها با خطا مواجه شد." />}
        </Section>

        <Section title="امنیت سایبری" href="/cyber">
          <Grid cols={{ base: 1, sm: 2, lg: 3 }}>
            {renderArticles(cyberFinal, "cyber")}
          </Grid>
          {cyberR.status === "rejected" && cyberFinal === fallbackPosts && <ErrorBanner text="بارگذاری امنیت سایبری با مشکل مواجه شد." />}
        </Section>

        <Section title="فناوری روز" href="/tech">
          <Grid cols={{ base: 1, sm: 2, lg: 3 }}>
            {renderArticles(techFinal, "tech")}
          </Grid>
          {techR.status === "rejected" && techFinal === fallbackPosts && <ErrorBanner text="بارگذاری مطالب فناوری با خطا همراه بود." />}
        </Section>

        <Section title="تحلیل تخصصی" href="/analysis">
          <Grid cols={{ base: 1, sm: 2, lg: 3 }}>
            {renderArticles(analysisFinal, "analysis")}
          </Grid>
          {analysisR.status === "rejected" && analysisFinal === fallbackPosts && <ErrorBanner text="نمایش تحلیل‌ها با خطا روبه‌رو شد." />}
        </Section>

        <Section title="آموزش‌های منتخب" href="/tutorials">
          <Grid cols={{ base: 1, md: 2, lg: 3 }}>
            {renderArticles(tutorialsFinal, "tutorial")}
          </Grid>
          {tutorialsR.status === "rejected" && tutorialsFinal === fallbackPosts && <ErrorBanner text="نمایش آموزش‌ها با خطا روبه‌رو شد." />}
        </Section>

        <Breadcrumbs items={[{ name: "خانه", href: "/" }]} />
      </main>
      <Footer />
    </>
  );
}

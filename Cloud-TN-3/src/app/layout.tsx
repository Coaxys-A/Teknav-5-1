import "./globals.css";
import localFont from "next/font/local";
import type { Metadata, Viewport } from "next";
import { organizationJsonLd, site, websiteJsonLd } from "@/lib/seo";
import { Providers } from "./providers";

// Text font family
const text = localFont({
  src: [
    { path: "./fonts/Vazirmatn-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Vazirmatn-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Vazirmatn-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-text",
  display: "swap",
  preload: true,
});

// Display font family
const display = localFont({
  src: [
    { path: "./fonts/Vazirmatn-SemiBold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

// Farsi digit-friendly Shabnam
const shabnamDigits = localFont({
  src: [
    { path: "./fonts/Farsi-Digits/Shabnam-FD.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Farsi-Digits/Shabnam-Medium-FD.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Farsi-Digits/Shabnam-Bold-FD.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-digits",
  display: "swap",
  preload: true,
});

const description = `${site.tagline} در ${site.name}.`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description,
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: site.name,
    url: site.url,
    images: [{ url: `${site.url}/og-home.jpg` }],
    description,
  },
  alternates: { canonical: `${site.url}/` },
  twitter: { card: "summary_large_image", title: site.name, description },
};

export const viewport: Viewport = {
  themeColor: "#0f4c81",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const website = websiteJsonLd();
  const org = organizationJsonLd();

  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* JSON-LD structured data */}
        <script
          id="ld-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
        />
        <script
          id="ld-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }}
        />
        {/* CSP placeholder (optional) */}
        {/* <meta httpEquiv="Content-Security-Policy"
              content="default-src 'self'; img-src 'self' https: data:; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self' https:;" /> */}
      </head>
      <body className={`${text.variable} ${display.variable} ${shabnamDigits.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

export const locales = ["fa"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fa";

export function getCurrentLocale(): Locale {
  return "fa";
}

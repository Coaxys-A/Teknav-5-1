"use client";

import { ReactNode, createContext, useContext, useMemo, useState, useEffect } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";

type Locale = "fa" | "en";

const I18nContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void }>({ locale: "fa", setLocale: () => {} });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("fa");
  const value = useMemo(() => ({ locale, setLocale }), [locale]);
  return (
    <I18nContext.Provider value={value}>
      <div dir={locale === "fa" ? "rtl" : "ltr"}>{children}</div>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function RootProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {});
    }
  }, []);

  return (
    <ThemeProvider>
      <I18nProvider>{children}</I18nProvider>
    </ThemeProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return <RootProviders>{children}</RootProviders>;
}

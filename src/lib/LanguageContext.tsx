"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Lang } from "./i18n";

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
}

const LangContext = createContext<LangContextType>({
  lang: "en",
  setLang: () => {},
  toggleLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("rsd_lang") as Lang | null;
    if (stored === "en" || stored === "sw") setLangState(stored);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("rsd_lang", lang);
    document.documentElement.setAttribute("lang", lang);
  }, [lang, mounted]);

  const setLang = (l: Lang) => setLangState(l);
  const toggleLang = () => setLangState((prev) => (prev === "en" ? "sw" : "en"));

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);

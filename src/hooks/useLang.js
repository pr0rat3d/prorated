import { useState, createContext, useContext } from "react";

export const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    // Check saved preference first
    try {
      const saved = localStorage.getItem("prorated_lang");
      if (saved) return saved;
    } catch {}
    // Auto-detect browser language
    const browser = navigator.language?.slice(0, 2).toLowerCase();
    return browser === "es" ? "es" : "en";
  });

  const switchLang = (newLang) => {
    setLang(newLang);
    try { localStorage.setItem("prorated_lang", newLang); } catch {}
  };

  return (
    <LangContext.Provider value={{ lang, switchLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
};

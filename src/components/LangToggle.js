import { useLang } from "../hooks/useLang";
import { BRAND } from "./UI";

export default function LangToggle({ style = {} }) {
  const { lang, switchLang } = useLang();

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      background: "#F1F5F9",
      borderRadius: 20,
      padding: 3,
      gap: 2,
      ...style,
    }}>
      {[
        { code: "en", flag: "🇺🇸", label: "EN" },
        { code: "es", flag: "🇲🇽", label: "ES" },
      ].map(({ code, flag, label }) => (
        <button
          key={code}
          onClick={() => switchLang(code)}
          title={code === "en" ? "English" : "Español"}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 10px", borderRadius: 16, border: "none",
            background: lang === code ? "#fff" : "transparent",
            color: lang === code ? BRAND.blue : BRAND.gray,
            fontWeight: lang === code ? 700 : 500,
            fontSize: 12, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: lang === code ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
            transition: "all 0.2s",
            WebkitTapHighlightColor: "transparent",
          }}>
          <span style={{ fontSize: 14 }}>{flag}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

import { useState, useEffect } from "react";
import Logo from "./Logo";
import { Btn, BRAND } from "./UI";
import { useLang } from "../hooks/useLang";
import { t } from "../i18n/translations";

export function OfflineBanner() {
  const { lang } = useLang();
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const on = () => setOffline(false), off = () => setOffline(true);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  if (!offline) return null;
  return (
    <div style={{ background: "#991B1B", color: "#FEE2E2", fontSize: 12, fontWeight: 600, textAlign: "center", padding: "8px 1rem" }}>
      {t(lang, "banners.offline")}
    </div>
  );
}

export function InstallBanner({ onInstall, onDismiss }) {
  const { lang } = useLang();
  return (
    <div style={{ background: BRAND.dark, borderBottom: "1px solid #1E293B", padding: "10px 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Logo size={32} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC" }}>{t(lang, "banners.installTitle")}</div>
          <div style={{ fontSize: 11, color: "#94A3B8" }}>{t(lang, "banners.installBody")}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={onDismiss} style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          {t(lang, "banners.notNow")}
        </button>
        <Btn small onClick={onInstall}>{t(lang, "banners.installBtn")}</Btn>
      </div>
    </div>
  );
}

export function IOSInstallBanner({ onDismiss }) {
  const { lang } = useLang();
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  if (!isIOS || isStandalone) return null;
  return (
    <div style={{ background: BRAND.dark, borderBottom: "1px solid #1E293B", padding: "12px 1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <Logo size={32} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC", marginBottom: 4 }}>{t(lang, "banners.iosTitle")}</div>
            <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.6 }}>
              {t(lang, "banners.iosTap")} <strong style={{ color: "#93C5FD" }}>{t(lang, "banners.iosShare")}</strong> {t(lang, "banners.iosThen")} <strong style={{ color: "#93C5FD" }}>{t(lang, "banners.iosAdd")}</strong> {t(lang, "banners.iosInstall")}
            </div>
          </div>
        </div>
        <button onClick={onDismiss} style={{ background: "none", border: "none", color: "#475569", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>
    </div>
  );
}

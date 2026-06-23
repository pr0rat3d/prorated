import { useState, useEffect } from "react";

export default function usePWA() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled]     = useState(false);
  const [isOnline, setIsOnline]           = useState(navigator.onLine);
  const [swReady, setSwReady]             = useState(false);

  useEffect(() => {
    // ── Register service worker ───────────────────────────────
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((reg) => {
            setSwReady(true);
          })
          .catch((err) => {
            console.warn("[ProRated] Service worker registration failed:", err);
          });
      });
    }

    // ── Capture install prompt (Android/Chrome) ───────────────
    const handleInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);

    // ── Detect if already installed ───────────────────────────
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    // ── Online/offline status ─────────────────────────────────
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ── Trigger the native install prompt ─────────────────────
  const promptInstall = async () => {
    if (!installPrompt) return false;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
    return outcome === "accepted";
  };

  return { installPrompt, isInstalled, isOnline, swReady, promptInstall };
}

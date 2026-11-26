import { useEffect, useState, useCallback } from "react";
import { InstallContext } from "./installStore.js";
import { detectInstallPlatform, isRunningStandalone } from "../utils/installHelper.js";

export function InstallProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => isRunningStandalone());
  const [showGuide, setShowGuide] = useState(false);
  const platform = detectInstallPlatform();

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowGuide(false);
    };

    const mq = window.matchMedia?.("(display-mode: standalone)");
    const handleDisplayModeChange = (event) => {
      if (event.matches) setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    mq?.addEventListener?.("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      mq?.removeEventListener?.("change", handleDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (isInstalled) return { outcome: "already-installed" };

    if (!deferredPrompt) {
      setShowGuide(true);
      return { outcome: "guide" };
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === "accepted") {
        setDeferredPrompt(null);
      }
      return { outcome: choice?.outcome || "dismissed" };
    } catch {
      setShowGuide(true);
      return { outcome: "guide" };
    }
  }, [deferredPrompt, isInstalled]);

  return (
    <InstallContext.Provider
      value={{
        canPromptInstall: Boolean(deferredPrompt),
        isInstalled,
        platform,
        showGuide,
        openGuide: () => setShowGuide(true),
        closeGuide: () => setShowGuide(false),
        promptInstall,
      }}
    >
      {children}
    </InstallContext.Provider>
  );
}

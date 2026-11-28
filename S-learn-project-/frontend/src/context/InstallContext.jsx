import { useEffect, useState, useCallback } from "react";
import { InstallContext } from "./installStore.js";
import {
  detectInstallPlatform,
  detectInstalledRelatedApp,
  hasStoredUserInstall,
  isRunningStandalone,
  setStoredUserInstall,
} from "../utils/installHelper.js";
import { onAuthChange } from "../firebase/authService";
import { getSettings, updateSettings } from "../firebase/dataService";

export function InstallProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [currentUid, setCurrentUid] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => isRunningStandalone());
  const [installCheckReady, setInstallCheckReady] = useState(() => isRunningStandalone());
  const [showGuide, setShowGuide] = useState(false);
  const platform = detectInstallPlatform();

  const persistInstalledForUser = useCallback((uid) => {
    setIsInstalled(true);
    setDeferredPrompt(null);
    setShowGuide(false);
    if (!uid) return;
    setStoredUserInstall(uid);
    updateSettings(uid, { phone_app_installed: true }).catch(() => {});
  }, []);

  const markInstalled = useCallback(() => {
    persistInstalledForUser(currentUid);
  }, [currentUid, persistInstalledForUser]);

  // Sync per-user installed status across devices whenever auth state resolves.
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthChange((user) => {
      if (!active) return;
      const uid = user?.uid || null;
      setCurrentUid(uid);

      const standaloneNow = isRunningStandalone();
      if (!uid) {
        setIsInstalled(standaloneNow);
        setInstallCheckReady(true);
        return;
      }

      const cachedForUser = hasStoredUserInstall(uid);
      if (standaloneNow || cachedForUser) {
        setIsInstalled(true);
        setInstallCheckReady(true);
      } else {
        setInstallCheckReady(false);
      }

      Promise.allSettled([getSettings(uid), detectInstalledRelatedApp()]).then(
        ([settingsRes, relatedRes]) => {
          if (!active) return;
          const serverInstalled =
            settingsRes.status === "fulfilled" &&
            Boolean(settingsRes.value?.phone_app_installed);
          const relatedInstalled =
            relatedRes.status === "fulfilled" && Boolean(relatedRes.value);

          if (serverInstalled) {
            setStoredUserInstall(uid);
            setIsInstalled(true);
          } else if (standaloneNow || cachedForUser || relatedInstalled) {
            // User already has the app installed on this phone — persist to their account.
            persistInstalledForUser(uid);
          } else {
            setIsInstalled(false);
          }
          setInstallCheckReady(true);
        },
      );
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [persistInstalledForUser]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      persistInstalledForUser(currentUid);
    };

    const mq = window.matchMedia?.("(display-mode: standalone)");
    const handleDisplayModeChange = (event) => {
      if (event.matches) {
        persistInstalledForUser(currentUid);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    mq?.addEventListener?.("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      mq?.removeEventListener?.("change", handleDisplayModeChange);
    };
  }, [currentUid, persistInstalledForUser]);

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
        persistInstalledForUser(currentUid);
      }
      return { outcome: choice?.outcome || "dismissed" };
    } catch {
      setShowGuide(true);
      return { outcome: "guide" };
    }
  }, [currentUid, deferredPrompt, isInstalled, persistInstalledForUser]);

  return (
    <InstallContext.Provider
      value={{
        canPromptInstall: Boolean(deferredPrompt),
        isInstalled,
        installCheckReady,
        platform,
        showGuide,
        openGuide: () => setShowGuide(true),
        closeGuide: () => setShowGuide(false),
        markInstalled,
        promptInstall,
      }}
    >
      {children}
    </InstallContext.Provider>
  );
}

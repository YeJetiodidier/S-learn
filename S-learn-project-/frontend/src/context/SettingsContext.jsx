import { useEffect, useState } from "react";
import { getSettings } from "../firebase/dataService";
import { onAuthChange } from "../firebase/authService";
import { applyAppearance } from "../utils/applyAppearance.js";
import { DEFAULT_APPEARANCE, SettingsContext } from "./settingsStore.js";

export function SettingsProvider({ children }) {
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);

  // Subscribe to Firebase Auth state so saved appearance loads once auth resolves.
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthChange((user) => {
      if (!user?.uid) {
        if (active) setAppearance(DEFAULT_APPEARANCE);
        applyAppearance(DEFAULT_APPEARANCE);
        return;
      }

      getSettings(user.uid)
        .then((d) => {
          if (!active || !d) return;
          const next = {
            theme: d.theme || "light",
            accentColor: d.accent_color || "#8b5cf6",
            fontSize: d.font_size || "medium",
            compactMode: d.compact_mode ?? false,
          };
          setAppearance(next);
          applyAppearance(next);
        })
        .catch((error) => {
          console.error("Could not load appearance settings:", error);
        });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Re-apply whenever the appearance state changes.
  useEffect(() => {
    applyAppearance(appearance);
  }, [appearance]);

  // React to OS theme changes when "system" is selected.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (appearance.theme === "system") applyAppearance(appearance);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [appearance]);

  return (
    <SettingsContext.Provider value={{ appearance, setAppearance }}>
      {children}
    </SettingsContext.Provider>
  );
}

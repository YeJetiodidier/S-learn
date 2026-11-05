import { useEffect, useState } from "react";
import { getSettings } from "../firebase/dataService";
import { getCurrentUser } from "../firebase/authService";
import { applyAppearance } from "../utils/applyAppearance.js";

export function SettingsProvider({ children }) {
  const [appearance, setAppearance] = useState({
    theme: "light",
    accentColor: "#8b5cf6",
    fontSize: "medium",
    compactMode: false,
  });

  // Load saved appearance from the API and apply it.
  useEffect(() => {
    let active = true;
    const uid = getCurrentUser()?.uid;
    if (!uid) return;
    getSettings(uid)
      .then((d) => {
        if (!d) return;
        const next = {
          theme: d.theme || "light",
          accentColor: d.accent_color || "#8b5cf6",
          fontSize: d.font_size || "medium",
          compactMode: d.compact_mode ?? false,
        };
        if (active) setAppearance(next);
        applyAppearance(next);
      })
      .catch((error) => {
        console.error("Could not load appearance settings:", error);
      });
    return () => {
      active = false;
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

  return children;
}

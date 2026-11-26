import { createContext, useContext } from "react";

export const DEFAULT_APPEARANCE = {
  theme: "light",
  accentColor: "#8b5cf6",
  fontSize: "medium",
  compactMode: false,
};

export const SettingsContext = createContext({
  appearance: DEFAULT_APPEARANCE,
  setAppearance: () => {},
});

export function useSettings() {
  return useContext(SettingsContext);
}

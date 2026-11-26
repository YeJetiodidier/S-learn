import { createContext, useContext } from "react";

export const InstallContext = createContext({
  canPromptInstall: false,
  isInstalled: false,
  platform: "desktop",
  showGuide: false,
  openGuide: () => {},
  closeGuide: () => {},
  promptInstall: async () => ({ outcome: "unavailable" }),
});

export function useInstallApp() {
  return useContext(InstallContext);
}

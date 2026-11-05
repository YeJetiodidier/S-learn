const FONT_SIZE_MAP = {
  small: "14px",
  medium: "16px",
  large: "18px",
};

function resolveTheme(theme) {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme === "dark" ? "dark" : "light";
}

export function applyAppearance(appearance) {
  if (!appearance || typeof document === "undefined") return;
  const root = document.documentElement;

  root.setAttribute("data-theme", resolveTheme(appearance.theme));
  root.style.setProperty("--accent", appearance.accentColor || "#8b5cf6");
  root.style.setProperty(
    "--base-font-size",
    FONT_SIZE_MAP[appearance.fontSize] || "16px"
  );
  root.classList.toggle("compact", !!appearance.compactMode);
}

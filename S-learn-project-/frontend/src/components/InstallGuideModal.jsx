import { useEffect } from "react";
import { useInstallApp } from "../context/installStore.js";
import { getManualInstallSteps } from "../utils/installHelper.js";

function InstallGuideModal() {
  const { showGuide, closeGuide, markInstalled, platform } = useInstallApp();

  useEffect(() => {
    if (!showGuide) return;
    const handleKey = (event) => {
      if (event.key === "Escape") closeGuide();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showGuide, closeGuide]);

  if (!showGuide) return null;

  const { heading, steps } = getManualInstallSteps(platform);

  return (
    <div
      className="pwa-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-guide-title"
      onClick={closeGuide}
    >
      <div className="pwa-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="pwa-modal-header">
          <img src="/icons/icon-192.png" alt="S-Learn icon" className="pwa-modal-icon" />
          <div>
            <h2 id="pwa-guide-title" className="pwa-modal-title">
              {heading}
            </h2>
            <p className="pwa-modal-sub">
              Launch S-Learn right from your home screen with one tap.
            </p>
          </div>
        </div>

        <ol className="pwa-modal-steps">
          {steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button type="button" className="pwa-modal-close-btn" onClick={markInstalled}>
            I&apos;ve Already Installed It on My Phone
          </button>
          <button
            type="button"
            className="pwa-modal-close-btn"
            style={{ background: "transparent", color: "inherit", border: "1px solid rgba(148, 163, 184, 0.4)" }}
            onClick={closeGuide}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default InstallGuideModal;

function StatusBanner({ type = "error", message, onDismiss }) {
  if (!message) return null;

  const isError = type === "error";
  const isSuccess = type === "success";
  const icon = isError ? "⚠️" : isSuccess ? "✅" : "ℹ️";

  return (
    <div
      className={`ui-status-banner ui-status-banner--${type}`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      <span className="ui-status-banner-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="ui-status-banner-text">{message}</span>
      {typeof onDismiss === "function" && (
        <button
          type="button"
          className="ui-status-banner-close"
          aria-label="Dismiss message"
          onClick={onDismiss}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default StatusBanner;

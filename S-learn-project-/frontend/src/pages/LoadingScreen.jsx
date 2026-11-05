import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthChange } from "../firebase/authService";
import "../App.css";

export function LoadingIndicator({ message = "Preparing your learning space" }) {
  return (
    <main className="loading-screen" role="status" aria-live="polite">
      <section className="loading-card">
        <div className="loading-mark">
          <img src="/slearn_logo.png" alt="" className="loading-logo" />
        </div>
        <p className="loading-eyebrow">S-LEARN</p>
        <h1 className="loading-title">Learning, made clearer.</h1>
        <p className="loading-message">{message}</p>
        <div className="loading-track" aria-hidden="true">
          <span className="loading-track-fill" />
        </div>
      </section>
    </main>
  );
}

function LoadingScreen() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Wait for Firebase to resolve the current session, then route accordingly.
    const unsub = onAuthChange((user) => {
      if (checked) return;
      setChecked(true);
      if (user) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    });
    return () => unsub();
  }, [navigate, checked]);

  return <LoadingIndicator message="Checking your account…" />;
}

export default LoadingScreen;

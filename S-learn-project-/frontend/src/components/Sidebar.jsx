import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { logoutUser } from "../firebase/authService";
import { useInstallApp } from "../context/installStore.js";
import "../dashboard.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isInstalled, canPromptInstall, promptInstall } = useInstallApp();

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Could not sign out:", error);
      return;
    }
    setMobileOpen(false);
    navigate("/login");
  };

  const handleNavigate = (path) => {
    setMobileOpen(false);
    navigate(path);
  };

  const handleInstallClick = async () => {
    setMobileOpen(false);
    await promptInstall();
  };

  const navItems = [
    { icon: "🏠", label: "Dashboard", action: () => handleNavigate("/dashboard"), active: location.pathname === "/dashboard" },
    { icon: "📖", label: "Learn & Notes", action: () => handleNavigate("/learn"), active: location.pathname.startsWith("/learn") },
    { icon: "🎓", label: "Practice Exam", action: () => handleNavigate("/exam"), active: location.pathname.startsWith("/exam") },
    { icon: "📚", label: "Smart Subjects", action: () => handleNavigate("/smartsubjects"), active: location.pathname.startsWith("/smartsubjects") },
    { icon: "🔬", label: "Science Lab", action: () => handleNavigate("/sciencelab"), active: location.pathname === "/sciencelab" },
    { icon: "📅", label: "Schedule", action: () => handleNavigate("/schedule"), active: location.pathname === "/schedule" },
    { icon: "⚙️", label: "Settings", action: () => handleNavigate("/settings"), active: location.pathname === "/settings" },
    ...(!isInstalled
      ? [
          {
            icon: "📲",
            label: canPromptInstall ? "Install App" : "Add Shortcut",
            action: handleInstallClick,
          },
        ]
      : []),
    { icon: "🚪", label: "Log Out", action: handleLogout },
  ];

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="db-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <button
        type="button"
        className={`db-sidebar-toggle ${mobileOpen ? "open" : ""}`}
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        onClick={() => setMobileOpen((value) => !value)}
      >
        {mobileOpen ? "✕" : "☰"}
      </button>

      <aside className={`db-sidebar ${mobileOpen ? "mobile-open" : "mobile-closed"}`}>
        <div className="db-logo">
          <img src="/slearn_logo.png" alt="S-Learn Logo" className="db-logo-img" />
        </div>

        <nav className="db-nav">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`db-nav-item ${item.active ? "active" : ""}`}
              onClick={item.action}
            >
              <span className="db-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

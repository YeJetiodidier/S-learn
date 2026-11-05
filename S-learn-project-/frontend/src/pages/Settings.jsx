import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { applyAppearance } from "../utils/applyAppearance.js";
import {
  getProfile,
  updateProfile,
  getSettings,
  updateSettings,
} from "../firebase/dataService";
import {
  changePassword,
  exportUserData,
  logoutUser,
  deleteAccount,
  getCurrentUser,
  mapAuthError,
} from "../firebase/authService";
import { uploadFile } from "../firebase/storageService";
import "../dashboard.css";
import "../App.css";

const TABS = [
  { id: "profile", icon: "👤", label: "Profile" },
  { id: "appearance", icon: "🎨", label: "Appearance" },
  { id: "notifications", icon: "🔔", label: "Notifications" },
  { id: "privacy", icon: "🔒", label: "Privacy" },
  { id: "account", icon: "⚙️", label: "Account" },
];

function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  // Profile state
  const [profile, setProfile] = useState({
    username: "S-Learn", role: "Student", avatar_url: "", bio: "", level: "", specialty: "",
  });

  // Appearance state
  const [appearance, setAppearance] = useState({
    theme: "light", accentColor: "#8b5cf6", fontSize: "medium", compactMode: false,
  });

  // Notifications state
  const [notifs, setNotifs] = useState({
    scheduleReminders: true, newPapers: true, videoUploads: false, weeklyReport: true, emailDigest: false,
  });

  // Privacy state
  const [privacy, setPrivacy] = useState({
    profileVisible: true, activityVisible: false, shareStats: true,
  });

  const uid = getCurrentUser()?.uid;

  // Load all settings from the API on mount
  useEffect(() => {
    if (!uid) return;
    getProfile(uid)
      .then(d => { if (d) setProfile(prev => ({ ...prev, ...d })); })
      .catch(error => console.error("Could not load profile settings:", error));

    getSettings(uid)
      .then(d => {
        if (!d) return;
        setAppearance({
          theme: d.theme || "light",
          accentColor: d.accent_color || "#8b5cf6",
          fontSize: d.font_size || "medium",
          compactMode: d.compact_mode ?? false,
        });
        setNotifs({
          scheduleReminders: d.notif_schedule_reminders ?? true,
          newPapers: d.notif_new_papers ?? true,
          videoUploads: d.notif_video_uploads ?? false,
          weeklyReport: d.notif_weekly_report ?? true,
          emailDigest: d.notif_email_digest ?? false,
        });
        setPrivacy({
          profileVisible: d.privacy_profile_visible ?? true,
          activityVisible: d.privacy_activity_visible ?? false,
          shareStats: d.privacy_share_stats ?? true,
        });
      })
      .catch(error => console.error("Could not load user settings:", error));
  }, [uid]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const url = await uploadFile(file, "avatar");
      const updated = { ...profile, avatar_url: url };
      setProfile(updated);
      // Save the profile URL so the image persists after refresh.
      if (uid) {
        await updateProfile(uid, updated);
        flash();
      }
    } catch (err) {
      alert("Avatar upload failed: " + (err?.message || err));
    } finally {
      setAvatarUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!uid) return;
    try {
      await updateProfile(uid, profile);
    } catch (error) {
      console.error("Could not save profile settings:", error);
      alert("Could not save profile settings. Please try again.");
      return;
    }
    flash();
  };

  const saveAppearance = async () => {
    if (!uid) return;
    try {
      await updateSettings(uid, {
        theme: appearance.theme,
        accent_color: appearance.accentColor,
        font_size: appearance.fontSize,
        compact_mode: appearance.compactMode,
      });
      // Apply immediately so the user sees the change without a reload
      applyAppearance(appearance);
    } catch (error) {
      console.error("Could not save appearance settings:", error);
      alert("Could not save appearance settings. Please try again.");
      return;
    }
    flash();
  };

  const saveNotifications = async () => {
    if (!uid) return;
    try {
      await updateSettings(uid, notifs);
    } catch (error) {
      console.error("Could not save notification settings:", error);
      alert("Could not save notification settings. Please try again.");
      return;
    }
    flash();
  };

  const savePrivacy = async () => {
    if (!uid) return;
    try {
      await updateSettings(uid, privacy);
    } catch (error) {
      console.error("Could not save privacy settings:", error);
      alert("Could not save privacy settings. Please try again.");
      return;
    }
    flash();
  };

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleChangePassword = async () => {
    const current = prompt("Enter current password:");
    if (!current) return;
    const newPass = prompt("Enter new password:");
    if (!newPass) return;
    try {
      await changePassword(current, newPass);
      alert("Password changed successfully");
    } catch (err) {
      alert(mapAuthError(err));
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `slearn-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert("Data exported successfully");
    } catch (error) {
      console.error("Could not export account data:", error);
      alert("Could not export account data. Please try again.");
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Could not sign out:", error);
      alert(mapAuthError(error));
      return;
    }
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    const password = prompt("Enter your password to confirm account deletion:");
    if (!password) return;
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await deleteAccount();
      alert("Account deleted");
      navigate("/register");
    } catch (err) {
      alert(mapAuthError(err));
    }
  };

  return (
    <div className="db-layout">
      <Sidebar />

      <main className="db-main">

        {/* HERO */}
        <section className="cfg-hero">
          <h1 className="cfg-title">⚙️ Settings</h1>
          <p className="cfg-sub">Manage your account, preferences, and privacy.</p>
          {saved && <div className="cfg-saved-toast">✅ Changes saved successfully!</div>}
        </section>

        <div className="cfg-layout">

          {/* TAB SIDEBAR */}
          <nav className="cfg-tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`cfg-tab ${activeTab === t.id ? "active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          {/* PANEL */}
          <div className="cfg-panel">

            {/* ── PROFILE ── */}
            {activeTab === "profile" && (
              <section className="cfg-section">
                <h2 className="cfg-section-title">Profile Information</h2>
                <p className="cfg-section-desc">Update your display name, role, and avatar that appear on your dashboard.</p>

                <div className="cfg-avatar-row">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="avatar" className="cfg-avatar-img" />
                  ) : (
                    <div className="cfg-avatar-placeholder">🧑‍🎓</div>
                  )}
                  <div>
                    <p className="cfg-avatar-name">{profile.username}</p>
                    <p className="cfg-avatar-role">{profile.role}</p>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleAvatarUpload}
                    />
                    <button
                      className="cfg-outline-btn"
                      style={{ marginTop: '8px', fontSize: '0.8rem', padding: '6px 16px' }}
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading}
                    >
                      {avatarUploading ? 'Uploading…' : '📷 Change Photo'}
                    </button>
                  </div>
                </div>

                <div className="cfg-form">
                  <div className="cfg-field">
                    <label>Display Name</label>
                    <input type="text" value={profile.username} onChange={e => setProfile({...profile, username: e.target.value})} placeholder="Your name" />
                  </div>
                  <div className="cfg-field">
                    <label>Role / Title</label>
                    <input type="text" value={profile.role} onChange={e => setProfile({...profile, role: e.target.value})} placeholder="e.g. Student, Teacher" />
                  </div>
                  <div className="cfg-field">
                    <label>Academic Level</label>
                    <select value={profile.level} onChange={e => setProfile({...profile, level: e.target.value})}>
                      <option value="">Not set</option>
                      <option>Ordinary Level</option>
                      <option>Advanced Level</option>
                      <option>Technical Level</option>
                      <option>Commercial Level</option>
                    </select>
                  </div>
                  <div className="cfg-field">
                    <label>Specialty</label>
                    <select value={profile.specialty} onChange={e => setProfile({...profile, specialty: e.target.value})}>
                      <option value="">Not set</option>
                      <option>Science</option>
                      <option>Arts</option>
                      <option>Commercial</option>
                      <option>Technical</option>
                    </select>
                  </div>
                  <div className="cfg-field" style={{gridColumn: "1/-1"}}>
                    <label>Bio</label>
                    <textarea rows={3} value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} placeholder="A short description about yourself..." />
                  </div>
                </div>
                <button className="cfg-save-btn" onClick={saveProfile}>Save Changes</button>
              </section>
            )}

            {/* ── APPEARANCE ── */}
            {activeTab === "appearance" && (
              <section className="cfg-section">
                <h2 className="cfg-section-title">Appearance</h2>
                <p className="cfg-section-desc">Customize how S-Learn looks and feels for you.</p>

                <div className="cfg-form">
                  <div className="cfg-field" style={{gridColumn: "1/-1"}}>
                    <label>Theme</label>
                    <div className="cfg-radio-group">
                      {["light", "dark", "system"].map(t => (
                        <button
                          key={t}
                          className={`cfg-radio-btn ${appearance.theme === t ? "active" : ""}`}
                          onClick={() => setAppearance({...appearance, theme: t})}
                        >
                          {t === "light" ? "☀️" : t === "dark" ? "🌙" : "💻"} {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="cfg-field">
                    <label>Accent Color</label>
                    <div className="cfg-color-row">
                      {["#8b5cf6","#3b82f6","#10b981","#f59e0b","#ef4444","#ec4899"].map(c => (
                        <button
                          key={c}
                          className={`cfg-color-swatch ${appearance.accentColor === c ? "active" : ""}`}
                          style={{ background: c }}
                          onClick={() => setAppearance({...appearance, accentColor: c})}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="cfg-field">
                    <label>Font Size</label>
                    <select value={appearance.fontSize} onChange={e => setAppearance({...appearance, fontSize: e.target.value})}>
                      <option value="small">Small</option>
                      <option value="medium">Medium (Default)</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div className="cfg-field" style={{gridColumn: "1/-1"}}>
                    <label>Compact Mode</label>
                    <div className="cfg-toggle-row">
                      <span>Reduce spacing for a denser layout</span>
                      <button
                        className={`cfg-toggle ${appearance.compactMode ? "on" : ""}`}
                        onClick={() => setAppearance({...appearance, compactMode: !appearance.compactMode})}
                      >
                        <span className="cfg-toggle-knob" />
                      </button>
                    </div>
                  </div>
                </div>
                <button className="cfg-save-btn" onClick={saveAppearance}>Save Preferences</button>
              </section>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeTab === "notifications" && (
              <section className="cfg-section">
                <h2 className="cfg-section-title">Notifications</h2>
                <p className="cfg-section-desc">Control which alerts and reminders you receive.</p>
                <div className="cfg-toggles-list">
                  {[
                    { key: "scheduleReminders", label: "Study Schedule Reminders", desc: "Get reminded when a study session is about to start" },
                    { key: "newPapers", label: "New Papers Added", desc: "Notify me when new past papers are uploaded to the database" },
                    { key: "videoUploads", label: "Science Lab Video Uploads", desc: "Alert when new practical videos are added" },
                    { key: "weeklyReport", label: "Weekly Progress Report", desc: "Receive a weekly summary of lessons completed and topics studied" },
                    { key: "emailDigest", label: "Email Digest", desc: "Get a weekly digest of all activity sent to your email" },
                  ].map(item => (
                    <div key={item.key} className="cfg-toggle-item">
                      <div className="cfg-toggle-info">
                        <p className="cfg-toggle-label">{item.label}</p>
                        <p className="cfg-toggle-desc">{item.desc}</p>
                      </div>
                      <button
                        className={`cfg-toggle ${notifs[item.key] ? "on" : ""}`}
                        onClick={() => setNotifs({...notifs, [item.key]: !notifs[item.key]})}
                      >
                        <span className="cfg-toggle-knob" />
                      </button>
                    </div>
                  ))}
                </div>
                <button className="cfg-save-btn" onClick={saveNotifications}>Save Preferences</button>
              </section>
            )}

            {/* ── PRIVACY ── */}
            {activeTab === "privacy" && (
              <section className="cfg-section">
                <h2 className="cfg-section-title">Privacy & Visibility</h2>
                <p className="cfg-section-desc">Control who can see your activity and profile information.</p>
                <div className="cfg-toggles-list">
                  {[
                    { key: "profileVisible", label: "Public Profile", desc: "Allow others to see your name and role" },
                    { key: "activityVisible", label: "Activity Status", desc: "Show when you are online or studying" },
                    { key: "shareStats", label: "Share Statistics", desc: "Allow your Lessons Completed and Topics Studied to be visible" },
                  ].map(item => (
                    <div key={item.key} className="cfg-toggle-item">
                      <div className="cfg-toggle-info">
                        <p className="cfg-toggle-label">{item.label}</p>
                        <p className="cfg-toggle-desc">{item.desc}</p>
                      </div>
                      <button
                        className={`cfg-toggle ${privacy[item.key] ? "on" : ""}`}
                        onClick={() => setPrivacy({...privacy, [item.key]: !privacy[item.key]})}
                      >
                        <span className="cfg-toggle-knob" />
                      </button>
                    </div>
                  ))}
                </div>
                <button className="cfg-save-btn" onClick={savePrivacy}>Save Preferences</button>
              </section>
            )}

            {/* ── ACCOUNT ── */}
            {activeTab === "account" && (
              <section className="cfg-section">
                <h2 className="cfg-section-title">Account Management</h2>
                <p className="cfg-section-desc">Manage your account security and data.</p>

                <div className="cfg-account-cards">
                  <div className="cfg-account-card">
                    <span className="cfg-account-icon">🔑</span>
                    <div>
                      <p className="cfg-account-label">Change Password</p>
                      <p className="cfg-account-sub">Update your login credentials</p>
                    </div>
                    <button className="cfg-outline-btn" onClick={handleChangePassword}>Change</button>
                  </div>
                  <div className="cfg-account-card">
                    <span className="cfg-account-icon">📦</span>
                    <div>
                      <p className="cfg-account-label">Export My Data</p>
                      <p className="cfg-account-sub">Download all your schedule and study data</p>
                    </div>
                    <button className="cfg-outline-btn" onClick={handleExportData}>Export</button>
                  </div>
                  <div className="cfg-account-card">
                    <span className="cfg-account-icon">🚪</span>
                    <div>
                      <p className="cfg-account-label">Sign Out</p>
                      <p className="cfg-account-sub">Log out of your current session</p>
                    </div>
                    <button className="cfg-outline-btn" onClick={handleSignOut}>Sign Out</button>
                  </div>
                  <div className="cfg-account-card danger">
                    <span className="cfg-account-icon">🗑️</span>
                    <div>
                      <p className="cfg-account-label">Delete Account</p>
                      <p className="cfg-account-sub">Permanently remove your account and all data</p>
                    </div>
                    <button className="cfg-danger-btn" onClick={handleDeleteAccount}>Delete</button>
                  </div>
                </div>
              </section>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

export default Settings;

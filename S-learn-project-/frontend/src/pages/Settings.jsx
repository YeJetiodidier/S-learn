import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatusBanner from "../components/StatusBanner";
import { applyAppearance } from "../utils/applyAppearance.js";
import { useSettings } from "../context/settingsStore.js";
import { useInstallApp } from "../context/installStore.js";
import { getFriendlyErrorMessage } from "../utils/friendlyError.js";
import {
  getProfile,
  updateProfile,
  getSettings,
  updateSettings,
  getPapers,
  getNotifications,
  broadcastNotification,
  markNotificationRead,
  markAllNotificationsRead,
} from "../firebase/dataService";
import {
  changePassword,
  exportUserData,
  logoutUser,
  deleteAccount,
  getCurrentUser,
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

const DEFAULT_LEVELS = [
  "Ordinary Level",
  "Advanced Level",
  "Technical Level",
  "Commercial Level",
];

const DEFAULT_SPECIALTIES = [
  "Science",
  "Arts",
  "Commercial",
  "Technical",
];

const formatNotificationDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function Settings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setAppearance: setGlobalAppearance } = useSettings();
  const { isInstalled, canPromptInstall, promptInstall } = useInstallApp();
  const initialTab = TABS.some((t) => t.id === searchParams.get("tab"))
    ? searchParams.get("tab")
    : "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error' | 'info', message: string }
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const [paperOptions, setPaperOptions] = useState({ levels: [], specialties: [] });

  const [updates, setUpdates] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [updateFilter, setUpdateFilter] = useState("all");
  const [announcement, setAnnouncement] = useState({
    category: "platform",
    title: "",
    message: "",
    link: "",
  });
  const [postingUpdate, setPostingUpdate] = useState(false);

  const currentUser = getCurrentUser();
  const fallbackName =
    currentUser?.displayName || currentUser?.email?.split("@")[0] || "Student";

  // Profile state
  const [profile, setProfile] = useState({
    username: fallbackName,
    role: "Student",
    avatar_url: currentUser?.photoURL || "",
    bio: "",
    level: "",
    specialty: "",
  });

  // Appearance state
  const [appearance, setAppearance] = useState({
    theme: "light", accentColor: "#8b5cf6", fontSize: "medium", compactMode: false,
  });

  // Notifications state
  const [notifs, setNotifs] = useState({
    platformUpdates: true,
    newPapers: true,
    videoUploads: false,
    scheduleReminders: true,
    weeklyReport: true,
    emailDigest: false,
  });

  // Privacy state
  const [privacy, setPrivacy] = useState({
    profileVisible: true, activityVisible: false, shareStats: true,
  });

  const uid = getCurrentUser()?.uid;
  const isAdmin = ["admin", "teacher"].includes(String(profile.role || "").toLowerCase());

  const showSuccess = (message) => setFeedback({ type: "success", message });
  const showError = (error, fallback) =>
    setFeedback({ type: "error", message: getFriendlyErrorMessage(error, fallback) });

  const fetchNotifications = useCallback(async () => {
    setUpdatesLoading(true);
    try {
      const data = await getNotifications();
      setUpdates(Array.isArray(data?.items) ? data.items : []);
      setUnreadCount(Number(data?.unreadCount) || 0);
    } catch (error) {
      console.error("Could not load notifications:", error);
      setFeedback({
        type: "error",
        message: getFriendlyErrorMessage(
          error,
          "We couldn't load your latest updates right now. Please try again.",
        ),
      });
    } finally {
      setUpdatesLoading(false);
    }
  }, []);

  // Load all settings from the API on mount
  useEffect(() => {
    if (!uid) return;
    getProfile(uid)
      .then((d) => {
        if (d) setProfile((prev) => ({ ...prev, ...d }));
      })
      .catch((error) => {
        console.error("Could not load profile settings:", error);
        setFeedback({
          type: "error",
          message: getFriendlyErrorMessage(
            error,
            "We couldn't load your profile details right now.",
          ),
        });
      });

    getSettings(uid)
      .then((d) => {
        if (!d) return;
        setAppearance({
          theme: d.theme || "light",
          accentColor: d.accent_color || "#8b5cf6",
          fontSize: d.font_size || "medium",
          compactMode: d.compact_mode ?? false,
        });
        setNotifs({
          platformUpdates: d.notif_platform_updates ?? true,
          newPapers: d.notif_new_papers ?? true,
          videoUploads: d.notif_video_uploads ?? false,
          scheduleReminders: d.notif_schedule_reminders ?? true,
          weeklyReport: d.notif_weekly_report ?? true,
          emailDigest: d.notif_email_digest ?? false,
        });
        setPrivacy({
          profileVisible: d.privacy_profile_visible ?? true,
          activityVisible: d.privacy_activity_visible ?? false,
          shareStats: d.privacy_share_stats ?? true,
        });
      })
      .catch((error) => {
        console.error("Could not load user settings:", error);
        setFeedback({
          type: "error",
          message: getFriendlyErrorMessage(
            error,
            "We couldn't load your saved preferences right now.",
          ),
        });
      });

    getPapers()
      .then((papers) => {
        if (!Array.isArray(papers)) return;
        setPaperOptions({
          levels: [...new Set(papers.map((p) => String(p.level || "").trim()).filter(Boolean))],
          specialties: [...new Set(papers.map((p) => String(p.specialty || "").trim()).filter(Boolean))],
        });
      })
      .catch(() => {});

    fetchNotifications();
  }, [uid, fetchNotifications]);

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setFeedback(null);
    setSearchParams(tabId === "profile" ? {} : { tab: tabId }, { replace: true });
    if (tabId === "notifications") {
      fetchNotifications();
    }
  };

  const levelOptions = useMemo(() => {
    return [...new Set([...DEFAULT_LEVELS, ...paperOptions.levels, profile.level].filter(Boolean))];
  }, [paperOptions.levels, profile.level]);

  const specialtyOptions = useMemo(() => {
    return [
      ...new Set([...DEFAULT_SPECIALTIES, ...paperOptions.specialties, profile.specialty].filter(Boolean)),
    ];
  }, [paperOptions.specialties, profile.specialty]);

  const filteredUpdates = useMemo(() => {
    if (updateFilter === "all") return updates;
    return updates.filter((item) => item.category === updateFilter);
  }, [updates, updateFilter]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    setFeedback(null);
    try {
      const url = await uploadFile(file, "avatar");
      const updated = { ...profile, avatar_url: url };
      setProfile(updated);
      if (uid) {
        await updateProfile(uid, updated);
        showSuccess("Profile photo updated successfully!");
      }
    } catch (err) {
      showError(err, "We couldn't upload your profile photo. Please try a JPG, PNG, or WebP image.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!uid) return;
    setFeedback(null);
    try {
      await updateProfile(uid, profile);
      showSuccess("Profile changes saved successfully!");
    } catch (error) {
      console.error("Could not save profile settings:", error);
      showError(error, "We couldn't save your profile changes. Please try again.");
    }
  };

  const saveAppearance = async () => {
    if (!uid) return;
    setFeedback(null);
    try {
      await updateSettings(uid, {
        theme: appearance.theme,
        accent_color: appearance.accentColor,
        font_size: appearance.fontSize,
        compact_mode: appearance.compactMode,
      });
      setGlobalAppearance(appearance);
      applyAppearance(appearance);
      showSuccess("Appearance preferences saved!");
    } catch (error) {
      console.error("Could not save appearance settings:", error);
      showError(error, "We couldn't save your appearance preferences. Please try again.");
    }
  };

  const saveNotifications = async () => {
    if (!uid) return;
    setFeedback(null);
    try {
      await updateSettings(uid, notifs);
      await fetchNotifications();
      showSuccess("Notification preferences saved! Your update feed is now synced.");
    } catch (error) {
      console.error("Could not save notification settings:", error);
      showError(error, "We couldn't save your notification preferences. Please try again.");
    }
  };

  const handleMarkRead = async (id) => {
    setFeedback(null);
    const previous = updates;
    setUpdates((list) => list.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await markNotificationRead(id);
    } catch (error) {
      setUpdates(previous);
      setUnreadCount(previous.filter((item) => !item.isRead).length);
      showError(error, "We couldn't update that notification right now.");
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setFeedback(null);
    const previous = updates;
    setUpdates((list) => list.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
      showSuccess("All notifications marked as read.");
    } catch (error) {
      setUpdates(previous);
      setUnreadCount(previous.filter((item) => !item.isRead).length);
      showError(error, "We couldn't mark notifications as read right now.");
    }
  };

  const handleBroadcastUpdate = async (e) => {
    e.preventDefault();
    if (postingUpdate) return;
    if (!announcement.title.trim() || !announcement.message.trim()) {
      setFeedback({
        type: "error",
        message: "Please enter both a title and a message before sending an update.",
      });
      return;
    }
    setPostingUpdate(true);
    setFeedback(null);
    try {
      await broadcastNotification({
        category: announcement.category,
        title: announcement.title.trim(),
        message: announcement.message.trim(),
        link: announcement.link.trim(),
      });
      setAnnouncement({ category: "platform", title: "", message: "", link: "" });
      await fetchNotifications();
      showSuccess("Update published! Subscribed users will now receive it.");
    } catch (error) {
      showError(error, "We couldn't publish the update right now. Please try again.");
    } finally {
      setPostingUpdate(false);
    }
  };

  const savePrivacy = async () => {
    if (!uid) return;
    setFeedback(null);
    try {
      await updateSettings(uid, privacy);
      showSuccess("Privacy preferences saved!");
    } catch (error) {
      console.error("Could not save privacy settings:", error);
      showError(error, "We couldn't save your privacy preferences. Please try again.");
    }
  };

  const handleChangePassword = async () => {
    const current = prompt("Enter current password:");
    if (!current) return;
    const newPass = prompt("Enter new password:");
    if (!newPass) return;
    setFeedback(null);
    try {
      await changePassword(current, newPass);
      showSuccess("Password changed successfully!");
    } catch (err) {
      showError(err, "We couldn't change your password. Please double-check your current password and try again.");
    }
  };

  const handleExportData = async () => {
    setFeedback(null);
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
      showSuccess("Your account, schedule, and study data has been downloaded.");
    } catch (error) {
      console.error("Could not export account data:", error);
      showError(error, "We couldn't export your account data right now. Please try again.");
    }
  };

  const handleSignOut = async () => {
    setFeedback(null);
    try {
      await logoutUser();
    } catch (error) {
      console.error("Could not sign out:", error);
      showError(error, "We couldn't sign you out right now. Please try again.");
      return;
    }
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    const password = prompt("Enter your password to confirm account deletion:");
    if (!password) return;
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    setFeedback(null);
    try {
      await deleteAccount(password);
      navigate("/register");
    } catch (err) {
      showError(err, "We couldn't delete your account. Please verify your password and try again.");
    }
  };

  return (
    <div className="db-layout">
      <Sidebar />

      <main className="db-main">
        {/* HERO */}
        <section className="cfg-hero">
          <h1 className="cfg-title">⚙️ Settings</h1>
          <p className="cfg-sub">Manage your account, notifications, preferences, and privacy.</p>
        </section>

        <StatusBanner
          type={feedback?.type}
          message={feedback?.message}
          onDismiss={() => setFeedback(null)}
        />

        <div className="cfg-layout">
          {/* TAB SIDEBAR */}
          <nav className="cfg-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`cfg-tab ${activeTab === t.id ? "active" : ""}`}
                onClick={() => handleSelectTab(t.id)}
              >
                <span>{t.icon}</span>
                <span>
                  {t.label}
                  {t.id === "notifications" && unreadCount > 0 ? ` (${unreadCount})` : ""}
                </span>
              </button>
            ))}
          </nav>

          {/* PANEL */}
          <div className="cfg-panel">
            {/* ── PROFILE ── */}
            {activeTab === "profile" && (
              <section className="cfg-section">
                <h2 className="cfg-section-title">Profile Information</h2>
                <p className="cfg-section-desc">Update your display name, academic details, and avatar shown on your dashboard.</p>

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
                      style={{ display: "none" }}
                      onChange={handleAvatarUpload}
                    />
                    <button
                      className="cfg-outline-btn"
                      style={{ marginTop: "8px", fontSize: "0.8rem", padding: "6px 16px" }}
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading}
                    >
                      {avatarUploading ? "Uploading…" : "📷 Change Photo"}
                    </button>
                  </div>
                </div>

                <div className="cfg-form">
                  <div className="cfg-field">
                    <label>Display Name</label>
                    <input type="text" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} placeholder="Your name" />
                  </div>
                  <div className="cfg-field">
                    <label>Role / Title (Managed by Admin)</label>
                    <input type="text" value={profile.role} readOnly disabled title="Roles are managed by an administrator" />
                  </div>
                  <div className="cfg-field">
                    <label>Academic Level</label>
                    <select value={profile.level} onChange={(e) => setProfile({ ...profile, level: e.target.value })}>
                      <option value="">Not set</option>
                      {levelOptions.map((lvl) => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                  <div className="cfg-field">
                    <label>Specialty</label>
                    <select value={profile.specialty} onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}>
                      <option value="">Not set</option>
                      {specialtyOptions.map((spec) => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>
                  <div className="cfg-field" style={{ gridColumn: "1/-1" }}>
                    <label>Bio</label>
                    <textarea rows={3} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="A short description about yourself..." />
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
                  <div className="cfg-field" style={{ gridColumn: "1/-1" }}>
                    <label>Theme</label>
                    <div className="cfg-radio-group">
                      {["light", "dark", "system"].map((t) => (
                        <button
                          key={t}
                          className={`cfg-radio-btn ${appearance.theme === t ? "active" : ""}`}
                          onClick={() => setAppearance({ ...appearance, theme: t })}
                        >
                          {t === "light" ? "☀️" : t === "dark" ? "🌙" : "💻"} {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="cfg-field">
                    <label>Accent Color</label>
                    <div className="cfg-color-row">
                      {["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"].map((c) => (
                        <button
                          key={c}
                          className={`cfg-color-swatch ${appearance.accentColor === c ? "active" : ""}`}
                          style={{ background: c }}
                          onClick={() => setAppearance({ ...appearance, accentColor: c })}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="cfg-field">
                    <label>Font Size</label>
                    <select value={appearance.fontSize} onChange={(e) => setAppearance({ ...appearance, fontSize: e.target.value })}>
                      <option value="small">Small</option>
                      <option value="medium">Medium (Default)</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div className="cfg-field" style={{ gridColumn: "1/-1" }}>
                    <label>Compact Mode</label>
                    <div className="cfg-toggle-row">
                      <span>Reduce spacing for a denser layout</span>
                      <button
                        className={`cfg-toggle ${appearance.compactMode ? "on" : ""}`}
                        onClick={() => setAppearance({ ...appearance, compactMode: !appearance.compactMode })}
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
                <h2 className="cfg-section-title">Notifications & Updates</h2>
                <p className="cfg-section-desc">
                  Choose which updates you want to receive about new past papers, lab videos, and S-Learn platform announcements.
                </p>

                <div className="cfg-toggles-list">
                  {[
                    { key: "platformUpdates", label: "Platform Updates & Announcements", desc: "Receive news about new features, improvements, and platform notices" },
                    { key: "newPapers", label: "Past Paper Updates", desc: "Get notified when new past papers are published or your submissions are approved" },
                    { key: "videoUploads", label: "Science Lab Video Updates", desc: "Alert when new practical videos are added to Science Lab" },
                    { key: "scheduleReminders", label: "Study Schedule Reminders", desc: "Show reminders for your upcoming study sessions" },
                    { key: "weeklyReport", label: "Weekly Progress Report", desc: "Receive a weekly summary of lessons completed and topics studied" },
                    { key: "emailDigest", label: "Email Digest", desc: "Get a weekly digest of activity sent to your email" },
                  ].map((item) => (
                    <div key={item.key} className="cfg-toggle-item">
                      <div className="cfg-toggle-info">
                        <p className="cfg-toggle-label">{item.label}</p>
                        <p className="cfg-toggle-desc">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        className={`cfg-toggle ${notifs[item.key] ? "on" : ""}`}
                        aria-pressed={notifs[item.key]}
                        aria-label={item.label}
                        onClick={() => setNotifs({ ...notifs, [item.key]: !notifs[item.key] })}
                      >
                        <span className="cfg-toggle-knob" />
                      </button>
                    </div>
                  ))}
                </div>
                <button className="cfg-save-btn" onClick={saveNotifications}>Save Preferences</button>

                {/* LIVE UPDATES FEED */}
                <div className="cfg-updates-box">
                  <div className="cfg-updates-header">
                    <div>
                      <h3 className="cfg-section-title" style={{ fontSize: "1.1rem", marginBottom: "4px" }}>
                        Recent Paper & Platform Updates {unreadCount > 0 ? `(${unreadCount} unread)` : ""}
                      </h3>
                      <p className="cfg-section-desc" style={{ margin: 0 }}>
                        Filtered according to your active notification preferences above.
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button type="button" className="cfg-mini-btn" onClick={fetchNotifications} disabled={updatesLoading}>
                        {updatesLoading ? "Refreshing..." : "Refresh"}
                      </button>
                      {unreadCount > 0 && (
                        <button type="button" className="cfg-mini-btn" onClick={handleMarkAllRead}>
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
                    {[
                      { id: "all", label: "All Updates" },
                      { id: "paper", label: "Papers" },
                      { id: "platform", label: "Platform" },
                      { id: "video", label: "Science Lab" },
                    ].map((chip) => (
                      <button
                        key={chip.id}
                        type="button"
                        className="cfg-mini-btn"
                        style={
                          updateFilter === chip.id
                            ? { background: "var(--accent, #4f46e5)", color: "#fff", borderColor: "var(--accent, #4f46e5)" }
                            : undefined
                        }
                        onClick={() => setUpdateFilter(chip.id)}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {updatesLoading ? (
                    <p className="cfg-section-desc">Loading updates…</p>
                  ) : filteredUpdates.length === 0 ? (
                    <p className="cfg-section-desc">
                      No updates in this category yet. Make sure the matching notification preference above is turned on and saved.
                    </p>
                  ) : (
                    <div className="cfg-updates-list">
                      {filteredUpdates.map((item) => (
                        <div key={item.id} className={`cfg-update-card ${item.isRead ? "" : "unread"}`}>
                          <div className="cfg-update-body">
                            <div className="cfg-update-meta">
                              <span className={`cfg-update-badge cfg-update-badge--${item.category}`}>
                                {item.category === "paper"
                                  ? "Paper Update"
                                  : item.category === "video"
                                    ? "Science Lab"
                                    : "Platform"}
                              </span>
                              {item.createdAt && (
                                <span className="cfg-update-time">
                                  {formatNotificationDate(item.createdAt)}
                                </span>
                              )}
                            </div>
                            <p className="cfg-update-title">{item.title}</p>
                            <p className="cfg-update-msg">{item.message}</p>
                          </div>
                          <div className="cfg-update-actions">
                            {!item.isRead && (
                              <button
                                type="button"
                                className="cfg-mini-btn"
                                onClick={() => handleMarkRead(item.id)}
                              >
                                Mark read
                              </button>
                            )}
                            {item.link && (
                              <button
                                type="button"
                                className="cfg-mini-btn"
                                onClick={() => {
                                  if (!item.isRead) handleMarkRead(item.id);
                                  navigate(item.link);
                                }}
                              >
                                Open
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ADMIN / TEACHER ANNOUNCEMENT COMPOSER */}
                {isAdmin && (
                  <form className="cfg-composer" onSubmit={handleBroadcastUpdate}>
                    <h3 className="cfg-section-title" style={{ fontSize: "1.05rem", margin: 0 }}>
                      📢 Publish Platform or Paper Update
                    </h3>
                    <p className="cfg-section-desc" style={{ margin: 0 }}>
                      Send an update to all users subscribed to that notification category.
                    </p>
                    <div className="cfg-form" style={{ marginBottom: 0 }}>
                      <div className="cfg-field">
                        <label>Update Type</label>
                        <select
                          value={announcement.category}
                          onChange={(e) => setAnnouncement({ ...announcement, category: e.target.value })}
                        >
                          <option value="platform">Platform Update</option>
                          <option value="paper">Paper Update</option>
                          <option value="video">Science Lab Update</option>
                        </select>
                      </div>
                      <div className="cfg-field">
                        <label>Link (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. /smartsubjects"
                          value={announcement.link}
                          onChange={(e) => setAnnouncement({ ...announcement, link: e.target.value })}
                        />
                      </div>
                      <div className="cfg-field" style={{ gridColumn: "1/-1" }}>
                        <label>Title</label>
                        <input
                          type="text"
                          placeholder="e.g. 2025 Chemistry Past Papers Added"
                          value={announcement.title}
                          onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                          required
                        />
                      </div>
                      <div className="cfg-field" style={{ gridColumn: "1/-1" }}>
                        <label>Message</label>
                        <textarea
                          rows={3}
                          placeholder="Share details about the paper or platform update..."
                          value={announcement.message}
                          onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <button type="submit" className="cfg-save-btn" disabled={postingUpdate}>
                        {postingUpdate ? "Publishing..." : "Publish Update"}
                      </button>
                    </div>
                  </form>
                )}
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
                  ].map((item) => (
                    <div key={item.key} className="cfg-toggle-item">
                      <div className="cfg-toggle-info">
                        <p className="cfg-toggle-label">{item.label}</p>
                        <p className="cfg-toggle-desc">{item.desc}</p>
                      </div>
                      <button
                        className={`cfg-toggle ${privacy[item.key] ? "on" : ""}`}
                        onClick={() => setPrivacy({ ...privacy, [item.key]: !privacy[item.key] })}
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
                    <span className="cfg-account-icon">📲</span>
                    <div>
                      <p className="cfg-account-label">Install S-Learn Phone Shortcut</p>
                      <p className="cfg-account-sub">
                        {isInstalled
                          ? "S-Learn is already installed as an app shortcut on this device."
                          : "Add S-Learn to your phone or desktop home screen for instant one-tap access."}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="cfg-outline-btn"
                      disabled={isInstalled}
                      onClick={async () => {
                        const result = await promptInstall();
                        if (result?.outcome === "accepted") {
                          showSuccess("S-Learn shortcut installed! Check your home screen.");
                        }
                      }}
                    >
                      {isInstalled ? "Installed ✓" : canPromptInstall ? "Install App" : "Add Shortcut"}
                    </button>
                  </div>
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

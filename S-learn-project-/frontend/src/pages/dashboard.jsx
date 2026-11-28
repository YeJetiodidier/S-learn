import Sidebar from "../components/Sidebar";
import StatusBanner from "../components/StatusBanner";
import { useInstallApp } from "../context/installStore.js";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getProfile,
  getStudyProgress,
  getPapers,
  getVideos,
  getSchedule,
  getSettings,
  updateSettings,
  getPendingPapers,
  getPendingVideos,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../firebase/dataService";
import { getCurrentUser } from "../firebase/authService";
import { getFriendlyErrorMessage } from "../utils/friendlyError";
import "../dashboard.css";

function StatChart({ studyProgress, lessons, onStartExam }) {
  const ordered = useMemo(() => {
    return [...(studyProgress || [])]
      .sort((a, b) => new Date(a.lastCompletedAt || 0) - new Date(b.lastCompletedAt || 0))
      .slice(-8);
  }, [studyProgress]);

  if (!ordered.length) {
    return (
      <div className="db-chart-empty">
        <p className="db-chart-empty-title">No study progress recorded yet</p>
        <p className="db-chart-empty-sub">
          Complete a practice exam to track your real accuracy and lessons over time.
        </p>
        <button type="button" className="db-chart-cta" onClick={onStartExam}>
          Start Your First Practice Exam
        </button>
      </div>
    );
  }

  const width = 260;
  const height = 100;
  const padX = 16;
  const padTop = 18;
  const padBottom = 14;
  const plotW = width - padX * 2;
  const plotH = height - padTop - padBottom;

  const scores = ordered.map((item) => {
    const total = Number(item.bestScoreTotal) || 0;
    const score = Number(item.bestScore) || 0;
    return total > 0 ? Math.round((score / total) * 100) : 0;
  });

  const avgScore = Math.round(scores.reduce((sum, val) => sum + val, 0) / scores.length);

  const scorePoints = ordered.map((item, idx) => {
    const x =
      ordered.length === 1
        ? padX + plotW / 2
        : padX + (idx / (ordered.length - 1)) * plotW;
    const pct = scores[idx];
    const y = padTop + plotH - (pct / 100) * plotH;
    return { x, y, pct, item };
  });

  const maxRuns = Math.max(1, ...ordered.map((item) => Number(item.completedCount) || 1));
  const runPoints = ordered.map((item, idx) => {
    const x =
      ordered.length === 1
        ? padX + plotW / 2
        : padX + (idx / (ordered.length - 1)) * plotW;
    const runs = Number(item.completedCount) || 0;
    const y = padTop + plotH - (runs / maxRuns) * plotH;
    return { x, y, runs, item };
  });

  const toPath = (pts) =>
    pts.map(({ x, y }, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  const lastPoint = scorePoints[scorePoints.length - 1];
  const latest = ordered[ordered.length - 1];

  return (
    <div className="db-chart-wrap">
      <div className="db-chart-summary">
        <span>
          <strong>{lessons || 0}</strong> Lessons
        </span>
        <span>
          <strong>{avgScore}%</strong> Avg Best Score
        </span>
        <span>
          Latest: <strong>{latest.subject}</strong> ({latest.topic})
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="stat-chart" preserveAspectRatio="none">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>

        {scorePoints.length > 1 && (
          <>
            <path
              d={`${toPath(scorePoints)} L${lastPoint.x.toFixed(1)},${height - padBottom} L${scorePoints[0].x.toFixed(1)},${height - padBottom} Z`}
              fill="url(#g1)"
            />
            <path
              d={toPath(scorePoints)}
              fill="none"
              stroke="#818cf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={`${toPath(runPoints)} L${runPoints[runPoints.length - 1].x.toFixed(1)},${height - padBottom} L${runPoints[0].x.toFixed(1)},${height - padBottom} Z`}
              fill="url(#g2)"
            />
            <path
              d={toPath(runPoints)}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {scorePoints.map(({ x, y, pct, item }, idx) => (
          <circle
            key={`${item.subject}-${item.topic}-${idx}`}
            cx={x}
            cy={y}
            r={idx === scorePoints.length - 1 ? 4.5 : 3}
            fill="#818cf8"
          >
            <title>
              {`${item.subject} — ${item.topic}: ${item.bestScore}/${item.bestScoreTotal} (${pct}%), ${item.completedCount} attempt(s)`}
            </title>
          </circle>
        ))}

        <rect
          x={Math.min(Math.max(lastPoint.x - 32, 4), width - 68)}
          y={Math.max(lastPoint.y - 22, 2)}
          width="64"
          height="16"
          rx="5"
          fill="#1e293b"
        />
        <text
          x={Math.min(Math.max(lastPoint.x, 36), width - 36)}
          y={Math.max(lastPoint.y - 11, 13)}
          textAnchor="middle"
          fill="white"
          fontSize="7"
          fontWeight="bold"
        >
          {`${lastPoint.pct}% Best`}
        </text>
      </svg>

      <div className="db-chart-legend">
        <span><i style={{ background: "#818cf8" }} /> Best Score (%)</span>
        <span><i style={{ background: "#38bdf8" }} /> Attempts per Topic</span>
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { isInstalled, installCheckReady, canPromptInstall, promptInstall } = useInstallApp();
  const [installBannerDismissed, setInstallBannerDismissed] = useState(() => {
    try {
      return sessionStorage.getItem("slearn_install_banner_dismissed") === "1";
    } catch {
      return false;
    }
  });
  const cardsRowRef = useRef(null);
  const searchWrapRef = useRef(null);
  const notifWrapRef = useRef(null);

  const currentUser = getCurrentUser();
  const fallbackName =
    currentUser?.displayName || currentUser?.email?.split("@")[0] || "Student";

  const [profile, setProfile] = useState({
    username: fallbackName,
    role: "Student",
    avatar_url: currentUser?.photoURL || "",
    lessons_completed: 0,
    topics_studied: 0,
  });
  const [studyProgress, setStudyProgress] = useState([]);
  const [papers, setPapers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [pendingCounts, setPendingCounts] = useState({ papers: 0, videos: 0 });
  const [favoriteCards, setFavoriteCards] = useState([]);
  const [serverNotifications, setServerNotifications] = useState([]);
  const [notifPrefs, setNotifPrefs] = useState({
    scheduleReminders: true,
    newPapers: true,
    videoUploads: false,
    platformUpdates: true,
  });
  const [banner, setBanner] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const uid = getCurrentUser()?.uid;
    if (!uid) return;
    let active = true;

    Promise.allSettled([
      getProfile(uid),
      getStudyProgress(uid),
      getPapers(),
      getVideos(),
      getSchedule(uid),
      getSettings(uid),
      getNotifications(),
    ]).then(([profileRes, progressRes, papersRes, videosRes, scheduleRes, settingsRes, notifsRes]) => {
      if (!active) return;

      if (profileRes.status === "fulfilled" && profileRes.value) {
        const data = profileRes.value;
        setProfile((current) => ({ ...current, ...data }));
        const role = String(data.role || "").toLowerCase();
        if (role === "admin" || role === "teacher") {
          Promise.allSettled([getPendingPapers(), getPendingVideos()]).then(
            ([pendingPapersRes, pendingVideosRes]) => {
              if (!active) return;
              setPendingCounts({
                papers:
                  pendingPapersRes.status === "fulfilled" && Array.isArray(pendingPapersRes.value)
                    ? pendingPapersRes.value.length
                    : 0,
                videos:
                  pendingVideosRes.status === "fulfilled" && Array.isArray(pendingVideosRes.value)
                    ? pendingVideosRes.value.length
                    : 0,
              });
            },
          );
        }
      }

      if (progressRes.status === "fulfilled" && Array.isArray(progressRes.value)) {
        setStudyProgress(progressRes.value);
      }
      if (papersRes.status === "fulfilled" && Array.isArray(papersRes.value)) {
        setPapers(papersRes.value);
      }
      if (videosRes.status === "fulfilled" && Array.isArray(videosRes.value)) {
        setVideos(videosRes.value);
      }
      if (scheduleRes.status === "fulfilled" && Array.isArray(scheduleRes.value)) {
        setScheduleItems(scheduleRes.value);
      }
      if (settingsRes.status === "fulfilled" && settingsRes.value) {
        const s = settingsRes.value;
        setFavoriteCards(Array.isArray(s.favorite_cards) ? s.favorite_cards : []);
        setNotifPrefs({
          scheduleReminders: s.notif_schedule_reminders ?? true,
          newPapers: s.notif_new_papers ?? true,
          videoUploads: s.notif_video_uploads ?? false,
          platformUpdates: s.notif_platform_updates ?? true,
        });
      }
      if (notifsRes.status === "fulfilled" && Array.isArray(notifsRes.value?.items)) {
        setServerNotifications(notifsRes.value.items);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
      if (notifWrapRef.current && !notifWrapRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const openScheduleTasks = useMemo(
    () => scheduleItems.filter((item) => !item.done),
    [scheduleItems],
  );

  const subjectCards = useMemo(
    () => [
      {
        id: "sciencelab",
        title: "Science Lab",
        desc:
          videos.length > 0
            ? `${videos.length} practical video${videos.length === 1 ? "" : "s"}`
            : "Chemistry & Physics Practicals",
        img: "/science_card.png",
        gradient: "linear-gradient(135deg, #f8b8d8, #f8d8a8)",
        action: "/sciencelab",
      },
      {
        id: "smartsubjects",
        title: "Smart Subjects",
        desc:
          papers.length > 0
            ? `${papers.length} approved past paper${papers.length === 1 ? "" : "s"}`
            : "Papers & Specialities",
        img: "/books_card.png",
        gradient: "linear-gradient(135deg, #4f46e5, #ec4899)",
        action: "/smartsubjects",
      },
      {
        id: "schedule",
        title: "Schedule",
        desc:
          openScheduleTasks.length > 0
            ? `${openScheduleTasks.length} upcoming task${openScheduleTasks.length === 1 ? "" : "s"}`
            : "Manage your timetable",
        img: "/schedule_card.png",
        gradient: "linear-gradient(135deg, #a8f0e8, #c8c8f8)",
        action: "/schedule",
      },
      {
        id: "learn",
        title: "Learn & Notes",
        desc: "Auto-generated syllabus notes",
        img: "/books_card.png",
        gradient: "linear-gradient(135deg, #2563eb, #38bdf8)",
        action: "/learn",
      },
      {
        id: "exam",
        title: "Exam",
        desc:
          studyProgress.length > 0
            ? `${studyProgress.length} topic${studyProgress.length === 1 ? "" : "s"} practiced`
            : "Practice exam questions",
        img: "/exam_card.png",
        gradient: "linear-gradient(135deg, #ff7e5f, #feb47b)",
        action: "/exam",
      },
    ],
    [videos.length, papers.length, openScheduleTasks.length, studyProgress.length],
  );

  const toggleFavorite = async (e, cardId) => {
    e.preventDefault();
    e.stopPropagation();
    const uid = getCurrentUser()?.uid;
    const nextFavorites = favoriteCards.includes(cardId)
      ? favoriteCards.filter((id) => id !== cardId)
      : [...favoriteCards, cardId];

    setFavoriteCards(nextFavorites);
    if (!uid) return;
    try {
      await updateSettings(uid, { favorite_cards: nextFavorites });
    } catch (error) {
      console.error("Could not save favorite:", error);
      setFavoriteCards(favoriteCards);
      setBanner({
        type: "error",
        message: getFriendlyErrorMessage(error, "We couldn't update your favorites right now. Please try again."),
      });
    }
  };

  const scrollCards = (direction) => {
    if (!cardsRowRef.current) return;
    cardsRowRef.current.scrollBy({ left: direction * 240, behavior: "smooth" });
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const matches = [];

    for (const card of subjectCards) {
      if (`${card.title} ${card.desc}`.toLowerCase().includes(q)) {
        matches.push({
          key: `card-${card.id}`,
          type: "Section",
          title: card.title,
          sub: card.desc,
          onSelect: () => navigate(card.action),
        });
      }
    }

    for (const paper of papers) {
      const text = `${paper.subject} ${paper.paper_name} ${paper.level} ${paper.year}`.toLowerCase();
      if (text.includes(q)) {
        matches.push({
          key: `paper-${paper.id}`,
          type: "Paper",
          title: `${paper.subject} — ${paper.paper_name}`,
          sub: [paper.level, paper.year].filter(Boolean).join(" • "),
          onSelect: () =>
            navigate(
              `/smartsubjects?subject=${encodeURIComponent(paper.subject || "")}&search=${encodeURIComponent(paper.paper_name || "")}`,
            ),
        });
      }
      if (matches.length >= 10) break;
    }

    for (const video of videos) {
      const text = `${video.title} ${video.subject} ${video.description}`.toLowerCase();
      if (text.includes(q)) {
        matches.push({
          key: `video-${video.id}`,
          type: "Video",
          title: video.title,
          sub: video.subject || "Science Lab",
          onSelect: () =>
            navigate(`/sciencelab?subject=${encodeURIComponent(video.subject || "")}`),
        });
      }
      if (matches.length >= 14) break;
    }

    for (const item of studyProgress) {
      const text = `${item.subject} ${item.topic}`.toLowerCase();
      if (text.includes(q)) {
        matches.push({
          key: `topic-${item.subject}-${item.topic}`,
          type: "Practice",
          title: `${item.subject}: ${item.topic}`,
          sub: `Best ${item.bestScore}/${item.bestScoreTotal}`,
          onSelect: () =>
            navigate("/exam", {
              state: { subject: item.subject, topic: item.topic },
            }),
        });
      }
      if (matches.length >= 18) break;
    }

    return matches.slice(0, 8);
  }, [searchQuery, subjectCards, papers, videos, studyProgress, navigate]);

  const handleOpenNotification = async (item) => {
    setNotifOpen(false);
    if (item.serverId && !item.isRead) {
      setServerNotifications((list) =>
        list.map((entry) => (entry.id === item.serverId ? { ...entry, isRead: true } : entry)),
      );
      markNotificationRead(item.serverId).catch(() => {});
    }
    if (item.onClick) item.onClick();
  };

  const handleMarkAllRead = async () => {
    const previous = serverNotifications;
    setServerNotifications((list) => list.map((entry) => ({ ...entry, isRead: true })));
    try {
      await markAllNotificationsRead();
    } catch (error) {
      setServerNotifications(previous);
      setBanner({
        type: "error",
        message: getFriendlyErrorMessage(error, "We couldn't mark notifications as read right now."),
      });
    }
  };

  const notifications = useMemo(() => {
    const items = [];
    if (pendingCounts.papers > 0) {
      items.push({
        id: "pending-papers",
        icon: "⏳",
        title: `${pendingCounts.papers} pending paper approval${pendingCounts.papers === 1 ? "" : "s"}`,
        sub: "Review submissions in Smart Subjects",
        isRead: false,
        onClick: () => navigate("/smartsubjects"),
      });
    }
    if (pendingCounts.videos > 0) {
      items.push({
        id: "pending-videos",
        icon: "🎬",
        title: `${pendingCounts.videos} pending video approval${pendingCounts.videos === 1 ? "" : "s"}`,
        sub: "Review submissions in Science Lab",
        isRead: false,
        onClick: () => navigate("/sciencelab"),
      });
    }
    if (notifPrefs.scheduleReminders && openScheduleTasks.length > 0) {
      openScheduleTasks.slice(0, 2).forEach((task) => {
        items.push({
          id: `sched-${task.id}`,
          icon: "📅",
          title: `Study: ${task.subject}`,
          sub: `${task.day} at ${task.time}`,
          isRead: true,
          onClick: () => navigate("/schedule"),
        });
      });
    }
    for (const n of serverNotifications.slice(0, 8)) {
      items.push({
        id: `srv-${n.id}`,
        serverId: n.id,
        icon: n.category === "paper" ? "📄" : n.category === "video" ? "🔬" : "📢",
        title: n.title,
        sub: n.message,
        isRead: Boolean(n.isRead),
        onClick: () => navigate(n.link || "/settings?tab=notifications"),
      });
    }
    return items;
  }, [pendingCounts, notifPrefs.scheduleReminders, openScheduleTasks, serverNotifications, navigate]);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const quickStartItems = useMemo(() => {
    const dynamicItems = [];

    if (studyProgress.length > 0) {
      const recent = studyProgress[0];
      dynamicItems.push({
        key: `recent-${recent.subject}-${recent.topic}`,
        icon: "🎯",
        label: `Retake ${recent.subject}`,
        sub: `${recent.topic} • Best ${recent.bestScore}/${recent.bestScoreTotal}`,
        onClick: () =>
          navigate("/exam", {
            state: { subject: recent.subject, topic: recent.topic },
          }),
      });
    } else {
      dynamicItems.push({
        key: "start-exam",
        icon: "🎓",
        label: "Practice Exam",
        sub: "Generate questions by topic",
        onClick: () => navigate("/exam"),
      });
    }

    if (openScheduleTasks.length > 0) {
      const nextTask = openScheduleTasks[0];
      dynamicItems.push({
        key: `next-task-${nextTask.id}`,
        icon: "📅",
        label: nextTask.subject,
        sub: `${nextTask.day} at ${nextTask.time}`,
        onClick: () => navigate("/schedule"),
      });
    } else {
      dynamicItems.push({
        key: "open-schedule",
        icon: "📅",
        label: "Study Schedule",
        sub: "Plan your weekly sessions",
        onClick: () => navigate("/schedule"),
      });
    }

    dynamicItems.push({
      key: "browse-papers",
      icon: "📚",
      label: "Past Papers",
      sub:
        papers.length > 0
          ? `${papers.length} papers ready to view`
          : "Explore Smart Subjects",
      onClick: () => navigate("/smartsubjects"),
    });

    dynamicItems.push({
      key: "open-lab",
      icon: "🔬",
      label: "Science Lab",
      sub:
        videos.length > 0
          ? `${videos.length} practical videos`
          : "Watch practical demos",
      onClick: () => navigate("/sciencelab"),
    });

    return dynamicItems;
  }, [studyProgress, openScheduleTasks, papers.length, videos.length, navigate]);

  const stats = [
    { label: "Lessons Completed", value: profile.lessons_completed },
    { label: "Topics Studied", value: profile.topics_studied },
  ];

  return (
    <div className="db-layout">
      {/* ── SIDEBAR ── */}
      <Sidebar />

      {/* ── MAIN ── */}
      <main className="db-main">
        {/* TOP BAR */}
        <div className="db-topbar">
          <div className="db-nav-arrows">
            <button type="button" className="arrow-btn" aria-label="Go back" onClick={() => navigate(-1)}>
              ‹
            </button>
            <button type="button" className="arrow-btn" aria-label="Go forward" onClick={() => navigate(1)}>
              ›
            </button>
          </div>

          <div className="db-search-wrap" ref={searchWrapRef}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="db-search"
              placeholder="Search subjects, papers, videos, topics..."
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSearchOpen(false);
                if (e.key === "Enter" && searchResults.length > 0) {
                  searchResults[0].onSelect();
                  setSearchOpen(false);
                }
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="db-search-clear"
                aria-label="Clear search"
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
            {searchOpen && searchQuery.trim() && (
              <div className="db-search-dropdown" role="listbox">
                {searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <button
                      key={result.key}
                      type="button"
                      className="db-search-result"
                      onClick={() => {
                        setSearchOpen(false);
                        result.onSelect();
                      }}
                    >
                      <span className="db-search-badge">{result.type}</span>
                      <span className="db-search-result-text">
                        <strong>{result.title}</strong>
                        {result.sub && <small>{result.sub}</small>}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="db-search-empty">No matches for "{searchQuery}"</div>
                )}
              </div>
            )}
          </div>

          <div className="db-topbar-actions">
            <div className="db-notif-wrap" ref={notifWrapRef}>
              <button
                type="button"
                className="icon-btn db-notif-btn"
                aria-label="Notifications"
                aria-expanded={notifOpen}
                onClick={() => setNotifOpen((open) => !open)}
              >
                🔔
                {unreadNotificationCount > 0 && (
                  <span className="db-notif-badge">{unreadNotificationCount}</span>
                )}
              </button>
              {notifOpen && (
                <div className="db-notif-popover">
                  <div className="db-notif-header">
                    <strong>Notifications</strong>
                    <div className="db-notif-actions">
                      {serverNotifications.some((n) => !n.isRead) && (
                        <button
                          type="button"
                          className="db-notif-link"
                          onClick={handleMarkAllRead}
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        type="button"
                        className="db-notif-link"
                        onClick={() => {
                          setNotifOpen(false);
                          navigate("/settings?tab=notifications");
                        }}
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                  {notifications.length > 0 ? (
                    <div className="db-notif-list">
                      {notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          className={`db-notif-item ${n.isRead ? "" : "unread"}`}
                          onClick={() => handleOpenNotification(n)}
                        >
                          <span className="db-notif-icon">{n.icon}</span>
                          <span>
                            <strong>{n.title}</strong>
                            <small>{n.sub}</small>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="db-notif-empty">You are all caught up!</p>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label="Open profile settings"
              onClick={() => navigate("/settings")}
            >
              👤
            </button>
          </div>
        </div>

        <StatusBanner
          type={banner?.type}
          message={banner?.message}
          onDismiss={() => setBanner(null)}
        />

        {installCheckReady && !isInstalled && !installBannerDismissed && (
          <div className="pwa-install-banner">
            <img src="/icons/icon-192.png" alt="S-Learn" className="pwa-install-banner-icon" />
            <div className="pwa-install-banner-text">
              <strong>Get the S-Learn Phone Shortcut</strong>
              <span>
                Add S-Learn to your home screen for one-tap access to past papers, labs, and exams.
              </span>
            </div>
            <div className="pwa-install-banner-actions">
              <button
                type="button"
                className="pwa-install-btn"
                onClick={async () => {
                  const res = await promptInstall();
                  if (res?.outcome === "accepted") {
                    setBanner({
                      type: "success",
                      message: "S-Learn shortcut installed! You can now launch it from your home screen.",
                    });
                  }
                }}
              >
                {canPromptInstall ? "Install App" : "Add to Home Screen"}
              </button>
              <button
                type="button"
                className="pwa-dismiss-btn"
                aria-label="Dismiss install banner"
                onClick={() => {
                  setInstallBannerDismissed(true);
                  try {
                    sessionStorage.setItem("slearn_install_banner_dismissed", "1");
                  } catch {
                    // ignore storage errors
                  }
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* SUBJECT CARDS */}
        <section className="db-section">
          <div className="db-section-header">
            <h2 className="db-section-title">Subject Sets</h2>
            <div className="db-arrows">
              <button
                type="button"
                className="arrow-sm"
                aria-label="Scroll subject sets left"
                onClick={() => scrollCards(-1)}
              >
                ‹
              </button>
              <button
                type="button"
                className="arrow-sm"
                aria-label="Scroll subject sets right"
                onClick={() => scrollCards(1)}
              >
                ›
              </button>
            </div>
          </div>

          <div className="db-subject-cards" ref={cardsRowRef}>
            {subjectCards.map((card) => {
              const isFavorite = favoriteCards.includes(card.id);
              return (
                <Link
                  key={card.id}
                  to={card.action}
                  className="db-subject-card"
                  style={{
                    background: card.gradient,
                    cursor: "pointer",
                    textDecoration: "none",
                    color: "inherit",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <img src={card.img} alt={card.title} className="db-card-img" />
                  <div className="db-card-label">
                    <h3>{card.title}</h3>
                    <p>{card.desc}</p>
                  </div>
                  <button
                    type="button"
                    className={`db-card-heart ${isFavorite ? "active" : ""}`}
                    aria-label={isFavorite ? `Remove ${card.title} from favorites` : `Add ${card.title} to favorites`}
                    aria-pressed={isFavorite}
                    onClick={(e) => toggleFavorite(e, card.id)}
                  >
                    {isFavorite ? "♥" : "♡"}
                  </button>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="db-section">
          <div className="db-section-header">
            <h2 className="db-section-title">Your Progress</h2>
          </div>
          <div className="db-stat-card" style={{ padding: "24px", borderRadius: "16px" }}>
            <StatChart
              studyProgress={studyProgress}
              lessons={profile.lessons_completed}
              onStartExam={() => navigate("/exam")}
            />
          </div>
        </section>
      </main>

      {/* ── RIGHT PANEL ── */}
      <aside className="db-right">
        {/* PROFILE */}
        <div
          className="db-profile-card"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/settings")}
          title="Edit profile in Settings"
        >
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="db-avatar-img" />
          ) : (
            <div className="db-avatar">🧑‍🎓</div>
          )}
          <h3 className="db-profile-name">{profile.username}</h3>
          <p className="db-profile-sub">{profile.role}</p>
          <div className="db-profile-stats">
            {stats.map((s) => (
              <div key={s.label} className="db-profile-stat">
                <span className="db-stat-val">{s.value}</span>
                <span className="db-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* QUICK START */}
        <div className="db-quickstart">
          <h3 className="db-qs-title">Quick Start</h3>
          {quickStartItems.map((item) => (
            <div
              key={item.key}
              className="db-qs-item"
              role="button"
              tabIndex={0}
              onClick={item.onClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  item.onClick();
                }
              }}
            >
              <span className="db-qs-icon">{item.icon}</span>
              <div>
                <p className="db-qs-label">{item.label}</p>
                <p className="db-qs-sub">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

export default Dashboard;

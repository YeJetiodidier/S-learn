import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getProfile } from "../firebase/dataService";
import { getCurrentUser } from "../firebase/authService";
import "../dashboard.css";

const subjectCards = [
  {
    title: "Science Lab",
    desc: "Chemistry & Physics Practicals",
    img: "/science_card.png",
    gradient: "linear-gradient(135deg, #f8b8d8, #f8d8a8)",
    action: "/sciencelab"
  },
  {
    title: "Smart Subjects",
    desc: "Papers & Specialities",
    img: "/books_card.png",
    gradient: "linear-gradient(135deg, #4f46e5, #ec4899)",
    action: "/smartsubjects"
  },
  {
    title: "Schedule",
    desc: "Manage your timetable",
    img: "/schedule_card.png",
    gradient: "linear-gradient(135deg, #a8f0e8, #c8c8f8)",
    action: "/schedule"
  },
  {
    title: "Exam",
    desc: "Practice exam questions",
    img: "/exam_card.png",
    gradient: "linear-gradient(135deg, #ff7e5f, #feb47b)",
    action: "/exam"
  },
];

const quickStartItems = [
  { icon: "🎓", label: "Exam", sub: "Practice papers", action: "/subjects" },
  { icon: "✍️", label: "Writing", sub: "Essay techniques" },
  { icon: "📖", label: "Reading", sub: "Comprehension" },
];

// dynamic stats hook handles this now

function StatChart({ lessons }) {
  // Invert Y axis: 100 is bottom, 0 is top
  const safeLessons = Math.min(Math.max(lessons || 0, 5), 100);
  const endY = 100 - safeLessons;

  // Calculate dynamic paths leading up to their current lessons
  const points = [
    [0, 80], [40, 75], [80, 60], [120, 50], [160, 45], [200, Math.min(endY + 10, 80)], [240, endY],
  ];
  const points2 = [
    [0, 95], [40, 80], [80, 85], [120, 75], [160, 80], [200, 60], [240, Math.min(endY + 20, 90)],
  ];
  const toPath = (pts) => pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");

  return (
    <svg viewBox="0 0 250 100" className="stat-chart" preserveAspectRatio="none">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={`${toPath(points)} L240,100 L0,100 Z`} fill="url(#g1)" className="fade-in-dot" style={{ animationDelay: '0.5s' }} />
      <path
        d={`${toPath(points)}`}
        fill="none"
        stroke="#818cf8"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="anim-path"
      />

      <path d={`${toPath(points2)} L240,100 L0,100 Z`} fill="url(#g2)" className="fade-in-dot" style={{ animationDelay: '0.8s' }} />
      <path
        d={`${toPath(points2)}`}
        fill="none"
        stroke="#38bdf8"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="anim-path-delay"
      />

      {/* Tooltip dot */}
      <circle cx="240" cy={endY} r="5" fill="#818cf8" className="fade-in-dot" />
      <rect x="180" y={Math.max(endY - 25, 0)} width="65" height="20" rx="6" fill="#1e293b" className="fade-in-dot" />
      <text x="212" y={Math.max(endY - 14, 11)} textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" className="fade-in-dot">
        {lessons || 0} Lessons
      </text>
    </svg>
  );
}

function Dashboard() {
  const navigate = useNavigate();

  const currentUser = getCurrentUser();
  const fallbackName = currentUser?.displayName || currentUser?.email?.split("@")[0] || "Student";

  const [profile, setProfile] = useState({
    username: fallbackName,
    role: "Student",
    avatar_url: currentUser?.photoURL || "",
    lessons_completed: 0,
    topics_studied: 0
  });

  useEffect(() => {
    const uid = getCurrentUser()?.uid;
    if (!uid) return;
    getProfile(uid)
      .then(data => {
        if (data) setProfile((current) => ({ ...current, ...data }));
      })
      .catch(err => console.error("Could not load profile stats:", err));
  }, []);

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
            <button className="arrow-btn" onClick={() => navigate(-1)}>‹</button>
            <button className="arrow-btn" onClick={() => navigate(1)}>›</button>
          </div>
          <div className="db-search-wrap">
            <span className="search-icon">🔍</span>
            <input type="text" className="db-search" placeholder="Search subjects, topics..." />
          </div>
          <div className="db-topbar-actions">
            <button className="icon-btn">🔔</button>
            <button className="icon-btn">👤</button>
          </div>
        </div>

        {/* SUBJECT CARDS */}
        <section className="db-section">
          <div className="db-section-header">
            <h2 className="db-section-title">Subject Sets</h2>
            <div className="db-arrows">
              <button className="arrow-sm">‹</button>
              <button className="arrow-sm">›</button>
            </div>
          </div>

          <div className="db-subject-cards">
            {subjectCards.map((card) => {
              const cardContent = (
                <>
                  <img src={card.img} alt={card.title} className="db-card-img" />
                  <div className="db-card-label">
                    <h3>{card.title}</h3>
                    <p>{card.desc}</p>
                  </div>
                  <button className="db-card-heart" onClick={(e) => e.preventDefault()}>♡</button>
                </>
              );

              return card.action ? (
                <Link
                  key={card.title}
                  to={card.action}
                  className="db-subject-card"
                  style={{ background: card.gradient, cursor: "pointer", textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}
                >
                  {cardContent}
                </Link>
              ) : (
                <div
                  key={card.title}
                  className="db-subject-card"
                  style={{ background: card.gradient }}
                >
                  {cardContent}
                </div>
              );
            })}
          </div>
        </section>
        <section className="db-section">
          <div className="db-section-header">
            <h2 className="db-section-title">Your Progress</h2>
          </div>
          <div className="db-stat-card" style={{ padding: '24px', background: 'white', borderRadius: '16px' }}>
            <StatChart lessons={profile.lessons_completed} />
          </div>
        </section>
      </main>

      {/* ── RIGHT PANEL ── */}
      <aside className="db-right">

        {/* PROFILE */}
        <div className="db-profile-card">
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
              key={item.label}
              className="db-qs-item"
              style={{ cursor: item.action ? "pointer" : "default" }}
              onClick={() => item.action && navigate(item.action)}
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
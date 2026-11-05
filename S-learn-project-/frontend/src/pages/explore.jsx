import "../dashboard.css";
import "../App.css";

const exploreItems = [
  { icon: "🧪", title: "Science", desc: "Physics, Chemistry, Biology", color: "linear-gradient(135deg, #f8b8d8, #f8d8a8)" },
  { icon: "📐", title: "Mathematics", desc: "Algebra, Calculus, Statistics", color: "linear-gradient(135deg, #a8c8f8, #c8b8f8)" },
  { icon: "🌍", title: "Geography", desc: "Maps, Climate, Ecosystems", color: "linear-gradient(135deg, #a8f0e8, #c8e8a8)" },
  { icon: "📖", title: "Literature", desc: "Poetry, Prose, Drama", color: "linear-gradient(135deg, #f8e8a8, #f8c8a8)" },
  { icon: "🏛️", title: "History", desc: "Ancient, Medieval, Modern", color: "linear-gradient(135deg, #e8c8f8, #f8a8c8)" },
  { icon: "💻", title: "Computer Science", desc: "Algorithms, Programming, Networks", color: "linear-gradient(135deg, #a8d8f8, #a8f8e8)" },
];

import Sidebar from "../components/Sidebar";

function Explore() {
  return (
    <div className="db-layout">

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN */}
      <main className="db-main">
        <div className="db-topbar">
          <div className="db-search-wrap">
            <span className="search-icon">🔍</span>
            <input type="text" className="db-search" placeholder="Search topics..." />
          </div>
          <div className="db-topbar-actions">
            <button className="icon-btn">🔔</button>
            <button className="icon-btn">👤</button>
          </div>
        </div>

        <div className="db-section">
          <div className="db-section-header">
            <h2 className="db-section-title">Explore Subjects</h2>
          </div>
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "8px" }}>
            Pick a subject below to start learning
          </p>

          <div className="db-subject-cards" style={{ flexWrap: "wrap" }}>
            {exploreItems.map((item) => (
              <div
                key={item.title}
                className="db-subject-card"
                style={{ background: item.color, minWidth: "180px", flex: "1 1 180px" }}
              >
                <span style={{ fontSize: "2.5rem" }}>{item.icon}</span>
                <div className="db-card-label">
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* RIGHT PANEL */}
      <aside className="db-right">
        <div className="db-quickstart">
          <h3 className="db-qs-title">Quick Access</h3>
          {exploreItems.slice(0, 3).map((item) => (
            <div key={item.title} className="db-qs-item">
              <span className="db-qs-icon">{item.icon}</span>
              <div>
                <p className="db-qs-label">{item.title}</p>
                <p className="db-qs-sub">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

    </div>
  );
}

export default Explore;

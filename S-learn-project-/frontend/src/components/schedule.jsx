import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import StatusBanner from "./StatusBanner";
import { getFriendlyErrorMessage } from "../utils/friendlyError";
import {
  getSchedule,
  addScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
} from "../firebase/dataService";
import { getCurrentUser } from "../firebase/authService";
import "../dashboard.css";
import "../App.css";

const readLegacyLocalSchedule = () => {
  try {
    const saved = localStorage.getItem("schedule");
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed)
      ? parsed.filter((item) => item && item.subject && item.day && item.time)
      : [];
  } catch {
    localStorage.removeItem("schedule");
    return [];
  }
};

function Schedule() {
  const navigate = useNavigate();

  const [subject, setSubject] = useState("");
  const [time, setTime] = useState("");
  const [day, setDay] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const uid = getCurrentUser()?.uid;
    if (!uid) {
      setIsLoading(false);
      return;
    }

    let active = true;
    const loadSchedule = async () => {
      setIsLoading(true);
      setError("");
      try {
        let items = await getSchedule(uid);
        items = Array.isArray(items) ? items : [];

        // One-time migration from legacy browser-only localStorage into Neon Postgres
        const legacyItems = readLegacyLocalSchedule();
        if (legacyItems.length > 0 && items.length === 0) {
          const migrated = [];
          for (const item of legacyItems) {
            const created = await addScheduleItem({
              subject: String(item.subject),
              day: String(item.day),
              time: String(item.time),
              done: Boolean(item.done),
            });
            migrated.push(created);
          }
          localStorage.removeItem("schedule");
          items = migrated;
        }

        if (active) setSchedule(items);
      } catch (err) {
        console.error("Could not load schedule:", err);
        if (active) {
          setError(
            getFriendlyErrorMessage(
              err,
              "We couldn't load your study schedule right now. Please try again.",
            ),
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadSchedule();
    return () => {
      active = false;
    };
  }, []);

  const addTask = async () => {
    const trimmedSubject = subject.trim();
    const trimmedDay = day.trim();
    const trimmedTime = time.trim();
    if (!trimmedSubject || !trimmedDay || !trimmedTime || isSaving) return;

    setIsSaving(true);
    setError("");
    try {
      const created = await addScheduleItem({
        subject: trimmedSubject,
        day: trimmedDay,
        time: trimmedTime,
        done: false,
      });
      setSchedule((prev) => [...prev, created]);
      setSubject("");
      setTime("");
      setDay("");
    } catch (err) {
      console.error("Could not add schedule item:", err);
      setError(
        getFriendlyErrorMessage(err, "We couldn't save your study session right now. Please try again."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTask = async (id) => {
    setError("");
    const previous = schedule;
    setSchedule((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteScheduleItem(id);
    } catch (err) {
      console.error("Could not delete schedule item:", err);
      setSchedule(previous);
      setError(
        getFriendlyErrorMessage(err, "We couldn't delete that task right now. Please try again."),
      );
    }
  };

  const toggleDone = async (item) => {
    setError("");
    const nextDone = !item.done;
    setSchedule((prev) =>
      prev.map((entry) => (entry.id === item.id ? { ...entry, done: nextDone } : entry)),
    );
    try {
      await updateScheduleItem(item.id, { done: nextDone });
    } catch (err) {
      console.error("Could not update schedule item:", err);
      setSchedule((prev) =>
        prev.map((entry) => (entry.id === item.id ? { ...entry, done: item.done } : entry)),
      );
      setError(
        getFriendlyErrorMessage(err, "We couldn't update that task right now. Please try again."),
      );
    }
  };

  const pendingCount = useMemo(
    () => schedule.filter((item) => !item.done).length,
    [schedule],
  );

  const filteredSchedule = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return schedule.filter((item) => {
      if (showPendingOnly && item.done) return false;
      if (!q) return true;
      return `${item.subject} ${item.day} ${item.time}`.toLowerCase().includes(q);
    });
  }, [schedule, searchQuery, showPendingOnly]);

  return (
    <div className="db-layout">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN */}
      <main className="db-main">
        <div className="db-topbar">
          <div className="db-nav-arrows">
            <button type="button" className="arrow-btn" aria-label="Go back" onClick={() => navigate(-1)}>
              ‹
            </button>
            <button type="button" className="arrow-btn" aria-label="Go forward" onClick={() => navigate(1)}>
              ›
            </button>
          </div>
          <div className="db-search-wrap">
            <span className="search-icon">📅</span>
            <input
              type="text"
              className="db-search"
              placeholder="Search schedule by subject, day, or time..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          </div>
          <div className="db-topbar-actions">
            <button
              type="button"
              className="icon-btn db-notif-btn"
              title={showPendingOnly ? "Showing upcoming tasks (click to show all)" : "Filter upcoming tasks"}
              aria-pressed={showPendingOnly}
              onClick={() => setShowPendingOnly((prev) => !prev)}
            >
              🔔
              {pendingCount > 0 && <span className="db-notif-badge">{pendingCount}</span>}
            </button>
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

        <div className="db-section-header">
          <h2 className="page-title" style={{ margin: 0 }}>
            My Study Schedule {showPendingOnly ? `(Upcoming: ${pendingCount})` : `(${schedule.length})`}
          </h2>
          {showPendingOnly && (
            <button
              type="button"
              className="db-notif-link"
              onClick={() => setShowPendingOnly(false)}
            >
              Show all tasks
            </button>
          )}
        </div>

        <StatusBanner type="error" message={error} onDismiss={() => setError("")} />

        {/* INPUT */}
        <form
          className="schedule-input"
          onSubmit={(e) => {
            e.preventDefault();
            addTask();
          }}
        >
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Day (e.g. Monday)"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            required
          />

          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Adding..." : "Add"}
          </button>
        </form>

        {/* LIST */}
        {isLoading ? (
          <p style={{ color: "#64748b" }}>Loading your schedule...</p>
        ) : filteredSchedule.length === 0 ? (
          <p style={{ color: "#64748b" }}>
            {schedule.length === 0
              ? "No study tasks scheduled yet. Add your first session above."
              : "No schedule tasks match your current filter."}
          </p>
        ) : (
          <div className="schedule-list">
            {filteredSchedule.map((item) => (
              <div key={item.id} className={`schedule-card ${item.done ? "done" : ""}`}>
                <h3>{item.subject}</h3>
                <p>{item.day}</p>
                <p>{item.time}</p>

                <div className="actions">
                  <button
                    type="button"
                    aria-label={item.done ? "Mark as incomplete" : "Mark as complete"}
                    onClick={() => toggleDone(item)}
                  >
                    ✔
                  </button>
                  <button
                    type="button"
                    aria-label="Delete task"
                    onClick={() => deleteTask(item.id)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Schedule;

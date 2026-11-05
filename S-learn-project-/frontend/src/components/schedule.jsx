import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../dashboard.css";
import "../App.css";

function Schedule() {
  const navigate = useNavigate();

  const getStoredSchedule = () => {
    try {
      const saved = localStorage.getItem("schedule");
      if (!saved) return [];

      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      localStorage.removeItem("schedule");
      return [];
    }
  };

  const [subject, setSubject] = useState("");
  const [time, setTime] = useState("");
  const [day, setDay] = useState("");
  const [schedule, setSchedule] = useState(getStoredSchedule);

  // Save data
  useEffect(() => {
    try {
      localStorage.setItem("schedule", JSON.stringify(schedule));
    } catch (error) {
      console.error("Could not save schedule:", error);
    }
  }, [schedule]);

  const addTask = () => {
    if (subject && time && day) {
      setSchedule([
        ...schedule,
        { subject, time, day, done: false }
      ]);
      setSubject("");
      setTime("");
      setDay("");
    }
  };

  const deleteTask = (index) => {
    const newList = schedule.filter((_, i) => i !== index);
    setSchedule(newList);
  };

  const toggleDone = (index) => {
    const updated = [...schedule];
    updated[index].done = !updated[index].done;
    setSchedule(updated);
  };

  return (
    <div className="db-layout">

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN */}
      <main className="db-main">
        <div className="db-topbar">
          <div className="db-nav-arrows">
            <button className="arrow-btn" onClick={() => navigate(-1)}>‹</button>
            <button className="arrow-btn" onClick={() => navigate(1)}>›</button>
          </div>
          <div className="db-search-wrap">
            <span className="search-icon">📅</span>
            <input type="text" className="db-search" placeholder="Search schedule..." />
          </div>
          <div className="db-topbar-actions">
            <button className="icon-btn">🔔</button>
            <button className="icon-btn">👤</button>
          </div>
        </div>

        <h2 className="page-title">My Study Schedule</h2>

        {/* INPUT */}
        <div className="schedule-input">

          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <input
            type="text"
            placeholder="Day (e.g Monday)"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />

          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />

          <button onClick={addTask}>Add</button>

        </div>

        {/* LIST */}
        <div className="schedule-list">

          {schedule.map((item, index) => (
            <div key={index} className={`schedule-card ${item.done ? "done" : ""}`}>

              <h3>{item.subject}</h3>
              <p>{item.day}</p>
              <p>{item.time}</p>

              <div className="actions">
                <button onClick={() => toggleDone(index)}>✔</button>
                <button onClick={() => deleteTask(index)}>🗑</button>
              </div>

            </div>
          ))}

        </div>

      </main>
    </div>
  );
}

export default Schedule;
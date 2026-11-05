import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import {
  getVideos,
  addVideo,
  getPendingVideos,
  approveVideo,
  deleteVideo,
  getProfile,
} from "../firebase/dataService";
import { uploadVideoFile } from "../firebase/storageService";
import { getCurrentUser } from "../firebase/authService";
import "../dashboard.css";
import "../App.css";

function ScienceLab() {
  const [videos, setVideos] = useState([]);
  const [pendingVideos, setPendingVideos] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all" or "pending"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVideo, setNewVideo] = useState({
    title: "",
    subject: "",
    description: "",
    video_url: "",
  });
  const [videoFile, setVideoFile] = useState(null);
  const [filter, setFilter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVideos = async () => {
    try {
      const data = await getVideos();
      setVideos(Array.isArray(data) ? data : []);

      const uid = getCurrentUser()?.uid;
      if (uid) {
        const profile = await getProfile(uid);
        const userRole = profile?.role || "Student";
        const adminCheck =
          userRole.toLowerCase() === "admin" ||
          userRole.toLowerCase() === "teacher";
        setIsAdmin(adminCheck);

        if (adminCheck) {
          const pendingData = await getPendingVideos();
          setPendingVideos(Array.isArray(pendingData) ? pendingData : []);
        }
      }
    } catch (err) {
      console.error("Could not load videos:", err);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleAddVideo = async () => {
    if (!newVideo.title || (!newVideo.video_url && !videoFile)) {
      return alert("Please fill in at least a Title and a Video URL or file!");
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let url = newVideo.video_url;
      if (videoFile) {
        url = await uploadVideoFile(videoFile);
      }
      await addVideo({
        title: newVideo.title,
        subject: newVideo.subject,
        description: newVideo.description,
        video_url: url,
        status: isAdmin ? "approved" : "pending",
      });
      alert(
        isAdmin
          ? "Video added successfully!"
          : "Video submitted! It will appear once approved by an Admin.",
      );
      await fetchVideos();
      setIsModalOpen(false);
      setNewVideo({ title: "", subject: "", description: "", video_url: "" });
      setVideoFile(null);
    } catch (err) {
      alert("Upload failed: " + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveVideo = async (id) => {
    try {
      const result = await approveVideo(id, getCurrentUser()?.uid);
      alert(result?.alreadyApproved ? "This video was already approved." : "Video approved!");
      await fetchVideos();
    } catch (err) {
      alert("Approval failed: " + err.message);
    }
  };

  const handleRejectVideo = async (id) => {
    if (!confirm("Are you sure you want to reject/delete this video?")) return;
    try {
      await deleteVideo(id);
      alert("Video deleted.");
      await fetchVideos();
    } catch (err) {
      alert("Failed to delete video: " + err.message);
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    // Support YouTube links
    const ytMatch = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?]+)/,
    );
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    return url; // Return as-is for direct video file URLs
  };

  const filtered = filter
    ? videos.filter((v) =>
        v.subject?.toLowerCase().includes(filter.toLowerCase()),
      )
    : videos;

  return (
    <div className="db-layout">
      <Sidebar />


      <main className="db-main">
        {/* HERO */}
        <section className="sl-hero">
          <div className="sl-hero-content">
            <h1 className="sl-hero-title">🔬 Science Lab</h1>
            <p className="sl-hero-sub">
              Watch practical demonstrations and upload new video papers for
              Chemistry & Physics
            </p>
          </div>
          <button
            className="ss-action-btn sl-upload-btn"
            onClick={() => setIsModalOpen(true)}
          >
            + Upload Video
          </button>
        </section>

        {/* ADMIN TAB OPTIONS */}
        {isAdmin && (
          <div style={{ display: "flex", gap: "10px", margin: "10px 0 20px" }}>
            <button
              onClick={() => setActiveTab("all")}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "none",
                background: activeTab === "all" ? "#4f46e5" : "#e2e8f0",
                color: activeTab === "all" ? "white" : "#475569",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              All Videos ({videos.length})
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "none",
                background: activeTab === "pending" ? "#f59e0b" : "#e2e8f0",
                color: activeTab === "pending" ? "white" : "#475569",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              Pending Approvals ({pendingVideos.length})
            </button>
          </div>
        )}

        {activeTab === "all" ? (
          <>
            {/* FILTER BAR */}
            <div className="sl-filter-bar">
              <span className="sl-filter-label">Filter by subject</span>
              <div className="sl-filter-chips">
                {["", "Chemistry", "Physics", "Biology"].map((s) => (
                  <button
                    key={s}
                    className={`sl-chip ${filter === s ? "active" : ""}`}
                    onClick={() => setFilter(s)}
                  >
                    {s || "All"}
                  </button>
                ))}
              </div>
            </div>

            {/* VIDEO GRID */}
            {filtered.length === 0 ? (
              <div className="sl-empty">
                <span className="sl-empty-icon">🎬</span>
                <h3>No videos yet!</h3>
                <p>
                  Click the upload button to add your first practical video.
                </p>
              </div>
            ) : (
              <div className="sl-video-grid">
                {filtered.map((v) => (
                  <div key={v.id} className="sl-video-card">
                    <div className="sl-video-player">
                      {getEmbedUrl(v.video_url) ? (
                        v.video_url.includes("youtube") ||
                        v.video_url.includes("youtu.be") ? (
                          <iframe
                            src={getEmbedUrl(v.video_url)}
                            title={v.title}
                            allowFullScreen
                            frameBorder="0"
                            className="sl-iframe"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        ) : (
                          <video
                            src={v.video_url}
                            controls
                            playsInline
                            preload="metadata"
                            className="sl-video-el"
                          />
                        )
                      ) : (
                        <div className="sl-video-placeholder">📹</div>
                      )}
                    </div>
                    <div className="sl-video-info">
                      {v.subject && <span className="sl-tag">{v.subject}</span>}
                      <h3 className="sl-video-title">{v.title}</h3>
                      {v.description && (
                        <p className="sl-video-desc">{v.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* PENDING APPROVALS VIDEO LIST */
          <div className="db-section">
            <h2
              className="db-section-title"
              style={{ color: "#f59e0b", marginBottom: "20px" }}
            >
              Pending Approvals ({pendingVideos.length})
            </h2>
            {pendingVideos.length === 0 ? (
              <div className="sl-empty">
                <span className="sl-empty-icon">⏳</span>
                <h3>No pending videos!</h3>
                <p>
                  User video submissions requiring approval will appear here.
                </p>
              </div>
            ) : (
              <div className="sl-video-grid">
                {pendingVideos.map((v) => (
                  <div key={v.id} className="sl-video-card">
                    <div className="sl-video-player">
                      {getEmbedUrl(v.video_url) ? (
                        v.video_url.includes("youtube") ||
                        v.video_url.includes("youtu.be") ? (
                          <iframe
                            src={getEmbedUrl(v.video_url)}
                            title={v.title}
                            allowFullScreen
                            frameBorder="0"
                            className="sl-iframe"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        ) : (
                          <video
                            src={v.video_url}
                            controls
                            playsInline
                            preload="metadata"
                            className="sl-video-el"
                          />
                        )
                      ) : (
                        <div className="sl-video-placeholder">📹</div>
                      )}
                    </div>
                    <div className="sl-video-info">
                      {v.subject && (
                        <span
                          className="sl-tag"
                          style={{ background: "#fef3c7", color: "#d97706" }}
                        >
                          {v.subject}
                        </span>
                      )}
                      <h3 className="sl-video-title">{v.title}</h3>
                      {v.description && (
                        <p
                          className="sl-video-desc"
                          style={{ marginBottom: "16px" }}
                        >
                          {v.description}
                        </p>
                      )}
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginTop: "12px",
                        }}
                      >
                        <button
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            background:
                              "linear-gradient(135deg, #10b981, #059669)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                          }}
                          onClick={() => handleApproveVideo(v.id)}
                        >
                          Approve ✅
                        </button>
                        <button
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            background:
                              "linear-gradient(135deg, #ef4444, #dc2626)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                          }}
                          onClick={() => handleRejectVideo(v.id)}
                        >
                          Reject ❌
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL */}
      {isModalOpen && (
        <div className="ss-modal-overlay">
          <div className="ss-modal">
            <h2>Upload Practical Video</h2>
            <p style={{color: "#334155"}}>Add a new lab video — YouTube links and direct video URLs are both supported.</p>
            <div className="ss-modal-grid">
              <input type="text" placeholder="Video Title *" value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} />
              <input type="text" placeholder="Subject (e.g. Chemistry)" value={newVideo.subject} onChange={e => setNewVideo({...newVideo, subject: e.target.value})} />
              <input type="text" placeholder="Video URL or YouTube link *" value={newVideo.video_url} onChange={e => setNewVideo({...newVideo, video_url: e.target.value})} style={{gridColumn: "1/-1"}} />
              <input type="file" accept="video/*" style={{gridColumn: "1/-1", padding: "10px" }} onChange={e => setVideoFile(e.target.files[0] || null)} />
              <textarea placeholder="Brief description (optional)" value={newVideo.description} onChange={e => setNewVideo({...newVideo, description: e.target.value})} style={{gridColumn: "1/-1", padding: "14px 18px", borderRadius: "12px", border: "2px solid #e2e8f0", background: "#f8fafc", color: "#1e293b", fontSize: "1rem", resize: "vertical", minHeight: "80px", boxSizing: "border-box"}} />

            </div>
            <div className="ss-modal-actions">
              <button className="ss-cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="ss-action-btn" onClick={handleAddVideo} disabled={isSubmitting}>
                {isSubmitting ? "Uploading..." : "Upload Video"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScienceLab;

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatusBanner from "../components/StatusBanner";
import { getFriendlyErrorMessage } from "../utils/friendlyError";
import {
  getPapers,
  addPaper,
  getPendingPapers,
  approvePaper,
  deletePaper,
  getProfile,
} from "../firebase/dataService";
import { uploadPaperFile } from "../firebase/storageService";
import { getCurrentUser } from "../firebase/authService";
import "../dashboard.css";
import "../App.css";

function SmartSubjects() {
  const [searchParams] = useSearchParams();
  const [level, setLevel] = useState("");
  const [subject, setSubject] = useState(() => searchParams.get("subject") || "");
  const [paper, setPaper] = useState("");
  const [year, setYear] = useState("");
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") || "");

  const [allPapers, setAllPapers] = useState([]);
  const [pendingPapers, setPendingPapers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all" or "pending"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPaper, setNewPaper] = useState({
    level: "",
    specialty: "",
    subject: "",
    paperName: "",
    year: "",
    link: "",
  });
  const [paperFile, setPaperFile] = useState(null);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [paperFiles, setPaperFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [modalError, setModalError] = useState("");

  // Fetch papers from the API.
  const fetchPapers = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await getPapers();
      setAllPapers(Array.isArray(data) ? data : []);

      const uid = getCurrentUser()?.uid;
      if (uid) {
        const profile = await getProfile(uid);
        const userRole = profile?.role || "Student";
        const adminCheck =
          userRole.toLowerCase() === "admin" ||
          userRole.toLowerCase() === "teacher";
        setIsAdmin(adminCheck);

        if (adminCheck) {
          const pendingData = await getPendingPapers();
          setPendingPapers(Array.isArray(pendingData) ? pendingData : []);
        }
      }
    } catch (err) {
      console.error("Could not load papers:", err);
      setLoadError(
        getFriendlyErrorMessage(err, "We couldn't load past papers right now. Please try again."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const handleAddPaper = async () => {
    setModalError("");
    if (!newPaper.level.trim() || !newPaper.subject.trim() || !newPaper.year.trim()) {
      setModalError("Please fill in the Academic Level, Subject, and Year.");
      return;
    }
    if (!isBulkMode && !newPaper.paperName.trim()) {
      setModalError("Please enter a name for the paper.");
      return;
    }
    if (isBulkMode && paperFiles.length === 0) {
      setModalError("Please select at least one PDF file to upload.");
      return;
    }
    if (!isBulkMode && !paperFile && !newPaper.link.trim()) {
      setModalError("Please attach a PDF file or provide a link to the paper.");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (isAdmin && isBulkMode) {
        let count = 0;
        for (const [index, file] of paperFiles.entries()) {
          const cleanName = file.name
            .replace(/\.[^/.]+$/, "")
            .replace(/_/g, " ")
            .replace(/-/g, " ");

          setUploadProgress({
            currentFile: index + 1,
            totalFiles: paperFiles.length,
            fileName: file.name,
            percentage: Math.round((index / paperFiles.length) * 100),
            stage: "uploading",
          });
          const link = await uploadPaperFile(file, newPaper.year, (percentage) => {
            setUploadProgress({
              currentFile: index + 1,
              totalFiles: paperFiles.length,
              fileName: file.name,
              percentage: Math.round(
                ((index + percentage / 100) / paperFiles.length) * 100,
              ),
              stage: "uploading",
            });
          });
          setUploadProgress((current) => ({
            ...current,
            percentage: Math.round(((index + 1) / paperFiles.length) * 100),
            stage: "saving",
          }));
          await addPaper({
            level: newPaper.level.trim(),
            specialty: newPaper.specialty.trim() || "",
            subject: newPaper.subject.trim(),
            paper_name: cleanName,
            year: newPaper.year.trim(),
            link: link || "",
            status: "approved",
          });
          count++;
        }
        setUploadProgress({
          currentFile: paperFiles.length,
          totalFiles: paperFiles.length,
          percentage: 100,
          stage: "refreshing",
        });
        setFeedback({
          type: "success",
          message: `Successfully uploaded ${count} paper${count === 1 ? "" : "s"}!`,
        });
      } else {
        let link = newPaper.link.trim();
        if (paperFile) {
          setUploadProgress({
            currentFile: 1,
            totalFiles: 1,
            fileName: paperFile.name,
            percentage: 0,
            stage: "uploading",
          });
          link = await uploadPaperFile(paperFile, newPaper.year, (percentage) => {
            setUploadProgress({
              currentFile: 1,
              totalFiles: 1,
              fileName: paperFile.name,
              percentage: Math.round(percentage),
              stage: "uploading",
            });
          });
          setUploadProgress((current) => ({
            ...current,
            percentage: 100,
            stage: "saving",
          }));
        }
        await addPaper({
          level: newPaper.level.trim(),
          specialty: newPaper.specialty.trim() || "",
          subject: newPaper.subject.trim(),
          paper_name: newPaper.paperName.trim(),
          year: newPaper.year.trim(),
          link: link || "",
          status: isAdmin ? "approved" : "pending",
        });
        setFeedback({
          type: "success",
          message: isAdmin
            ? "Paper added to the shared library and subscribers notified!"
            : "Paper submitted for review. It will appear once an Admin approves it.",
        });
        if (paperFile) {
          setUploadProgress((current) => ({
            ...current,
            percentage: 100,
            stage: "refreshing",
          }));
        }
      }

      await fetchPapers();
      setIsModalOpen(false);
      setNewPaper({
        level: "",
        specialty: "",
        subject: "",
        paperName: "",
        year: "",
        link: "",
      });
      setPaperFile(null);
      setPaperFiles([]);
      setIsBulkMode(false);
    } catch (err) {
      setModalError(
        getFriendlyErrorMessage(err, "We couldn't upload the paper right now. Please try again."),
      );
    } finally {
      setUploadProgress(null);
      setIsSubmitting(false);
    }
  };

  const handleApprovePaper = async (id) => {
    setFeedback(null);
    try {
      const result = await approvePaper(id);
      setFeedback({
        type: "success",
        message: result?.alreadyApproved
          ? "This paper was already approved."
          : "Paper approved and published!",
      });
      await fetchPapers();
    } catch (err) {
      setFeedback({
        type: "error",
        message: getFriendlyErrorMessage(err, "We couldn't approve this paper right now. Please try again."),
      });
    }
  };

  const handleRejectPaper = async (id) => {
    if (!confirm("Are you sure you want to reject/delete this paper?")) return;
    setFeedback(null);
    try {
      await deletePaper(id);
      setFeedback({ type: "success", message: "Paper removed." });
      await fetchPapers();
    } catch (err) {
      setFeedback({
        type: "error",
        message: getFriendlyErrorMessage(err, "We couldn't delete this paper right now. Please try again."),
      });
    }
  };


  // Dynamic options
  const dynamicLevels = [...new Set(allPapers.map((p) => p.level))].filter(
    Boolean,
  );
  const dynamicSubjects = [
    ...new Set(
      allPapers
        .filter((p) => !level || p.level === level)
        .map((p) => p.subject),
    ),
  ].filter(Boolean);
  const dynamicPapers = [
    ...new Set(
      allPapers
        .filter((p) => !subject || p.subject === subject)
        .map((p) => p.paper_name),
    ),
  ].filter(Boolean);
  const dynamicYears = [
    ...new Set(
      allPapers
        .filter((p) => !paper || p.paper_name === paper)
        .map((p) => p.year),
    ),
  ].filter(Boolean);

  // Results Filter
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredPapers = allPapers.filter((p) => {
    const matchesKeyword =
      !normalizedQuery ||
      `${p.subject || ""} ${p.paper_name || ""} ${p.level || ""} ${p.year || ""} ${p.specialty || ""}`
        .toLowerCase()
        .includes(normalizedQuery);
    return (
      matchesKeyword &&
      (!level || p.level === level) &&
      (!subject || p.subject === subject) &&
      (!paper || p.paper_name === paper) &&
      (!year || p.year === year)
    );
  });

  const normalizePaperLink = (rawLink) => {
    if (!rawLink) return "";

    const value = rawLink.trim();
    if (!value) return "";

    if (/^https?:\/\//i.test(value)) {
      const normalized = new URL(value);
      if (normalized.hostname === "localhost" || normalized.hostname === "127.0.0.1") {
        normalized.protocol = window.location.protocol;
        normalized.hostname = window.location.hostname;
        normalized.port = window.location.port;
      }
      return normalized.toString();
    }

    if (value.startsWith("/")) return `${window.location.origin}${value}`;
    if (value.startsWith("documents/")) return `${window.location.origin}/${value}`;
    return value;
  };

  const handleDownload = async (e, p) => {
    e.preventDefault();
    const paperLink = normalizePaperLink(p.link);
    if (!paperLink) {
      setFeedback({ type: "error", message: "No downloadable link is available for this paper." });
      return;
    }

    try {
      const response = await fetch(paperLink, { method: "GET" });
      if (!response.ok) throw new Error("Network response was not ok");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      const filename =
        paperLink.split("/").pop() || `${p.subject}_${p.paper_name}.pdf`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error(
        "Programmatic download failed, opening in new tab instead:",
        error,
      );
      window.open(paperLink, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="db-layout">
      <Sidebar />

      <main className="db-main">
        {/* TOPBAR / HEADER */}
        <div className="db-topbar">
          <div className="db-section-header" style={{ width: "100%" }}>
            <div>
              <h1
                className="db-section-title"
                style={{ fontSize: "1.8rem", margin: 0 }}
              >
                Smart Subjects
              </h1>
              <p
                style={{
                  color: "#64748b",
                  fontSize: "0.9rem",
                  marginTop: "4px",
                }}
              >
                Find and access your past papers.
              </p>
            </div>
            <button
              className="upload-btn"
              style={{
                width: "auto",
                padding: "10px 24px",
                fontSize: "0.9rem",
              }}
              onClick={() => {
                setModalError("");
                setIsModalOpen(true);
              }}
            >
              + Add New Paper
            </button>
          </div>
        </div>

        <StatusBanner
          type={feedback?.type}
          message={feedback?.message}
          onDismiss={() => setFeedback(null)}
        />

        {/* ADMIN TAB OPTIONS */}
        {isAdmin && (
          <div style={{ display: "flex", gap: "10px", margin: "10px 0" }}>
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
              All Papers ({allPapers.length})
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
              Pending Approvals ({pendingPapers.length})
            </button>
          </div>
        )}

        {activeTab === "all" ? (
          <>
            {/* SEARCH & FILTERS PANEL */}
            <section className="db-section">
              <div
                className="db-stat-card"
                style={{
                  padding: "24px",
                  borderLeft: "4px solid #4f46e5",
                  background: "linear-gradient(to right, #ffffff, #f8faff)",
                }}
              >
                <div style={{ marginBottom: "16px" }}>
                  <input
                    type="text"
                    className="db-search"
                    style={{
                      padding: "10px 14px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      width: "100%",
                    }}
                    placeholder="Search papers by subject, title, level, or year..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "20px",
                  }}
                >
                  <div
                    className="db-profile-stat"
                    style={{ alignItems: "flex-start" }}
                  >
                    <label
                      className="db-stat-label"
                      style={{ marginBottom: "8px", fontWeight: "700" }}
                    >
                      Academic Level
                    </label>
                    <select
                      className="db-search"
                      style={{
                        padding: "10px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        width: "100%",
                      }}
                      value={level}
                      onChange={(e) => {
                        setLevel(e.target.value);
                        setSubject("");
                        setPaper("");
                        setYear("");
                      }}
                    >
                      <option value="">All Levels</option>
                      {dynamicLevels.sort().map((l, i) => (
                        <option key={i} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    className="db-profile-stat"
                    style={{ alignItems: "flex-start" }}
                  >
                    <label
                      className="db-stat-label"
                      style={{ marginBottom: "8px", fontWeight: "700" }}
                    >
                      Subject
                    </label>
                    <select
                      className="db-search"
                      style={{
                        padding: "10px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        width: "100%",
                      }}
                      value={subject}
                      onChange={(e) => {
                        setSubject(e.target.value);
                        setPaper("");
                        setYear("");
                      }}
                    >
                      <option value="">All Subjects</option>
                      {dynamicSubjects.sort().map((s, i) => (
                        <option key={i} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    className="db-profile-stat"
                    style={{ alignItems: "flex-start" }}
                  >
                    <label
                      className="db-stat-label"
                      style={{ marginBottom: "8px", fontWeight: "700" }}
                    >
                      Paper No.
                    </label>
                    <select
                      className="db-search"
                      style={{
                        padding: "10px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        width: "100%",
                      }}
                      value={paper}
                      onChange={(e) => {
                        setPaper(e.target.value);
                        setYear("");
                      }}
                    >
                      <option value="">All Papers</option>
                      {dynamicPapers.sort().map((p, i) => (
                        <option key={i} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    className="db-profile-stat"
                    style={{ alignItems: "flex-start" }}
                  >
                    <label
                      className="db-stat-label"
                      style={{ marginBottom: "8px", fontWeight: "700" }}
                    >
                      Year
                    </label>
                    <select
                      className="db-search"
                      style={{
                        padding: "10px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        width: "100%",
                      }}
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                    >
                      <option value="">All Years</option>
                      {dynamicYears
                        .sort((a, b) => b - a)
                        .map((y, i) => (
                          <option key={i} value={y}>
                            {y}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* RESULTS GRID */}
            <section className="db-section">
              <div className="db-section-header">
                <h2 className="db-section-title" style={{ color: "#4f46e5" }}>
                  Available papers ({filteredPapers.length})
                </h2>
                {isLoading && (
                  <span className="db-stat-label">Updating from vault...</span>
                )}
              </div>

              {isLoading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px",
                    color: "#94a3b8",
                  }}
                >
                  <p>Searching for documents...</p>
                </div>
              ) : filteredPapers.length > 0 ? (
                <div
                  className="db-subject-list"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {filteredPapers.map((p, i) => (
                    <div
                      key={i}
                      className="db-list-item"
                      style={{
                        background: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "16px",
                        transition: "all 0.3s ease",
                        padding: "20px 24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "20px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow =
                          "0 10px 25px rgba(79, 70, 229, 0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {/* LEFT SECTION: Icon + Info */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "20px",
                          flex: 1,
                        }}
                      >
                        <div
                          className="db-avatar"
                          style={{
                            fontSize: "1.5rem",
                            borderRadius: "16px",
                            background:
                              "linear-gradient(135deg, #4f46e5, #818cf8)",
                            color: "white",
                            width: "56px",
                            height: "56px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          📄
                        </div>

                        <div className="db-item-info">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              marginBottom: "4px",
                            }}
                          >
                            <h3
                              style={{
                                fontSize: "1.1rem",
                                color: "#1e293b",
                                margin: 0,
                              }}
                            >
                              {p.subject}
                            </h3>
                            <span
                              style={{
                                background:
                                  "linear-gradient(90deg, #f1f5f9, #e2e8f0)",
                                padding: "4px 10px",
                                borderRadius: "100px",
                                fontSize: "0.7rem",
                                fontWeight: "700",
                                color: "#475569",
                              }}
                            >
                              {p.level}
                            </span>
                          </div>
                          <p
                            style={{
                              color: "#64748b",
                              fontWeight: "500",
                              margin: 0,
                            }}
                          >
                            {p.paper_name} • {p.year}
                          </p>
                        </div>
                      </div>

                      {/* RIGHT SECTION: ACTION BUTTONS */}
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          flexShrink: 0,
                        }}
                      >
                        <button
                          style={{
                            padding: "10px 20px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            background: "#f1f5f9",
                            color: "#475569",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            transition: "all 0.2s",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            const paperLink = normalizePaperLink(p.link);
                            if (paperLink) {
                              window.open(paperLink, "_blank", "noopener,noreferrer");
                            } else {
                              setFeedback({ type: "error", message: "No link is available for this paper." });
                            }
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#e2e8f0")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "#f1f5f9")
                          }
                        >
                          View
                        </button>
                        <button
                          onClick={(e) => handleDownload(e, p)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "10px 20px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            background:
                              "linear-gradient(135deg, #0ea5e9, #22d3ee)",
                            color: "white",
                            border: "none",
                            borderRadius: "10px",
                            cursor: "pointer",
                            transition: "opacity 0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.opacity = "0.9")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.opacity = "1")
                          }
                        >
                          Download 📥
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="db-stat-card"
                  style={{ textAlign: "center", padding: "60px" }}
                >
                  {loadError ? (
                    <p role="alert" style={{ color: "#b91c1c" }}>
                      {loadError}
                    </p>
                  ) : (
                    <p style={{ color: "#64748b" }}>
                      No papers found matching your filters.
                    </p>
                  )}
                  <button
                    className="arrow-btn"
                    style={{
                      width: "auto",
                      margin: "20px auto 0",
                      padding: "0 20px",
                      borderRadius: "12px",
                      fontSize: "0.85rem",
                    }}
                    onClick={loadError ? fetchPapers : () => {
                      setLevel("");
                      setSubject("");
                      setPaper("");
                      setYear("");
                      setSearchQuery("");
                    }}
                  >
                    {loadError ? "Try Again" : "Reset Filters"}
                  </button>
                </div>
              )}
            </section>
          </>
        ) : (
          /* PENDING APPROVALS LIST */
          <section className="db-section">
            <div className="db-section-header">
              <h2 className="db-section-title" style={{ color: "#f59e0b" }}>
                Pending Approvals ({pendingPapers.length})
              </h2>
            </div>

            {pendingPapers.length > 0 ? (
              <div
                className="db-subject-list"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {pendingPapers.map((p, i) => (
                  <div
                    key={i}
                    className="db-list-item"
                    style={{
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      padding: "20px 24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        flex: 1,
                      }}
                    >
                      <div
                        className="db-avatar"
                        style={{
                          fontSize: "1.5rem",
                          borderRadius: "16px",
                          background:
                            "linear-gradient(135deg, #f59e0b, #ed8936)",
                          color: "white",
                          width: "56px",
                          height: "56px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        ⏳
                      </div>
                      <div className="db-item-info">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "4px",
                          }}
                        >
                          <h3
                            style={{
                              fontSize: "1.1rem",
                              color: "#1e293b",
                              margin: 0,
                            }}
                          >
                            {p.subject}
                          </h3>
                          <span
                            style={{
                              background: "#fef3c7",
                              padding: "4px 10px",
                              borderRadius: "100px",
                              fontSize: "0.7rem",
                              fontWeight: "700",
                              color: "#d97706",
                            }}
                          >
                            {p.level}
                          </span>
                        </div>
                        <p
                          style={{
                            color: "#64748b",
                            fontWeight: "500",
                            margin: 0,
                          }}
                        >
                          {p.paper_name} • {p.year}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        flexShrink: 0,
                      }}
                    >
                      <button
                        style={{
                          padding: "10px 20px",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          background: "#f1f5f9",
                          color: "#475569",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          const paperLink = normalizePaperLink(p.link);
                          if (paperLink) {
                            window.open(paperLink, "_blank", "noopener,noreferrer");
                          } else {
                            setFeedback({ type: "error", message: "No link is available for this paper." });
                          }
                        }}
                      >
                        View Paper
                      </button>
                      <button
                        style={{
                          padding: "10px 20px",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          background:
                            "linear-gradient(135deg, #10b981, #059669)",
                          color: "white",
                          border: "none",
                          borderRadius: "10px",
                          cursor: "pointer",
                        }}
                        onClick={() => handleApprovePaper(p.id)}
                      >
                        Approve ✅
                      </button>
                      <button
                        style={{
                          padding: "10px 20px",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          background:
                            "linear-gradient(135deg, #ef4444, #dc2626)",
                          color: "white",
                          border: "none",
                          borderRadius: "10px",
                          cursor: "pointer",
                        }}
                        onClick={() => handleRejectPaper(p.id)}
                      >
                        Reject ❌
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="db-stat-card"
                style={{ textAlign: "center", padding: "60px" }}
              >
                <p style={{ color: "#64748b" }}>No pending approvals!</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* MODAL SYSTEM (Styled to match the S-Learn vibe) */}
      {isModalOpen && (
        <div
          className="ss-modal-overlay"
          style={{
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="db-stat-card"
            style={{
              padding: "32px",
              maxWidth: "500px",
              width: "95%",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "white",
              borderRadius: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
            }}
          >
            <h2 className="db-section-title" style={{ marginBottom: "10px" }}>
              Submit New Paper
            </h2>

            <StatusBanner type="error" message={modalError} onDismiss={() => setModalError("")} />

            {isAdmin && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "20px",
                  justifyContent: "center",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkMode(false);
                    setPaperFiles([]);
                  }}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "15px",
                    border: "none",
                    background: !isBulkMode ? "#4f46e5" : "#e2e8f0",
                    color: !isBulkMode ? "white" : "#475569",
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Single Upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkMode(true);
                    setPaperFile(null);
                  }}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "15px",
                    border: "none",
                    background: isBulkMode ? "#4f46e5" : "#e2e8f0",
                    color: isBulkMode ? "white" : "#475569",
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Bulk / Folder Upload
                </button>
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                marginBottom: "25px",
              }}
            >
              <input
                type="text"
                className="db-search"
                style={{
                  border: "1.5px solid #e2e8f0",
                  padding: "12px",
                  borderRadius: "10px",
                }}
                placeholder="Academic Level (e.g. A-Level, AS)"
                value={newPaper.level}
                onChange={(e) =>
                  setNewPaper({ ...newPaper, level: e.target.value })
                }
              />
              <input
                type="text"
                className="db-search"
                style={{
                  border: "1.5px solid #e2e8f0",
                  padding: "12px",
                  borderRadius: "10px",
                }}
                placeholder="Subject (e.g. Pure Mathematics)"
                value={newPaper.subject}
                onChange={(e) =>
                  setNewPaper({ ...newPaper, subject: e.target.value })
                }
              />
              <input
                type="text"
                className="db-search"
                style={{
                  border: "1.5px solid #e2e8f0",
                  padding: "12px",
                  borderRadius: "10px",
                }}
                placeholder="Year (e.g. 2024)"
                value={newPaper.year}
                onChange={(e) =>
                  setNewPaper({ ...newPaper, year: e.target.value })
                }
              />

              {!isBulkMode ? (
                <>
                  <input
                    type="text"
                    className="db-search"
                    style={{
                      border: "1.5px solid #e2e8f0",
                      padding: "12px",
                      borderRadius: "10px",
                    }}
                    placeholder="Paper Name (e.g. Paper 1)"
                    value={newPaper.paperName}
                    onChange={(e) =>
                      setNewPaper({ ...newPaper, paperName: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    className="db-search"
                    style={{
                      border: "1.5px solid #e2e8f0",
                      padding: "12px",
                      borderRadius: "10px",
                    }}
                    placeholder="External URL Link (optional)"
                    value={newPaper.link}
                    onChange={(e) =>
                      setNewPaper({ ...newPaper, link: e.target.value })
                    }
                  />
                  <input
                    type="file"
                    accept="application/pdf"
                    className="db-search"
                    style={{
                      border: "1.5px solid #e2e8f0",
                      padding: "12px",
                      borderRadius: "10px",
                    }}
                    onChange={(e) => setPaperFile(e.target.files[0] || null)}
                  />
                </>
              ) : (
                <>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "#64748b",
                      margin: "5px 0",
                    }}
                  >
                    ℹ️ Paper names will be auto-generated from your filenames.
                    Underscores/dashes will be replaced with spaces.
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="application/pdf"
                    className="db-search"
                    style={{
                      border: "1.5px solid #e2e8f0",
                      padding: "12px",
                      borderRadius: "10px",
                    }}
                    onChange={(e) => setPaperFiles(Array.from(e.target.files))}
                  />
                  {paperFiles.length > 0 && (
                    <div
                      style={{
                        maxHeight: "120px",
                        overflowY: "auto",
                        fontSize: "0.8rem",
                        color: "#475569",
                        background: "#f1f5f9",
                        padding: "8px 12px",
                        borderRadius: "10px",
                      }}
                    >
                      <strong>Selected PDFs ({paperFiles.length}):</strong>
                      {paperFiles.map((file, idx) => (
                        <div key={idx} style={{ marginTop: "4px" }}>
                          • {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {uploadProgress && (
              <div className="paper-upload-progress" role="status" aria-live="polite">
                <div className="paper-upload-progress-heading">
                  <span>
                    {uploadProgress.stage === "uploading"
                      ? "Uploading paper"
                      : uploadProgress.stage === "saving"
                        ? "Saving paper details"
                        : "Refreshing shared paper library"}
                  </span>
                  <span>{uploadProgress.percentage}%</span>
                </div>
                <progress
                  className="paper-upload-progress-bar"
                  value={uploadProgress.percentage}
                  max="100"
                  aria-label="Paper upload progress"
                />
                <div className="paper-upload-progress-detail">
                  {uploadProgress.totalFiles > 1 &&
                    `Paper ${uploadProgress.currentFile} of ${uploadProgress.totalFiles}`}
                  {uploadProgress.fileName && ` · ${uploadProgress.fileName}`}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                className="db-nav-item"
                style={{
                  flex: 1,
                  color: "#64748b",
                  textAlign: "center",
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                }}
                disabled={isSubmitting}
                onClick={() => {
                  setIsModalOpen(false);
                  setIsBulkMode(false);
                  setPaperFiles([]);
                  setPaperFile(null);
                }}
              >
                {isSubmitting ? "Please wait…" : "Cancel"}
              </button>
              <button
                className="upload-btn"
                style={{ flex: 1, padding: "12px", borderRadius: "10px" }}
                onClick={handleAddPaper}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Adding..."
                  : isBulkMode
                  ? `Upload ${paperFiles.length} Papers`
                  : "Add Paper"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartSubjects;

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiMessageSquare,
  FiStar,
  FiUsers,
  FiAward,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiCalendar,
  FiPlus,
  FiCheckCircle,
  FiAlertCircle,
  FiCheck,
  FiX,
  FiEye,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiBookOpen,
  FiLayers,
  FiTrendingUp,
  FiUserCheck,
  FiTag
} from "react-icons/fi";
import "../../layout/admin/AdminFeedback.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

const API = {
  list: `${API_BASE}/Feedback/admin/list`,
  facultySummary: `${API_BASE}/Feedback/admin/faculty-summary`,
  collegeSummary: `${API_BASE}/Feedback/admin/college-summary`,
  dashboardSummary: `${API_BASE}/Feedback/admin/dashboard-summary`,
  sessionList: `${API_BASE}/Feedback/session/list`,
  activeSession: `${API_BASE}/Feedback/active-session`,
  createSession: `${API_BASE}/Feedback/session/create`,
  updateSession: (id) => `${API_BASE}/Feedback/session/update/${id}`,
  facultyList: `${API_BASE}/Faculty/postFacultyData`,
};

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  "";

const getHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const pick = (obj, keys, fallback = "-") => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return fallback;
};

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toYMD = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().slice(0, 10);
};

const normalizeList = (row, index = 0) => {
  return {
    id: pick(row, ["feedback_id", "id"], index + 1),
    studentId: pick(row, ["student_id"], "-"),
    facultyId: pick(row, ["faculty_id"], "-"),
    sessionId: pick(row, ["session_id"], "-"),
    sessionTitle: pick(row?.session, ["title"]) !== "-" ? pick(row?.session, ["title"]) : pick(row, ["session_title", "title"], "-"),
    feedbackType: String(pick(row, ["feedback_type"], "GENERAL")).toUpperCase(),
    category: pick(row, ["category"], "GENERAL"),
    rating: Number(pick(row, ["rating"], 0)),
    comment: pick(row, ["comment"], "No comment provided."),
    createdAt: pick(row, ["created_at", "createdAt", "updated_at"], "-"),
    raw: row,
  };
};

export default function AdminFeedback() {
  const [loading, setLoading] = useState(true);
  const [feedbackRows, setFeedbackRows] = useState([]);
  const [dashboard, setDashboard] = useState({});
  const [facultySummary, setFacultySummary] = useState([]);
  const [collegeSummary, setCollegeSummary] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [facultyMap, setFacultyMap] = useState({});
  const [toast, setToast] = useState(null);

  // Filters & State
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEW");
  const [activeTab, setActiveTab] = useState("feedback"); // 'feedback', 'faculty', 'college', 'sessions'

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modals
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [openSessionModal, setOpenSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    session_id: null,
    title: "",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    is_active: true,
  });
  const [sessionSubmitting, setSessionSubmitting] = useState(false);

  const showToast = (message, type = "ok") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  const fetchFacultyDirectory = async () => {
    try {
      const res = await axios.post(API.facultyList, {}, { headers: getHeaders() });
      const raw = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data?.message)
        ? res.data.message
        : [];

      const map = {};
      raw.forEach((f) => {
        const id = f.faculty_id || f.user_id || f.id;
        const name = `${f.first_name || ""} ${f.last_name || ""}`.trim() || f.name || f.user_name || `Faculty #${id}`;
        if (id) map[id] = { name, department: f.department || f.dept || "Academic Faculty" };
      });
      setFacultyMap(map);
    } catch {
      // ignore
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [listRes, dashboardRes, facultyRes, collegeRes, sessionRes, activeSessRes] = await Promise.allSettled([
        fetch(API.list, { method: "POST", headers: getHeaders(), body: JSON.stringify({}) }),
        fetch(API.dashboardSummary, { method: "POST", headers: getHeaders(), body: JSON.stringify({}) }),
        fetch(API.facultySummary, { method: "POST", headers: getHeaders(), body: JSON.stringify({}) }),
        fetch(API.collegeSummary, { method: "POST", headers: getHeaders(), body: JSON.stringify({}) }),
        fetch(API.sessionList, { method: "POST", headers: getHeaders(), body: JSON.stringify({}) }),
        fetch(API.activeSession, { method: "POST", headers: getHeaders(), body: JSON.stringify({}) }),
      ]);

      if (listRes.status === "fulfilled" && listRes.value.ok) {
        const listData = await listRes.value.json();
        const listRows = Array.isArray(listData)
          ? listData
          : Array.isArray(listData?.data)
          ? listData.data
          : Array.isArray(listData?.rows)
          ? listData.rows
          : Array.isArray(listData?.feedback)
          ? listData.feedback
          : [];
        setFeedbackRows(listRows.map(normalizeList));
      }

      if (dashboardRes.status === "fulfilled" && dashboardRes.value.ok) {
        const dashboardData = await dashboardRes.value.json();
        setDashboard(
          dashboardData?.data ||
          dashboardData?.summary ||
          dashboardData?.row ||
          dashboardData ||
          {}
        );
      }

      if (facultyRes.status === "fulfilled" && facultyRes.value.ok) {
        const facultyData = await facultyRes.value.json();
        setFacultySummary(
          Array.isArray(facultyData)
            ? facultyData
            : Array.isArray(facultyData?.data)
            ? facultyData.data
            : Array.isArray(facultyData?.rows)
            ? facultyData.rows
            : []
        );
      }

      if (collegeRes.status === "fulfilled" && collegeRes.value.ok) {
        const collegeData = await collegeRes.value.json();
        setCollegeSummary(
          Array.isArray(collegeData)
            ? collegeData
            : Array.isArray(collegeData?.data)
            ? collegeData.data
            : Array.isArray(collegeData?.rows)
            ? collegeData.rows
            : []
        );
      }

      if (sessionRes.status === "fulfilled" && sessionRes.value.ok) {
        const sessData = await sessionRes.value.json();
        setSessions(
          Array.isArray(sessData)
            ? sessData
            : Array.isArray(sessData?.data)
            ? sessData.data
            : []
        );
      }

      if (activeSessRes.status === "fulfilled" && activeSessRes.value.ok) {
        const actData = await activeSessRes.value.json();
        setActiveSession(actData?.data || actData || null);
      }
    } catch (err) {
      showToast(err.message || "Failed to load feedback analytics", "err");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    fetchFacultyDirectory();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedFeedback(null);
        setOpenSessionModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredRows = useMemo(() => {
    let rows = [...feedbackRows];

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((item) => {
        const facName = facultyMap[item.facultyId]?.name?.toLowerCase() || "";
        return (
          String(item.id).toLowerCase().includes(q) ||
          String(item.studentId).toLowerCase().includes(q) ||
          String(item.facultyId).toLowerCase().includes(q) ||
          facName.includes(q) ||
          String(item.sessionId).toLowerCase().includes(q) ||
          String(item.sessionTitle).toLowerCase().includes(q) ||
          String(item.feedbackType).toLowerCase().includes(q) ||
          String(item.category).toLowerCase().includes(q) ||
          String(item.comment).toLowerCase().includes(q)
        );
      });
    }

    if (ratingFilter !== "ALL") {
      rows = rows.filter((item) => String(item.rating) === String(ratingFilter));
    }

    if (typeFilter !== "ALL") {
      rows = rows.filter(
        (item) => String(item.feedbackType).toUpperCase() === String(typeFilter).toUpperCase()
      );
    }

    if (categoryFilter !== "ALL") {
      rows = rows.filter(
        (item) => String(item.category).toUpperCase() === String(categoryFilter).toUpperCase()
      );
    }

    if (sortBy === "NEW") {
      rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "OLD") {
      rows.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "RATING_HIGH") {
      rows.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "RATING_LOW") {
      rows.sort((a, b) => a.rating - b.rating);
    }

    return rows;
  }, [feedbackRows, search, ratingFilter, typeFilter, categoryFilter, sortBy, facultyMap]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredRows.length / limit));
  }, [filteredRows.length, limit]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredRows.slice(start, start + limit);
  }, [filteredRows, page, limit]);

  const stats = {
    total: dashboard?.total_feedback ?? feedbackRows.length,
    avg: Number(
      dashboard?.avg_rating ??
      (
        feedbackRows.reduce((sum, item) => sum + (Number(item.rating) || 0), 0) /
        (feedbackRows.length || 1)
      )
    ).toFixed(2),
    facultyFeedback: dashboard?.faculty_feedback ?? feedbackRows.filter((f) => f.feedbackType === "FACULTY").length,
    collegeFeedback: dashboard?.college_feedback ?? feedbackRows.filter((f) => f.feedbackType === "COLLEGE").length,
  };

  const handleOpenCreateSession = () => {
    setSessionForm({
      session_id: null,
      title: "",
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      is_active: true,
    });
    setOpenSessionModal(true);
  };

  const handleOpenEditSession = (sess) => {
    setSessionForm({
      session_id: sess.session_id,
      title: sess.title || "",
      start_date: toYMD(sess.start_date),
      end_date: toYMD(sess.end_date),
      is_active: !!sess.is_active,
    });
    setOpenSessionModal(true);
  };

  const saveSession = async (e) => {
    if (e) e.preventDefault();
    if (!sessionForm.title.trim()) {
      showToast("Session title is required", "err");
      return;
    }

    try {
      setSessionSubmitting(true);
      if (sessionForm.session_id) {
        // Update
        const res = await fetch(API.updateSession(sessionForm.session_id), {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(sessionForm),
        });
        if (!res.ok) throw new Error("Failed to update session");
        showToast("Feedback session updated successfully!", "ok");
      } else {
        // Create
        const res = await fetch(API.createSession, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(sessionForm),
        });
        if (!res.ok) throw new Error("Failed to create session");
        showToast("New feedback session activated!", "ok");
      }

      setOpenSessionModal(false);
      await fetchAllData();
    } catch (err) {
      showToast(err.message || "Failed to save session", "err");
    } finally {
      setSessionSubmitting(false);
    }
  };

  const renderStars = (rating = 0) => {
    const r = Math.round(Number(rating) || 0);
    return (
      <div className="fb-stars-flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`fb-star-glyph ${i <= r ? "filled" : "empty"}`}>
            ★
          </span>
        ))}
        <span className="fb-star-num">({rating})</span>
      </div>
    );
  };

  return (
    <div className="fb-pro-root">
      {/* Toast Alert */}
      {toast && (
        <div className={`fb-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. HERO COMMAND BANNER */}
      <section className="fb-hero-banner">
        <div className="fb-hero-left">
          <div className="fb-live-chip">
            <span className="fb-ping"></span>
            <span className="fb-live-txt">INSTITUTIONAL FEEDBACK & SENTIMENT ANALYTICS • CONTROL CENTER</span>
          </div>
          <h1 className="fb-hero-title">Student & Faculty Feedback Analytics</h1>
          <p className="fb-hero-sub">
            Evaluate academic course reviews, faculty teaching efficacy, institutional facilities appraisal, and active feedback cycles.
          </p>
        </div>

        <div className="fb-hero-actions">
          <button
            className="fb-btn fb-btn-secondary"
            onClick={fetchAllData}
            disabled={loading}
            title="Refresh database records"
          >
            <FiRefreshCw className={loading ? "fb-spin" : ""} />
            <span>Sync</span>
          </button>

          <button className="fb-btn fb-btn-primary" onClick={handleOpenCreateSession}>
            <FiPlus />
            <span>New Feedback Cycle</span>
          </button>
        </div>
      </section>

      {/* ACTIVE SESSION STATUS BANNER */}
      {activeSession && (
        <div className="fb-active-session-strip">
          <div className="fb-active-session-left">
            <div className="fb-active-icon-badge">
              <FiCalendar size={18} />
            </div>
            <div>
              <div className="fb-active-session-title">
                Active Collection: <b>{activeSession.title || "Institutional Survey"}</b>
              </div>
              <div className="fb-active-session-dates">
                <span>Window: {toYMD(activeSession.start_date)} to {toYMD(activeSession.end_date)}</span>
                <span className="fb-active-badge">🟢 Live for Student Submissions</span>
              </div>
            </div>
          </div>

          <button
            className="fb-btn fb-btn-xs fb-btn-secondary"
            onClick={() => handleOpenEditSession(activeSession)}
          >
            Configure Cycle
          </button>
        </div>
      )}

      {/* 2. KPI ANALYTICS CARDS */}
      <section className="fb-kpi-grid">
        <div className="fb-kpi-card">
          <div className="fb-kpi-header">
            <span className="fb-kpi-label">Total Submissions</span>
            <div className="fb-kpi-icon-wrap primary">
              <FiMessageSquare size={18} />
            </div>
          </div>
          <div className="fb-kpi-val">{stats.total}</div>
          <div className="fb-kpi-meta">
            <span className="fb-kpi-hint">Aggregated feedback responses</span>
          </div>
        </div>

        <div className="fb-kpi-card">
          <div className="fb-kpi-header">
            <span className="fb-kpi-label">Campus Rating Avg</span>
            <div className="fb-kpi-icon-wrap gold">
              <FiStar size={18} />
            </div>
          </div>
          <div className="fb-kpi-val gold">{stats.avg} <span className="sub">/ 5.0</span></div>
          <div className="fb-kpi-meta">
            <span className="fb-kpi-hint">Overall institutional satisfaction</span>
          </div>
        </div>

        <div className="fb-kpi-card">
          <div className="fb-kpi-header">
            <span className="fb-kpi-label">Faculty Appraisals</span>
            <div className="fb-kpi-icon-wrap cyan">
              <FiUserCheck size={18} />
            </div>
          </div>
          <div className="fb-kpi-val cyan">{stats.facultyFeedback}</div>
          <div className="fb-kpi-meta">
            <span className="fb-kpi-hint">Professor & course ratings</span>
          </div>
        </div>

        <div className="fb-kpi-card">
          <div className="fb-kpi-header">
            <span className="fb-kpi-label">Campus & Facilities</span>
            <div className="fb-kpi-icon-wrap success">
              <FiAward size={18} />
            </div>
          </div>
          <div className="fb-kpi-val success">{stats.collegeFeedback}</div>
          <div className="fb-kpi-meta">
            <span className="fb-kpi-hint">Infrastructure & service reviews</span>
          </div>
        </div>
      </section>

      {/* 3. NAVIGATION TABS */}
      <div className="fb-tabs-strip">
        <button
          className={`fb-tab-btn ${activeTab === "feedback" ? "active" : ""}`}
          onClick={() => { setActiveTab("feedback"); setPage(1); }}
        >
          <FiMessageSquare />
          <span>All Feedback Records ({feedbackRows.length})</span>
        </button>

        <button
          className={`fb-tab-btn ${activeTab === "faculty" ? "active" : ""}`}
          onClick={() => setActiveTab("faculty")}
        >
          <FiUsers />
          <span>Faculty Scorecards ({facultySummary.length})</span>
        </button>

        <button
          className={`fb-tab-btn ${activeTab === "college" ? "active" : ""}`}
          onClick={() => setActiveTab("college")}
        >
          <FiLayers />
          <span>College Category Breakdown ({collegeSummary.length})</span>
        </button>

        <button
          className={`fb-tab-btn ${activeTab === "sessions" ? "active" : ""}`}
          onClick={() => setActiveTab("sessions")}
        >
          <FiCalendar />
          <span>Survey Cycles ({sessions.length})</span>
        </button>
      </div>

      {/* 4. TAB PANELS */}
      {activeTab === "feedback" && (
        <section className="fb-deck-panel">
          <div className="fb-filter-row">
            <div className="fb-search-field">
              <FiSearch className="fb-search-icon" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search feedback comment, faculty name, student ID, category..."
              />
              {search && (
                <button className="fb-clear-btn" onClick={() => setSearch("")}>
                  <FiX />
                </button>
              )}
            </div>

            <div className="fb-select-group">
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              >
                <option value="ALL">All Categories</option>
                <option value="FACULTY">Faculty Reviews Only</option>
                <option value="COLLEGE">Campus Facilities Only</option>
              </select>

              <select
                value={ratingFilter}
                onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
              >
                <option value="ALL">All Star Ratings</option>
                <option value="5">★★★★★ 5 Star Only</option>
                <option value="4">★★★★☆ 4 Star Only</option>
                <option value="3">★★★☆☆ 3 Star Only</option>
                <option value="2">★★☆☆☆ 2 Star Only</option>
                <option value="1">★☆☆☆☆ 1 Star Only</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="NEW">Newest First</option>
                <option value="OLD">Oldest First</option>
                <option value="RATING_HIGH">Highest Rating First</option>
                <option value="RATING_LOW">Lowest Rating First</option>
              </select>

              <button
                className="fb-btn fb-btn-secondary"
                onClick={() => {
                  setSearch("");
                  setRatingFilter("ALL");
                  setTypeFilter("ALL");
                  setCategoryFilter("ALL");
                  setSortBy("NEW");
                  setPage(1);
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* TABLE VIEW */}
          <div className="fb-table-wrap">
            <table className="fb-table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>ID</th>
                  <th>Student Info</th>
                  <th>Recipient / Target</th>
                  <th>Survey Cycle</th>
                  <th className="center">Score Rating</th>
                  <th>Student Comment / Observation</th>
                  <th>Submitted Date</th>
                  <th className="right">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="fb-skel-row">
                      <td colSpan={8}>
                        <div className="fb-skel-pulse" />
                      </td>
                    </tr>
                  ))
                ) : paginatedRows.length ? (
                  paginatedRows.map((item) => {
                    const facInfo = facultyMap[item.facultyId];
                    return (
                      <tr key={item.id}>
                        <td>
                          <span className="fb-id-pill">#{item.id}</span>
                        </td>

                        <td>
                          <div className="fb-student-cell">
                            <span className="fb-stu-badge">Student ID #{item.studentId}</span>
                            <span className="fb-anon-tag">Verified Scholar</span>
                          </div>
                        </td>

                        <td>
                          {item.feedbackType === "FACULTY" ? (
                            <div className="fb-target-box faculty">
                              <span className="fb-target-name">{facInfo?.name || `Faculty #${item.facultyId}`}</span>
                              <span className="fb-target-sub">{facInfo?.department || "Academic Faculty"}</span>
                            </div>
                          ) : (
                            <div className="fb-target-box college">
                              <span className="fb-target-cat">{item.category || "General Campus"}</span>
                              <span className="fb-target-sub">Institutional Infrastructure</span>
                            </div>
                          )}
                        </td>

                        <td>
                          <div className="fb-session-cell">
                            <span className="fb-session-txt">{item.sessionTitle || "General Feedback"}</span>
                            <span className="fb-session-sub">Cycle #{item.sessionId}</span>
                          </div>
                        </td>

                        <td className="center">
                          {renderStars(item.rating)}
                        </td>

                        <td>
                          <div className="fb-comment-preview" title={item.comment}>
                            "{item.comment}"
                          </div>
                        </td>

                        <td>
                          <div className="fb-date-cell">
                            <FiClock size={13} />
                            <span>{formatDate(item.createdAt)}</span>
                          </div>
                        </td>

                        <td className="right">
                          <button
                            className="fb-icon-action view"
                            onClick={() => setSelectedFeedback(item)}
                            title="Inspect full feedback details"
                          >
                            <FiEye />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8}>
                      <div className="fb-empty-state">
                        <div className="fb-empty-icon-box">
                          <FiMessageSquare />
                        </div>
                        <h3>No Feedback Entries Found</h3>
                        <p>No student feedback responses match your current filter parameters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="fb-pagination-bar">
            <div className="fb-pager-info">
              <span>
                Showing <b>{paginatedRows.length}</b> of <b>{filteredRows.length}</b> responses (Page {page} of {totalPages})
              </span>

              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="fb-page-size-select"
              >
                {[10, 20, 30, 50].map((n) => (
                  <option key={n} value={n}>
                    {n} rows per page
                  </option>
                ))}
              </select>
            </div>

            <div className="fb-pager-buttons">
              <button
                className="fb-pager-btn"
                onClick={() => setPage(1)}
                disabled={page === 1 || loading}
                title="First page"
              >
                <FiChevronsLeft />
              </button>

              <button
                className="fb-pager-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                title="Previous page"
              >
                <FiChevronLeft />
              </button>

              <span className="fb-page-number">{page}</span>

              <button
                className="fb-pager-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                title="Next page"
              >
                <FiChevronRight />
              </button>

              <button
                className="fb-pager-btn"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages || loading}
                title="Last page"
              >
                <FiChevronsRight />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* FACULTY SCORECARDS TAB */}
      {activeTab === "faculty" && (
        <section className="fb-summary-grid">
          {facultySummary.length === 0 ? (
            <div className="fb-empty-state span-full">
              <div className="fb-empty-icon-box"><FiUsers /></div>
              <h3>No Faculty Appraisal Summaries</h3>
              <p>No faculty-specific feedback records have been compiled for this survey cycle.</p>
            </div>
          ) : (
            facultySummary.map((row, i) => {
              const facId = pick(row, ["faculty_id"], "-");
              const facInfo = facultyMap[facId];
              const avg = Number(pick(row, ["avg_rating", "average_rating", "rating"], 0)).toFixed(2);
              const count = pick(row, ["total_feedback", "total", "count"], 0);

              return (
                <div className="fb-scorecard-item" key={i}>
                  <div className="fb-scorecard-head">
                    <div className="fb-scorecard-avatar">
                      {(facInfo?.name || `F${facId}`).slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="fb-scorecard-name">{facInfo?.name || pick(row, ["faculty_name", "name"], `Faculty ID #${facId}`)}</h4>
                      <span className="fb-scorecard-dept">{facInfo?.department || "Department Faculty"}</span>
                    </div>
                  </div>

                  <div className="fb-scorecard-stats">
                    <div className="fb-stat-subbox">
                      <span className="lbl">Average Rating</span>
                      <div className="val gold">
                        <FiStar size={14} />
                        <span>{avg}</span>
                      </div>
                    </div>

                    <div className="fb-stat-subbox">
                      <span className="lbl">Total Reviews</span>
                      <div className="val">
                        <FiMessageSquare size={14} />
                        <span>{count} reviews</span>
                      </div>
                    </div>
                  </div>

                  <div className="fb-scorecard-stars">
                    {renderStars(avg)}
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      {/* COLLEGE BREAKDOWN TAB */}
      {activeTab === "college" && (
        <section className="fb-summary-grid">
          {collegeSummary.length === 0 ? (
            <div className="fb-empty-state span-full">
              <div className="fb-empty-icon-box"><FiLayers /></div>
              <h3>No Institutional Breakdown Records</h3>
              <p>Campus facilities and infrastructure feedback summaries are currently empty.</p>
            </div>
          ) : (
            collegeSummary.map((row, i) => {
              const cat = pick(row, ["category", "feedback_type"], `Category ${i + 1}`);
              const avg = Number(pick(row, ["avg_rating", "average_rating", "rating"], 0)).toFixed(2);
              const count = pick(row, ["total_feedback", "total", "count"], 0);

              return (
                <div className="fb-scorecard-item" key={i}>
                  <div className="fb-scorecard-head">
                    <div className="fb-scorecard-avatar cyan">
                      <FiAward size={20} />
                    </div>
                    <div>
                      <h4 className="fb-scorecard-name">{cat}</h4>
                      <span className="fb-scorecard-dept">Institutional Infrastructure</span>
                    </div>
                  </div>

                  <div className="fb-scorecard-stats">
                    <div className="fb-stat-subbox">
                      <span className="lbl">Average Score</span>
                      <div className="val cyan">
                        <FiStar size={14} />
                        <span>{avg}</span>
                      </div>
                    </div>

                    <div className="fb-stat-subbox">
                      <span className="lbl">Responses</span>
                      <div className="val">
                        <FiMessageSquare size={14} />
                        <span>{count}</span>
                      </div>
                    </div>
                  </div>

                  <div className="fb-scorecard-stars">
                    {renderStars(avg)}
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      {/* SURVEY SESSIONS TAB */}
      {activeTab === "sessions" && (
        <section className="fb-deck-panel">
          <div className="fb-filter-row">
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Institutional Survey Collection Cycles</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#94a3b8" }}>Manage start and expiration windows for student feedback submission</p>
            </div>

            <button className="fb-btn fb-btn-primary" onClick={handleOpenCreateSession}>
              <FiPlus />
              <span>Create New Survey Cycle</span>
            </button>
          </div>

          <div className="fb-table-wrap">
            <table className="fb-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Survey Cycle Title</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Current State</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length ? (
                  sessions.map((sess) => (
                    <tr key={sess.session_id}>
                      <td><span className="fb-id-pill">#{sess.session_id}</span></td>
                      <td><b>{sess.title}</b></td>
                      <td>{toYMD(sess.start_date)}</td>
                      <td>{toYMD(sess.end_date)}</td>
                      <td>
                        {sess.is_active ? (
                          <span className="fb-chip-status ok">
                            <span className="fb-chip-dot ok" />
                            Active Collection
                          </span>
                        ) : (
                          <span className="fb-chip-status warn">
                            <span className="fb-chip-dot warn" />
                            Closed / Inactive
                          </span>
                        )}
                      </td>
                      <td className="right">
                        <button
                          className="fb-btn fb-btn-xs fb-btn-secondary"
                          onClick={() => handleOpenEditSession(sess)}
                        >
                          Edit Settings
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 30, color: "#94a3b8" }}>
                      No survey cycles created yet. Click "Create New Survey Cycle" to initiate one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* FEEDBACK DETAILS MODAL */}
      {selectedFeedback && (
        <div className="fb-modal-backdrop" onClick={() => setSelectedFeedback(null)}>
          <div className="fb-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="fb-modal-header">
              <div className="fb-modal-title-group">
                <div className="fb-modal-icon-badge">
                  <FiMessageSquare size={20} />
                </div>
                <div>
                  <h3 className="fb-modal-title">Official Student Feedback Transcript</h3>
                  <p className="fb-modal-sub">Verified academic feedback evaluation record #{selectedFeedback.id}</p>
                </div>
              </div>

              <button className="fb-modal-close" onClick={() => setSelectedFeedback(null)}>
                <FiX size={18} />
              </button>
            </div>

            <div className="fb-modal-body">
              <div className="fb-view-stats-grid">
                <div className="fb-stat-box">
                  <span className="fb-stat-lbl">Feedback ID</span>
                  <span className="fb-stat-val">#{selectedFeedback.id}</span>
                </div>

                <div className="fb-stat-box">
                  <span className="fb-stat-lbl">Student Reference</span>
                  <span className="fb-stat-val">Student ID #{selectedFeedback.studentId}</span>
                </div>

                <div className="fb-stat-box">
                  <span className="fb-stat-lbl">Survey Category</span>
                  <span className="fb-stat-val">{selectedFeedback.feedbackType}</span>
                </div>

                <div className="fb-stat-box">
                  <span className="fb-stat-lbl">Assigned Rating</span>
                  <div className="fb-stat-val">
                    {renderStars(selectedFeedback.rating)}
                  </div>
                </div>

                {selectedFeedback.feedbackType === "FACULTY" ? (
                  <div className="fb-stat-box span-full highlight">
                    <span className="fb-stat-lbl">Faculty Member</span>
                    <span className="fb-stat-val">
                      {facultyMap[selectedFeedback.facultyId]?.name || `Faculty Member #${selectedFeedback.facultyId}`}
                    </span>
                    <span className="fb-stat-desc">{facultyMap[selectedFeedback.facultyId]?.department || "Department"}</span>
                  </div>
                ) : (
                  <div className="fb-stat-box span-full highlight">
                    <span className="fb-stat-lbl">Campus Category</span>
                    <span className="fb-stat-val">{selectedFeedback.category}</span>
                  </div>
                )}

                <div className="fb-stat-box span-full">
                  <span className="fb-stat-lbl">Submitted Observation & Comment</span>
                  <p className="fb-stat-comment">"{selectedFeedback.comment}"</p>
                </div>

                <div className="fb-stat-box">
                  <span className="fb-stat-lbl">Survey Cycle</span>
                  <span className="fb-stat-val">{selectedFeedback.sessionTitle}</span>
                </div>

                <div className="fb-stat-box">
                  <span className="fb-stat-lbl">Submission Timestamp</span>
                  <span className="fb-stat-val">{formatDate(selectedFeedback.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="fb-modal-footer">
              <button
                className="fb-btn fb-btn-secondary"
                onClick={() => setSelectedFeedback(null)}
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT SESSION MODAL */}
      {openSessionModal && (
        <div className="fb-modal-backdrop" onClick={() => setOpenSessionModal(false)}>
          <div className="fb-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="fb-modal-header">
              <div className="fb-modal-title-group">
                <div className="fb-modal-icon-badge gold">
                  <FiCalendar size={20} />
                </div>
                <div>
                  <h3 className="fb-modal-title">
                    {sessionForm.session_id ? "Configure Survey Cycle" : "Initiate Feedback Survey Cycle"}
                  </h3>
                  <p className="fb-modal-sub">Define submission timelines and portal activation status</p>
                </div>
              </div>

              <button className="fb-modal-close" onClick={() => setOpenSessionModal(false)}>
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={saveSession}>
              <div className="fb-modal-body">
                <div className="fb-form-grid">
                  <div className="fb-form-field span-full">
                    <label>Survey Cycle Title *</label>
                    <input
                      type="text"
                      value={sessionForm.title}
                      onChange={(e) => setSessionForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Fall 2026 Institutional Faculty & Facilities Survey"
                      required
                    />
                  </div>

                  <div className="fb-form-field">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      value={sessionForm.start_date}
                      onChange={(e) => setSessionForm((p) => ({ ...p, start_date: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="fb-form-field">
                    <label>End Date *</label>
                    <input
                      type="date"
                      value={sessionForm.end_date}
                      onChange={(e) => setSessionForm((p) => ({ ...p, end_date: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="fb-form-field span-full">
                    <label>Activation State</label>
                    <div className="fb-switch-wrapper">
                      <label className="fb-toggle-switch">
                        <input
                          type="checkbox"
                          checked={sessionForm.is_active}
                          onChange={(e) => setSessionForm((p) => ({ ...p, is_active: e.target.checked }))}
                        />
                        <span className="fb-toggle-slider"></span>
                      </label>
                      <span className="fb-toggle-label">
                        {sessionForm.is_active ? "Active for Student Submissions" : "Closed / Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="fb-modal-footer">
                <button
                  type="button"
                  className="fb-btn fb-btn-secondary"
                  onClick={() => setOpenSessionModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fb-btn fb-btn-primary"
                  disabled={sessionSubmitting}
                >
                  {sessionSubmitting ? (
                    <>
                      <FiRefreshCw className="fb-spin" />
                      <span>Saving Cycle...</span>
                    </>
                  ) : (
                    <>
                      <FiCheck />
                      <span>{sessionForm.session_id ? "Save Settings" : "Activate Survey"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
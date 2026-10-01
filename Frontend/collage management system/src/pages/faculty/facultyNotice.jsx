import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiMessageSquare,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiUser,
  FiTag,
  FiRefreshCw,
  FiAlertCircle,
  FiEye,
  FiX,
  FiBookmark,
  FiChevronRight
} from "react-icons/fi";
import "../../layout/faculty/facultyNotice.css";

const API_BASE = `${import.meta.env.VITE_API_BASE || "http://localhost:5001"}/Notice`;
const API = {
  list: `${API_BASE}/postNoticeData`,
};

const pick = (obj, keys, fallback = "") => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== "") {
      return obj[key];
    }
  }
  return fallback;
};

const formatDate = (value) => {
  if (!value) return "Recent Date";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeNotice = (item, index) => ({
  id: pick(item, ["notice_id", "id"], index + 1),
  title: pick(item, ["title", "notice_title", "subject"], "Untitled Notice"),
  description: pick(
    item,
    ["description", "message", "notice_description"],
    "No description available."
  ),
  date: pick(item, ["publish_at", "created_at", "date", "notice_date"], ""),
  audience: String(pick(item, ["audience"], "ALL")).toUpperCase(),
  category: pick(item, ["category"], "General"),
  status: String(pick(item, ["status"], "DRAFT")).toUpperCase(),
  createdBy: pick(item, ["issue_by", "created_by", "author", "by"], "University Admin"),
});

export default function FacultyNotice() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedNotice, setSelectedNotice] = useState(null);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await axios.post(API.list, {});
      const raw = res?.data?.data ?? res?.data?.message ?? res?.data ?? [];
      const rows = Array.isArray(raw) ? raw : [];

      const cleaned = rows
        .map((item, index) => normalizeNotice(item, index))
        .filter(
          (n) =>
            n.status === "PUBLISHED" &&
            (n.audience === "ALL" || n.audience === "FACULTY" || n.audience === "STAFF")
        );

      setNotices(cleaned);
    } catch {
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const categoryOptions = useMemo(() => {
    const set = new Set();
    notices.forEach((n) => {
      if (n.category && String(n.category).trim().toLowerCase() !== "all") {
        set.add(String(n.category));
      }
    });
    return ["all", ...Array.from(set)];
  }, [notices]);

  const filteredNotices = useMemo(() => {
    const q = query.trim().toLowerCase();

    return notices.filter((n) => {
      const matchesSearch =
        !q ||
        `${n.title} ${n.description} ${n.audience} ${n.category} ${n.createdBy}`
          .toLowerCase()
          .includes(q);

      const category = String(n.category || "").toLowerCase();
      const matchesCategory =
        categoryFilter === "all" ||
        category === categoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [notices, query, categoryFilter]);

  return (
    <div className="fn-pro-root">
      {/* 1. HERO COMMAND BANNER */}
      <section className="fn-hero-banner">
        <div className="fn-hero-left">
          <div className="fn-live-chip">
            <span className="fn-ping"></span>
            <span className="fn-live-txt">OFFICIAL FACULTY BULLETIN &amp; CAMPUS CIRCULARS</span>
          </div>
          <h1 className="fn-hero-title">Faculty Circulars &amp; Notices</h1>
          <p className="fn-hero-sub">
            Stay updated with academic council resolutions, exam duty schedules, faculty meetings, and departmental circulars.
          </p>
        </div>

        <div className="fn-hero-actions">
          <button
            className="fn-btn fn-btn-secondary"
            onClick={fetchNotices}
            disabled={loading}
            title="Refresh circular stream"
          >
            <FiRefreshCw className={loading ? "fn-spin" : ""} />
            <span>Sync</span>
          </button>
        </div>
      </section>

      {/* 2. CATEGORY CHIPS STRIP */}
      <div className="fn-cat-strip">
        {categoryOptions.map((cat) => (
          <button
            key={cat}
            className={`fn-cat-chip ${categoryFilter === cat ? "active" : ""}`}
            onClick={() => setCategoryFilter(cat)}
          >
            <span>{cat === "all" ? "All Circulars" : cat}</span>
          </button>
        ))}
      </div>

      {/* 3. SEARCH & DECK PANEL */}
      <section className="fn-deck-panel">
        <div className="fn-filter-row">
          <div className="fn-search-field">
            <FiSearch className="fn-search-icon" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search circulars, subject lines, administrative author..."
            />
            {query && (
              <button className="fn-clear-btn" onClick={() => setQuery("")}>
                <FiX />
              </button>
            )}
          </div>

          <div className="fn-results-counter">
            Showing <b>{filteredNotices.length}</b> official circulars
          </div>
        </div>

        {/* 4. NOTICES CARDS GRID */}
        <div className="fn-grid-container">
          {loading ? (
            <div className="fn-empty">
              <FiRefreshCw className="fn-spin" style={{ fontSize: "22px" }} />
              <p style={{ marginTop: "10px" }}>Loading faculty notice stream...</p>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="fn-empty">No active notices found matching your criteria.</div>
          ) : (
            <div className="fn-cards-grid">
              {filteredNotices.map((n) => {
                const catLower = n.category.toLowerCase();
                const isExam = catLower.includes("exam");
                const isEvent = catLower.includes("event") || catLower.includes("meeting");
                const isAcademic = catLower.includes("academic");

                return (
                  <div
                    className="fn-notice-card"
                    key={n.id}
                    onClick={() => setSelectedNotice(n)}
                  >
                    <div className="fn-card-header">
                      <span
                        className={`fn-cat-tag ${
                          isExam ? "exam" : isEvent ? "event" : isAcademic ? "academic" : ""
                        }`}
                      >
                        {n.category}
                      </span>

                      <span className="fn-date-text">
                        <FiCalendar size={13} />
                        {formatDate(n.date)}
                      </span>
                    </div>

                    <h3 className="fn-card-title">{n.title}</h3>
                    <p className="fn-card-desc">{n.description}</p>

                    <div className="fn-card-footer">
                      <span className="fn-author">
                        <FiUser size={13} />
                        Issued by: {n.createdBy}
                      </span>

                      <span className="fn-read-more">
                        <span>Read Circular</span>
                        <FiChevronRight />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 5. NOTICE DETAIL MODAL */}
      {selectedNotice && (
        <div
          className="fn-modal-overlay"
          onClick={() => setSelectedNotice(null)}
        >
          <div
            className="fn-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fn-modal-head">
              <div>
                <span className="fn-cat-tag">{selectedNotice.category}</span>
                <h2 style={{ marginTop: "8px" }}>{selectedNotice.title}</h2>
                <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "12px" }}>
                  Published: {formatDate(selectedNotice.date)} • Target: {selectedNotice.audience}
                </p>
              </div>

              <button
                className="fn-close-btn"
                onClick={() => setSelectedNotice(null)}
              >
                <FiX />
              </button>
            </div>

            <div className="fn-modal-body">
              {selectedNotice.description}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px", color: "#94a3b8", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <span>Issued by: <b style={{ color: "#f8fafc" }}>{selectedNotice.createdBy}</b></span>
              <button
                className="fn-btn fn-btn-secondary"
                style={{ padding: "6px 14px", fontSize: "12px" }}
                onClick={() => setSelectedNotice(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
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
import "../../layout/student/studentNotice.css";

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
  category: pick(item, ["category"], "Academic"),
  status: String(pick(item, ["status"], "DRAFT")).toUpperCase(),
  createdBy: pick(item, ["issue_by", "created_by", "author", "by"], "University Admin"),
});

export default function StudentNotice() {
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
            (n.audience === "ALL" || n.audience === "STUDENT" || n.audience === "STUDENTS")
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
    return notices.filter((n) => {
      const matchQ =
        !query.trim() ||
        n.title.toLowerCase().includes(query.toLowerCase()) ||
        n.description.toLowerCase().includes(query.toLowerCase()) ||
        n.createdBy.toLowerCase().includes(query.toLowerCase());

      const matchCat =
        categoryFilter === "all" ||
        n.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchQ && matchCat;
    });
  }, [notices, query, categoryFilter]);

  return (
    <div className="stn-pro-root">
      {/* 1. HERO COMMAND BANNER */}
      <section className="stn-hero-banner">
        <div className="stn-hero-left">
          <div className="stn-live-chip">
            <span className="stn-ping"></span>
            <span className="stn-live-txt">INSTITUTIONAL NOTICE BOARD & OFFICIAL CIRCULARS</span>
          </div>
          <h1 className="stn-hero-title">Campus Bulletin & Notices</h1>
          <p className="stn-hero-sub">
            Stay updated with semester exam notifications, holiday declarations, academic calendars, and administrative circulars.
          </p>
        </div>

        <div className="stn-hero-actions">
          <button
            className="stn-btn stn-btn-secondary"
            onClick={fetchNotices}
            disabled={loading}
            title="Refresh notice stream"
          >
            <FiRefreshCw className={loading ? "stn-spin" : ""} />
            <span>Sync</span>
          </button>
        </div>
      </section>

      {/* 2. CATEGORY CHIPS STRIP */}
      <div className="stn-cat-strip">
        {categoryOptions.map((cat) => (
          <button
            key={cat}
            className={`stn-cat-chip ${categoryFilter === cat ? "active" : ""}`}
            onClick={() => setCategoryFilter(cat)}
          >
            <span>{cat === "all" ? "All Circulars" : cat}</span>
          </button>
        ))}
      </div>

      {/* 3. SEARCH & DECK PANEL */}
      <section className="stn-deck-panel">
        <div className="stn-filter-row">
          <div className="stn-search-field">
            <FiSearch className="stn-search-icon" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search circulars, subject lines, administrative author..."
            />
            {query && (
              <button className="stn-clear-btn" onClick={() => setQuery("")}>
                <FiX />
              </button>
            )}
          </div>

          <div className="stn-results-counter">
            <span>Showing <b>{filteredNotices.length}</b> official notices</span>
          </div>
        </div>

        {/* 4. NOTICES GRID */}
        <div className="stn-grid-container">
          {loading ? (
            <div className="stn-skel-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="stn-skel-card" />
              ))}
            </div>
          ) : filteredNotices.length ? (
            <div className="stn-cards-grid">
              {filteredNotices.map((n) => (
                <div
                  className="stn-notice-card"
                  key={n.id}
                  onClick={() => setSelectedNotice(n)}
                >
                  <div className="stn-card-top">
                    <span className="stn-cat-badge">{n.category}</span>
                    <div className="stn-date-badge">
                      <FiCalendar size={12} />
                      <span>{formatDate(n.date)}</span>
                    </div>
                  </div>

                  <h3 className="stn-card-title">{n.title}</h3>

                  <p className="stn-card-snippet">
                    {n.description.slice(0, 140)}
                    {n.description.length > 140 ? "..." : ""}
                  </p>

                  <div className="stn-card-foot">
                    <div className="stn-author-box">
                      <FiUser size={13} />
                      <span>Issued by: {n.createdBy}</span>
                    </div>

                    <button className="stn-read-btn">
                      <span>Read Full Notice</span>
                      <FiChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="stn-empty-state">
              <div className="stn-empty-icon-box">
                <FiMessageSquare />
              </div>
              <h3>No Notices Found</h3>
              <p>No published circulars matched your active query or selected category.</p>
            </div>
          )}
        </div>
      </section>

      {/* NOTICE DETAIL MODAL */}
      {selectedNotice && (
        <div className="stn-modal-backdrop" onClick={() => setSelectedNotice(null)}>
          <div className="stn-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="stn-modal-header">
              <div className="stn-modal-title-group">
                <span className="stn-cat-badge">{selectedNotice.category}</span>
                <h3 className="stn-modal-title">{selectedNotice.title}</h3>
                <div className="stn-modal-meta">
                  <span>📅 {formatDate(selectedNotice.date)}</span>
                  <span>•</span>
                  <span>👤 Issued by {selectedNotice.createdBy}</span>
                </div>
              </div>

              <button className="stn-modal-close" onClick={() => setSelectedNotice(null)}>
                <FiX size={18} />
              </button>
            </div>

            <div className="stn-modal-body">
              <div className="stn-full-notice-text">
                {selectedNotice.description}
              </div>
            </div>

            <div className="stn-modal-footer">
              <button
                className="stn-btn stn-btn-secondary"
                onClick={() => setSelectedNotice(null)}
              >
                Close Circular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
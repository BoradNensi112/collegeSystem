import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiBell,
  FiPlusCircle,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiEdit2,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiPaperclip,
  FiCalendar,
  FiEye,
  FiCheck,
  FiX,
  FiBookmark,
  FiSend,
  FiFileText,
  FiGlobe,
  FiUsers,
  FiUserCheck,
  FiClock,
  FiTag,
  FiSliders,
  FiChevronRight,
  FiExternalLink
} from "react-icons/fi";
import "../../layout/admin/noticeDashboard.css";

const API_BASE = `${import.meta.env.VITE_API_BASE || "http://localhost:5001"}/Notice`;

const API = {
  list: `${API_BASE}/postNoticeData`,
  create: `${API_BASE}/create`,
  update: `${API_BASE}/update`,
  remove: `${API_BASE}/delete`,
  toggle: `${API_BASE}/toggle`,
  one: `${API_BASE}/one`,
};

const cn = (...a) => a.filter(Boolean).join(" ");

const isoNowLocal = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const normalizeNotice = (n) => ({
  notice_id: n.notice_id ?? n.id ?? n.noticeId ?? n._id ?? null,
  title: n.title ?? "",
  message: n.description ?? n.message ?? n.body ?? "",
  category: n.category ?? "General",
  audience: String(n.audience ?? n.visibility ?? "ALL").toUpperCase(),
  priority: String(n.priority ?? "NORMAL").toUpperCase(),
  status: String(n.status ?? "PUBLISHED").toUpperCase(),
  pinned: Boolean(n.pinned ?? false),
  attachmentUrl: n.attachment_url ?? n.attachmentUrl ?? n.fileUrl ?? n.url ?? "",
  createdAt: n.created_at ?? n.createdAt ?? n.uploadedAt ?? "",
  publishAt: n.publish_at ?? n.publishAt ?? n.publishedAt ?? "",
  by: n.issue_by ?? n.by ?? n.faculty ?? n.author ?? "Admin",
});

const initialForm = {
  notice_id: null,
  title: "",
  message: "",
  category: "General",
  audience: "ALL",
  priority: "NORMAL",
  status: "PUBLISHED",
  pinned: false,
  publishAt: "",
  attachmentUrl: "",
  by: "Admin",
};

const CATEGORIES = [
  "General",
  "Examination",
  "Fee Circular",
  "Academics",
  "Holiday",
  "Campus Event",
  "Placement",
  "Sports",
  "Workshop",
  "Emergency"
];

function fmt(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) {
    const s = String(d);
    if (s.length >= 16) return s.slice(0, 16).replace("T", " ");
    return s;
  }
  return dt.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AdminNoticePro() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [list, setList] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [mode, setMode] = useState("create");

  const [q, setQ] = useState("");
  const [aud, setAud] = useState("ALL");
  const [st, setSt] = useState("ALL");
  const [pr, setPr] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sort, setSort] = useState("NEW");

  const [drawer, setDrawer] = useState({ open: false, item: null });
  const [confirmDel, setConfirmDel] = useState({ open: false, item: null });

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const closeDrawer = () => setDrawer({ open: false, item: null });
  const closeConfirm = () => setConfirmDel({ open: false, item: null });

  const fetchList = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await axios.post(API.list, {});
      const raw = res?.data?.data ?? [];
      const arr = Array.isArray(raw) ? raw.map(normalizeNotice) : [];

      setList(arr);

      if (drawer.open && drawer.item?.notice_id) {
        const latest = arr.find(
          (x) => String(x.notice_id) === String(drawer.item.notice_id)
        );
        if (latest) {
          setDrawer({ open: true, item: latest });
        } else {
          closeDrawer();
        }
      }
    } catch (e) {
      console.error("Notice fetch error:", e);
      showToast("err", e?.response?.data?.message || e.message || "Failed to load notices");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchList();

    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const el = document.getElementById("nz-pro-search");
        el?.focus();
      }
      if (e.key === "Escape") {
        closeDrawer();
        closeConfirm();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const stats = useMemo(() => {
    const total = list.length;
    const published = list.filter((x) => x.status === "PUBLISHED").length;
    const draft = list.filter((x) => x.status === "DRAFT").length;
    const high = list.filter((x) => x.priority === "HIGH").length;
    return { total, published, draft, high };
  }, [list]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const rankPriority = (p) => (p === "HIGH" ? 3 : p === "NORMAL" ? 2 : 1);

    const arr = list.filter((n) => {
      const title = String(n.title || "").toLowerCase();
      const message = String(n.message || "").toLowerCase();
      const id = String(n.notice_id || "").toLowerCase();
      const cat = String(n.category || "").toLowerCase();

      const matchText = !t || title.includes(t) || message.includes(t) || id.includes(t) || cat.includes(t);
      const matchAud = aud === "ALL" ? true : n.audience === aud;
      const matchSt = st === "ALL" ? true : n.status === st;
      const matchPr = pr === "ALL" ? true : n.priority === pr;
      const matchCat = categoryFilter === "ALL" ? true : n.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchText && matchAud && matchSt && matchPr && matchCat;
    });

    arr.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

      if (sort === "OLD") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }

      if (sort === "PRIORITY") {
        const r = rankPriority(b.priority) - rankPriority(a.priority);
        if (r !== 0) return r;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }

      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return arr;
  }, [list, q, aud, st, pr, categoryFilter, sort]);

  const validate = (f) => {
    const e = {};

    if (!f.title?.trim()) e.title = "Please enter notice title";
    else if (f.title.trim().length < 3) e.title = "Title must be at least 3 characters";

    if (!f.message?.trim()) e.message = "Please enter notice announcement message";
    else if (f.message.trim().length < 5) e.message = "Message must be at least 5 characters";

    if (!["ALL", "STUDENT", "FACULTY"].includes(f.audience)) e.audience = "Invalid audience selected";
    if (!["LOW", "NORMAL", "HIGH"].includes(f.priority)) e.priority = "Invalid priority";
    if (!["PUBLISHED", "DRAFT"].includes(f.status)) e.status = "Invalid status";

    if (f.attachmentUrl && !/^https?:\/\/|^\/uploads\//i.test(f.attachmentUrl)) {
      e.attachmentUrl = "Please provide valid URL (e.g. https://... or /uploads/..)";
    }

    return e;
  };

  const resetToCreate = () => {
    setMode("create");
    setForm(initialForm);
    setFormErrors({});
  };

  const loadToEdit = (item) => {
    setMode("edit");
    setFormErrors({});
    setForm({
      notice_id: item.notice_id,
      title: item.title || "",
      message: item.message || "",
      category: item.category || "General",
      audience: item.audience || "ALL",
      priority: item.priority || "NORMAL",
      status: item.status || "PUBLISHED",
      pinned: Boolean(item.pinned),
      publishAt: item.publishAt ? String(item.publishAt).slice(0, 16) : "",
      attachmentUrl: item.attachmentUrl || "",
      by: item.by || "Admin",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    closeDrawer();
  };

  const save = async () => {
    const e = validate(form);
    setFormErrors(e);
    if (Object.keys(e).length) return;

    try {
      setSaving(true);

      const payload = {
        notice_id: form.notice_id,
        title: form.title.trim(),
        message: form.message.trim(),
        description: form.message.trim(),
        category: form.category?.trim() || "General",
        audience: form.audience,
        priority: form.priority,
        status: form.status,
        pinned: Boolean(form.pinned),
        publish_at: form.publishAt || null,
        publishAt: form.publishAt || null,
        attachment_url: form.attachmentUrl || null,
        attachmentUrl: form.attachmentUrl || null,
        issue_by: form.by || "Admin",
        by: form.by || "Admin",
      };

      if (mode === "edit" && form.notice_id) {
        await axios.post(API.update, payload);
        showToast("ok", "Notice bulletin updated successfully");
      } else {
        await axios.post(API.create, payload);
        showToast("ok", "New notice broadcasted and published");
      }

      await fetchList();
      resetToCreate();
    } catch (err) {
      console.error("Save notice error:", err);
      showToast("err", err?.response?.data?.message || err.message || "Save notice failed");
    } finally {
      setSaving(false);
    }
  };

  const removeNotice = async (item) => {
    const id = item?.notice_id ?? item?.id ?? form?.notice_id ?? null;

    if (!id) {
      showToast("err", "Notice ID missing");
      return;
    }

    try {
      const res = await axios.post(API.remove, {
        notice_id: id,
        id,
      });

      const ok =
        res?.status === 200 &&
        (res?.data?.success === true ||
          res?.data?.message === "Notice deleted" ||
          res?.data?.message === "Notice deleted successfully" ||
          Number(res?.data?.data) > 0);

      if (!ok) {
        throw new Error(res?.data?.message || "Delete failed");
      }

      setList((prev) => prev.filter((x) => String(x.notice_id) !== String(id)));
      closeConfirm();
      showToast("ok", "Notice removed from board");

      if (drawer.open && String(drawer.item?.notice_id) === String(id)) {
        closeDrawer();
      }

      if (mode === "edit" && String(form.notice_id) === String(id)) {
        resetToCreate();
      }

      await fetchList();
    } catch (err) {
      console.error("Delete notice error:", err);
      showToast("err", err?.response?.data?.message || err.message || "Delete notice failed");
    }
  };

  const togglePublish = async (item) => {
    if (!item?.notice_id) return;

    try {
      try {
        await axios.post(API.toggle, {
          notice_id: item.notice_id,
          id: item.notice_id,
        });
      } catch {
        const nextStatus = item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
        await axios.post(API.update, {
          notice_id: item.notice_id,
          title: item.title,
          message: item.message,
          description: item.message,
          category: item.category,
          audience: item.audience,
          priority: item.priority,
          status: nextStatus,
          pinned: item.pinned,
          publish_at: item.publishAt || null,
          attachment_url: item.attachmentUrl || null,
          issue_by: item.by || "Admin",
        });
      }

      showToast("ok", `Notice marked as ${item.status === "PUBLISHED" ? "Draft" : "Published"}`);
      await fetchList();
    } catch (err) {
      console.error("Toggle publish error:", err);
      showToast("err", err?.response?.data?.message || err.message || "Status toggle failed");
    }
  };

  const resetFilters = () => {
    setQ("");
    setAud("ALL");
    setSt("ALL");
    setPr("ALL");
    setCategoryFilter("ALL");
    setSort("NEW");
  };

  const isFiltered = q || aud !== "ALL" || st !== "ALL" || pr !== "ALL" || categoryFilter !== "ALL";

  return (
    <div className="nzpro-root">
      {/* Toast Notification */}
      {toast && (
        <div className={`nz-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheck /> : <FiAlertCircle />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* =========================================================
          1. HERO COMMAND BANNER
          ========================================================= */}
      <section className="nz-hero-banner">
        <div className="nz-hero-left">
          <div className="nz-live-chip">
            <span className="nz-ping" />
            <span className="nz-live-txt">CAMPUS BULLETINS &amp; ANNOUNCEMENTS • CONTROL CENTER</span>
          </div>
          <h1 className="nz-hero-title">Notices &amp; Circulars</h1>
          <p className="nz-hero-sub">
            Broadcast official university circulars, examination schedules, fee alerts, and departmental bulletins.
          </p>
        </div>

        <div className="nz-hero-right">
          <div className="nz-kpi-row">
            <div className="nz-kpi-pill">
              <span className="kpi-lbl">Total Bulletins</span>
              <span className="kpi-val">{stats.total}</span>
            </div>
            <div className="nz-kpi-pill published">
              <span className="kpi-lbl">Published</span>
              <span className="kpi-val">{stats.published}</span>
            </div>
            <div className="nz-kpi-pill draft">
              <span className="kpi-lbl">Drafts</span>
              <span className="kpi-val">{stats.draft}</span>
            </div>
            <div className="nz-kpi-pill high">
              <span className="kpi-lbl">Urgent / High</span>
              <span className="kpi-val">{stats.high}</span>
            </div>
          </div>

          <div className="nz-hero-actions">
            <button
              className={`nz-btn ghost ${refreshing ? "spinning" : ""}`}
              onClick={() => fetchList(true)}
              disabled={refreshing}
              title="Refresh database feed"
            >
              <FiRefreshCw className={refreshing ? "spin-ico" : ""} />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>

            <button
              className="nz-btn primary"
              onClick={resetToCreate}
            >
              <FiPlusCircle />
              <span>+ New Notice</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          2. DUAL-WORKBENCH GRID (COMPOSER & FEED)
          ========================================================= */}
      <div className="nz-workbench-grid">
        {/* LEFT COLUMN: NOTICE COMPOSER */}
        <div className="nz-panel composer-panel">
          <div className="panel-header">
            <div className="panel-header-info">
              <div className="panel-title-row">
                <div className="composer-ico-box">
                  {mode === "edit" ? <FiEdit2 /> : <FiSend />}
                </div>
                <div>
                  <h3 className="panel-title">
                    {mode === "edit" ? `Edit Notice #${form.notice_id}` : "Publish New Notice"}
                  </h3>
                  <p className="panel-subtitle">
                    {mode === "edit" ? "Modify notice body, target audience or priority" : "Draft and dispatch official campus communications"}
                  </p>
                </div>
              </div>
            </div>

            {mode === "edit" && (
              <button className="nz-btn ghost small reset-btn" onClick={resetToCreate}>
                ✕ Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); save(); }} className="composer-body">
            {/* Notice Title */}
            <div className="nz-field">
              <label htmlFor="notice-title">
                Notice Headline / Subject <span className="req">*</span>
              </label>
              <div className="input-wrap">
                <FiFileText className="input-ico" />
                <input
                  id="notice-title"
                  type="text"
                  placeholder="e.g. End Semester Examination Schedule - Autumn 2026"
                  value={form.title}
                  onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                />
              </div>
              {formErrors.title && <span className="nz-field-err">{formErrors.title}</span>}
            </div>

            {/* Message Body */}
            <div className="nz-field">
              <label htmlFor="notice-message">
                Announcement Details &amp; Message <span className="req">*</span>
              </label>
              <textarea
                id="notice-message"
                rows={5}
                placeholder="Write comprehensive circular instructions, deadlines, guidelines, or venue details..."
                value={form.message}
                onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
              />
              {formErrors.message && <span className="nz-field-err">{formErrors.message}</span>}
            </div>

            {/* Target Audience, Priority & Status */}
            <div className="nz-form-grid-3">
              <div className="nz-field">
                <label htmlFor="notice-audience">Target Audience</label>
                <div className="select-wrap">
                  <FiUsers className="select-ico" />
                  <select
                    id="notice-audience"
                    value={form.audience}
                    onChange={(e) => setForm((s) => ({ ...s, audience: e.target.value }))}
                  >
                    <option value="ALL">All Campus (Everyone)</option>
                    <option value="STUDENT">Students Only</option>
                    <option value="FACULTY">Faculty &amp; Staff</option>
                  </select>
                </div>
              </div>

              <div className="nz-field">
                <label htmlFor="notice-priority">Priority Level</label>
                <div className="select-wrap">
                  <FiAlertCircle className="select-ico" />
                  <select
                    id="notice-priority"
                    value={form.priority}
                    onChange={(e) => setForm((s) => ({ ...s, priority: e.target.value }))}
                  >
                    <option value="NORMAL">Normal Priority</option>
                    <option value="HIGH">High / Urgent 🔴</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="nz-field">
                <label htmlFor="notice-status">Visibility Status</label>
                <div className="select-wrap">
                  <FiGlobe className="select-ico" />
                  <select
                    id="notice-status"
                    value={form.status}
                    onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
                  >
                    <option value="PUBLISHED">Published (Live)</option>
                    <option value="DRAFT">Draft (Saved Only)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Category & Publish Schedule */}
            <div className="nz-form-grid-2">
              <div className="nz-field">
                <label htmlFor="notice-category">Notice Category</label>
                <div className="category-input-group">
                  <select
                    value={CATEGORIES.includes(form.category) ? form.category : "Custom"}
                    onChange={(e) => {
                      if (e.target.value !== "Custom") {
                        setForm((s) => ({ ...s, category: e.target.value }));
                      }
                    }}
                    className="category-select"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="Custom">+ Custom Category</option>
                  </select>
                  {(!CATEGORIES.includes(form.category) || form.category === "Custom") && (
                    <input
                      type="text"
                      placeholder="Enter category name..."
                      value={form.category === "Custom" ? "" : form.category}
                      onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                      className="category-custom-input"
                    />
                  )}
                </div>
              </div>

              <div className="nz-field">
                <label htmlFor="notice-publish-at">Publish Schedule Date</label>
                <div className="datetime-input-group">
                  <input
                    id="notice-publish-at"
                    type="datetime-local"
                    value={form.publishAt}
                    onChange={(e) => setForm((s) => ({ ...s, publishAt: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="quick-now-btn"
                    onClick={() => setForm((s) => ({ ...s, publishAt: isoNowLocal() }))}
                    title="Set to Current Time"
                  >
                    Now
                  </button>
                </div>
              </div>
            </div>

            {/* Attachment URL & Pinned Toggle */}
            <div className="nz-form-grid-2">
              <div className="nz-field">
                <label htmlFor="notice-attachment">Document / File Link (Optional)</label>
                <div className="input-wrap">
                  <FiPaperclip className="input-ico" />
                  <input
                    id="notice-attachment"
                    type="text"
                    placeholder="https://drive.google.com/... or /uploads/circular.pdf"
                    value={form.attachmentUrl}
                    onChange={(e) => setForm((s) => ({ ...s, attachmentUrl: e.target.value }))}
                  />
                </div>
                {formErrors.attachmentUrl && (
                  <span className="nz-field-err">{formErrors.attachmentUrl}</span>
                )}
              </div>

              <div className="nz-field">
                <label>Pin Notice at Top</label>
                <div
                  className={`pin-toggle-card ${form.pinned ? "active" : ""}`}
                  onClick={() => setForm((s) => ({ ...s, pinned: !s.pinned }))}
                >
                  <div className="pin-toggle-left">
                    <FiBookmark className="pin-ico" />
                    <div className="pin-txt">
                      <strong>{form.pinned ? "📌 Pinned Bulletin" : "Normal Positioning"}</strong>
                      <span>{form.pinned ? "Displays prominently at top of all feeds" : "Positioned in chronological order"}</span>
                    </div>
                  </div>
                  <div className={`switch-pill ${form.pinned ? "on" : ""}`}>
                    <span className="switch-dot" />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="composer-actions">
              {mode === "edit" ? (
                <button
                  type="button"
                  className="nz-btn danger"
                  onClick={() =>
                    setConfirmDel({
                      open: true,
                      item: {
                        notice_id: form.notice_id,
                        id: form.notice_id,
                        title: form.title,
                      },
                    })
                  }
                >
                  <FiTrash2 />
                  <span>Delete Notice</span>
                </button>
              ) : (
                <button type="button" className="nz-btn ghost" onClick={resetToCreate}>
                  Clear Form
                </button>
              )}

              <button type="submit" className="nz-btn primary" disabled={saving}>
                {saving ? (
                  <>
                    <FiRefreshCw className="spin-ico" />
                    <span>Saving...</span>
                  </>
                ) : mode === "edit" ? (
                  <>
                    <FiCheckCircle />
                    <span>Update Bulletin</span>
                  </>
                ) : form.status === "DRAFT" ? (
                  <>
                    <FiFileText />
                    <span>Save as Draft</span>
                  </>
                ) : (
                  <>
                    <FiSend />
                    <span>🚀 Publish Bulletin</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: NOTICE FEED */}
        <div className="nz-panel feed-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Active Notice Board</h3>
              <p className="panel-subtitle">
                Search <kbd className="nz-kbd">Ctrl + K</kbd> • Click any bulletin card to view full details
              </p>
            </div>

            <div className="sort-box">
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="sort-select">
                <option value="NEW">Sort: Newest First</option>
                <option value="PRIORITY">Sort: Priority First</option>
                <option value="OLD">Sort: Oldest First</option>
              </select>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="feed-controls">
            <div className="feed-search-wrap">
              <FiSearch className="search-ico" />
              <input
                id="nz-pro-search"
                type="text"
                placeholder="Search bulletins by title, message, category, #ID..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q && <button className="clear-search-btn" onClick={() => setQ("")}>✕</button>}
            </div>

            <div className="filter-dropdowns">
              <select value={aud} onChange={(e) => setAud(e.target.value)}>
                <option value="ALL">All Audiences</option>
                <option value="STUDENT">Students</option>
                <option value="FACULTY">Faculty</option>
              </select>

              <select value={st} onChange={(e) => setSt(e.target.value)}>
                <option value="ALL">All Status</option>
                <option value="PUBLISHED">Published Only</option>
                <option value="DRAFT">Drafts Only</option>
              </select>

              <select value={pr} onChange={(e) => setPr(e.target.value)}>
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High Priority</option>
                <option value="NORMAL">Normal Priority</option>
                <option value="LOW">Low Priority</option>
              </select>

              {isFiltered && (
                <button className="nz-btn ghost small reset-filters-btn" onClick={resetFilters}>
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Results Counter */}
          <div className="feed-results-info">
            <span>Showing <strong>{filtered.length}</strong> bulletins</span>
            {stats.high > 0 && <span className="urgent-badge">🚨 {stats.high} Urgent Active</span>}
          </div>

          {/* Notice Card List */}
          <div className="feed-list-container">
            {loading ? (
              <div className="feed-loading-state">
                <FiRefreshCw className="spin-ico" />
                <span>Loading notices from PostgreSQL...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="feed-empty-state">
                <FiBell className="empty-ico" />
                <h4>No notice bulletins found</h4>
                <p>Try adjusting your search criteria or write a new notice in the left composer.</p>
                <button className="nz-btn primary small" onClick={resetToCreate}>
                  + Create New Notice
                </button>
              </div>
            ) : (
              filtered.map((n) => {
                const isPub = n.status === "PUBLISHED";
                const isHigh = n.priority === "HIGH";

                return (
                  <div
                    key={n.notice_id}
                    className={cn("nz-notice-card", n.pinned ? "pinned" : "", isHigh ? "high-priority" : "")}
                    onClick={() => setDrawer({ open: true, item: n })}
                  >
                    <div className="card-top-bar">
                      <div className="card-badge-row">
                        {n.pinned && (
                          <span className="badge-pill pin">
                            📌 PINNED
                          </span>
                        )}
                        <span className={cn("badge-pill status", isPub ? "published" : "draft")}>
                          <span className="dot" />
                          {n.status}
                        </span>
                        <span className={cn("badge-pill priority", isHigh ? "high" : n.priority === "LOW" ? "low" : "normal")}>
                          {n.priority}
                        </span>
                        <span className="badge-pill audience">
                          {n.audience === "ALL" ? "👥 All" : n.audience === "STUDENT" ? "🎓 Students" : "👨‍🏫 Faculty"}
                        </span>
                        <span className="badge-pill category">
                          🏷️ {n.category}
                        </span>
                      </div>

                      <span className="card-notice-id">#{n.notice_id}</span>
                    </div>

                    <h4 className="card-notice-title">{n.title}</h4>
                    <p className="card-notice-msg">{n.message}</p>

                    {n.attachmentUrl && (
                      <div className="card-attachment-tag">
                        <FiPaperclip />
                        <span>Has Document Attachment</span>
                      </div>
                    )}

                    <div className="card-footer-row">
                      <div className="card-meta-info">
                        <div className="meta-item">
                          <FiCalendar className="meta-ico" />
                          <span>{fmt(n.createdAt)}</span>
                        </div>
                        <div className="meta-item author">
                          <span>By <strong>{n.by || "Admin"}</strong></span>
                        </div>
                      </div>

                      <div className="card-action-bar" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="card-act-btn view"
                          onClick={() => setDrawer({ open: true, item: n })}
                          title="View Full Notice Details"
                        >
                          <FiEye />
                        </button>

                        <button
                          type="button"
                          className="card-act-btn edit"
                          onClick={() => loadToEdit(n)}
                          title="Edit in Composer"
                        >
                          <FiEdit2 />
                        </button>

                        <button
                          type="button"
                          className={cn("card-act-btn toggle", isPub ? "unpub" : "pub")}
                          onClick={() => togglePublish(n)}
                          title={isPub ? "Mark as Draft (Unpublish)" : "Publish Live"}
                        >
                          {isPub ? "Unpublish" : "Publish"}
                        </button>

                        <button
                          type="button"
                          className="card-act-btn delete"
                          onClick={() =>
                            setConfirmDel({
                              open: true,
                              item: {
                                ...n,
                                id: n.notice_id,
                              },
                            })
                          }
                          title="Delete Bulletin"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* =========================================================
          3. FULL DETAIL MODAL DRAWER
          ========================================================= */}
      {drawer.open && drawer.item && (
        <div className="nz-drawer-backdrop" onClick={closeDrawer}>
          <div className="nz-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-title-box">
                <div className="drawer-id-badge">#{drawer.item.notice_id}</div>
                <div>
                  <h3 className="drawer-title">{drawer.item.title}</h3>
                  <p className="drawer-sub">
                    Published by <strong>{drawer.item.by || "Admin"}</strong>
                  </p>
                </div>
              </div>
              <button className="drawer-close-btn" onClick={closeDrawer}>
                <FiX />
              </button>
            </div>

            <div className="drawer-badges-bar">
              {drawer.item.pinned && <span className="badge-pill pin">📌 PINNED</span>}
              <span className={cn("badge-pill status", drawer.item.status === "PUBLISHED" ? "published" : "draft")}>
                {drawer.item.status}
              </span>
              <span className={cn("badge-pill priority", drawer.item.priority === "HIGH" ? "high" : "normal")}>
                {drawer.item.priority} Priority
              </span>
              <span className="badge-pill audience">👥 {drawer.item.audience}</span>
              <span className="badge-pill category">🏷️ {drawer.item.category}</span>
            </div>

            <div className="drawer-content-body">
              <div className="drawer-message-card">
                <h5 className="section-label">Notice Message:</h5>
                <p className="full-text-message">{drawer.item.message}</p>
              </div>

              {drawer.item.attachmentUrl && (
                <div className="drawer-attachment-card">
                  <h5 className="section-label">Attached Document / Resource:</h5>
                  <a
                    href={drawer.item.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="attachment-download-link"
                  >
                    <FiPaperclip className="att-ico" />
                    <span className="att-url">{drawer.item.attachmentUrl}</span>
                    <FiExternalLink className="ext-ico" />
                  </a>
                </div>
              )}

              <div className="drawer-meta-grid">
                <div className="drawer-meta-card">
                  <span className="m-lbl">Issued On</span>
                  <span className="m-val">{fmt(drawer.item.createdAt)}</span>
                </div>
                <div className="drawer-meta-card">
                  <span className="m-lbl">Scheduled Publish</span>
                  <span className="m-val">
                    {drawer.item.publishAt ? fmt(drawer.item.publishAt) : "Instant Publication"}
                  </span>
                </div>
              </div>
            </div>

            <div className="drawer-footer-actions">
              <button
                className="nz-btn ghost"
                onClick={() => loadToEdit(drawer.item)}
              >
                <FiEdit2 />
                <span>Edit Notice</span>
              </button>

              <button
                className={cn("nz-btn", drawer.item.status === "PUBLISHED" ? "ghost" : "primary")}
                onClick={() => togglePublish(drawer.item)}
              >
                {drawer.item.status === "PUBLISHED" ? "Unpublish Notice" : "Publish Now"}
              </button>

              <button
                className="nz-btn danger"
                onClick={() =>
                  setConfirmDel({
                    open: true,
                    item: {
                      ...drawer.item,
                      id: drawer.item.notice_id,
                    },
                  })
                }
              >
                <FiTrash2 />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          4. DELETE CONFIRMATION MODAL
          ========================================================= */}
      {confirmDel.open && (
        <div className="nz-modal-backdrop" onClick={closeConfirm}>
          <div className="nz-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-danger">
                <FiTrash2 />
              </div>
              <div>
                <h3 className="modal-title">Delete Notice Bulletin?</h3>
                <p className="modal-sub">This action will remove the notice from the live database.</p>
              </div>
            </div>

            <div className="delete-target-preview">
              <span className="del-id">#{confirmDel.item?.notice_id ?? confirmDel.item?.id}</span>
              <strong className="del-title">{confirmDel.item?.title || "Untitled Notice"}</strong>
            </div>

            <div className="modal-footer">
              <button className="nz-btn ghost" onClick={closeConfirm}>
                Cancel
              </button>
              <button
                className="nz-btn danger"
                onClick={() => removeNotice(confirmDel.item)}
              >
                Yes, Delete Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
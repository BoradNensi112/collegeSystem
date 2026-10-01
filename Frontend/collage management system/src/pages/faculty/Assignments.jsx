import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  FiBook,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEdit2,
  FiExternalLink,
  FiFileText,
  FiFilter,
  FiLayers,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUploadCloud,
  FiUser,
  FiUsers,
  FiX,
  FiAlertCircle,
  FiAward
} from "react-icons/fi";
import "../../layout/faculty/Assignments.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

const API = {
  list: `${API_BASE}/Assignment/postViewData`,
  create: `${API_BASE}/Assignment/Aadd`,
  update: `${API_BASE}/Assignment/Aupdate`,
  remove: `${API_BASE}/Assignment/delete`,
  submissionsByAssignment: `${API_BASE}/Assignment/submitted-by-assignment`,
  courses: `${API_BASE}/Course/list`,
  timetable: `${API_BASE}/Timetable/list`,
};

const allowedExt = ["pdf", "doc", "docx", "ppt", "pptx", "zip", "rar", "png", "jpg", "jpeg"];
const maxFileMB = 50;

const DEFAULT_COURSES = [
  { code: "BCA", name: "Bachelor of Computer Applications", maxSem: 6 },
  { code: "B.Tech CSE", name: "B.Tech Computer Science", maxSem: 8 },
  { code: "MCA", name: "Master of Computer Applications", maxSem: 4 },
  { code: "BBA", name: "Bachelor of Business Administration", maxSem: 6 },
  { code: "BCom", name: "Bachelor of Commerce", maxSem: 6 },
];

const DEFAULT_SUBJECTS = [
  "Python Programming",
  "Database Management Systems",
  "Data Structures & Algorithms",
  "Web Technology & Frameworks",
  "Computer Networks & Security",
  "Java Programming",
  "Software Engineering",
  "Operating Systems",
];

const fmtDate = (d) => {
  if (!d) return "No Due Date";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(d).slice(0, 10);
  }
};

function bytesToSize(bytes) {
  if (!bytes && bytes !== 0) return "-";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function isOverdue(due_date) {
  if (!due_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(String(due_date).slice(0, 10));
  return due < today;
}

function isDueSoon(due_date, days = 3) {
  if (!due_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(String(due_date).slice(0, 10));
  const diff = (due - today) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
}

function validateFile(file) {
  if (!file) return { ok: false, msg: "File required" };
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!allowedExt.includes(ext)) return { ok: false, msg: `Invalid file type .${ext}. Allowed: ${allowedExt.join(", ")}` };
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxFileMB) return { ok: false, msg: `File too large. Max ${maxFileMB}MB allowed.` };
  return { ok: true, msg: "" };
}

function extractList(res) {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.rows)) return d.rows;
  if (Array.isArray(d?.result)) return d.result;
  if (Array.isArray(d?.items)) return d.items;
  return [];
}

export default function FacultyAssignments() {
  const fileRef = useRef(null);

  const [coursesList, setCoursesList] = useState(DEFAULT_COURSES);
  const [subjectsList, setSubjectsList] = useState(DEFAULT_SUBJECTS);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState("create"); // 'create' | 'edit'
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    subject: "Python Programming",
    class_name: "BCA",
    sem: 6,
    title: "",
    description: "",
    due_date: "",
    total_marks: 50,
    status: "ACTIVE",
  });

  const [file, setFile] = useState(null);
  const [fileErr, setFileErr] = useState("");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  const [q, setQ] = useState("");
  const [semFilter, setSemFilter] = useState("ALL");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [sort, setSort] = useState("newest");

  const [toast, setToast] = useState(null);

  // Submissions state
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  const showToast = (message, type = "ok") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync courses & subjects from database
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [cRes, ttRes] = await Promise.all([
          axios.post(API.courses, {}).catch(() => null),
          axios.post(API.timetable, {}).catch(() => null),
        ]);

        if (cRes?.data?.data && Array.isArray(cRes.data.data)) {
          const cList = cRes.data.data.map((c) => ({
            code: c.course_code || c.course_name,
            name: c.course_name,
            maxSem: c.total_semesters || 6,
          }));
          if (cList.length > 0) setCoursesList(cList);
        }

        if (ttRes?.data) {
          const rows = Array.isArray(ttRes.data) ? ttRes.data : ttRes.data.data || [];
          const sList = Array.from(
            new Set(rows.map((r) => r.subject?.trim()).filter(Boolean))
          );
          if (sList.length > 0) setSubjectsList(sList);
        }
      } catch {
        // fallback
      }
    };
    fetchMetadata();
  }, []);

  const resetForm = () => {
    setForm({
      subject: subjectsList[0] || "Python Programming",
      class_name: coursesList[0]?.code || "BCA",
      sem: 6,
      title: "",
      description: "",
      due_date: "",
      total_marks: 50,
      status: "ACTIVE",
    });
    setFile(null);
    setFileErr("");
    setMode("create");
    setEditId(null);
    setProgress(0);
    if (fileRef.current) fileRef.current.value = "";
  };

  const openCreate = () => {
    resetForm();
    setDrawerOpen(true);
  };

  const openEdit = (row) => {
    const id = row.assignment_id || row.id;
    setMode("edit");
    setEditId(id);

    setForm({
      subject: row.subject ?? subjectsList[0] ?? "",
      class_name: row.class_name ?? "BCA",
      sem: row.sem ?? 6,
      title: row.title ?? "",
      description: row.description ?? "",
      due_date: row.due_date ? String(row.due_date).slice(0, 10) : "",
      total_marks: row.total_marks ?? 50,
      status: row.status ?? "ACTIVE",
    });

    setFile(null);
    setFileErr("");
    if (fileRef.current) fileRef.current.value = "";
    setDrawerOpen(true);
  };

  const pickFile = (f) => {
    if (!f) return;
    const v = validateFile(f);
    if (!v.ok) {
      setFile(null);
      setFileErr(v.msg);
      showToast(v.msg, "err");
      return;
    }
    setFile(f);
    setFileErr("");
  };

  const fetchList = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.post(API.list, {});
      const data = extractList(res);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      if (!silent) showToast(e?.response?.data?.message || "Failed to load assignments", "err");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(false);
  }, []);

  // Filtered & Sorted Assignments List
  const derived = useMemo(() => {
    let arr = [...items];

    if (q.trim()) {
      const s = q.trim().toLowerCase();
      arr = arr.filter(
        (x) =>
          (x.title || "").toLowerCase().includes(s) ||
          (x.subject || "").toLowerCase().includes(s) ||
          String(x.sem || "").includes(s) ||
          String(x.class_name || "").toLowerCase().includes(s) ||
          (x.description || "").toLowerCase().includes(s)
      );
    }

    if (semFilter !== "ALL") {
      arr = arr.filter((x) => String(x.sem) === String(semFilter));
    }

    if (courseFilter !== "ALL") {
      arr = arr.filter((x) =>
        String(x.class_name || "")
          .toLowerCase()
          .includes(courseFilter.toLowerCase())
      );
    }

    if (sort === "newest") {
      arr.sort(
        (a, b) =>
          new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0)
      );
    } else if (sort === "dueSoon") {
      arr.sort(
        (a, b) =>
          new Date(a.due_date || "2999-12-31") - new Date(b.due_date || "2999-12-31")
      );
    } else if (sort === "overdue") {
      arr.sort((a, b) => Number(isOverdue(b.due_date)) - Number(isOverdue(a.due_date)));
    } else if (sort === "marks") {
      arr.sort((a, b) => Number(b.total_marks || 0) - Number(a.total_marks || 0));
    }

    const total = items.length;
    const dueSoon = items.filter((x) => isDueSoon(x.due_date, 3)).length;
    const overdue = items.filter((x) => isOverdue(x.due_date)).length;
    const activeCount = items.filter((x) => x.status === "ACTIVE").length;

    return { arr, stats: { total, dueSoon, overdue, activeCount } };
  }, [items, q, semFilter, courseFilter, sort]);

  // Open uploaded assignment resource
  const openFile = (row) => {
    const url = row.file_url;
    if (!url) return showToast("No attachment file uploaded with this assignment", "err");
    const full = url.startsWith("http") ? url : `${API_BASE}${url}`;
    window.open(full, "_blank");
  };

  // Open student submissions modal
  const openSubmissions = async (row) => {
    try {
      setSelectedAssignment(row);
      setSubmissions([]);
      setSubmissionsOpen(true);
      setSubmissionLoading(true);

      const assignmentId = row.assignment_id || row.id;
      const res = await axios.post(API.submissionsByAssignment, {
        assignment_id: assignmentId,
      });

      const data = extractList(res);
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("SUBMISSIONS ERROR:", e);
      setSubmissions([]);
      showToast(e?.response?.data?.message || "Failed to fetch student submissions", "err");
    } finally {
      setSubmissionLoading(false);
    }
  };

  // Save / Submit Assignment
  const submit = async (e) => {
    if (e) e.preventDefault();

    if (!form.title?.trim()) return showToast("Assignment title is required", "err");
    if (!form.subject?.trim()) return showToast("Subject name is required", "err");
    if (!form.class_name?.trim()) return showToast("Course degree is required", "err");
    if (!form.sem) return showToast("Semester is required", "err");
    if (!form.due_date) return showToast("Due date is required", "err");

    try {
      setSaving(true);
      setProgress(0);

      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("subject", form.subject.trim());
      fd.append("class_name", form.class_name.trim());
      fd.append("sem", form.sem);
      fd.append("description", form.description.trim());
      fd.append("due_date", form.due_date);
      fd.append("total_marks", form.total_marks || 50);
      fd.append("status", form.status);

      if (mode === "edit") {
        fd.append("assignment_id", editId);
      }

      if (file) {
        fd.append("file", file);
      }

      const url = mode === "edit" ? API.update : API.create;

      await axios.post(url, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const pct = Math.round((evt.loaded * 100) / evt.total);
          setProgress(pct);
        },
      });

      showToast(
        mode === "edit" ? "Assignment updated successfully!" : "New Assignment published successfully!",
        "ok"
      );
      setDrawerOpen(false);
      resetForm();
      fetchList(false);
    } catch (e) {
      console.error("SAVE ERROR:", e);
      showToast(e?.response?.data?.message || "Save assignment failed", "err");
    } finally {
      setSaving(false);
      setProgress(0);
    }
  };

  // Delete assignment
  const removeItem = async (row) => {
    const id = row.assignment_id || row.id;
    if (!id) return showToast("Assignment ID missing", "err");

    const ok = window.confirm(`Are you sure you want to delete assignment "${row.title}"?`);
    if (!ok) return;

    try {
      await axios.post(API.remove, { assignment_id: id });
      showToast("Assignment deleted successfully", "ok");
      fetchList(false);
    } catch (e) {
      showToast(e?.response?.data?.message || "Delete failed", "err");
    }
  };

  const semOptions = useMemo(() => {
    const set = new Set(
      items
        .map((x) => x.sem)
        .filter((x) => x !== null && x !== undefined && x !== "")
        .map(String)
    );
    if (set.size === 0) return ["1", "2", "3", "4", "5", "6", "7", "8"];
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [items]);

  return (
    <div className="fac-assign-page">
      {/* Background ambient lighting */}
      <div className="fac-bg-orb fmu-orb-1"></div>
      <div className="fac-bg-orb fmu-orb-2"></div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fac-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. HERO COMMAND BANNER */}
      <div className="fac-header">
        <div className="fac-hero-left">
          <div className="fac-live-chip">
            <span className="fac-ping"></span>
            <span className="fac-live-txt">COURSEWORK &amp; ASSIGNMENT CONTROL CENTER</span>
          </div>
          <h1 className="fac-hero-title">Assignment Management</h1>
          <p className="fac-hero-sub">
            Create coursework tasks, attach problem sets, track deadlines and grade student submissions.
          </p>
        </div>

        <div className="fac-hero-actions">
          <button
            className="fac-btn fac-btn-secondary"
            onClick={() => fetchList(false)}
            disabled={loading}
            title="Sync latest assignments from PostgreSQL database"
          >
            <FiRefreshCw className={loading ? "fac-spin" : ""} />
            <span>Sync</span>
          </button>

          <button className="fac-btn fac-btn-primary" onClick={openCreate}>
            <FiPlus />
            <span>New Assignment</span>
          </button>
        </div>
      </div>

      {/* 2. LIVE METRICS HUD */}
      <div className="fac-metrics-hud">
        <div className="fac-hud-card total">
          <div className="hud-top">
            <span className="hud-lbl">Total Tasks</span>
            <FiFileText className="hud-icon cyan" />
          </div>
          <strong className="hud-val cyan">{derived.stats.total}</strong>
          <span className="hud-sub">Assignments Created</span>
        </div>

        <div className="fac-hud-card active">
          <div className="hud-top">
            <span className="hud-lbl">Active &amp; Open</span>
            <FiCheckCircle className="hud-icon green" />
          </div>
          <strong className="hud-val green">{derived.stats.activeCount}</strong>
          <span className="hud-badge green">Accepting Submissions</span>
        </div>

        <div className="fac-hud-card due">
          <div className="hud-top">
            <span className="hud-lbl">Due Soon (&le;3 Days)</span>
            <FiClock className="hud-icon amber" />
          </div>
          <strong className="hud-val amber">{derived.stats.dueSoon}</strong>
          <span className="hud-sub">Approaching Deadline</span>
        </div>

        <div className="fac-hud-card overdue">
          <div className="hud-top">
            <span className="hud-lbl">Overdue</span>
            <FiAlertCircle className="hud-icon red" />
          </div>
          <strong className="hud-val red">{derived.stats.overdue}</strong>
          <span className="hud-sub">Passed Deadline</span>
        </div>
      </div>

      {/* 3. FILTER & SEARCH TOOLBAR */}
      <div className="fac-controls-panel">
        <div className="search-group">
          <div className="search-wrap">
            <FiSearch className="s-ico" />
            <input
              type="text"
              placeholder="Search by title, subject, course, or semester..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="fac-search-input"
            />
          </div>
        </div>

        <div className="filter-group">
          <label><FiLayers className="ctrl-icon" /> Semester:</label>
          <select value={semFilter} onChange={(e) => setSemFilter(e.target.value)} className="fac-select">
            <option value="ALL">All Semesters</option>
            {semOptions.map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label><FiBook className="ctrl-icon" /> Course:</label>
          <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="fac-select">
            <option value="ALL">All Courses</option>
            {coursesList.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label><FiFilter className="ctrl-icon" /> Sort:</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="fac-select">
            <option value="newest">Newest First</option>
            <option value="dueSoon">Due Soonest</option>
            <option value="overdue">Overdue First</option>
            <option value="marks">Highest Marks</option>
          </select>
        </div>
      </div>

      {/* 4. INTERACTIVE ASSIGNMENT CARDS GRID */}
      {loading ? (
        <div className="fac-loading-box">
          <FiRefreshCw className="fac-spin" size={32} />
          <span>Loading assignments from database...</span>
        </div>
      ) : derived.arr.length === 0 ? (
        <div className="fac-empty-box">
          <FiFileText size={48} className="empty-ico" />
          <h3>No Assignments Found</h3>
          <p>There are no assignments matching your current search or filter criteria.</p>
          <button className="fac-btn fac-btn-primary" onClick={openCreate} style={{ marginTop: "12px" }}>
            + Create First Assignment
          </button>
        </div>
      ) : (
        <div className="fac-cards-grid">
          {derived.arr.map((row) => {
            const overdue = isOverdue(row.due_date);
            const dueSoon = isDueSoon(row.due_date);

            return (
              <div key={row.assignment_id || row.id} className="fac-assign-card">
                {/* Top Badge & Deadline Indicator */}
                <div className="card-top-row">
                  <span className="card-subject-badge">
                    {row.subject}
                  </span>

                  <span
                    className={`card-status-badge ${
                      row.status === "CLOSED"
                        ? "closed"
                        : overdue
                        ? "overdue"
                        : dueSoon
                        ? "duesoon"
                        : "active"
                    }`}
                  >
                    {row.status === "CLOSED"
                      ? "Closed"
                      : overdue
                      ? "Overdue"
                      : dueSoon
                      ? "Due Soon"
                      : "Active"}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="card-title">{row.title}</h3>
                <p className="card-desc">{row.description || "No specific instructions provided."}</p>

                {/* Class & Metric Chips */}
                <div className="card-chips-grid">
                  <div className="chip-item">
                    <span className="chip-lbl">Target Class</span>
                    <strong className="chip-val">{row.class_name} • Sem {row.sem}</strong>
                  </div>

                  <div className="chip-item">
                    <span className="chip-lbl">Total Marks</span>
                    <strong className="chip-val highlight">{row.total_marks ?? 50} Pts</strong>
                  </div>

                  <div className="chip-item span-full">
                    <span className="chip-lbl">Submission Due Date</span>
                    <strong className={`chip-val ${overdue ? "red" : dueSoon ? "amber" : "cyan"}`}>
                      <FiCalendar size={13} style={{ marginRight: "4px" }} />
                      {fmtDate(row.due_date)}
                    </strong>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="card-actions-bar">
                  <button
                    className="act-btn submissions"
                    onClick={() => openSubmissions(row)}
                    title="View students who submitted this assignment"
                  >
                    <FiUsers size={14} />
                    <span>Submissions</span>
                  </button>

                  <div className="act-right-group">
                    {row.file_url ? (
                      <button
                        className="act-btn file"
                        onClick={() => openFile(row)}
                        title="Download attached problem set / guideline file"
                      >
                        <FiDownload size={14} />
                        <span>File</span>
                      </button>
                    ) : null}

                    <button
                      className="act-btn edit"
                      onClick={() => openEdit(row)}
                      title="Edit Assignment details"
                    >
                      <FiEdit2 size={14} />
                    </button>

                    <button
                      className="act-btn delete"
                      onClick={() => removeItem(row)}
                      title="Delete Assignment"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. CREATE & EDIT ASSIGNMENT DRAWER (MODAL) */}
      {drawerOpen && (
        <div className="fac-drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="fac-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h2>{mode === "edit" ? "Edit Assignment" : "Create New Assignment"}</h2>
                <p>Configure task details, assign target classes and upload attachment file</p>
              </div>
              <button className="drawer-close-btn" onClick={() => setDrawerOpen(false)}>
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="drawer-form-body">
              <div className="drawer-form-grid">
                <div className="drawer-field span-full">
                  <label>Assignment Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Build Full-Stack REST API & Database Schema"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="drawer-field">
                  <label>Subject / Paper *</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                    required
                  >
                    {subjectsList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="drawer-field">
                  <label>Course Degree *</label>
                  <select
                    value={form.class_name}
                    onChange={(e) => setForm((p) => ({ ...p, class_name: e.target.value }))}
                    required
                  >
                    {coursesList.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="drawer-field">
                  <label>Semester *</label>
                  <select
                    value={form.sem}
                    onChange={(e) => setForm((p) => ({ ...p, sem: Number(e.target.value) }))}
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="drawer-field">
                  <label>Due Date *</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
                    required
                  />
                </div>

                <div className="drawer-field">
                  <label>Total Evaluation Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={form.total_marks}
                    onChange={(e) => setForm((p) => ({ ...p, total_marks: Number(e.target.value) }))}
                    placeholder="e.g. 50"
                  />
                </div>

                <div className="drawer-field">
                  <label>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="ACTIVE">ACTIVE (Accepting Submissions)</option>
                    <option value="CLOSED">CLOSED (Locked)</option>
                  </select>
                </div>

                <div className="drawer-field span-full">
                  <label>Description &amp; Guidelines</label>
                  <textarea
                    rows={4}
                    placeholder="Describe problem statement, submission format, grading criteria..."
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>

                <div className="drawer-field span-full">
                  <label>Attachment File (PDF, DOCX, PPTX, ZIP, Images)</label>
                  <div className="file-upload-box">
                    <input
                      ref={fileRef}
                      type="file"
                      id="assign-file-upload"
                      hidden
                      onChange={(e) => pickFile(e.target.files?.[0])}
                      accept={allowedExt.map((x) => "." + x).join(",")}
                    />
                    <label htmlFor="assign-file-upload" className="file-upload-label">
                      <FiUploadCloud size={28} className="upload-ico" />
                      <span>{file ? file.name : "Click to select assignment file"}</span>
                      <small>Max {maxFileMB}MB • PDF, DOCX, ZIP, PNG, PPT</small>
                    </label>
                  </div>
                  {file ? (
                    <div className="file-picked-info">
                      <span>Attached: <b>{file.name}</b> ({bytesToSize(file.size)})</span>
                      <button type="button" onClick={() => setFile(null)}>Remove</button>
                    </div>
                  ) : null}
                  {fileErr ? <div className="file-err-msg">{fileErr}</div> : null}
                </div>
              </div>

              {saving && progress > 0 ? (
                <div className="upload-progress-wrap">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                  <span className="progress-txt">{progress}% Uploading...</span>
                </div>
              ) : null}

              <div className="drawer-footer-actions">
                <button type="button" className="fac-btn fac-btn-secondary" onClick={() => setDrawerOpen(false)}>
                  Cancel
                </button>

                <button type="submit" className="fac-btn fac-btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <FiRefreshCw className="fac-spin" />
                      <span>Saving Assignment...</span>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle />
                      <span>{mode === "edit" ? "Update Assignment" : "Publish Assignment"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. STUDENT SUBMISSIONS DRAWER (MODAL) */}
      {submissionsOpen && (
        <div className="fac-drawer-overlay" onClick={() => setSubmissionsOpen(false)}>
          <div className="fac-drawer-panel submissions-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h2>Student Submissions</h2>
                <p>
                  <b>{selectedAssignment?.title}</b> • {selectedAssignment?.class_name} Sem {selectedAssignment?.sem} ({selectedAssignment?.total_marks || 50} Marks)
                </p>
              </div>
              <button className="drawer-close-btn" onClick={() => setSubmissionsOpen(false)}>
                <FiX size={18} />
              </button>
            </div>

            <div className="submissions-body">
              {submissionLoading ? (
                <div className="fac-loading-box">
                  <FiRefreshCw className="fac-spin" size={28} />
                  <span>Loading submissions for this assignment...</span>
                </div>
              ) : submissions.length === 0 ? (
                <div className="fac-empty-box">
                  <FiUsers size={44} className="empty-ico" />
                  <h3>No Submissions Yet</h3>
                  <p>No students have submitted solutions for this assignment yet.</p>
                </div>
              ) : (
                <div className="submissions-list">
                  <div className="sub-count-banner">
                    <span>Total Submissions Received: <b>{submissions.length}</b></span>
                  </div>

                  {submissions.map((s) => {
                    const submissionFileUrl = s.file_url
                      ? s.file_url.startsWith("http")
                        ? s.file_url
                        : `${API_BASE}${s.file_url}`
                      : "";

                    return (
                      <div key={s.submit_id} className="submission-card">
                        <div className="sub-card-top">
                          <div className="sub-student-info">
                            <div className="sub-student-avatar">
                              {s.student_name ? s.student_name.charAt(0) : "S"}
                            </div>
                            <div>
                              <strong className="sub-student-name">
                                {s.student_name || `Student #${s.student_id}`}
                              </strong>
                              <span className="sub-student-roll">
                                {s.enrollment ? `Enrollment: ${s.enrollment}` : `ID: ${s.student_id}`}
                              </span>
                            </div>
                          </div>

                          <span className="sub-status-badge">
                            {s.status || "SUBMITTED"}
                          </span>
                        </div>

                        {s.message && (
                          <div className="sub-message-box">
                            <span className="sub-lbl">Student Notes:</span>
                            <p>{s.message}</p>
                          </div>
                        )}

                        {s.link && (
                          <div className="sub-link-box">
                            <span className="sub-lbl">Project / Repo Link:</span>
                            <a href={s.link} target="_blank" rel="noreferrer" className="sub-ext-link">
                              <FiExternalLink />
                              <span>{s.link}</span>
                            </a>
                          </div>
                        )}

                        <div className="sub-actions-bar">
                          {submissionFileUrl ? (
                            <button
                              className="fac-btn fac-btn-primary"
                              onClick={() => window.open(submissionFileUrl, "_blank")}
                            >
                              <FiDownload />
                              <span>Download Solution ({s.file_name || "Attachment"})</span>
                            </button>
                          ) : (
                            <span className="sub-no-file">No file attached (Link/Text submission)</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
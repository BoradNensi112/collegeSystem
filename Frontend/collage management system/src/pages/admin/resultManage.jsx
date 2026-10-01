import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  FiAward,
  FiBook,
  FiCheck,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiClock,
  FiDownload,
  FiEdit2,
  FiEye,
  FiFilter,
  FiLayers,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiTrash2,
  FiTrendingUp,
  FiUser,
  FiUsers,
  FiX,
  FiAlertCircle,
  FiAlertTriangle,
  FiFileText,
  FiPercent
} from "react-icons/fi";
import "../../layout/admin/resultManage.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

const API = {
  list: `/Result/list`,
  summary: `/Result/summary`,
  create: `/Result/create`,
  update: `/Result/update`,
  remove: `/Result/delete`,
  one: `/Result/one`,
  togglePublish: `/Result/togglePublish`,
  bulk: `/Result/bulk`,
  send: `/Result/send`,
  export: `/Result/export`,
  studentList: `/Student/postStudentData`,
};

const http = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const cn = (...a) => a.filter(Boolean).join(" ");

const safeJsonParse = (value, fallback = {}) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const getCurrentUser = () => {
  const rawUser = localStorage.getItem("user");
  const parsed = safeJsonParse(rawUser, {});
  return parsed && typeof parsed === "object" ? parsed : {};
};

const isAdminUser = () => {
  const user = getCurrentUser();
  const role = String(
    user?.role || user?.usertype || user?.user_type || user?.type || ""
  ).toLowerCase();
  return role === "admin" || !role; // default true for admin portal
};

const toYMD = (d) => {
  if (!d) return "";
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
};

const toYMDOrDash = (d) => (toYMD(d) ? toYMD(d) : "-");

const money = (n) =>
  n === null || n === undefined || n === "" || Number.isNaN(Number(n))
    ? "0.00"
    : Number(n).toFixed(2);

const emptyForm = {
  result_id: null,
  student_id: "",
  student_name: "",
  enrollment: "",
  course: "BCA",
  semester: 1,
  exam_name: "Mid Sem",
  exam_year: new Date().getFullYear(),
  published: false,
  total_marks: 100,
  obtained_marks: 0,
  percentage: 0,
  grade: "F",
  sgpa: "",
  cgpa: "",
  remark: "",
  declared_on: new Date().toISOString().slice(0, 10),
};

function calcPercentage(total, obtained) {
  const t = Number(total || 0);
  const o = Number(obtained || 0);
  if (!t || t <= 0) return 0;
  return Math.max(0, Math.min(100, (o / t) * 100));
}

function autoGrade(p) {
  const x = Number(p || 0);
  if (x >= 90) return "A+";
  if (x >= 80) return "A";
  if (x >= 70) return "B+";
  if (x >= 60) return "B";
  if (x >= 50) return "C";
  if (x >= 40) return "D";
  return "F";
}

const normalizeList = (data) => {
  if (Array.isArray(data?.rows)) {
    return { rows: data.rows, total: data.total ?? data.count ?? data.rows.length };
  }
  if (Array.isArray(data?.message?.rows)) {
    return {
      rows: data.message.rows,
      total: data.message.total ?? data.message.count ?? data.message.rows.length,
    };
  }
  if (Array.isArray(data?.message)) {
    return { rows: data.message, total: data.message.length };
  }
  if (Array.isArray(data?.data)) {
    return { rows: data.data, total: data.data.length };
  }
  if (Array.isArray(data?.result)) {
    return { rows: data.result, total: data.result.length };
  }
  return { rows: [], total: 0 };
};

const normalizeSummary = (data) => {
  const s = data?.message && typeof data.message === "object" ? data.message : data;
  return {
    total: Number(s?.total ?? 0),
    published: Number(s?.published ?? 0),
    draft: Number(s?.draft ?? 0),
    avgPct: Number(s?.avgPct ?? s?.avg_percentage ?? 0),
  };
};

const normalizeOne = (data) => {
  if (data?.data) return data.data;
  if (data?.message && typeof data.message === "object") return data.message;
  if (data?.result && typeof data.result === "object") return data.result;
  return data;
};

const isSuccessResponse = (data) => {
  if (!data) return false;
  if (data.ok === true || data.success === true || data.status === true) return true;
  if (data.message === 1 || data.affectedRows > 0 || data.rowCount > 0 || data.data) return true;

  const msg = String(data.message || data.msg || "").toLowerCase();
  if (
    msg.includes("success") ||
    msg.includes("updated") ||
    msg.includes("deleted") ||
    msg.includes("published") ||
    msg.includes("created") ||
    msg.includes("done") ||
    msg.includes("ok")
  ) {
    return true;
  }
  return false;
};

export default function AdminManageResults() {
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    published: 0,
    draft: 0,
    avgPct: 0,
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [q, setQ] = useState("");

  const [filters, setFilters] = useState({
    course: "ALL",
    semester: "ALL",
    status: "ALL",
    exam_name: "ALL",
    from: "",
    to: "",
  });

  const [selected, setSelected] = useState(new Set());
  const [openForm, setOpenForm] = useState(false);
  const [formMode, setFormMode] = useState("CREATE");
  const [form, setForm] = useState({ ...emptyForm });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState(null);

  const [openSend, setOpenSend] = useState(false);
  const [sendPayload, setSendPayload] = useState({
    channel: "APP",
    note: "Your semester examination result has been officially announced and published. Please log in to your student portal to review your scorecard.",
  });
  const [sendSubmitting, setSendSubmitting] = useState(false);

  // Student list suggestions for faster result entry
  const [students, setStudents] = useState([]);

  const debounceRef = useRef(null);
  const isAdmin = useMemo(() => isAdminUser(), []);

  const showToast = (message, type = "ok") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  const fetchStudents = async () => {
    try {
      const res = await http.post(API.studentList, {});
      const raw = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.message)
        ? res.data.message
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setStudents(raw);
    } catch {
      // ignore silently if students endpoint is restricted
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const allOnPageSelected = useMemo(() => {
    if (!list.length) return false;
    return list.every((r) => selected.has(r.result_id));
  }, [list, selected]);

  const totalPages = useMemo(() => {
    const totalFromSummary = Number(summary.total || 0);
    const total = totalFromSummary > 0 ? totalFromSummary : list.length;
    return Math.max(1, Math.ceil(total / limit));
  }, [summary.total, list.length, limit]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const payload = { page, limit, q, filters };

      const [ls, sm] = await Promise.all([
        http.post(API.list, payload),
        http.post(API.summary, { q, filters }),
      ]);

      const nl = normalizeList(ls.data);
      setList(nl.rows);

      const ns = normalizeSummary(sm.data);
      if (!ns.total && nl.total) ns.total = nl.total;
      setSummary(ns);

      setSelected(new Set());
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || "Failed to load results", "err");
      setList([]);
      setSummary({ total: 0, published: 0, draft: 0, avgPct: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchAll();
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filters]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleSelectAllOnPage = () => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (allOnPageSelected) {
        list.forEach((r) => n.delete(r.result_id));
      } else {
        list.forEach((r) => n.add(r.result_id));
      }
      return n;
    });
  };

  const openCreate = () => {
    setFormMode("CREATE");
    setForm({
      ...emptyForm,
      declared_on: new Date().toISOString().slice(0, 10),
    });
    setOpenForm(true);
  };

  const openEdit = async (row) => {
    try {
      setLoading(true);
      let data = row;
      try {
        const res = await http.post(API.one, { result_id: row.result_id, id: row.result_id });
        data = normalizeOne(res.data) || row;
      } catch {
        data = row;
      }

      setFormMode("EDIT");
      setForm({
        ...emptyForm,
        ...data,
        result_id: data.result_id || row.result_id,
        semester: Number(data.semester ?? row.semester ?? 1),
        total_marks: Number(data.total_marks ?? row.total_marks ?? 100),
        obtained_marks: Number(data.obtained_marks ?? row.obtained_marks ?? 0),
        percentage: Number(data.percentage ?? row.percentage ?? 0),
        declared_on:
          toYMD(data.declared_on || row.declared_on) ||
          new Date().toISOString().slice(0, 10),
        published: !!(data.published ?? row.published),
      });

      setOpenForm(true);
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || "Failed to load result details", "err");
    } finally {
      setLoading(false);
    }
  };

  const openDetails = (row) => {
    setViewRow(row);
    setOpenView(true);
  };

  const handleStudentSelect = (e) => {
    const enr = e.target.value;
    if (!enr) return;
    const found = students.find(
      (s) => String(s.enrollment || "").trim().toLowerCase() === enr.trim().toLowerCase()
    );
    if (found) {
      const name = `${found.first_name || ""} ${found.last_name || ""}`.trim() || found.name || found.user_name || "";
      setForm((p) => ({
        ...p,
        enrollment: found.enrollment || enr,
        student_id: found.user_id || found.student_id || p.student_id,
        student_name: name || p.student_name,
        course: found.course || p.course,
        semester: found.sem || found.semester || p.semester,
      }));
    } else {
      setForm((p) => ({ ...p, enrollment: enr }));
    }
  };

  const onFormChange = (k, v) => {
    setForm((p) => {
      const next = { ...p, [k]: v };

      if (k === "semester") next.semester = Number(v);
      if (k === "student_id") next.student_id = v;
      if (k === "total_marks") next.total_marks = Number(v || 0);
      if (k === "obtained_marks") next.obtained_marks = Number(v || 0);

      if (k === "total_marks" || k === "obtained_marks") {
        const pct = calcPercentage(next.total_marks, next.obtained_marks);
        next.percentage = Number(pct.toFixed(2));
        next.grade = autoGrade(pct);
      }

      if (k === "declared_on") next.declared_on = toYMD(v);

      return next;
    });
  };

  const saveForm = async (e) => {
    if (e) e.preventDefault();

    const payload = { ...form };
    const pct = calcPercentage(payload.total_marks, payload.obtained_marks);

    payload.percentage = Number(pct.toFixed(2));
    payload.grade = payload.grade?.trim() ? payload.grade : autoGrade(pct);
    payload.declared_on =
      toYMD(payload.declared_on) || new Date().toISOString().slice(0, 10);

    if (!payload.student_id && !payload.enrollment) {
      showToast("Student Enrollment Number or ID is required.", "err");
      return;
    }

    if (!payload.exam_name?.trim()) {
      showToast("Exam Name is required.", "err");
      return;
    }

    if (payload.student_id !== "") payload.student_id = Number(payload.student_id);

    try {
      setFormSubmitting(true);

      if (formMode === "CREATE") {
        await http.post(API.create, payload);
        showToast("Result entry created successfully!", "ok");
      } else {
        await http.post(API.update, payload);
        showToast("Result entry updated successfully!", "ok");
      }

      setOpenForm(false);
      await fetchAll();
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || "Failed to save result", "err");
    } finally {
      setFormSubmitting(false);
    }
  };

  const deleteOne = async (row) => {
    const ok = window.confirm(`Permanently delete examination result for ${row.student_name || row.enrollment || "this student"}?`);
    if (!ok) return;

    try {
      setLoading(true);
      await http.post(API.remove, { result_id: row.result_id, id: row.result_id });
      showToast("Result removed permanently.", "ok");
      await fetchAll();
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || "Delete failed", "err");
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (row) => {
    try {
      setLoading(true);
      const nextStatus = !row.published;
      await http.post(API.togglePublish, {
        result_id: row.result_id,
        id: row.result_id,
        published: nextStatus,
        status: nextStatus,
      });

      showToast(nextStatus ? "Result published to student portal." : "Result retracted to draft status.", "ok");
      await fetchAll();
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || "Status update failed", "err");
    } finally {
      setLoading(false);
    }
  };

  const doBulk = async (action) => {
    if (!selected.size) {
      showToast("Please select at least one result record.", "err");
      return;
    }

    if (!isAdmin) {
      showToast("Administrator authorization required for bulk operations.", "err");
      return;
    }

    const ids = Array.from(selected);
    const upperAction = String(action || "").toUpperCase();

    const label =
      upperAction === "PUBLISH"
        ? `Publish ${ids.length} selected result(s) to student portal?`
        : upperAction === "UNPUBLISH"
        ? `Retract ${ids.length} selected result(s) to draft?`
        : `Permanently delete ${ids.length} selected result records?`;

    const ok = window.confirm(label);
    if (!ok) return;

    try {
      setLoading(true);
      const payload = {
        ids,
        result_ids: ids,
        selectedIds: ids,
        selected_ids: ids,
        action: upperAction,
        type: upperAction,
        bulk_action: upperAction,
      };

      const res = await http.post(API.bulk, payload);

      if (!isSuccessResponse(res.data)) {
        const msg =
          res?.data?.message ||
          res?.data?.msg ||
          "Bulk operation finished.";
        showToast(msg, "ok");
      } else {
        showToast(`Bulk ${upperAction.toLowerCase()} completed for ${ids.length} record(s).`, "ok");
      }

      setSelected(new Set());
      await fetchAll();
    } catch (e) {
      showToast(
        e?.response?.data?.message ||
        e?.response?.data?.msg ||
        e.message ||
        "Bulk operation failed",
        "err"
      );
    } finally {
      setLoading(false);
    }
  };

  const openSendModal = () => {
    if (!selected.size) {
      showToast("Please select at least one result to send notification.", "err");
      return;
    }

    if (!isAdmin) {
      showToast("Administrator authorization required to send results.", "err");
      return;
    }

    setOpenSend(true);
  };

  const doSend = async (e) => {
    if (e) e.preventDefault();
    if (!selected.size) {
      showToast("Please select at least one result.", "err");
      return;
    }

    try {
      setSendSubmitting(true);
      await http.post(API.send, {
        ids: Array.from(selected),
        result_ids: Array.from(selected),
        ...sendPayload,
      });

      showToast(`Results dispatched to ${selected.size} student(s) via ${sendPayload.channel}.`, "ok");
      setOpenSend(false);
      setSelected(new Set());
      await fetchAll();
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || "Dispatch failed", "err");
    } finally {
      setSendSubmitting(false);
    }
  };

  const doExport = async () => {
    try {
      setLoading(true);
      const res = await http.post(API.export, { q, filters });
      const url = res.data?.url || res.data?.message?.url || res.data?.data?.url;

      if (url) {
        window.open(url, "_blank");
        showToast("CSV Export generated successfully!", "ok");
      } else {
        showToast("CSV exported from active records.", "ok");
      }
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || "Export failed", "err");
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadgeClass = (pct) => {
    const val = Number(pct || 0);
    if (val >= 80) return "res-score-top";
    if (val >= 60) return "res-score-good";
    if (val >= 40) return "res-score-pass";
    return "res-score-fail";
  };

  const getGradeBadgeClass = (grade) => {
    const g = String(grade || "").toUpperCase();
    if (g.startsWith("A")) return "res-grade-a";
    if (g.startsWith("B")) return "res-grade-b";
    if (g.startsWith("C")) return "res-grade-c";
    if (g.startsWith("D")) return "res-grade-d";
    return "res-grade-f";
  };

  return (
    <div className="res-pro-root">
      {/* Toast Alert */}
      {toast && (
        <div className={`res-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. HERO COMMAND BANNER */}
      <section className="res-hero-banner">
        <div className="res-hero-left">
          <div className="res-live-chip">
            <span className="res-ping"></span>
            <span className="res-live-txt">ACADEMIC PERFORMANCE & EXAMINATION RESULTS • CONTROL CENTER</span>
          </div>
          <h1 className="res-hero-title">Result Management System</h1>
          <p className="res-hero-sub">
            Publish semester examination marks, compute automated grades & percentages, and dispatch broadcast notifications.
          </p>
        </div>

        <div className="res-hero-actions">
          <button
            className="res-btn res-btn-secondary"
            onClick={doExport}
            disabled={loading}
            title="Download CSV report"
          >
            <FiDownload />
            <span>Export CSV</span>
          </button>

          <button
            className="res-btn res-btn-secondary"
            onClick={fetchAll}
            disabled={loading}
            title="Refresh records"
          >
            <FiRefreshCw className={loading ? "res-spin" : ""} />
            <span>Sync</span>
          </button>

          <button className="res-btn res-btn-primary" onClick={openCreate} disabled={loading}>
            <FiPlus />
            <span>New Result Entry</span>
          </button>
        </div>
      </section>

      {/* 2. KPI METRIC CARDS */}
      <section className="res-kpi-grid">
        <div className="res-kpi-card">
          <div className="res-kpi-header">
            <span className="res-kpi-label">Total Results</span>
            <div className="res-kpi-icon-wrap primary">
              <FiBook size={18} />
            </div>
          </div>
          <div className="res-kpi-val">{summary.total || 0}</div>
          <div className="res-kpi-meta">
            <span className="res-kpi-hint">All recorded evaluations</span>
          </div>
        </div>

        <div className="res-kpi-card">
          <div className="res-kpi-header">
            <span className="res-kpi-label">Published</span>
            <div className="res-kpi-icon-wrap success">
              <FiCheckCircle size={18} />
            </div>
          </div>
          <div className="res-kpi-val success">{summary.published || 0}</div>
          <div className="res-kpi-meta">
            <span className="res-kpi-hint">Live on student portal</span>
          </div>
        </div>

        <div className="res-kpi-card">
          <div className="res-kpi-header">
            <span className="res-kpi-label">Draft / Moderation</span>
            <div className="res-kpi-icon-wrap warning">
              <FiClock size={18} />
            </div>
          </div>
          <div className="res-kpi-val warning">{summary.draft || 0}</div>
          <div className="res-kpi-meta">
            <span className="res-kpi-hint">Pending faculty verification</span>
          </div>
        </div>

        <div className="res-kpi-card">
          <div className="res-kpi-header">
            <span className="res-kpi-label">Class Average</span>
            <div className="res-kpi-icon-wrap cyan">
              <FiTrendingUp size={18} />
            </div>
          </div>
          <div className="res-kpi-val cyan">{money(summary.avgPct || 0)}%</div>
          <div className="res-kpi-meta">
            <span className="res-kpi-hint">Aggregated score performance</span>
          </div>
        </div>
      </section>

      {/* 3. MASTER TOOLBAR & FILTER DECK */}
      <section className="res-deck-panel">
        <div className="res-filter-row">
          <div className="res-search-field">
            <FiSearch className="res-search-icon" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search student name, enrollment no, exam title..."
            />
            {q && (
              <button className="res-clear-btn" onClick={() => setQ("")} title="Clear search">
                <FiX />
              </button>
            )}
          </div>

          <div className="res-select-group">
            <select
              value={filters.course}
              onChange={(e) => setFilters((p) => ({ ...p, course: e.target.value }))}
            >
              <option value="ALL">All Courses</option>
              <option value="BCA">BCA</option>
              <option value="BBA">BBA</option>
              <option value="BSC">BSC</option>
              <option value="MCA">MCA</option>
              <option value="B.Tech">B.Tech</option>
            </select>

            <select
              value={filters.semester}
              onChange={(e) => setFilters((p) => ({ ...p, semester: e.target.value }))}
            >
              <option value="ALL">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={String(s)}>
                  Semester {s}
                </option>
              ))}
            </select>

            <select
              value={filters.exam_name}
              onChange={(e) => setFilters((p) => ({ ...p, exam_name: e.target.value }))}
            >
              <option value="ALL">All Exam Categories</option>
              <option value="Mid Sem">Mid Sem</option>
              <option value="End Sem">End Sem</option>
              <option value="Internal">Internal Assessment</option>
              <option value="Practical">Practical Examination</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published Only</option>
              <option value="DRAFT">Draft Only</option>
            </select>

            <div className="res-date-box">
              <input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
                title="Declared From"
              />
              <span className="res-date-arrow">→</span>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
                title="Declared To"
              />
            </div>

            <button
              className="res-btn res-btn-secondary"
              onClick={() =>
                setFilters({
                  course: "ALL",
                  semester: "ALL",
                  status: "ALL",
                  exam_name: "ALL",
                  from: "",
                  to: "",
                })
              }
              title="Reset all filters"
            >
              Reset
            </button>
          </div>
        </div>

        {/* BULK ACTIONS STRIP */}
        <div className="res-bulk-strip">
          <div className="res-bulk-left">
            <label className="res-custom-check">
              <input
                type="checkbox"
                checked={allOnPageSelected}
                onChange={toggleSelectAllOnPage}
              />
              <span className="res-check-mark"></span>
              <span className="res-check-txt">Select Page ({list.length})</span>
            </label>

            {selected.size > 0 ? (
              <div className="res-selected-pill">
                <FiCheck size={14} />
                <span><b>{selected.size}</b> selected for batch execution</span>
              </div>
            ) : (
              <span className="res-bulk-tip">Select rows to batch publish, notify, or remove</span>
            )}
          </div>

          <div className="res-bulk-right">
            <button
              className="res-btn res-btn-xs res-btn-success"
              onClick={() => doBulk("PUBLISH")}
              disabled={loading || !selected.size}
            >
              <FiCheckCircle />
              <span>Publish ({selected.size})</span>
            </button>

            <button
              className="res-btn res-btn-xs res-btn-secondary"
              onClick={() => doBulk("UNPUBLISH")}
              disabled={loading || !selected.size}
            >
              <FiClock />
              <span>Unpublish ({selected.size})</span>
            </button>

            <button
              className="res-btn res-btn-xs res-btn-accent"
              onClick={openSendModal}
              disabled={loading || !selected.size}
            >
              <FiSend />
              <span>Dispatch Notify ({selected.size})</span>
            </button>

            <button
              className="res-btn res-btn-xs res-btn-danger"
              onClick={() => doBulk("DELETE")}
              disabled={loading || !selected.size}
            >
              <FiTrash2 />
              <span>Delete ({selected.size})</span>
            </button>
          </div>
        </div>

        {/* 4. DATA TABLE */}
        <div className="res-table-wrap">
          <table className="res-table">
            <thead>
              <tr>
                <th style={{ width: 44, textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAllOnPage}
                  />
                </th>
                <th>Student Profile</th>
                <th>Exam & Session</th>
                <th className="center">Marks (Obt / Total)</th>
                <th className="center">Percentage</th>
                <th className="center">Grade</th>
                <th>Status</th>
                <th>Declared Date</th>
                <th className="right">Action Controls</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="res-skel-row">
                    <td colSpan={9}>
                      <div className="res-skel-pulse" />
                    </td>
                  </tr>
                ))
              ) : list.length ? (
                list.map((r) => {
                  const pct = Number(r.percentage || 0);
                  const isChecked = selected.has(r.result_id);

                  return (
                    <tr key={r.result_id} className={isChecked ? "res-row-active" : ""}>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(r.result_id)}
                        />
                      </td>

                      <td>
                        <div className="res-student-box">
                          <div className="res-avatar-ring">
                            {(r.student_name || r.enrollment || "S").slice(0, 1).toUpperCase()}
                          </div>
                          <div className="res-student-meta">
                            <span className="res-student-name">{r.student_name || "—"}</span>
                            <div className="res-student-badges">
                              <span className="res-enr-pill">{r.enrollment || r.student_id || "No Enr"}</span>
                              <span className="res-course-pill">{r.course || "N/A"} • Sem {r.semester ?? "-"}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="res-exam-meta">
                          <span className="res-exam-title">{r.exam_name || "Examination"}</span>
                          <span className="res-exam-sub">{r.exam_year || new Date().getFullYear()} Session</span>
                        </div>
                      </td>

                      <td className="center">
                        <div className="res-marks-pill">
                          <span className="res-marks-obtained">{r.obtained_marks ?? 0}</span>
                          <span className="res-marks-sep">/</span>
                          <span className="res-marks-total">{r.total_marks ?? 100}</span>
                        </div>
                      </td>

                      <td className="center">
                        <span className={`res-pct-badge ${getScoreBadgeClass(pct)}`}>
                          {money(pct)}%
                        </span>
                      </td>

                      <td className="center">
                        <span className={`res-grade-badge ${getGradeBadgeClass(r.grade || autoGrade(pct))}`}>
                          {r.grade || autoGrade(pct)}
                        </span>
                      </td>

                      <td>
                        {r.published ? (
                          <span className="res-chip-status ok">
                            <span className="res-chip-dot ok" />
                            Published
                          </span>
                        ) : (
                          <span className="res-chip-status warn">
                            <span className="res-chip-dot warn" />
                            Draft
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="res-date-cell">
                          <FiClock size={13} />
                          <span>{toYMDOrDash(r.declared_on || r.created_at || r.createdAt)}</span>
                        </div>
                      </td>

                      <td className="right">
                        <div className="res-action-btns">
                          <button
                            className="res-icon-action view"
                            onClick={() => openDetails(r)}
                            title="View scorecard details"
                          >
                            <FiEye />
                          </button>

                          <button
                            className="res-icon-action edit"
                            onClick={() => openEdit(r)}
                            title="Edit marks"
                          >
                            <FiEdit2 />
                          </button>

                          <button
                            className={`res-icon-action publish ${r.published ? "active" : ""}`}
                            onClick={() => togglePublish(r)}
                            title={r.published ? "Retract to draft" : "Publish to students"}
                          >
                            <FiCheck />
                          </button>

                          <button
                            className="res-icon-action delete"
                            onClick={() => deleteOne(r)}
                            title="Delete result"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9}>
                    <div className="res-empty-state">
                      <div className="res-empty-icon-box">
                        <FiAward />
                      </div>
                      <h3>No Examination Results Found</h3>
                      <p>
                        No results matched your query or filter criteria. Create a new scorecard or reset active filters.
                      </p>
                      <button className="res-btn res-btn-primary" onClick={openCreate}>
                        <FiPlus />
                        <span>Create New Result</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 5. PAGINATION CONTROLS */}
        <div className="res-pagination-bar">
          <div className="res-pager-info">
            <span>
              Showing Page <b>{page}</b> of <b>{totalPages}</b> ({summary.total || list.length} total entries)
            </span>

            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="res-page-size-select"
            >
              {[10, 20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  {n} rows per page
                </option>
              ))}
            </select>
          </div>

          <div className="res-pager-buttons">
            <button
              className="res-pager-btn"
              onClick={() => setPage(1)}
              disabled={page === 1 || loading}
              title="First page"
            >
              <FiChevronsLeft />
            </button>

            <button
              className="res-pager-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              title="Previous page"
            >
              <FiChevronLeft />
            </button>

            <span className="res-page-number">{page}</span>

            <button
              className="res-pager-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              title="Next page"
            >
              <FiChevronRight />
            </button>

            <button
              className="res-pager-btn"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages || loading}
              title="Last page"
            >
              <FiChevronsRight />
            </button>
          </div>
        </div>
      </section>

      {/* CREATE / EDIT RESULT MODAL */}
      {openForm && (
        <div className="res-modal-backdrop" onClick={() => setOpenForm(false)}>
          <div className="res-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="res-modal-header">
              <div className="res-modal-title-group">
                <div className="res-modal-icon-badge">
                  <FiAward size={20} />
                </div>
                <div>
                  <h3 className="res-modal-title">
                    {formMode === "CREATE" ? "New Result Entry" : "Modify Result Details"}
                  </h3>
                  <p className="res-modal-sub">
                    {formMode === "CREATE"
                      ? "Record student evaluation scores and auto-calculate GPA & grade."
                      : `Update scorecard for ${form.student_name || form.enrollment || "Student"}`}
                  </p>
                </div>
              </div>

              <button className="res-modal-close" onClick={() => setOpenForm(false)}>
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={saveForm}>
              <div className="res-modal-body">
                {/* Student Selection / Lookup Strip */}
                <div className="res-form-section-title">
                  <FiUser />
                  <span>Student & Enrollment Information</span>
                </div>

                <div className="res-form-grid">
                  <div className="res-form-field">
                    <label>Enrollment Number *</label>
                    <input
                      type="text"
                      value={form.enrollment || ""}
                      onChange={(e) => onFormChange("enrollment", e.target.value)}
                      placeholder="e.g. ENR2026001"
                      required
                    />
                    {students.length > 0 && (
                      <select
                        className="res-quick-student-select"
                        onChange={handleStudentSelect}
                        defaultValue=""
                      >
                        <option value="" disabled>-- Or Quick Select Registered Student --</option>
                        {students.map((st) => (
                          <option key={st.user_id || st.student_id || st.enrollment} value={st.enrollment}>
                            {st.enrollment} - {st.first_name || ""} {st.last_name || ""} ({st.course || "BCA"})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="res-form-field">
                    <label>Student Name</label>
                    <input
                      type="text"
                      value={form.student_name || ""}
                      onChange={(e) => onFormChange("student_name", e.target.value)}
                      placeholder="e.g. John Doe"
                    />
                  </div>

                  <div className="res-form-field">
                    <label>Course / Degree *</label>
                    <select
                      value={form.course || "BCA"}
                      onChange={(e) => onFormChange("course", e.target.value)}
                    >
                      <option value="BCA">BCA - Bachelor of Computer Applications</option>
                      <option value="BBA">BBA - Bachelor of Business Admin</option>
                      <option value="BSC">BSC - Bachelor of Science</option>
                      <option value="MCA">MCA - Master of Computer Applications</option>
                      <option value="B.Tech">B.Tech - Computer Science & Engineering</option>
                    </select>
                  </div>

                  <div className="res-form-field">
                    <label>Semester *</label>
                    <select
                      value={form.semester}
                      onChange={(e) => onFormChange("semester", Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Exam Context */}
                <div className="res-form-section-title">
                  <FiBook />
                  <span>Exam Details & Schedule</span>
                </div>

                <div className="res-form-grid">
                  <div className="res-form-field">
                    <label>Exam Name *</label>
                    <select
                      value={form.exam_name}
                      onChange={(e) => onFormChange("exam_name", e.target.value)}
                    >
                      <option value="Mid Sem">Mid Semester Examination</option>
                      <option value="End Sem">End Semester Examination</option>
                      <option value="Internal">Internal Assessment & Lab</option>
                      <option value="Practical">Practical Examination</option>
                      <option value="Final Board">Final Board Evaluation</option>
                    </select>
                  </div>

                  <div className="res-form-field">
                    <label>Exam Academic Year</label>
                    <input
                      type="number"
                      value={form.exam_year}
                      onChange={(e) => onFormChange("exam_year", Number(e.target.value))}
                    />
                  </div>

                  <div className="res-form-field">
                    <label>Result Declared Date</label>
                    <input
                      type="date"
                      value={form.declared_on || ""}
                      onChange={(e) => onFormChange("declared_on", e.target.value)}
                    />
                  </div>

                  <div className="res-form-field">
                    <label>Publish Status</label>
                    <div className="res-switch-wrapper">
                      <label className="res-toggle-switch">
                        <input
                          type="checkbox"
                          checked={!!form.published}
                          onChange={(e) => onFormChange("published", e.target.checked)}
                        />
                        <span className="res-toggle-slider"></span>
                      </label>
                      <span className="res-toggle-label">
                        {form.published ? "Published (Visible to Student)" : "Draft (Hidden from Student)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Marks & Calculation Grid */}
                <div className="res-form-section-title">
                  <FiPercent />
                  <span>Evaluation Scores & Performance Computation</span>
                </div>

                <div className="res-form-grid marks-calc-grid">
                  <div className="res-form-field">
                    <label>Total Max Marks *</label>
                    <input
                      type="number"
                      value={form.total_marks}
                      onChange={(e) => onFormChange("total_marks", e.target.value)}
                      min="1"
                      required
                    />
                  </div>

                  <div className="res-form-field">
                    <label>Obtained Marks *</label>
                    <input
                      type="number"
                      value={form.obtained_marks}
                      onChange={(e) => onFormChange("obtained_marks", e.target.value)}
                      min="0"
                      required
                    />
                  </div>

                  <div className="res-form-field">
                    <label>Percentage (Calculated)</label>
                    <div className="res-calc-display">
                      <span>{money(form.percentage)}%</span>
                    </div>
                  </div>

                  <div className="res-form-field">
                    <label>Grade</label>
                    <input
                      type="text"
                      value={form.grade || ""}
                      onChange={(e) => onFormChange("grade", e.target.value)}
                      placeholder="e.g. A+, A, B"
                    />
                  </div>

                  <div className="res-form-field">
                    <label>SGPA (Optional)</label>
                    <input
                      type="text"
                      value={form.sgpa || ""}
                      onChange={(e) => onFormChange("sgpa", e.target.value)}
                      placeholder="e.g. 8.45"
                    />
                  </div>

                  <div className="res-form-field">
                    <label>CGPA (Optional)</label>
                    <input
                      type="text"
                      value={form.cgpa || ""}
                      onChange={(e) => onFormChange("cgpa", e.target.value)}
                      placeholder="e.g. 8.20"
                    />
                  </div>

                  <div className="res-form-field span-full">
                    <label>Performance Remarks & Evaluation Notes</label>
                    <textarea
                      rows={3}
                      value={form.remark || ""}
                      onChange={(e) => onFormChange("remark", e.target.value)}
                      placeholder="e.g. Outstanding performance in core subjects. Eligible for honors recognition."
                    />
                  </div>
                </div>
              </div>

              <div className="res-modal-footer">
                <button
                  type="button"
                  className="res-btn res-btn-secondary"
                  onClick={() => setOpenForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="res-btn res-btn-primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? (
                    <>
                      <FiRefreshCw className="res-spin" />
                      <span>Saving Scorecard...</span>
                    </>
                  ) : (
                    <>
                      <FiCheck />
                      <span>{formMode === "CREATE" ? "Save & Create Result" : "Update Result"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW RESULT DETAILS DRAWER / MODAL */}
      {openView && (
        <div className="res-modal-backdrop" onClick={() => setOpenView(false)}>
          <div className="res-modal-box view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="res-modal-header">
              <div className="res-modal-title-group">
                <div className="res-modal-icon-badge cyan">
                  <FiAward size={20} />
                </div>
                <div>
                  <h3 className="res-modal-title">Official Examination Scorecard</h3>
                  <p className="res-modal-sub">Verified institutional academic evaluation transcript</p>
                </div>
              </div>

              <button className="res-modal-close" onClick={() => setOpenView(false)}>
                <FiX size={18} />
              </button>
            </div>

            <div className="res-modal-body">
              {viewRow ? (
                <div className="res-view-container">
                  {/* Top Student Banner */}
                  <div className="res-view-hero">
                    <div className="res-avatar-large">
                      {(viewRow.student_name || viewRow.enrollment || "S").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="res-view-hero-text">
                      <h2>{viewRow.student_name || "Enrolled Student"}</h2>
                      <div className="res-view-hero-pills">
                        <span className="res-enr-pill">{viewRow.enrollment || viewRow.student_id || "No Enr"}</span>
                        <span className="res-course-pill">{viewRow.course || "Course"} • Semester {viewRow.semester ?? "-"}</span>
                        {viewRow.published ? (
                          <span className="res-chip-status ok">
                            <span className="res-chip-dot ok" />
                            Published Live
                          </span>
                        ) : (
                          <span className="res-chip-status warn">
                            <span className="res-chip-dot warn" />
                            Draft State
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="res-view-stats-grid">
                    <div className="res-stat-box">
                      <span className="res-stat-lbl">Exam Name</span>
                      <span className="res-stat-val">{viewRow.exam_name || "Mid Sem"}</span>
                    </div>

                    <div className="res-stat-box">
                      <span className="res-stat-lbl">Exam Session</span>
                      <span className="res-stat-val">{viewRow.exam_year || new Date().getFullYear()}</span>
                    </div>

                    <div className="res-stat-box highlight">
                      <span className="res-stat-lbl">Total Score</span>
                      <span className="res-stat-val">
                        {viewRow.obtained_marks ?? 0} <span className="sub">/ {viewRow.total_marks ?? 100}</span>
                      </span>
                    </div>

                    <div className="res-stat-box highlight">
                      <span className="res-stat-lbl">Percentage</span>
                      <span className="res-stat-val cyan">{money(viewRow.percentage || 0)}%</span>
                    </div>

                    <div className="res-stat-box">
                      <span className="res-stat-lbl">Grade Assigned</span>
                      <span className={`res-grade-badge large ${getGradeBadgeClass(viewRow.grade)}`}>
                        {viewRow.grade || autoGrade(viewRow.percentage)}
                      </span>
                    </div>

                    <div className="res-stat-box">
                      <span className="res-stat-lbl">Declared Date</span>
                      <span className="res-stat-val">{toYMDOrDash(viewRow.declared_on || viewRow.created_at)}</span>
                    </div>

                    {viewRow.sgpa && (
                      <div className="res-stat-box">
                        <span className="res-stat-lbl">SGPA</span>
                        <span className="res-stat-val">{viewRow.sgpa}</span>
                      </div>
                    )}

                    {viewRow.cgpa && (
                      <div className="res-stat-box">
                        <span className="res-stat-lbl">CGPA</span>
                        <span className="res-stat-val">{viewRow.cgpa}</span>
                      </div>
                    )}

                    <div className="res-stat-box span-full">
                      <span className="res-stat-lbl">Faculty Remarks</span>
                      <p className="res-stat-desc">{viewRow.remark || "Standard examination evaluation completed with no disciplinary remarks."}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="res-empty-state">
                  <p>No result selected.</p>
                </div>
              )}
            </div>

            <div className="res-modal-footer">
              <button
                className="res-btn res-btn-secondary"
                onClick={() => setOpenView(false)}
              >
                Close
              </button>

              {viewRow && (
                <button
                  className="res-btn res-btn-primary"
                  onClick={() => {
                    setOpenView(false);
                    openEdit(viewRow);
                  }}
                >
                  <FiEdit2 />
                  <span>Edit Scorecard</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH NOTIFICATIONS MODAL */}
      {openSend && (
        <div className="res-modal-backdrop" onClick={() => setOpenSend(false)}>
          <div className="res-modal-box send-modal" onClick={(e) => e.stopPropagation()}>
            <div className="res-modal-header">
              <div className="res-modal-title-group">
                <div className="res-modal-icon-badge accent">
                  <FiSend size={20} />
                </div>
                <div>
                  <h3 className="res-modal-title">Broadcast Result Announcements</h3>
                  <p className="res-modal-sub">
                    Notify <b>{selected.size}</b> selected students regarding published examination marks
                  </p>
                </div>
              </div>

              <button className="res-modal-close" onClick={() => setOpenSend(false)}>
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={doSend}>
              <div className="res-modal-body">
                <div className="res-form-grid">
                  <div className="res-form-field span-full">
                    <label>Dispatch Notification Channel *</label>
                    <select
                      value={sendPayload.channel}
                      onChange={(e) =>
                        setSendPayload((p) => ({ ...p, channel: e.target.value }))
                      }
                    >
                      <option value="APP">In-App Student Notification Portal (Instant)</option>
                      <option value="EMAIL">Direct Academic Email Broadcast</option>
                      <option value="SMS">Official SMS Mobile Alert</option>
                    </select>
                  </div>

                  <div className="res-form-field span-full">
                    <label>Announcement Body / Message Note *</label>
                    <textarea
                      rows={5}
                      value={sendPayload.note}
                      onChange={(e) =>
                        setSendPayload((p) => ({ ...p, note: e.target.value }))
                      }
                      placeholder="Enter custom announcement note for students..."
                      required
                    />
                  </div>
                </div>

                <div className="res-send-summary-box">
                  <FiCheckCircle size={16} />
                  <span>
                    Selected <b>{selected.size}</b> student scorecard(s) will receive an automated broadcast dispatch.
                  </span>
                </div>
              </div>

              <div className="res-modal-footer">
                <button
                  type="button"
                  className="res-btn res-btn-secondary"
                  onClick={() => setOpenSend(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="res-btn res-btn-primary"
                  disabled={sendSubmitting}
                >
                  {sendSubmitting ? (
                    <>
                      <FiRefreshCw className="res-spin" />
                      <span>Dispatching Broadcast...</span>
                    </>
                  ) : (
                    <>
                      <FiSend />
                      <span>Dispatch Announcement ({selected.size})</span>
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
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiCalendar,
  FiClock,
  FiBook,
  FiUser,
  FiMapPin,
  FiPlus,
  FiSearch,
  FiFilter,
  FiEdit2,
  FiTrash2,
  FiPrinter,
  FiDownload,
  FiLayers,
  FiVideo,
  FiAlertTriangle,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiBookOpen,
  FiUsers,
  FiExternalLink
} from "react-icons/fi";
import "../../layout/admin/timeTable.css";

const API_BASE = `${import.meta.env.VITE_API_BASE || "http://localhost:5001"}/Timetable`;

const API = {
  list: `${API_BASE}/postTimetableData`,
  create: `${API_BASE}/Tadd`,
  update: `${API_BASE}/update`,
  remove: `${API_BASE}/delete`,
  one: `${API_BASE}/postOneData`,
};

const DAYS = [
  { key: "MON", label: "Monday", short: "Mon" },
  { key: "TUE", label: "Tuesday", short: "Tue" },
  { key: "WED", label: "Wednesday", short: "Wed" },
  { key: "THU", label: "Thursday", short: "Thu" },
  { key: "FRI", label: "Friday", short: "Fri" },
  { key: "SAT", label: "Saturday", short: "Sat" },
];

const TYPES = ["LECTURE", "LAB", "TUTORIAL"];

const emptyForm = {
  timeTable_id: null,
  course: "",
  semester: "",
  batch: "",
  day: "MON",
  start_time: "09:00:00",
  end_time: "10:00:00",
  subject: "",
  subject_code: "",
  faculty_name: "",
  room: "",
  type: "LECTURE",
  note: "",
  meet_link: "",
  status: "ACTIVE",
};

const cn = (...arr) => arr.filter(Boolean).join(" ");

const toMin = (hhmmss) => {
  const s = String(hhmmss || "").slice(0, 5);
  const [h, m] = s.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const fmt12 = (hhmmss) => {
  if (!hhmmss) return "--:--";
  const s = String(hhmmss || "").slice(0, 5);
  const [h, m] = s.split(":").map(Number);
  if (isNaN(h)) return hhmmss;
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m || 0).padStart(2, "0")} ${ampm}`;
};

const normalizeDay = (day) => {
  const d = String(day || "").trim().toUpperCase();
  const map = {
    MON: "MON",
    MONDAY: "MON",
    TUE: "TUE",
    TUESDAY: "TUE",
    WED: "WED",
    WEDNESDAY: "WED",
    THU: "THU",
    THURSDAY: "THU",
    FRI: "FRI",
    FRIDAY: "FRI",
    SAT: "SAT",
    SATURDAY: "SAT",
  };
  return map[d] || d;
};

const normalizeType = (type) => {
  const t = String(type || "").trim().toUpperCase();
  if (t === "LECTURE" || t === "LAB" || t === "TUTORIAL") return t;
  return "LECTURE";
};

const normalizeText = (value) => String(value || "").trim();

const normalizeRows = (res) => {
  const raw =
    Array.isArray(res)
      ? res
      : Array.isArray(res?.message)
      ? res.message
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.rows)
      ? res.rows
      : [];

  return raw.map((x, idx) => ({
    timeTable_id: x.timeTable_id ?? x.id ?? idx + 1,
    course: normalizeText(x.course),
    semester: Number(x.semester ?? x.sem ?? 0),
    batch: normalizeText(x.batch),
    day: normalizeDay(x.day),
    start_time: String(x.start_time || "").slice(0, 8),
    end_time: String(x.end_time || "").slice(0, 8),
    subject: normalizeText(x.subject),
    subject_code: normalizeText(x.subject_code || x.code),
    faculty_name: normalizeText(x.faculty_name || x.faculty),
    room: normalizeText(x.room),
    type: normalizeType(x.type),
    note: normalizeText(x.note),
    meet_link: normalizeText(x.meet_link),
    status: String(x.status || "ACTIVE").trim().toUpperCase(),
  }));
};

const overlaps = (a, b) =>
  toMin(a.start_time) < toMin(b.end_time) &&
  toMin(b.start_time) < toMin(a.end_time);

const isRealConflict = (a, b) => {
  if (!overlaps(a, b)) return null;

  // 1. Same Room/Lab conflict
  const roomA = String(a.room || "").trim().toLowerCase();
  const roomB = String(b.room || "").trim().toLowerCase();
  if (roomA && roomB && roomA === roomB) {
    return `Room Conflict: Both "${a.subject}" and "${b.subject}" are assigned to Room/Hall "${a.room}"`;
  }

  // 2. Same Faculty conflict
  const facA = String(a.faculty_name || "").trim().toLowerCase();
  const facB = String(b.faculty_name || "").trim().toLowerCase();
  if (facA && facB && facA === facB) {
    return `Faculty Conflict: Professor "${a.faculty_name}" is assigned to both "${a.subject}" and "${b.subject}" at the same time`;
  }

  // 3. Same Student Group/Class conflict (Course + Semester + matching Batch)
  const courseA = String(a.course || "").trim().toLowerCase();
  const courseB = String(b.course || "").trim().toLowerCase();
  const semA = String(a.semester ?? "").trim();
  const semB = String(b.semester ?? "").trim();
  const batchA = String(a.batch || "").trim().toLowerCase();
  const batchB = String(b.batch || "").trim().toLowerCase();

  const sameClass = courseA && courseB && courseA === courseB && semA === semB;
  const sameBatch = !batchA || !batchB || batchA === batchB;

  if (sameClass && sameBatch) {
    return `Class Batch Conflict: ${a.course} Sem ${a.semester}${a.batch ? ` (Batch ${a.batch})` : ""} has both "${a.subject}" and "${b.subject}" scheduled simultaneously`;
  }

  return null;
};

export default function AdminTimeTable() {
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const [q, setQ] = useState("");
  const [fCourse, setFCourse] = useState("");
  const [fSem, setFSem] = useState("");
  const [fBatch, setFBatch] = useState("");
  const [fType, setFType] = useState("ALL");
  const [activeDay, setActiveDay] = useState("MON");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState({});

  const [bulk, setBulk] = useState(false);
  const [bulkItems, setBulkItems] = useState([{ ...emptyForm, day: "MON" }]);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchList = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const possibleBodies = [{ status: "ACTIVE" }, {}, undefined];
      let data = null;
      let success = false;

      for (const body of possibleBodies) {
        try {
          const res =
            body === undefined
              ? await axios.post(API.list)
              : await axios.post(API.list, body);

          data = res.data;
          success = true;
          break;
        } catch (err) {
          // try next
        }
      }

      if (!success) {
        throw new Error("Timetable fetch failed");
      }

      const rows = normalizeRows(data);
      setAllRows(rows);
    } catch (error) {
      console.error("Timetable load error:", error);
      setAllRows([]);
      showToast("err", "Failed to load timetable from database");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const toolbarFilteredRows = useMemo(() => {
    const courseVal = fCourse.trim().toLowerCase();
    const batchVal = fBatch.trim().toLowerCase();
    const semVal = String(fSem || "").trim();
    const typeVal = String(fType || "ALL").toUpperCase();

    return allRows.filter((row) => {
      if (row.status && row.status !== "ACTIVE") return false;

      if (courseVal && !String(row.course || "").toLowerCase().includes(courseVal)) {
        return false;
      }

      if (semVal && String(row.semester || "") !== semVal) {
        return false;
      }

      if (batchVal && !String(row.batch || "").toLowerCase().includes(batchVal)) {
        return false;
      }

      if (typeVal !== "ALL" && String(row.type || "").toUpperCase() !== typeVal) {
        return false;
      }

      return true;
    });
  }, [allRows, fCourse, fSem, fBatch, fType]);

  const searchedRows = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return toolbarFilteredRows;

    return toolbarFilteredRows.filter((x) => {
      const blob = `
        ${x.subject}
        ${x.subject_code}
        ${x.faculty_name}
        ${x.room}
        ${x.course}
        ${x.semester}
        ${x.batch}
        ${x.type}
      `.toLowerCase();

      return blob.includes(query);
    });
  }, [toolbarFilteredRows, q]);

  const dayRows = useMemo(() => {
    return searchedRows
      .filter((x) => x.day === activeDay)
      .slice()
      .sort((a, b) => toMin(a.start_time) - toMin(b.start_time));
  }, [searchedRows, activeDay]);

  const dayCounts = useMemo(() => {
    return DAYS.reduce((acc, day) => {
      acc[day.key] = toolbarFilteredRows.filter((row) => row.day === day.key).length;
      return acc;
    }, {});
  }, [toolbarFilteredRows]);

  const conflicts = useMemo(() => {
    const list = [];
    const arr = dayRows.slice().sort((a, b) => toMin(a.start_time) - toMin(b.start_time));

    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (overlaps(arr[i], arr[j])) {
          const reason = isRealConflict(arr[i], arr[j]);
          if (reason) {
            list.push({ a: arr[i], b: arr[j], reason });
          }
        } else {
          break;
        }
      }
    }

    return list;
  }, [dayRows]);

  const overlapIds = useMemo(() => {
    const set = new Set();
    conflicts.forEach(({ a, b }) => {
      set.add(a.timeTable_id);
      set.add(b.timeTable_id);
    });
    return set;
  }, [conflicts]);

  const stats = useMemo(() => {
    const total = toolbarFilteredRows.length;
    const lectures = toolbarFilteredRows.filter((r) => r.type === "LECTURE").length;
    const labs = toolbarFilteredRows.filter((r) => r.type === "LAB").length;
    const tutorials = toolbarFilteredRows.filter((r) => r.type === "TUTORIAL").length;

    return { total, lectures, labs, tutorials };
  }, [toolbarFilteredRows]);

  const validate = (x) => {
    const e = {};
    if (!x.course?.trim()) e.course = "Course degree required";
    if (!String(x.semester).trim()) e.semester = "Semester required";
    if (!x.subject?.trim()) e.subject = "Subject name required";
    if (!x.day) e.day = "Day required";
    if (!x.start_time) e.start_time = "Start time required";
    if (!x.end_time) e.end_time = "End time required";

    if (x.start_time && x.end_time && toMin(x.start_time) >= toMin(x.end_time)) {
      e.end_time = "End time must be after start time";
    }

    if (!x.faculty_name?.trim()) e.faculty_name = "Faculty professor required";
    if (!x.room?.trim()) e.room = "Room or Lab number required";

    return e;
  };

  const openCreate = () => {
    setForm({
      ...emptyForm,
      day: activeDay,
      course: fCourse || "BCA",
      semester: fSem || "1",
      batch: fBatch || "A",
      type: fType !== "ALL" ? fType : "LECTURE",
    });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row) => {
    setForm({
      ...emptyForm,
      ...row,
      semester: String(row.semester ?? ""),
      batch: row.batch ?? "",
    });
    setErrors({});
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setSaving(false);
    setErrors({});
  };

  const saveOne = async () => {
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);

    try {
      const payload = {
        ...form,
        semester: Number(form.semester),
        batch: form.batch?.trim() ? form.batch.trim() : null,
        subject_code: form.subject_code?.trim() ? form.subject_code.trim() : null,
        note: form.note?.trim() ? form.note.trim() : null,
        meet_link: form.meet_link?.trim() ? form.meet_link.trim() : null,
      };

      if (form.timeTable_id) {
        await axios.post(API.update, payload);
        showToast("ok", "Timetable slot updated successfully");
      } else {
        await axios.post(API.create, payload);
        showToast("ok", "New timetable period scheduled");
      }

      closeModal();
      fetchList();
    } catch (error) {
      console.error(error);
      showToast("err", "Save timetable slot failed");
    } finally {
      setSaving(false);
    }
  };

  const removeOne = async (row) => {
    if (!window.confirm(`Delete ${row.subject} (${fmt12(row.start_time)}) timetable slot?`)) return;

    try {
      const res = await axios.post(API.remove, { id: row.timeTable_id });

      if (res?.status === 200 && (res.data?.ok === true || res.data?.message === 1)) {
        showToast("ok", "Class period deleted");
        fetchList();
      } else {
        showToast("err", "Delete slot failed");
      }
    } catch (error) {
      console.error(error);
      showToast("err", error?.response?.data?.message || "Delete failed");
    }
  };

  const addBulkRow = () => {
    setBulkItems((prev) => [
      ...prev,
      {
        ...emptyForm,
        day: activeDay,
        course: fCourse || "BCA",
        semester: fSem || "1",
        batch: fBatch || "A",
        type: fType !== "ALL" ? fType : "LECTURE",
      },
    ]);
  };

  const updateBulk = (index, key, value) => {
    setBulkItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  };

  const removeBulkRow = (index) => {
    setBulkItems((prev) => prev.filter((_, i) => i !== index));
  };

  const saveBulk = async () => {
    for (const item of bulkItems) {
      const e = validate(item);
      if (Object.keys(e).length) {
        showToast("err", "Please fill required fields in all bulk rows");
        return;
      }
    }

    try {
      setSaving(true);

      for (const item of bulkItems) {
        await axios.post(API.create, {
          ...item,
          semester: Number(item.semester),
          batch: item.batch?.trim() ? item.batch.trim() : null,
          subject_code: item.subject_code?.trim() ? item.subject_code.trim() : null,
          note: item.note?.trim() ? item.note.trim() : null,
          meet_link: item.meet_link?.trim() ? item.meet_link.trim() : null,
        });
      }

      showToast("ok", `Added ${bulkItems.length} timetable periods`);
      setBulk(false);
      setBulkItems([{ ...emptyForm, day: activeDay }]);
      fetchList();
    } catch (error) {
      console.error(error);
      showToast("err", "Bulk save failed");
    } finally {
      setSaving(false);
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(toolbarFilteredRows, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timetable-schedule-${activeDay}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("ok", "Timetable exported as JSON");
  };

  const printNow = () => {
    setOpen(false);
    setTimeout(() => window.print(), 250);
  };

  const resetFilters = () => {
    setQ("");
    setFCourse("");
    setFSem("");
    setFBatch("");
    setFType("ALL");
  };

  const isFiltered = q || fCourse || fSem || fBatch || fType !== "ALL";

  return (
    <div className="tt-pro-root">
      {/* Toast Alert */}
      {toast && (
        <div className={`tt-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheck /> : <FiAlertCircle />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* =========================================================
          1. HERO COMMAND BANNER
          ========================================================= */}
      <section className="tt-hero-banner no-print">
        <div className="tt-hero-left">
          <div className="tt-live-chip">
            <span className="tt-ping" />
            <span className="tt-live-txt">ACADEMIC SCHEDULING &amp; TIMETABLE CONTROL CENTER</span>
          </div>
          <h1 className="tt-hero-title">Timetable &amp; Class Schedules</h1>
          <p className="tt-hero-sub">
            Coordinate weekly lecture slots, assign laboratory halls, track faculty periods, and resolve classroom conflicts.
          </p>
        </div>

        <div className="tt-hero-right">
          <div className="tt-hero-actions">
            <button
              className={`tt-btn ghost ${refreshing ? "spinning" : ""}`}
              onClick={() => fetchList(true)}
              disabled={refreshing}
              title="Refresh timetable slots"
            >
              <FiRefreshCw className={refreshing ? "spin-ico" : ""} />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>

            <button className="tt-btn ghost" onClick={exportJson} title="Export timetable JSON">
              <FiDownload />
              <span>Export</span>
            </button>

            <button className="tt-btn ghost" onClick={printNow} title="Print timetable schedule">
              <FiPrinter />
              <span>Print</span>
            </button>

            <button
              className={cn("tt-btn", bulk ? "primary" : "ghost")}
              onClick={() => setBulk((v) => !v)}
              title="Bulk Add Multiple Slots"
            >
              <FiLayers />
              <span>{bulk ? "Close Bulk Mode" : "Bulk Add"}</span>
            </button>

            <button className="tt-btn primary" onClick={openCreate}>
              <FiPlus />
              <span>+ Add Slot</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          2. KPI STATS ROW
          ========================================================= */}
      <div className="tt-kpi-grid no-print">
        <div className="tt-kpi-card total">
          <div className="kpi-top">
            <span className="kpi-title">Total Active Periods</span>
            <div className="kpi-icon-box total">
              <FiCalendar />
            </div>
          </div>
          <div className="kpi-val">{stats.total}</div>
          <span className="kpi-foot">All days across campus</span>
        </div>

        <div className="tt-kpi-card lecture">
          <div className="kpi-top">
            <span className="kpi-title">Lectures (Theory)</span>
            <div className="kpi-icon-box lecture">
              <FiBookOpen />
            </div>
          </div>
          <div className="kpi-val lecture-val">{stats.lectures}</div>
          <span className="kpi-foot">Classroom sessions</span>
        </div>

        <div className="tt-kpi-card lab">
          <div className="kpi-top">
            <span className="kpi-title">Lab Practicals</span>
            <div className="kpi-icon-box lab">
              <FiLayers />
            </div>
          </div>
          <div className="kpi-val lab-val">{stats.labs}</div>
          <span className="kpi-foot">Computer &amp; Sci labs</span>
        </div>

        <div className="tt-kpi-card tutorial">
          <div className="kpi-top">
            <span className="kpi-title">Tutorials &amp; Seminars</span>
            <div className="kpi-icon-box tutorial">
              <FiUsers />
            </div>
          </div>
          <div className="kpi-val tutorial-val">{stats.tutorials}</div>
          <span className="kpi-foot">Interactive problem solving</span>
        </div>
      </div>

      {/* =========================================================
          3. DAY SELECTOR NAVIGATION TABS
          ========================================================= */}
      <div className="tt-days-strip no-print">
        {DAYS.map((day) => {
          const isActive = activeDay === day.key;
          const count = dayCounts[day.key] || 0;

          return (
            <button
              key={day.key}
              className={cn("tt-day-tab", isActive && "active")}
              onClick={() => setActiveDay(day.key)}
            >
              <div className="day-name">{day.label}</div>
              <div className="day-badge-pill">{count} Periods</div>
            </button>
          );
        })}
      </div>

      {/* =========================================================
          4. SEARCH & MULTI-FILTER TOOLBAR
          ========================================================= */}
      <div className="tt-toolbar-card no-print">
        <div className="tt-search-box">
          <FiSearch className="search-ico" />
          <input
            type="text"
            placeholder="Search timetable by subject, faculty professor, room, course, code..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && <button className="clear-btn" onClick={() => setQ("")}>✕</button>}
        </div>

        <div className="tt-filter-group">
          <div className="select-wrap">
            <input
              type="text"
              placeholder="Filter Course (e.g. BCA)"
              value={fCourse}
              onChange={(e) => setFCourse(e.target.value)}
              className="tt-mini-input"
            />
          </div>

          <div className="select-wrap">
            <input
              type="number"
              min="1"
              max="8"
              placeholder="Semester"
              value={fSem}
              onChange={(e) => setFSem(e.target.value)}
              className="tt-mini-input sem"
            />
          </div>

          <div className="select-wrap">
            <input
              type="text"
              placeholder="Batch (e.g. A)"
              value={fBatch}
              onChange={(e) => setFBatch(e.target.value)}
              className="tt-mini-input batch"
            />
          </div>

          <div className="select-wrap">
            <select
              value={fType}
              onChange={(e) => setFType(e.target.value)}
              className="tt-type-select"
            >
              <option value="ALL">All Session Types</option>
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {isFiltered && (
            <button className="tt-btn ghost small" onClick={resetFilters}>
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Conflict Warning Banner */}
      {conflicts.length > 0 && (
        <div className="tt-conflict-alert no-print">
          <FiAlertTriangle className="alert-ico" />
          <div style={{ flex: 1 }}>
            <strong>Schedule Conflict Detected ({conflicts.length} on {activeDay}):</strong>
            <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: "0.85rem", lineHeight: 1.5 }}>
              {conflicts.map((c, idx) => (
                <li key={idx}>{c.reason}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* =========================================================
          5. BULK ENTRY WORKBENCH (OPTIONAL DRAWER)
          ========================================================= */}
      {bulk && (
        <div className="tt-bulk-panel no-print">
          <div className="bulk-header">
            <div>
              <h3 className="bulk-title">⚡ Bulk Timetable Entry for {activeDay}</h3>
              <p className="bulk-sub">Rapidly input multiple lecture schedules at once</p>
            </div>
            <div className="bulk-actions">
              <button className="tt-btn ghost small" onClick={addBulkRow}>
                + Add Another Row
              </button>
              <button className="tt-btn primary small" onClick={saveBulk} disabled={saving}>
                {saving ? "Saving..." : `Save All ${bulkItems.length} Slots`}
              </button>
            </div>
          </div>

          <div className="bulk-grid-container">
            {bulkItems.map((item, index) => (
              <div key={index} className="bulk-row-card">
                <input
                  type="text"
                  placeholder="Subject Name *"
                  value={item.subject}
                  onChange={(e) => updateBulk(index, "subject", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Code"
                  value={item.subject_code}
                  onChange={(e) => updateBulk(index, "subject_code", e.target.value)}
                  className="code-input"
                />
                <input
                  type="text"
                  placeholder="Faculty *"
                  value={item.faculty_name}
                  onChange={(e) => updateBulk(index, "faculty_name", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Room *"
                  value={item.room}
                  onChange={(e) => updateBulk(index, "room", e.target.value)}
                  className="room-input"
                />
                <select
                  value={item.type}
                  onChange={(e) => updateBulk(index, "type", e.target.value)}
                >
                  {TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <div className="time-input-pair">
                  <input
                    type="time"
                    value={item.start_time.slice(0, 5)}
                    onChange={(e) => updateBulk(index, "start_time", `${e.target.value}:00`)}
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={item.end_time.slice(0, 5)}
                    onChange={(e) => updateBulk(index, "end_time", `${e.target.value}:00`)}
                  />
                </div>
                {bulkItems.length > 1 && (
                  <button
                    className="bulk-del-btn"
                    onClick={() => removeBulkRow(index)}
                    title="Remove Row"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================
          6. INTERACTIVE SCHEDULE CARDS BOARD
          ========================================================= */}
      <div className="tt-board-container no-print">
        {loading ? (
          <div className="tt-loading-box">
            <FiRefreshCw className="spin-ico" />
            <span>Loading {activeDay} schedule from PostgreSQL...</span>
          </div>
        ) : dayRows.length === 0 ? (
          <div className="tt-empty-card">
            <FiCalendar className="empty-ico" />
            <h3>No Scheduled Periods for {activeDay}</h3>
            <p>There are no classes configured matching your active filters for this day.</p>
            <button className="tt-btn primary small" onClick={openCreate}>
              + Add Class Slot
            </button>
          </div>
        ) : (
          <div className="tt-slot-grid">
            {dayRows.map((row) => {
              const isOverlap = overlapIds.has(row.timeTable_id);
              const typeClass = String(row.type || "LECTURE").toLowerCase();

              return (
                <div
                  key={row.timeTable_id}
                  className={cn("tt-slot-card", isOverlap && "conflict", typeClass)}
                >
                  <div className="slot-top-row">
                    <div className="slot-time-pill">
                      <FiClock className="clock-ico" />
                      <strong>{fmt12(row.start_time)}</strong>
                      <span className="sep">-</span>
                      <span>{fmt12(row.end_time)}</span>
                    </div>

                    <div className="slot-actions-top">
                      <button
                        className="slot-act-btn edit"
                        onClick={() => openEdit(row)}
                        title="Edit Class Slot"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className="slot-act-btn delete"
                        onClick={() => removeOne(row)}
                        title="Delete Slot"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>

                  <div className="slot-subject-info">
                    <h3 className="slot-subject-title">{row.subject || "Untitled Subject"}</h3>
                    <div className="slot-chips-row">
                      {row.subject_code && (
                        <span className="slot-chip code">{row.subject_code}</span>
                      )}
                      <span className="slot-chip course">
                        {row.course} • Sem {row.semester}
                      </span>
                      {row.batch && <span className="slot-chip batch">Batch {row.batch}</span>}
                    </div>
                  </div>

                  <div className="slot-meta-grid">
                    <div className="meta-block">
                      <span className="m-lbl">
                        <FiUser className="m-ico" /> Faculty
                      </span>
                      <strong className="m-val">{row.faculty_name || "—"}</strong>
                    </div>

                    <div className="meta-block">
                      <span className="m-lbl">
                        <FiMapPin className="m-ico" /> Room / Hall
                      </span>
                      <strong className="m-val">{row.room || "—"}</strong>
                    </div>

                    <div className="meta-block">
                      <span className="m-lbl">
                        <FiLayers className="m-ico" /> Format
                      </span>
                      <span className={`slot-type-badge ${typeClass}`}>
                        {row.type}
                      </span>
                    </div>
                  </div>

                  {row.note && (
                    <div className="slot-note-bar">
                      <span>📝 {row.note}</span>
                    </div>
                  )}

                  {row.meet_link && (
                    <a
                      href={row.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="slot-meet-link"
                    >
                      <FiVideo />
                      <span>Join Live Meeting / Class</span>
                      <FiExternalLink />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================
          7. PRINTABLE TABLE LAYOUT (Print Only)
          ========================================================= */}
      <div className="tt-print-sheet">
        <div className="print-header">
          <h2>NavNext University • Official Class Timetable</h2>
          <p>
            Day: <strong>{activeDay}</strong> | Generated on: {new Date().toLocaleDateString("en-IN")}
          </p>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th>Time Slot</th>
              <th>Subject &amp; Code</th>
              <th>Course / Sem / Batch</th>
              <th>Faculty</th>
              <th>Room</th>
              <th>Type</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {dayRows.map((row) => (
              <tr key={row.timeTable_id}>
                <td>{fmt12(row.start_time)} - {fmt12(row.end_time)}</td>
                <td><strong>{row.subject}</strong> ({row.subject_code || "—"})</td>
                <td>{row.course} Sem {row.semester} {row.batch ? `(${row.batch})` : ""}</td>
                <td>{row.faculty_name}</td>
                <td>{row.room}</td>
                <td>{row.type}</td>
                <td>{row.note || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* =========================================================
          8. CREATE / EDIT MODAL DRAWER
          ========================================================= */}
      {open && (
        <div className="tt-modal-backdrop no-print" onClick={closeModal}>
          <div className="tt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="tt-modal-header">
              <div className="modal-title-box">
                <div className="modal-icon-box">
                  {form.timeTable_id ? <FiEdit2 /> : <FiCalendar />}
                </div>
                <div>
                  <h3 className="modal-title">{form.timeTable_id ? "Update Class Period" : "Schedule New Period"}</h3>
                  <p className="modal-sub">Set academic course, room hall, and faculty timeline</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                <FiX />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); saveOne(); }} className="tt-modal-body">
              <div className="form-grid-2">
                <div className="form-field">
                  <label>Degree Course <span className="req">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. BCA"
                    value={form.course}
                    onChange={(e) => setForm({ ...form, course: e.target.value })}
                    required
                  />
                  {errors.course && <span className="err-txt">{errors.course}</span>}
                </div>

                <div className="form-field">
                  <label>Semester <span className="req">*</span></label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    placeholder="e.g. 1"
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    required
                  />
                  {errors.semester && <span className="err-txt">{errors.semester}</span>}
                </div>

                <div className="form-field">
                  <label>Batch / Section</label>
                  <input
                    type="text"
                    placeholder="e.g. Batch A"
                    value={form.batch}
                    onChange={(e) => setForm({ ...form, batch: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Day of Week <span className="req">*</span></label>
                  <select
                    value={form.day}
                    onChange={(e) => setForm({ ...form, day: e.target.value })}
                    required
                  >
                    {DAYS.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field full-width">
                  <label>Subject Name <span className="req">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Data Structures & Algorithms"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                  />
                  {errors.subject && <span className="err-txt">{errors.subject}</span>}
                </div>

                <div className="form-field">
                  <label>Subject Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CS-201"
                    value={form.subject_code}
                    onChange={(e) => setForm({ ...form, subject_code: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Faculty Professor <span className="req">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={form.faculty_name}
                    onChange={(e) => setForm({ ...form, faculty_name: e.target.value })}
                    required
                  />
                  {errors.faculty_name && <span className="err-txt">{errors.faculty_name}</span>}
                </div>

                <div className="form-field">
                  <label>Room / Lab Hall <span className="req">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Hall 302 or Lab 2"
                    value={form.room}
                    onChange={(e) => setForm({ ...form, room: e.target.value })}
                    required
                  />
                  {errors.room && <span className="err-txt">{errors.room}</span>}
                </div>

                <div className="form-field">
                  <label>Session Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Start Time <span className="req">*</span></label>
                  <input
                    type="time"
                    value={(form.start_time || "09:00:00").slice(0, 5)}
                    onChange={(e) => setForm({ ...form, start_time: `${e.target.value}:00` })}
                    required
                  />
                  {errors.start_time && <span className="err-txt">{errors.start_time}</span>}
                </div>

                <div className="form-field">
                  <label>End Time <span className="req">*</span></label>
                  <input
                    type="time"
                    value={(form.end_time || "10:00:00").slice(0, 5)}
                    onChange={(e) => setForm({ ...form, end_time: `${e.target.value}:00` })}
                    required
                  />
                  {errors.end_time && <span className="err-txt">{errors.end_time}</span>}
                </div>

                <div className="form-field full-width">
                  <label>Online Classroom Link (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://meet.google.com/xyz-abc-def"
                    value={form.meet_link}
                    onChange={(e) => setForm({ ...form, meet_link: e.target.value })}
                  />
                </div>

                <div className="form-field full-width">
                  <label>Remarks &amp; Class Notes</label>
                  <textarea
                    placeholder="e.g. Bring lab coat / Scientific calculator required"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="tt-btn ghost" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="tt-btn primary" disabled={saving}>
                  {saving ? "Saving..." : form.timeTable_id ? "Update Period" : "Schedule Period"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
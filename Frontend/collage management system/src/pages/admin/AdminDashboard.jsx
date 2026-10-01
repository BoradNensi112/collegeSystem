import React, { useEffect, useMemo, useState } from "react";
import {
  FiUsers,
  FiUserPlus,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiEdit2,
  FiEye,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiPhone,
  FiMail,
  FiBook,
  FiHash,
  FiLayers,
  FiX,
  FiCheck,
  FiAlertCircle
} from "react-icons/fi";
import "../../layout/admin/AdminDashboard.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

const API = {
  list: `${API_BASE}/Student/postStudentData`,
  create: `${API_BASE}/Student/Sadd`,
  update: `${API_BASE}/Student/update`,
  remove: `${API_BASE}/Student/delete`,
};

const cn = (...a) => a.filter(Boolean).join(" ");

const safeId = (r) =>
  String(r?.user_id ?? r?.id ?? r?.student_id ?? r?._id ?? r?.sid ?? "");

const pick = (obj, keys, fallback = "") => {
  for (const k of keys) {
    if (obj?.[k] != null && obj?.[k] !== "") return obj[k];
  }
  return fallback;
};

function normalizeStatus(s) {
  const raw = String(
    pick(s, ["status", "active", "is_active"], "active")
  ).toLowerCase();

  return raw.includes("de") || raw === "0" || raw === "false"
    ? "deactive"
    : "active";
}

const emptyForm = {
  id: "",
  first_name: "",
  last_name: "",
  user_name: "",
  email: "",
  mobile: "",
  enrollment: "",
  course: "",
  department: "",
  sem: "",
  status: "active",
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState([]);

  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [fCourse, setFCourse] = useState("all");
  const [fSem, setFSem] = useState("all");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selected, setSelected] = useState(() => new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create"); // 'create' | 'edit' | 'view'
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(emptyForm);

  const fetchJson = async (url, payload = {}) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    return { res, data };
  };

  const fetchList = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const { res, data } = await fetchJson(API.list, {});

      const list =
        data?.message ??
        data?.rows ??
        data?.data ??
        data?.students ??
        (Array.isArray(data) ? data : []);

      const arr = Array.isArray(list) ? list : [];
      setStudents(arr);
    } catch (e) {
      console.error("Student list error:", e);
      setStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const courseOptions = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      const c = pick(s, [
        "course",
        "course_name",
        "cource",
        "program",
        "program_name",
      ]);
      if (c) set.add(String(c));
    });
    return ["all", ...Array.from(set).sort()];
  }, [students]);

  const semOptions = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      const sem = pick(s, [
        "sem",
        "semester",
        "sem_no",
        "semester_no",
        "current_sem",
      ]);
      if (sem !== "") set.add(String(sem));
    });
    return ["all", ...Array.from(set).sort((a, b) => Number(a) - Number(b))];
  }, [students]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return students.filter((s) => {
      const status = normalizeStatus(s);
      const course = String(
        pick(
          s,
          ["course", "course_name", "cource", "program", "program_name"],
          ""
        )
      ).toLowerCase();

      const sem = String(
        pick(s, ["sem", "semester", "sem_no", "semester_no", "current_sem"], "")
      ).toLowerCase();

      const statusOk = fStatus === "all" ? true : status === fStatus;
      const courseOk =
        fCourse === "all" ? true : course === fCourse.toLowerCase();
      const semOk = fSem === "all" ? true : sem === String(fSem).toLowerCase();

      if (!statusOk || !courseOk || !semOk) return false;
      if (!query) return true;

      const blob = [
        pick(s, ["first_name", "fname", "student_name"], ""),
        pick(s, ["last_name", "lname"], ""),
        pick(s, ["user_name", "username", "user", "name"], ""),
        pick(s, ["email", "email_id"], ""),
        pick(s, ["mobile", "mobile_no", "phone", "phone_no"], ""),
        pick(
          s,
          ["enrollment", "enrollment_no", "enroll_no", "roll_no", "admission_no"],
          ""
        ),
        pick(s, ["department", "dept", "department_name", "branch"], ""),
        pick(
          s,
          ["course", "course_name", "cource", "program", "program_name"],
          ""
        ),
        pick(
          s,
          ["sem", "semester", "sem_no", "semester_no", "current_sem"],
          ""
        ),
      ]
        .join(" ")
        .toLowerCase();

      return blob.includes(query);
    });
  }, [students, q, fStatus, fCourse, fSem]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const overallCounts = useMemo(() => {
    const total = students.length;
    const active = students.filter((x) => normalizeStatus(x) === "active").length;
    const deactive = total - active;
    return { total, active, deactive };
  }, [students]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const allOnPageSelected =
    pageRows.length > 0 &&
    pageRows.every((r, index) => {
      const id = safeId(r) || `row-${page}-${index}`;
      return selected.has(id);
    });

  const toggleSelectAllOnPage = () => {
    const next = new Set(selected);
    if (allOnPageSelected) {
      pageRows.forEach((r, index) => {
        const id = safeId(r) || `row-${page}-${index}`;
        next.delete(id);
      });
    } else {
      pageRows.forEach((r, index) => {
        const id = safeId(r) || `row-${page}-${index}`;
        next.add(id);
      });
    }
    setSelected(next);
  };

  const toggleOne = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const openCreate = () => {
    setMode("create");
    setForm(emptyForm);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const mapStudentToForm = (s) => ({
    id: safeId(s),
    first_name: pick(s, ["first_name", "fname", "student_name"], ""),
    last_name: pick(s, ["last_name", "lname"], ""),
    user_name: pick(s, ["user_name", "username", "user", "name"], ""),
    email: pick(s, ["email", "email_id"], ""),
    mobile: pick(s, ["mobile", "mobile_no", "phone", "phone_no"], ""),
    enrollment: pick(
      s,
      ["enrollment", "enrollment_no", "enroll_no", "roll_no", "admission_no"],
      ""
    ),
    course: pick(
      s,
      ["course", "course_name", "cource", "program", "program_name"],
      ""
    ),
    department: pick(
      s,
      ["department", "dept", "department_name", "branch"],
      ""
    ),
    sem: pick(
      s,
      ["sem", "semester", "sem_no", "semester_no", "current_sem"],
      ""
    ),
    status: normalizeStatus(s),
  });

  const openView = (s) => {
    setMode("view");
    setForm(mapStudentToForm(s));
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setMode("edit");
    setForm(mapStudentToForm(s));
    setModalOpen(true);
  };

  const buildPayload = () => {
    const id = form.id || undefined;
    const cleanSem =
      form.sem === "" || form.sem == null ? "" : Number(form.sem);

    return {
      id,
      user_id: id,
      student_id: id,
      sid: id,
      first_name: form.first_name?.trim(),
      last_name: form.last_name?.trim(),
      user_name: form.user_name?.trim(),
      username: form.user_name?.trim(),
      email: form.email?.trim(),
      email_id: form.email?.trim(),
      mobile: form.mobile?.trim(),
      mobile_no: form.mobile?.trim(),
      phone: form.mobile?.trim(),
      enrollment: form.enrollment?.trim(),
      enrollment_no: form.enrollment?.trim(),
      enroll_no: form.enrollment?.trim(),
      roll_no: form.enrollment?.trim(),
      course: form.course?.trim(),
      course_name: form.course?.trim(),
      cource: form.course?.trim(),
      program: form.course?.trim(),
      department: form.department?.trim(),
      dept: form.department?.trim(),
      branch: form.department?.trim(),
      sem: cleanSem,
      semester: cleanSem,
      sem_no: cleanSem,
      semester_no: cleanSem,
      status: form.status,
      active: form.status,
      is_active: form.status === "active",
    };
  };

  const save = async (e) => {
    e.preventDefault();

    if (!form.first_name.trim()) return alert("First name required");
    if (!form.user_name.trim()) return alert("Username required");
    if (!form.email.trim()) return alert("Email required");

    if (mode === "edit" && !form.id) {
      return alert("Student ID missing");
    }

    try {
      setSaving(true);
      const url = mode === "edit" ? API.update : API.create;
      const payload = buildPayload();

      const { res, data } = await fetchJson(url, payload);

      if (!res.ok || data?.success === false) {
        alert(data?.message || "Failed to save student details");
        return;
      }

      closeModal();
      await fetchList();
      alert(
        mode === "edit"
          ? "Student profile updated successfully"
          : "New student registered successfully"
      );
    } catch (err) {
      console.error("Save error:", err);
      alert("Save failed. Please check network connection.");
    } finally {
      setSaving(false);
    }
  };

  const removeOne = async (s) => {
    const id = safeId(s);
    if (!id) return alert("Student ID missing");

    if (!window.confirm("Are you sure you want to delete this student record?")) return;

    const payload = {
      id,
      user_id: id,
      student_id: id,
      sid: id,
    };

    try {
      const { res, data } = await fetchJson(API.remove, payload);

      if (!res.ok || data?.success === false) {
        alert(data?.message || "Server error while deleting");
        return;
      }

      setStudents((prev) => prev.filter((row) => safeId(row) !== id));
      setSelected((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });

      alert("Student deleted successfully");
    } catch (e) {
      console.error("Delete error:", e);
      alert("Delete failed.");
    }
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} selected student records?`)) return;

    try {
      const ids = Array.from(selected);
      const failed = [];

      for (const id of ids) {
        const payload = { id, user_id: id, student_id: id, sid: id };
        // eslint-disable-next-line no-await-in-loop
        const { res, data } = await fetchJson(API.remove, payload);
        if (!res.ok || data?.success === false) {
          failed.push(id);
        }
      }

      if (failed.length) {
        alert(`Some deletions could not complete: ${failed.join(", ")}`);
      } else {
        alert("Selected students removed successfully");
      }

      setSelected(new Set());
      await fetchList();
    } catch (e) {
      console.error("Bulk delete error:", e);
      alert("Bulk delete encountered an issue.");
    }
  };

  const resetFilters = () => {
    setQ("");
    setFStatus("all");
    setFCourse("all");
    setFSem("all");
    setPage(1);
  };

  return (
    <div className="sm-root">
      {/* =========================================================
          1. HEADER HERO BANNER
          ========================================================= */}
      <section className="sm-hero">
        <div className="sm-hero-left">
          <div className="sm-live-chip">
            <span className="sm-ping" />
            <span className="sm-live-txt">STUDENT DIRECTORY • REALTIME DATABASE</span>
          </div>
          <h1 className="sm-title">Manage Students</h1>
          <p className="sm-sub">
            Search, filter, edit student profiles, enrollments, and academic statuses in one central place.
          </p>
        </div>

        <div className="sm-hero-right">
          {/* Quick Metric Pills */}
          <div className="sm-kpi-row">
            <div className="sm-kpi-pill">
              <span className="sm-kpi-lbl">Total</span>
              <span className="sm-kpi-val">{overallCounts.total}</span>
            </div>
            <div className="sm-kpi-pill ok">
              <span className="sm-kpi-lbl">Active</span>
              <span className="sm-kpi-val">{overallCounts.active}</span>
            </div>
            <div className="sm-kpi-pill bad">
              <span className="sm-kpi-lbl">Deactive</span>
              <span className="sm-kpi-val">{overallCounts.deactive}</span>
            </div>
          </div>

          <div className="sm-hero-actions">
            <button
              className={`sm-btn ghost ${refreshing ? "spinning" : ""}`}
              onClick={() => fetchList(true)}
              disabled={refreshing}
              title="Refresh database records"
            >
              <FiRefreshCw className={refreshing ? "spin-ico" : ""} />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>

            {selected.size > 0 && (
              <button className="sm-btn danger" onClick={bulkDelete}>
                <FiTrash2 />
                <span>Delete Selected ({selected.size})</span>
              </button>
            )}

            <button className="sm-btn primary" onClick={openCreate}>
              <FiUserPlus />
              <span>+ Add Student</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          2. FILTER & SEARCH CONTROL BAR
          ========================================================= */}
      <div className="sm-filter-bar">
        <div className="sm-search-box">
          <FiSearch className="sm-search-ico" />
          <input
            id="sm-search-input"
            name="sm-search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search by student name, roll/enrollment, email, mobile, course..."
            autoComplete="off"
          />
          {q && (
            <button
              className="sm-clear-btn"
              onClick={() => setQ("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="sm-dropdown-group">
          <div className="sm-select-wrap">
            <FiFilter className="sm-select-ico" />
            <select
              value={fStatus}
              onChange={(e) => {
                setFStatus(e.target.value);
                setPage(1);
              }}
              className="sm-select"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="deactive">Deactive Only</option>
            </select>
          </div>

          <div className="sm-select-wrap">
            <FiBook className="sm-select-ico" />
            <select
              value={fCourse}
              onChange={(e) => {
                setFCourse(e.target.value);
                setPage(1);
              }}
              className="sm-select"
            >
              {courseOptions.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All Courses" : c}
                </option>
              ))}
            </select>
          </div>

          <div className="sm-select-wrap">
            <FiLayers className="sm-select-ico" />
            <select
              value={fSem}
              onChange={(e) => {
                setFSem(e.target.value);
                setPage(1);
              }}
              className="sm-select"
            >
              {semOptions.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All Semesters" : `Sem ${s}`}
                </option>
              ))}
            </select>
          </div>

          {(q || fStatus !== "all" || fCourse !== "all" || fSem !== "all") && (
            <button className="sm-btn ghost small reset-btn" onClick={resetFilters}>
              Reset Filters
            </button>
          )}
        </div>

        <div className="sm-results-badge">
          Showing <strong>{filtered.length}</strong> matching records
        </div>
      </div>

      {/* =========================================================
          3. MASTER GLASSMORPHIC STUDENTS TABLE
          ========================================================= */}
      <div className="sm-table-card">
        <div className="sm-table-wrapper">
          <table className="sm-table">
            <thead>
              <tr>
                <th style={{ width: 44 }}>
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAllOnPage}
                    className="sm-checkbox"
                    aria-label="Select all on page"
                  />
                </th>
                <th>Student Profile</th>
                <th>Enrollment / Roll</th>
                <th>Course & Dept</th>
                <th>Semester</th>
                <th>Contact Mobile</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="sm-empty-cell">
                    <div className="sm-loading-box">
                      <FiRefreshCw className="spin-ico" />
                      <span>Loading student records from PostgreSQL database...</span>
                    </div>
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="sm-empty-cell">
                    <div className="sm-no-data-box">
                      <FiUsers className="sm-no-ico" />
                      <h4>No matching students found</h4>
                      <p>Try refining your search query or reset active filters.</p>
                      <button className="sm-btn primary small" onClick={openCreate}>
                        + Add New Student
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                pageRows.map((s, idx) => {
                  const id = safeId(s) || `row-${page}-${idx}`;
                  const st = normalizeStatus(s);
                  const fname = pick(s, ["first_name", "fname", "student_name"], "Student");
                  const lname = pick(s, ["last_name", "lname"], "");
                  const fullName = `${fname} ${lname}`.trim();
                  const isChecked = selected.has(id);

                  return (
                    <tr key={id} className={isChecked ? "selected-row" : ""}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOne(id)}
                          className="sm-checkbox"
                          aria-label={`Select ${fullName}`}
                        />
                      </td>

                      <td>
                        <div className="sm-user-profile">
                          <div className="sm-avatar">
                            {(fname[0] || "S").toUpperCase()}
                          </div>
                          <div>
                            <div className="sm-full-name">{fullName}</div>
                            <div className="sm-user-email">
                              <FiMail className="sm-sub-ico" />
                              <span>{pick(s, ["email", "email_id"], "—")}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="sm-mono-pill">
                          <FiHash className="sm-hash-ico" />
                          {pick(s, ["enrollment", "enrollment_no", "enroll_no", "roll_no", "admission_no"], "—")}
                        </span>
                      </td>

                      <td>
                        <div className="sm-course-block">
                          <span className="sm-course-tag">
                            {pick(s, ["course", "course_name", "cource", "program"], "General")}
                          </span>
                          <span className="sm-dept-txt">
                            {pick(s, ["department", "dept", "branch"], "Main Dept")}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="sm-sem-pill">
                          Sem {pick(s, ["sem", "semester", "sem_no", "current_sem"], "1")}
                        </span>
                      </td>

                      <td>
                        <div className="sm-phone-box">
                          <FiPhone className="sm-sub-ico" />
                          <span>{pick(s, ["mobile", "mobile_no", "phone"], "—")}</span>
                        </div>
                      </td>

                      <td>
                        <span className={`sm-status-chip ${st === "active" ? "active" : "deactive"}`}>
                          <span className="sm-status-dot" />
                          {st === "active" ? "Active" : "Deactive"}
                        </span>
                      </td>

                      <td className="text-right">
                        <div className="sm-action-btns">
                          <button
                            className="sm-act-btn view"
                            onClick={() => openView(s)}
                            title="View Profile"
                          >
                            <FiEye />
                          </button>
                          <button
                            className="sm-act-btn edit"
                            onClick={() => openEdit(s)}
                            title="Edit Student"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            className="sm-act-btn delete"
                            onClick={() => removeOne(s)}
                            title="Delete Student"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* =========================================================
            4. PAGINATION FOOTER
            ========================================================= */}
        <div className="sm-pagination">
          <div className="sm-page-count">
            Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({filtered.length} total students)
          </div>

          <div className="sm-pager-nav">
            <button
              className="sm-page-btn"
              onClick={() => setPage(1)}
              disabled={page === 1}
              title="First Page"
            >
              <FiChevronsLeft />
            </button>
            <button
              className="sm-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              title="Previous Page"
            >
              <FiChevronLeft />
            </button>

            <span className="sm-current-page">{page}</span>

            <button
              className="sm-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              title="Next Page"
            >
              <FiChevronRight />
            </button>
            <button
              className="sm-page-btn"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              title="Last Page"
            >
              <FiChevronsRight />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          5. MODAL DRAWER FOR ADD / EDIT / VIEW STUDENT
          ========================================================= */}
      {modalOpen && (
        <div className="sm-modal-backdrop" onClick={closeModal}>
          <div className="sm-modal-panel" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sm-modal-head">
              <div className="sm-modal-title-row">
                <div className="sm-modal-icon-box">
                  {mode === "create" ? <FiUserPlus /> : mode === "edit" ? <FiEdit2 /> : <FiEye />}
                </div>
                <div>
                  <h3 className="sm-m-title">
                    {mode === "create"
                      ? "Register New Student"
                      : mode === "edit"
                      ? "Edit Student Profile"
                      : "Student Details & Dossier"}
                  </h3>
                  <p className="sm-m-sub">
                    {mode === "create"
                      ? "Enter student academic credentials and identity details"
                      : mode === "edit"
                      ? `Updating record for ${form.first_name} ${form.last_name}`
                      : `View complete profile information`}
                  </p>
                </div>
              </div>
              <button className="sm-modal-close" onClick={closeModal} title="Close modal">
                <FiX />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={save} className="sm-modal-body">
              <div className="sm-form-grid">
                {/* First Name */}
                <div className="sm-form-field">
                  <label>First Name <span className="req">*</span></label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="e.g. Rahul"
                    required
                    disabled={mode === "view"}
                  />
                </div>

                {/* Last Name */}
                <div className="sm-form-field">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    placeholder="e.g. Sharma"
                    disabled={mode === "view"}
                  />
                </div>

                {/* Username */}
                <div className="sm-form-field">
                  <label>Username <span className="req">*</span></label>
                  <input
                    type="text"
                    value={form.user_name}
                    onChange={(e) => setForm({ ...form, user_name: e.target.value })}
                    placeholder="e.g. rahul_sharma"
                    required
                    disabled={mode === "view"}
                  />
                </div>

                {/* Email */}
                <div className="sm-form-field">
                  <label>Email Address <span className="req">*</span></label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. rahul@example.com"
                    required
                    disabled={mode === "view"}
                  />
                </div>

                {/* Enrollment / Roll No */}
                <div className="sm-form-field">
                  <label>Enrollment / Roll No</label>
                  <input
                    type="text"
                    value={form.enrollment}
                    onChange={(e) => setForm({ ...form, enrollment: e.target.value })}
                    placeholder="e.g. 2026BCA102"
                    disabled={mode === "view"}
                  />
                </div>

                {/* Mobile */}
                <div className="sm-form-field">
                  <label>Mobile Number</label>
                  <input
                    type="text"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="e.g. 9876543210"
                    disabled={mode === "view"}
                  />
                </div>

                {/* Course */}
                <div className="sm-form-field">
                  <label>Degree Course / Program</label>
                  <input
                    type="text"
                    value={form.course}
                    onChange={(e) => setForm({ ...form, course: e.target.value })}
                    placeholder="e.g. BCA, MCA, B.Tech, MBA"
                    disabled={mode === "view"}
                  />
                </div>

                {/* Department */}
                <div className="sm-form-field">
                  <label>Department / Branch</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="e.g. Computer Science"
                    disabled={mode === "view"}
                  />
                </div>

                {/* Semester */}
                <div className="sm-form-field">
                  <label>Current Semester</label>
                  <select
                    value={form.sem}
                    onChange={(e) => setForm({ ...form, sem: e.target.value })}
                    disabled={mode === "view"}
                    className="sm-modal-select"
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="sm-form-field">
                  <label>Account Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    disabled={mode === "view"}
                    className="sm-modal-select"
                  >
                    <option value="active">Active (Enrolled)</option>
                    <option value="deactive">Deactive (Suspended/Alumni)</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sm-modal-footer">
                <button type="button" className="sm-btn ghost" onClick={closeModal}>
                  Close
                </button>
                {mode !== "view" && (
                  <button type="submit" className="sm-btn primary" disabled={saving}>
                    {saving ? "Saving..." : mode === "edit" ? "Save Changes" : "Register Student"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
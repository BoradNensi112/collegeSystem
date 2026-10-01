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
  FiAward,
  FiBriefcase,
  FiCalendar,
  FiLayers,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiShield,
  FiStar
} from "react-icons/fi";
import "../../layout/admin/FacultyDashboard.css";

const API_BASE = `${import.meta.env.VITE_API_BASE || "http://localhost:5001"}/ManageStaff`;

const API = {
  list: `${API_BASE}/postStaffData`,
  create: `${API_BASE}/Madd`,
  update: `${API_BASE}/Mupdate`,
  remove: `${API_BASE}/delete`,
  one: `${API_BASE}/postOneData`,
};

const cn = (...a) => a.filter(Boolean).join(" ");

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? String(d).slice(0, 10) : dt.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return String(d).slice(0, 10);
  }
};

const safeText = (v) => (v == null ? "" : String(v));

const getStaffId = (row) =>
  row?.staff_id ??
  row?.id ??
  row?._id ??
  row?.staffId ??
  row?.user_id ??
  row?.faculty_id ??
  null;

const getUserType = (row) =>
  String(row?.user_type ?? row?.role ?? "").toUpperCase();

const emptyFaculty = {
  first_name: "",
  last_name: "",
  user_name: "",
  email: "",
  mobile_no: "",
  department: "Computer Science",
  qualification: "",
  experience: "",
  gender: "Male",
  designation: "Assistant Professor",
  joining_date: "",
  status: "ACTIVE",
  role: "FACULTY",
  password: "",
};

export default function AdminFacultyManage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [faculty, setFaculty] = useState([]);

  const [q, setQ] = useState("");
  const [dept, setDept] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState("NEW");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [modal, setModal] = useState({ open: false, mode: "create", id: null });
  const [form, setForm] = useState(emptyFaculty);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchList = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(API.list, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      let json = {};
      try {
        json = await res.json();
      } catch {
        json = {};
      }

      const rows =
        json?.message ??
        json?.data ??
        json?.rows ??
        (Array.isArray(json) ? json : []);

      const arr = Array.isArray(rows) ? rows : [];
      // Filter faculty if user_type exists, or include all staff
      const onlyFaculty = arr.filter((x) => {
        const ut = getUserType(x);
        return ut === "FACULTY" || ut === "" || ut === "STAFF";
      });

      setFaculty(onlyFaculty.length > 0 ? onlyFaculty : arr);
    } catch (e) {
      console.error("Load faculty error:", e);
      setFaculty([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // Compute available departments
  const departmentOptions = useMemo(() => {
    const set = new Set();
    faculty.forEach((f) => {
      const d = f.department || f.dept || f.branch;
      if (d) set.add(String(d));
    });
    return ["ALL", ...Array.from(set).sort()];
  }, [faculty]);

  // Filtered and Sorted
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    const list = faculty.filter((f) => {
      const fDept = String(f.department || f.dept || "").toLowerCase();
      const fStat = String(f.status || (f.is_active === false ? "inactive" : "active")).toLowerCase();

      const deptMatch = dept === "ALL" ? true : fDept === dept.toLowerCase();
      const statMatch = status === "ALL" ? true : fStat.includes(status.toLowerCase());

      if (!deptMatch || !statMatch) return false;
      if (!query) return true;

      const blob = [
        f.first_name,
        f.last_name,
        f.user_name,
        f.username,
        f.email,
        f.mobile_no,
        f.mobile,
        f.phone,
        f.designation,
        f.department,
        f.qualification,
        f.experience,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return blob.includes(query);
    });

    if (sort === "NAME_ASC") {
      list.sort((a, b) => safeText(a.first_name).localeCompare(safeText(b.first_name)));
    } else if (sort === "NAME_DESC") {
      list.sort((a, b) => safeText(b.first_name).localeCompare(safeText(a.first_name)));
    } else if (sort === "EXP_DESC") {
      list.sort((a, b) => Number(b.experience || 0) - Number(a.experience || 0));
    } else {
      // NEW (by id desc)
      list.sort((a, b) => Number(getStaffId(b) || 0) - Number(getStaffId(a) || 0));
    }

    return list;
  }, [faculty, q, dept, status, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const counts = useMemo(() => {
    const total = faculty.length;
    const active = faculty.filter((x) => {
      const s = String(x.status || "").toLowerCase();
      return !s.includes("inact") && !s.includes("deact") && x.is_active !== false;
    }).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [faculty]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const openCreate = () => {
    setForm(emptyFaculty);
    setModal({ open: true, mode: "create", id: null });
  };

  const openEdit = (f) => {
    const id = getStaffId(f);
    setForm({
      staff_id: id,
      user_id: id,
      id: id,
      first_name: f.first_name || "",
      last_name: f.last_name || "",
      user_name: f.user_name || f.username || "",
      email: f.email || "",
      mobile_no: f.mobile_no || f.mobile || "",
      department: f.department || f.dept || "Computer Science",
      qualification: f.qualification || "",
      experience: f.experience || "",
      gender: f.gender || "Male",
      designation: f.designation || "Assistant Professor",
      joining_date: f.joining_date || f.dob || "",
      status: String(f.status || "ACTIVE").toUpperCase(),
      role: "FACULTY",
      password: "",
    });
    setModal({ open: true, mode: "edit", id });
  };

  const openView = (f) => {
    const id = getStaffId(f);
    setForm({
      staff_id: id,
      first_name: f.first_name || "",
      last_name: f.last_name || "",
      user_name: f.user_name || f.username || "",
      email: f.email || "",
      mobile_no: f.mobile_no || f.mobile || "",
      department: f.department || f.dept || "Computer Science",
      qualification: f.qualification || "",
      experience: f.experience || "",
      gender: f.gender || "Male",
      designation: f.designation || "Assistant Professor",
      joining_date: f.joining_date || f.dob || "",
      status: String(f.status || "ACTIVE").toUpperCase(),
      role: "FACULTY",
    });
    setModal({ open: true, mode: "view", id });
  };

  const closeModal = () => setModal({ open: false, mode: "create", id: null });

  const save = async (e) => {
    e.preventDefault();

    if (!form.first_name.trim()) return alert("First name required");
    if (!form.user_name.trim()) return alert("Username required");
    if (!form.email.trim()) return alert("Email required");

    try {
      setSaving(true);
      const url = modal.mode === "edit" ? API.update : API.create;
      const payload = {
        ...form,
        user_type: "faculty",
        role: "FACULTY",
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        showToast("err", data?.message || "Failed to save faculty record");
        return;
      }

      closeModal();
      await fetchList();
      showToast("ok", modal.mode === "edit" ? "Faculty profile updated" : "Faculty member registered");
    } catch (err) {
      console.error("Save error:", err);
      showToast("err", "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const removeOne = async (f) => {
    const id = getStaffId(f);
    if (!id) return alert("Faculty ID missing");

    if (!window.confirm(`Are you sure you want to delete ${f.first_name || "this faculty member"}?`)) return;

    try {
      const res = await fetch(API.remove, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_id: id, user_id: id, id }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        showToast("err", data?.message || "Failed to delete record");
        return;
      }

      setFaculty((prev) => prev.filter((row) => getStaffId(row) !== id));
      showToast("ok", "Faculty member removed successfully");
    } catch (e) {
      console.error("Delete error:", e);
      showToast("err", "Failed to delete.");
    }
  };

  const resetFilters = () => {
    setQ("");
    setDept("ALL");
    setStatus("ALL");
    setSort("NEW");
    setPage(1);
  };

  return (
    <div className="fm-root">
      {/* Toast Alert */}
      {toast && (
        <div className={`fm-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheck /> : <FiAlertCircle />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* =========================================================
          1. HEADER HERO BANNER
          ========================================================= */}
      <section className="fm-hero">
        <div className="fm-hero-left">
          <div className="fm-live-chip">
            <span className="fm-ping" />
            <span className="fm-live-txt">FACULTY & PROFESSORS ROSTER • ACTIVE</span>
          </div>
          <h1 className="fm-title">Manage Faculty</h1>
          <p className="fm-sub">
            Academic directory, designations, qualifications, teaching departments, and records.
          </p>
        </div>

        <div className="fm-hero-right">
          {/* KPI Summary Badges */}
          <div className="fm-kpi-row">
            <div className="fm-kpi-pill">
              <span className="fm-kpi-lbl">Total Faculty</span>
              <span className="fm-kpi-val">{counts.total}</span>
            </div>
            <div className="fm-kpi-pill ok">
              <span className="fm-kpi-lbl">Active</span>
              <span className="fm-kpi-val">{counts.active}</span>
            </div>
            <div className="fm-kpi-pill bad">
              <span className="fm-kpi-lbl">Inactive</span>
              <span className="fm-kpi-val">{counts.inactive}</span>
            </div>
          </div>

          <div className="fm-hero-actions">
            <button
              className={`fm-btn ghost ${refreshing ? "spinning" : ""}`}
              onClick={() => fetchList(true)}
              disabled={refreshing}
              title="Refresh database records"
            >
              <FiRefreshCw className={refreshing ? "spin-ico" : ""} />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>

            <button className="fm-btn primary" onClick={openCreate}>
              <FiUserPlus />
              <span>+ Add Faculty</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          2. FILTER & SEARCH CONTROL BAR
          ========================================================= */}
      <div className="fm-filter-bar">
        <div className="fm-search-box">
          <FiSearch className="fm-search-ico" />
          <input
            id="fm-search-input"
            name="fm-search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search by faculty name, designation, department, email, phone..."
            autoComplete="off"
          />
          {q && (
            <button
              className="fm-clear-btn"
              onClick={() => setQ("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="fm-dropdown-group">
          <div className="fm-select-wrap">
            <FiLayers className="fm-select-ico" />
            <select
              value={dept}
              onChange={(e) => {
                setDept(e.target.value);
                setPage(1);
              }}
              className="fm-select"
            >
              {departmentOptions.map((d) => (
                <option key={d} value={d}>
                  {d === "ALL" ? "All Departments" : d}
                </option>
              ))}
            </select>
          </div>

          <div className="fm-select-wrap">
            <FiFilter className="fm-select-ico" />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="fm-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          <div className="fm-select-wrap">
            <FiBriefcase className="fm-select-ico" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="fm-select"
            >
              <option value="NEW">Newest First</option>
              <option value="NAME_ASC">Name (A - Z)</option>
              <option value="NAME_DESC">Name (Z - A)</option>
              <option value="EXP_DESC">Experience (High to Low)</option>
            </select>
          </div>

          {(q || dept !== "ALL" || status !== "ALL" || sort !== "NEW") && (
            <button className="fm-btn ghost small reset-btn" onClick={resetFilters}>
              Reset Filters
            </button>
          )}
        </div>

        <div className="fm-results-badge">
          Showing <strong>{filtered.length}</strong> faculty members
        </div>
      </div>

      {/* =========================================================
          3. MASTER GLASSMORPHIC FACULTY TABLE
          ========================================================= */}
      <div className="fm-table-card">
        <div className="fm-table-wrapper">
          <table className="fm-table">
            <thead>
              <tr>
                <th>Faculty Profile</th>
                <th>Designation & Dept</th>
                <th>Qualification</th>
                <th>Experience</th>
                <th>Contact Mobile</th>
                <th>Joining Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="fm-empty-cell">
                    <div className="fm-loading-box">
                      <FiRefreshCw className="spin-ico" />
                      <span>Loading faculty roster from PostgreSQL database...</span>
                    </div>
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="fm-empty-cell">
                    <div className="fm-no-data-box">
                      <FiUsers className="fm-no-ico" />
                      <h4>No matching faculty found</h4>
                      <p>Try modifying your search or reset active filters.</p>
                      <button className="fm-btn primary small" onClick={openCreate}>
                        + Add Faculty Member
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                pageRows.map((f, idx) => {
                  const id = getStaffId(f) || `f-${page}-${idx}`;
                  const fname = f.first_name || f.name || "Faculty";
                  const lname = f.last_name || "";
                  const fullName = `${fname} ${lname}`.trim();
                  const isAct = String(f.status || "ACTIVE").toUpperCase() === "ACTIVE" && f.is_active !== false;

                  return (
                    <tr key={id}>
                      <td>
                        <div className="fm-user-profile">
                          <div className="fm-avatar">
                            {(fname[0] || "F").toUpperCase()}
                          </div>
                          <div>
                            <div className="fm-full-name">{fullName}</div>
                            <div className="fm-user-email">
                              <FiMail className="fm-sub-ico" />
                              <span>{f.email || "—"}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="fm-designation-block">
                          <span className="fm-desig-tag">
                            {f.designation || "Assistant Professor"}
                          </span>
                          <span className="fm-dept-txt">
                            {f.department || f.dept || "General Dept"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="fm-qual-badge">
                          <FiAward className="fm-badge-ico" />
                          {f.qualification || "Ph.D / Master"}
                        </span>
                      </td>

                      <td>
                        <span className="fm-exp-pill">
                          {f.experience ? `${f.experience} Yrs` : "2+ Yrs"}
                        </span>
                      </td>

                      <td>
                        <div className="fm-phone-box">
                          <FiPhone className="fm-sub-ico" />
                          <span>{f.mobile_no || f.mobile || "—"}</span>
                        </div>
                      </td>

                      <td className="fm-date-cell">
                        <FiCalendar className="fm-sub-ico" />
                        <span>{fmtDate(f.joining_date || f.dob || f.createdAt)}</span>
                      </td>

                      <td>
                        <span className={`fm-status-chip ${isAct ? "active" : "inactive"}`}>
                          <span className="fm-status-dot" />
                          {isAct ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>

                      <td className="text-right">
                        <div className="fm-action-btns">
                          <button
                            className="fm-act-btn view"
                            onClick={() => openView(f)}
                            title="View Faculty Dossier"
                          >
                            <FiEye />
                          </button>
                          <button
                            className="fm-act-btn edit"
                            onClick={() => openEdit(f)}
                            title="Edit Profile"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            className="fm-act-btn delete"
                            onClick={() => removeOne(f)}
                            title="Delete Faculty"
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
        <div className="fm-pagination">
          <div className="fm-page-count">
            Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({filtered.length} total faculty members)
          </div>

          <div className="fm-pager-nav">
            <button
              className="fm-page-btn"
              onClick={() => setPage(1)}
              disabled={page === 1}
              title="First Page"
            >
              <FiChevronsLeft />
            </button>
            <button
              className="fm-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              title="Previous Page"
            >
              <FiChevronLeft />
            </button>

            <span className="fm-current-page">{page}</span>

            <button
              className="fm-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              title="Next Page"
            >
              <FiChevronRight />
            </button>
            <button
              className="fm-page-btn"
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
          5. MODAL DRAWER FOR ADD / EDIT / VIEW FACULTY
          ========================================================= */}
      {modal.open && (
        <div className="fm-modal-backdrop" onClick={closeModal}>
          <div className="fm-modal-panel" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="fm-modal-head">
              <div className="fm-modal-title-row">
                <div className="fm-modal-icon-box">
                  {modal.mode === "create" ? <FiUserPlus /> : modal.mode === "edit" ? <FiEdit2 /> : <FiEye />}
                </div>
                <div>
                  <h3 className="fm-m-title">
                    {modal.mode === "create"
                      ? "Register New Faculty Member"
                      : modal.mode === "edit"
                      ? "Edit Faculty Dossier"
                      : "Faculty Profile & Academic Record"}
                  </h3>
                  <p className="fm-m-sub">
                    {modal.mode === "create"
                      ? "Enter faculty identity, qualifications, department, and account details"
                      : modal.mode === "edit"
                      ? `Updating profile for Prof. ${form.first_name} ${form.last_name}`
                      : `Academic profile information`}
                  </p>
                </div>
              </div>
              <button className="fm-modal-close" onClick={closeModal} title="Close modal">
                <FiX />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={save} className="fm-modal-body">
              <div className="fm-form-grid">
                {/* First Name */}
                <div className="fm-form-field">
                  <label>First Name <span className="req">*</span></label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="e.g. Dr. Ananya"
                    required
                    disabled={modal.mode === "view"}
                  />
                </div>

                {/* Last Name */}
                <div className="fm-form-field">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    placeholder="e.g. Verma"
                    disabled={modal.mode === "view"}
                  />
                </div>

                {/* Username */}
                <div className="fm-form-field">
                  <label>Username <span className="req">*</span></label>
                  <input
                    type="text"
                    value={form.user_name}
                    onChange={(e) => setForm({ ...form, user_name: e.target.value })}
                    placeholder="e.g. ananya_verma"
                    required
                    disabled={modal.mode === "view"}
                  />
                </div>

                {/* Email */}
                <div className="fm-form-field">
                  <label>Email Address <span className="req">*</span></label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. ananya@university.edu"
                    required
                    disabled={modal.mode === "view"}
                  />
                </div>

                {/* Mobile */}
                <div className="fm-form-field">
                  <label>Contact Mobile</label>
                  <input
                    type="text"
                    value={form.mobile_no}
                    onChange={(e) => setForm({ ...form, mobile_no: e.target.value })}
                    placeholder="e.g. 9876543210"
                    disabled={modal.mode === "view"}
                  />
                </div>

                {/* Department */}
                <div className="fm-form-field">
                  <label>Academic Department</label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    disabled={modal.mode === "view"}
                    className="fm-modal-select"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Electronics & Comm">Electronics & Comm</option>
                    <option value="Business Administration">Business Administration</option>
                    <option value="Humanities & Science">Humanities & Science</option>
                  </select>
                </div>

                {/* Designation */}
                <div className="fm-form-field">
                  <label>Academic Designation</label>
                  <select
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    disabled={modal.mode === "view"}
                    className="fm-modal-select"
                  >
                    <option value="Professor & HOD">Professor & HOD</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Visiting Lecturer">Visiting Lecturer</option>
                    <option value="Lab Instructor">Lab Instructor</option>
                  </select>
                </div>

                {/* Qualification */}
                <div className="fm-form-field">
                  <label>Qualification & Degrees</label>
                  <input
                    type="text"
                    value={form.qualification}
                    onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                    placeholder="e.g. Ph.D (AI), M.Tech (CSE)"
                    disabled={modal.mode === "view"}
                  />
                </div>

                {/* Experience */}
                <div className="fm-form-field">
                  <label>Experience (in Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                    placeholder="e.g. 6"
                    disabled={modal.mode === "view"}
                  />
                </div>

                {/* Gender */}
                <div className="fm-form-field">
                  <label>Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    disabled={modal.mode === "view"}
                    className="fm-modal-select"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Joining Date */}
                <div className="fm-form-field">
                  <label>Joining Date</label>
                  <input
                    type="date"
                    value={form.joining_date ? form.joining_date.slice(0, 10) : ""}
                    onChange={(e) => setForm({ ...form, joining_date: e.target.value })}
                    disabled={modal.mode === "view"}
                  />
                </div>

                {/* Status */}
                <div className="fm-form-field">
                  <label>Account Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    disabled={modal.mode === "view"}
                    className="fm-modal-select"
                  >
                    <option value="ACTIVE">Active (On Duty)</option>
                    <option value="INACTIVE">Inactive (On Leave / Former)</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="fm-modal-footer">
                <button type="button" className="fm-btn ghost" onClick={closeModal}>
                  Close
                </button>
                {modal.mode !== "view" && (
                  <button type="submit" className="fm-btn primary" disabled={saving}>
                    {saving ? "Saving..." : modal.mode === "edit" ? "Save Changes" : "Register Faculty"}
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
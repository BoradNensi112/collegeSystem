import React, { useEffect, useMemo, useState } from "react";
import {
  FiUserPlus,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiEdit2,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiMail,
  FiPhone,
  FiBook,
  FiPercent,
  FiCamera,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiUsers,
  FiClock
} from "react-icons/fi";
import "../../layout/admin/AdminAdmission.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

const emptyApp = {
  name: "",
  mobile: "",
  email: "",
  course: "BCA",
  percentage: "",
  photo: "",
  status: "Approved",
};

export default function AdminAdmission() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All");

  const [newApp, setNewApp] = useState(emptyApp);
  const [toast, setToast] = useState(null);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAdmissions = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`${API_BASE}/Student/postStudentData`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const json = await res.json().catch(() => ({}));
      const list = json?.data || json?.message || json?.rows || (Array.isArray(json) ? json : []);

      if (Array.isArray(list)) {
        const mapped = list.map((s) => ({
          id: s.user_id || s.id,
          name: `${s.first_name || ""} ${s.last_name || ""}`.trim() || s.user_name || "Applicant",
          firstName: s.first_name || "",
          lastName: s.last_name || "",
          mobile: s.mobile || s.phone || "—",
          email: s.email || "—",
          course: s.course || "BCA",
          percentage: s.percentage ? `${s.percentage}%` : "82%",
          photo: s.photo || "",
          status: s.admission_status || (s.status === "active" ? "Approved" : s.status === "deactive" ? "Rejected" : "Approved"),
          createdAt: s.createdAt || s.created_at || new Date().toISOString(),
        }));
        setApplications(mapped);
      }
    } catch (err) {
      console.error("Fetch admissions error:", err);
      setApplications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  /* ---------------- PHOTO UPLOAD ---------------- */
  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () =>
      setNewApp((prev) => ({ ...prev, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  /* ---------------- ADD / UPDATE ---------------- */
  const addAdmission = async (e) => {
    e.preventDefault();

    if (!newApp.name.trim() || !newApp.course.trim()) {
      alert("Please fill student name and course.");
      return;
    }

    try {
      setSaving(true);
      const nameParts = newApp.name.trim().split(" ");
      const firstName = nameParts[0] || "Student";
      const lastName = nameParts.slice(1).join(" ") || "User";
      const cleanUsername = `${firstName.toLowerCase()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const cleanEmail = newApp.email || `${cleanUsername}@college.edu`;

      if (editId) {
        await fetch(`${API_BASE}/Student/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: editId,
            first_name: firstName,
            last_name: lastName,
            mobile: newApp.mobile,
            course: newApp.course,
            status: newApp.status === "Approved" ? "active" : "deactive",
          }),
        });
        showToast("ok", "Admission record updated successfully");
      } else {
        await fetch(`${API_BASE}/Student/Sadd`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            user_name: cleanUsername,
            email: cleanEmail,
            password: "password123",
            mobile: newApp.mobile,
            course: newApp.course,
            sem: 1,
            enrollment: `${newApp.course}-${Date.now().toString().slice(-4)}`,
            status: newApp.status === "Approved" ? "active" : "deactive",
          }),
        });
        showToast("ok", "Student admitted and registered successfully");
      }

      await fetchAdmissions();
      resetForm();
    } catch (err) {
      console.error("Save admission error:", err);
      showToast("err", "Failed to save admission to database");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setNewApp(emptyApp);
    setEditId(null);
    setShowForm(false);
  };

  /* ---------------- ACTIONS ---------------- */
  const updateStatus = (id, status) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status } : app))
    );
    showToast("ok", `Application status marked as ${status}`);
  };

  const editAdmission = (app) => {
    setNewApp({
      name: app.name,
      mobile: app.mobile !== "—" ? app.mobile : "",
      email: app.email !== "—" ? app.email : "",
      course: app.course,
      percentage: app.percentage !== "—" ? app.percentage.replace("%", "") : "",
      photo: app.photo || "",
      status: app.status || "Approved",
    });
    setEditId(app.id);
    setShowForm(true);
  };

  const deleteAdmission = async (id, name) => {
    if (window.confirm(`Delete admission record for ${name || "this applicant"}?`)) {
      try {
        await fetch(`${API_BASE}/Student/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, user_id: id }),
        });
        setApplications((prev) => prev.filter((a) => a.id !== id));
        showToast("ok", "Admission record removed successfully");
      } catch (err) {
        console.error("Delete admission error:", err);
        setApplications((prev) => prev.filter((a) => a.id !== id));
      }
    }
  };

  // Course Options
  const courseOptions = useMemo(() => {
    const set = new Set();
    applications.forEach((a) => {
      if (a.course) set.add(a.course);
    });
    return ["All", ...Array.from(set).sort()];
  }, [applications]);

  /* ---------------- FILTER DATA ---------------- */
  const filteredData = useMemo(() => {
    return applications.filter((app) => {
      const searchMatch = String(app.name || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
        String(app.email || "").toLowerCase().includes(search.toLowerCase()) ||
        String(app.mobile || "").includes(search);

      const statusMatch = filter === "All" || app.status.toLowerCase() === filter.toLowerCase();
      const courseMatch = courseFilter === "All" || app.course.toLowerCase() === courseFilter.toLowerCase();

      return searchMatch && statusMatch && courseMatch;
    });
  }, [applications, search, filter, courseFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  /* ---------------- STATS ---------------- */
  const total = applications.length;
  const approved = applications.filter((a) => a.status.toLowerCase() === "approved").length;
  const pending = applications.filter((a) => a.status.toLowerCase() === "pending").length;
  const rejected = applications.filter((a) => a.status.toLowerCase() === "rejected").length;

  const resetFilters = () => {
    setSearch("");
    setFilter("All");
    setCourseFilter("All");
    setPage(1);
  };

  return (
    <div className="adm-app-root">
      {/* Toast Alert */}
      {toast && (
        <div className={`adm-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheck /> : <FiAlertCircle />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* =========================================================
          1. HEADER HERO BANNER
          ========================================================= */}
      <section className="adm-app-hero">
        <div className="adm-app-hero-left">
          <div className="adm-app-live-chip">
            <span className="adm-app-ping" />
            <span className="adm-app-live-txt">STUDENT ADMISSION PIPELINE • ENROLLMENT DESK</span>
          </div>
          <h1 className="adm-app-title">Admissions &amp; Enrollments</h1>
          <p className="adm-app-sub">
            Review student candidate dossiers, approve new admission applications, and register academic profiles.
          </p>
        </div>

        <div className="adm-app-hero-right">
          {/* KPI Summary Badges */}
          <div className="adm-app-kpi-row">
            <div className="adm-app-kpi-pill">
              <span className="kpi-lbl">Total Applicants</span>
              <span className="kpi-val">{total}</span>
            </div>
            <div className="adm-app-kpi-pill approved">
              <span className="kpi-lbl">Approved</span>
              <span className="kpi-val">{approved}</span>
            </div>
            <div className="adm-app-kpi-pill pending">
              <span className="kpi-lbl">Pending</span>
              <span className="kpi-val">{pending}</span>
            </div>
            <div className="adm-app-kpi-pill rejected">
              <span className="kpi-lbl">Rejected</span>
              <span className="kpi-val">{rejected}</span>
            </div>
          </div>

          <div className="adm-app-hero-actions">
            <button
              className={`adm-app-btn ghost ${refreshing ? "spinning" : ""}`}
              onClick={() => fetchAdmissions(true)}
              disabled={refreshing}
              title="Refresh database records"
            >
              <FiRefreshCw className={refreshing ? "spin-ico" : ""} />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>

            <button
              className="adm-app-btn primary"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              <FiUserPlus />
              <span>+ New Admission</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          2. FILTER & SEARCH CONTROL BAR
          ========================================================= */}
      <div className="adm-app-filter-bar">
        <div className="adm-app-search-box">
          <FiSearch className="search-ico" />
          <input
            type="text"
            placeholder="Search applicants by student name, email, or mobile..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {search && (
            <button className="clear-btn" onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        <div className="adm-app-dropdown-group">
          <div className="select-wrap">
            <FiFilter className="select-ico" />
            <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
              <option value="All">All Application Statuses</option>
              <option value="Approved">Approved Only</option>
              <option value="Pending">Pending Only</option>
              <option value="Rejected">Rejected Only</option>
            </select>
          </div>

          <div className="select-wrap">
            <FiBook className="select-ico" />
            <select value={courseFilter} onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }}>
              {courseOptions.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All Applied Courses" : c}
                </option>
              ))}
            </select>
          </div>

          {(search || filter !== "All" || courseFilter !== "All") && (
            <button className="adm-app-btn ghost small reset-btn" onClick={resetFilters}>
              Reset Filters
            </button>
          )}
        </div>

        <div className="adm-app-results-badge">
          Showing <strong>{filteredData.length}</strong> candidates
        </div>
      </div>

      {/* =========================================================
          3. GLASSMORPHIC APPLICANTS TABLE
          ========================================================= */}
      <div className="adm-app-table-card">
        <div className="adm-app-table-wrap">
          <table className="adm-app-table">
            <thead>
              <tr>
                <th>Applicant Profile</th>
                <th>Course Stream</th>
                <th>Academic Score</th>
                <th>Contact Mobile</th>
                <th>Admission Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="empty-cell">
                    <div className="loading-box">
                      <FiRefreshCw className="spin-ico" />
                      <span>Loading admission dossiers from PostgreSQL...</span>
                    </div>
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-cell">
                    <div className="no-data-box">
                      <FiUsers className="no-ico" />
                      <h4>No applicants found</h4>
                      <p>Try modifying your search or reset active filters.</p>
                      <button
                        className="adm-app-btn primary small"
                        onClick={() => {
                          resetForm();
                          setShowForm(true);
                        }}
                      >
                        + New Admission
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                pageRows.map((app) => {
                  const st = (app.status || "Approved").toLowerCase();
                  return (
                    <tr key={app.id}>
                      <td>
                        <div className="app-user-cell">
                          {app.photo ? (
                            <img src={app.photo} className="app-photo" alt={app.name} />
                          ) : (
                            <div className="app-avatar-circle">
                              {(app.name[0] || "A").toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="app-name">{app.name}</div>
                            <div className="app-email">
                              <FiMail className="sub-ico" />
                              <span>{app.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="app-course-tag">{app.course}</span>
                      </td>

                      <td>
                        <span className="app-score-badge">
                          <FiPercent className="score-ico" />
                          {app.percentage}
                        </span>
                      </td>

                      <td>
                        <div className="app-phone-box">
                          <FiPhone className="sub-ico" />
                          <span>{app.mobile}</span>
                        </div>
                      </td>

                      <td>
                        <span className={`app-status-badge ${st}`}>
                          <span className="dot" />
                          {app.status}
                        </span>
                      </td>

                      <td className="text-right">
                        <div className="app-action-btns">
                          {st === "pending" && (
                            <>
                              <button
                                className="act-btn approve"
                                onClick={() => updateStatus(app.id, "Approved")}
                                title="Approve Application"
                              >
                                <FiCheck />
                              </button>
                              <button
                                className="act-btn reject"
                                onClick={() => updateStatus(app.id, "Rejected")}
                                title="Reject Application"
                              >
                                <FiX />
                              </button>
                            </>
                          )}
                          <button
                            className="act-btn edit"
                            onClick={() => editAdmission(app)}
                            title="Edit Applicant Record"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            className="act-btn delete"
                            onClick={() => deleteAdmission(app.id, app.name)}
                            title="Delete Record"
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
        <div className="adm-app-pagination">
          <div className="page-count">
            Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({filteredData.length} applicants)
          </div>

          <div className="pager-nav">
            <button
              className="page-btn"
              onClick={() => setPage(1)}
              disabled={page === 1}
              title="First Page"
            >
              <FiChevronsLeft />
            </button>
            <button
              className="page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              title="Previous Page"
            >
              <FiChevronLeft />
            </button>

            <span className="current-page">{page}</span>

            <button
              className="page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              title="Next Page"
            >
              <FiChevronRight />
            </button>
            <button
              className="page-btn"
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
          5. MODAL DRAWER FOR ADD / EDIT ADMISSION
          ========================================================= */}
      {showForm && (
        <div className="adm-app-modal-backdrop" onClick={resetForm}>
          <div className="adm-app-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="adm-app-modal-head">
              <div className="modal-title-row">
                <div className="modal-icon-box">
                  {editId ? <FiEdit2 /> : <FiUserPlus />}
                </div>
                <div>
                  <h3 className="m-title">{editId ? "Edit Admission Dossier" : "New Candidate Admission"}</h3>
                  <p className="m-sub">Register candidate credentials and course enrollment</p>
                </div>
              </div>
              <button className="modal-close" onClick={resetForm} title="Close">
                <FiX />
              </button>
            </div>

            <form onSubmit={addAdmission} className="adm-app-modal-body">
              {/* Photo Upload Row */}
              <div className="photo-upload-container">
                <div className="photo-avatar-box">
                  {newApp.photo ? (
                    <img src={newApp.photo} alt="applicant" className="preview-img" />
                  ) : (
                    <div className="photo-placeholder">
                      <FiCamera />
                      <span>Upload Photo</span>
                    </div>
                  )}
                </div>
                <label className="photo-input-label">
                  <FiCamera />
                  <span>Choose Image</span>
                  <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
                </label>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Applicant Full Name <span className="req">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Priya Patel"
                    value={newApp.name}
                    onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Contact Mobile <span className="req">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={newApp.mobile}
                    onChange={(e) => setNewApp({ ...newApp, mobile: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. priya@example.com"
                    value={newApp.email}
                    onChange={(e) => setNewApp({ ...newApp, email: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Applied Degree Course <span className="req">*</span></label>
                  <select
                    value={newApp.course}
                    onChange={(e) => setNewApp({ ...newApp, course: e.target.value })}
                    className="modal-select"
                    required
                  >
                    <option value="BCA">BCA (Bachelor of Computer Applications)</option>
                    <option value="MCA">MCA (Master of Computer Applications)</option>
                    <option value="B.Tech">B.Tech (Computer Science & Engg)</option>
                    <option value="BBA">BBA (Business Administration)</option>
                    <option value="MBA">MBA (Master of Business Admin)</option>
                    <option value="B.Com">B.Com (Commerce & Finance)</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Previous Qualifying Score / Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 85"
                    value={newApp.percentage}
                    onChange={(e) => setNewApp({ ...newApp, percentage: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Admission Status</label>
                  <select
                    value={newApp.status}
                    onChange={(e) => setNewApp({ ...newApp, status: e.target.value })}
                    className="modal-select"
                  >
                    <option value="Approved">Approved (Admit Student)</option>
                    <option value="Pending">Pending (Under Review)</option>
                    <option value="Rejected">Rejected (Ineligible)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="adm-app-btn ghost" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="adm-app-btn primary" disabled={saving}>
                  {saving ? "Processing..." : editId ? "Update Candidate" : "Enroll Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

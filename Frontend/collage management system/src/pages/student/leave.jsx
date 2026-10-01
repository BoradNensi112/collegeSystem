import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "../../layout/student/leave.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

const StudentLeave = () => {
  const [faculties, setFaculties] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");

  const getStudentUser = () => {
    try {
      const u =
        JSON.parse(localStorage.getItem("user")) ||
        JSON.parse(localStorage.getItem("userData")) ||
        JSON.parse(localStorage.getItem("student")) ||
        {};
      return {
        student_id: localStorage.getItem("student_id") || u.user_id || u.student_id || u.id || "",
        name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.name || "Student",
        course: u.course || "",
        sem: u.sem || u.semester || "",
        enrollment: u.enrollment || "",
      };
    } catch {
      return {
        student_id: localStorage.getItem("student_id") || "",
        name: "Student",
        course: "",
        sem: "",
        enrollment: "",
      };
    }
  };

  const studentUser = useMemo(() => getStudentUser(), []);

  const [form, setForm] = useState({
    student_id: studentUser.student_id,
    faculty_id: "",
    leave_type: "",
    priority: "Normal",
    from_date: "",
    to_date: "",
    reason: "",
    document: null,
  });

  const [message, setMessage] = useState({ type: "", text: "" });

  const leaveTypes = [
    "Sick Leave",
    "Medical Leave",
    "Casual Leave",
    "Family Function",
    "Academic / Internship",
    "Emergency Leave",
  ];

  const totalDays = useMemo(() => {
    if (!form.from_date || !form.to_date) return 0;
    const start = new Date(form.from_date);
    const end = new Date(form.to_date);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  }, [form.from_date, form.to_date]);

  const fetchFaculties = async () => {
    try {
      setFacultyLoading(true);
      const res = await axios.post(`${API_BASE}/ManageStaff/postStaffData`, {});
      const list = res.data?.data || res.data?.message || res.data || [];
      setFaculties(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Faculty fetch error:", error);
    } finally {
      setFacultyLoading(false);
    }
  };

  const fetchLeaveHistory = async () => {
    if (!studentUser.student_id) return;
    try {
      setHistoryLoading(true);
      const res = await axios.post(`${API_BASE}/Leave/list`, {
        student_id: Number(studentUser.student_id),
      });
      const list = res.data?.data || res.data?.rows || res.data?.message || [];
      setLeaveHistory(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Leave history fetch error:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculties();
    fetchLeaveHistory();
  }, [studentUser.student_id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "document") {
      setForm((prev) => ({
        ...prev,
        document: files?.[0] || null,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = () => {
    if (!form.student_id) {
      setMessage({ type: "error", text: "Student identity not detected. Please login again." });
      return false;
    }
    if (!form.leave_type) {
      setMessage({ type: "error", text: "Please select a leave type." });
      return false;
    }
    if (!form.from_date || !form.to_date) {
      setMessage({ type: "error", text: "From Date and To Date are both required." });
      return false;
    }
    if (new Date(form.to_date) < new Date(form.from_date)) {
      setMessage({ type: "error", text: "To Date cannot be earlier than From Date." });
      return false;
    }
    if (!form.reason.trim()) {
      setMessage({ type: "error", text: "Please provide a valid reason for your leave." });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!validateForm()) return;

    try {
      setLoading(true);

      const payload = {
        student_id: Number(form.student_id),
        faculty_id: form.faculty_id ? Number(form.faculty_id) : null,
        leave_type: form.leave_type,
        priority: form.priority || "Normal",
        from_date: form.from_date,
        to_date: form.to_date,
        total_days: totalDays,
        reason: form.reason.trim(),
      };

      const res = await axios.post(`${API_BASE}/Leave/create`, payload);

      setMessage({
        type: "success",
        text: res.data?.message || "Leave request submitted successfully for faculty review!",
      });

      setForm((prev) => ({
        ...prev,
        faculty_id: "",
        leave_type: "",
        priority: "Normal",
        from_date: "",
        to_date: "",
        reason: "",
        document: null,
      }));

      const fileInput = document.getElementById("leave-document");
      if (fileInput) fileInput.value = "";

      // Refresh leave history
      fetchLeaveHistory();
    } catch (error) {
      console.error("Submit error:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Could not submit leave application. Please check details and retry.",
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = leaveHistory.length;
    const pending = leaveHistory.filter((l) => l.status === "Pending").length;
    const approved = leaveHistory.filter((l) => l.status === "Approved").length;
    const rejected = leaveHistory.filter((l) => l.status === "Rejected").length;
    return { total, pending, approved, rejected };
  }, [leaveHistory]);

  const filteredHistory = useMemo(() => {
    if (activeTab === "ALL") return leaveHistory;
    return leaveHistory.filter((l) => l.status === activeTab);
  }, [leaveHistory, activeTab]);

  return (
    <div className="sla-page">
      {/* Top Banner */}
      <div className="sla-hero">
        <div className="sla-hero-left">
          <p className="sla-kicker">Academic Leave Portal</p>
          <h1>Apply for Leave</h1>
          <p className="sla-subtext">
            Submit formal leave applications directly to faculty supervisors and track real-time approval status.
          </p>

          <div className="sla-student-pill">
            <span className="sla-stu-avatar">{(studentUser.name || "S").charAt(0).toUpperCase()}</span>
            <div className="sla-stu-info">
              <strong>{studentUser.name}</strong>
              <span>
                {studentUser.course ? `${studentUser.course} • Sem ${studentUser.sem || "1"}` : "Student"} | Enroll: {studentUser.enrollment || studentUser.student_id}
              </span>
            </div>
          </div>
        </div>

        <div className="sla-stats-grid">
          <div className="sla-stat-box">
            <span className="sla-stat-lbl">Total Applied</span>
            <strong className="sla-stat-val">{stats.total}</strong>
          </div>
          <div className="sla-stat-box pending">
            <span className="sla-stat-lbl">Pending</span>
            <strong className="sla-stat-val text-warning">{stats.pending}</strong>
          </div>
          <div className="sla-stat-box approved">
            <span className="sla-stat-lbl">Approved</span>
            <strong className="sla-stat-val text-success">{stats.approved}</strong>
          </div>
          <div className="sla-stat-box rejected">
            <span className="sla-stat-lbl">Rejected</span>
            <strong className="sla-stat-val text-danger">{stats.rejected}</strong>
          </div>
        </div>
      </div>

      <div className="sla-main-grid">
        {/* Left: Apply Leave Form */}
        <div className="sla-card form-card">
          <div className="sla-card-head">
            <h2>New Leave Application</h2>
            <span className="sla-badge-form">Form</span>
          </div>

          <form className="sla-form" onSubmit={handleSubmit}>
            <div className="sla-field">
              <label>Assign To Faculty (Advisor/HOD)</label>
              <select
                name="faculty_id"
                value={form.faculty_id}
                onChange={handleChange}
              >
                <option value="">
                  {facultyLoading ? "Loading faculty roster..." : "Select Faculty (Optional)"}
                </option>
                {faculties.map((faculty) => (
                  <option key={faculty.id || faculty.user_id} value={faculty.id || faculty.user_id}>
                    {faculty.first_name} {faculty.last_name} {faculty.department ? `(${faculty.department})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="sla-row-2">
              <div className="sla-field">
                <label>Leave Category <span className="req">*</span></label>
                <select
                  name="leave_type"
                  value={form.leave_type}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Category</option>
                  {leaveTypes.map((type, i) => (
                    <option key={i} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sla-field">
                <label>Urgency / Priority</label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High / Emergency</option>
                </select>
              </div>
            </div>

            <div className="sla-row-2">
              <div className="sla-field">
                <label>From Date <span className="req">*</span></label>
                <input
                  type="date"
                  name="from_date"
                  value={form.from_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="sla-field">
                <label>To Date <span className="req">*</span></label>
                <input
                  type="date"
                  name="to_date"
                  value={form.to_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {totalDays > 0 && (
              <div className="sla-days-banner">
                <span>Total Duration:</span>
                <strong>{totalDays} Day{totalDays > 1 ? "s" : ""}</strong>
              </div>
            )}

            <div className="sla-field">
              <label>Reason & Justification <span className="req">*</span></label>
              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                rows="4"
                placeholder="Explain the purpose of leave and any coverage planned for missed lectures..."
                required
              />
            </div>

            <div className="sla-field">
              <label>Supporting Document (Medical certificate / Proof)</label>
              <input
                id="leave-document"
                type="file"
                name="document"
                onChange={handleChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
            </div>

            {message.text && (
              <div className={`sla-alert ${message.type}`}>
                {message.type === "success" ? "✓" : "⚠"} {message.text}
              </div>
            )}

            <div className="sla-actions">
              <button type="submit" className="sla-submit-btn" disabled={loading}>
                {loading ? "Submitting Application..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Leave History & Live Tracker */}
        <div className="sla-card history-card">
          <div className="sla-card-head">
            <div>
              <h2>Application History</h2>
              <p>Track review and faculty remarks</p>
            </div>

            <button
              className="sla-refresh-btn"
              onClick={fetchLeaveHistory}
              disabled={historyLoading}
              type="button"
            >
              {historyLoading ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>

          <div className="sla-tab-bar">
            <button
              className={`sla-tab-btn ${activeTab === "ALL" ? "active" : ""}`}
              onClick={() => setActiveTab("ALL")}
              type="button"
            >
              All ({stats.total})
            </button>
            <button
              className={`sla-tab-btn ${activeTab === "Pending" ? "active" : ""}`}
              onClick={() => setActiveTab("Pending")}
              type="button"
            >
              Pending ({stats.pending})
            </button>
            <button
              className={`sla-tab-btn ${activeTab === "Approved" ? "active" : ""}`}
              onClick={() => setActiveTab("Approved")}
              type="button"
            >
              Approved ({stats.approved})
            </button>
            <button
              className={`sla-tab-btn ${activeTab === "Rejected" ? "active" : ""}`}
              onClick={() => setActiveTab("Rejected")}
              type="button"
            >
              Rejected ({stats.rejected})
            </button>
          </div>

          <div className="sla-history-list">
            {historyLoading ? (
              <div className="sla-empty-box">Loading applications...</div>
            ) : filteredHistory.length === 0 ? (
              <div className="sla-empty-box">
                <span>📋</span>
                <p>No leave applications found in this category.</p>
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div key={item.id} className="sla-history-item">
                  <div className="sla-item-header">
                    <div className="sla-item-title-row">
                      <h4>{item.leave_type}</h4>
                      <span className={`sla-status-pill ${String(item.status || "Pending").toLowerCase()}`}>
                        {item.status || "Pending"}
                      </span>
                    </div>
                    <div className="sla-item-meta">
                      <span>📅 {String(item.from_date).slice(0, 10)} to {String(item.to_date).slice(0, 10)}</span>
                      <span>•</span>
                      <span>⏱ {item.total_days || 1} Day(s)</span>
                      {item.priority && (
                        <>
                          <span>•</span>
                          <span className={`sla-priority-tag ${String(item.priority).toLowerCase()}`}>
                            {item.priority}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="sla-item-reason">
                    <strong>Reason:</strong> {item.reason}
                  </div>

                  {item.faculty_note && (
                    <div className="sla-item-note">
                      <strong>Faculty Note:</strong> {item.faculty_note}
                    </div>
                  )}

                  <div className="sla-item-footer">
                    <span>Applied on: {item.created_at ? new Date(item.created_at).toLocaleDateString() : "-"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLeave;
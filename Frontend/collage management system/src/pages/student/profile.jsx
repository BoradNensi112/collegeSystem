import React, { useEffect, useState } from "react";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiMapPin,
  FiBook,
  FiAward,
  FiCheckCircle,
  FiShield,
  FiCamera,
  FiHash,
  FiCreditCard,
  FiLayers,
  FiBookmark,
  FiLock,
  FiEdit3,
  FiSave,
  FiX,
  FiPrinter,
  FiRefreshCw,
  FiAlertCircle,
  FiCheck,
  FiUsers
} from "react-icons/fi";
import "../../layout/student/profile.css";
import { getActiveStudentSession, setActiveStudentSession } from "../../utils/studentSession";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  "";

const getHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function StudentProfile() {
  const [student, setStudent] = useState(getActiveStudentSession());
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'edit', 'security'
  const [profileImage, setProfileImage] = useState(null);
  const [toast, setToast] = useState(null);

  // Check if currently logged in user is an Admin / Faculty
  const authUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const authRole = (localStorage.getItem("role") || authUser.user_type || "").toLowerCase();
  const isAdminOrFaculty = authRole === "admin" || authRole === "faculty" || (authUser.user_type && authUser.user_type.toLowerCase() !== "student");

  // Edit form state
  const [editForm, setEditForm] = useState({
    first_name: student.first_name || "",
    last_name: student.last_name || "",
    email: student.email || "",
    mobile: student.mobile || "",
    dob: student.dob || "",
    father_name: student.father_name || "",
    father_mobile: student.father_mobile || "",
    address: student.address || "",
    city: student.city || "",
    state: student.state || "",
    pincode: student.pincode || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [pwdForm, setPwdForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [changingPwd, setChangingPwd] = useState(false);

  const showToast = (message, type = "ok") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  // Fetch available students list for Admin switcher
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch(`${API_BASE}/Student/list`);
        if (res.ok) {
          const json = await res.json();
          const list = json?.message || json?.data || [];
          if (Array.isArray(list) && list.length > 0) {
            setStudentsList(list);
          }
        }
      } catch {
        // ignore
      }
    };
    fetchStudents();
  }, []);

  // Fetch live profile from database
  const fetchLiveProfile = async () => {
    setLoading(true);
    try {
      const token = getToken();

      // If logged in as student, fetch from /Profile/my with token
      if (token && !isAdminOrFaculty) {
        const res = await fetch(`${API_BASE}/Profile/my`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({}),
        });

        if (res.ok) {
          const json = await res.json();
          if (json?.data && json.data.user_type === "student") {
            const u = json.data;
            setActiveStudentSession(u);
            localStorage.setItem("user", JSON.stringify(u));
            const updated = getActiveStudentSession();
            setStudent(updated);
            setEditForm({
              first_name: updated.first_name,
              last_name: updated.last_name,
              email: updated.email,
              mobile: updated.mobile,
              dob: updated.dob,
              father_name: updated.father_name,
              father_mobile: updated.father_mobile,
              address: updated.address,
              city: updated.city,
              state: updated.state,
              pincode: updated.pincode,
            });
            return;
          }
        }
      }

      // If in Admin session or fallback, fetch student by student_id from database
      const activeId = student.user_id || 2;
      const resStudent = await fetch(`${API_BASE}/Profile/student/${activeId}`);
      if (resStudent.ok) {
        const json = await resStudent.json();
        if (json?.data) {
          const u = json.data;
          setActiveStudentSession(u);
          const updated = getActiveStudentSession();
          setStudent(updated);
          setEditForm({
            first_name: updated.first_name,
            last_name: updated.last_name,
            email: updated.email,
            mobile: updated.mobile,
            dob: updated.dob,
            father_name: updated.father_name,
            father_mobile: updated.father_mobile,
            address: updated.address,
            city: updated.city,
            state: updated.state,
            pincode: updated.pincode,
          });
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveProfile();
  }, []);

  // Handle switching active student in preview mode
  const handleSwitchStudent = (studentId) => {
    const found = studentsList.find((s) => String(s.user_id) === String(studentId));
    if (found) {
      setActiveStudentSession(found);
      const updated = getActiveStudentSession();
      setStudent(updated);
      setEditForm({
        first_name: updated.first_name,
        last_name: updated.last_name,
        email: updated.email,
        mobile: updated.mobile,
        dob: updated.dob,
        father_name: updated.father_name,
        father_mobile: updated.father_mobile,
        address: updated.address,
        city: updated.city,
        state: updated.state,
        pincode: updated.pincode,
      });
      showToast(`Switched active student to ${updated.name}`, "ok");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
      showToast("Profile photograph updated locally!", "ok");
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.first_name.trim()) {
      showToast("First name is required", "err");
      return;
    }

    try {
      setSavingProfile(true);
      const payload = {
        ...editForm,
        user_id: student.user_id,
      };

      const res = await fetch(`${API_BASE}/Profile/update`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || "Failed to update profile");
      }

      showToast("Student profile updated successfully!", "ok");
      if (json?.data) {
        setActiveStudentSession(json.data);
      }
      await fetchLiveProfile();
      setActiveTab("overview");
    } catch (err) {
      showToast(err.message || "Error updating profile", "err");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwdForm.old_password || !pwdForm.new_password) {
      showToast("All password fields are required", "err");
      return;
    }

    if (pwdForm.new_password.length < 6) {
      showToast("New password must be at least 6 characters", "err");
      return;
    }

    if (pwdForm.new_password !== pwdForm.confirm_password) {
      showToast("New password and confirm password do not match", "err");
      return;
    }

    try {
      setChangingPwd(true);
      const res = await fetch(`${API_BASE}/Profile/change-password`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          user_id: student.user_id,
          old_password: pwdForm.old_password,
          new_password: pwdForm.new_password,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || "Failed to change password");
      }

      showToast("Password updated successfully!", "ok");
      setPwdForm({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
      setActiveTab("overview");
    } catch (err) {
      showToast(err.message || "Failed to change password", "err");
    } finally {
      setChangingPwd(false);
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="stp-pro-root">
      {/* Toast Alert */}
      {toast && (
        <div className={`stp-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. HERO COMMAND BANNER */}
      <section className="stp-hero-banner">
        <div className="stp-hero-left">
          <div className="stp-live-chip">
            <span className="stp-ping"></span>
            <span className="stp-live-txt">OFFICIAL DIGITAL STUDENT IDENTITY • CONTROL CENTER</span>
          </div>
          <h1 className="stp-hero-title">
            {student.first_name} {student.last_name}
          </h1>
          <p className="stp-hero-sub">
            {student.course} • Semester {student.semester} • Enrollment: <b>{student.enrollment}</b>
          </p>
        </div>

        <div className="stp-hero-actions">
          {/* Quick Student Switcher for Admin */}
          {isAdminOrFaculty && studentsList.length > 0 && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                padding: "8px 12px",
                borderRadius: "12px",
              }}
            >
              <FiUsers style={{ color: "#38bdf8" }} />
              <select
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: "700",
                  outline: "none",
                  cursor: "pointer",
                }}
                value={student.user_id}
                onChange={(e) => handleSwitchStudent(e.target.value)}
                title="Select Student to Preview Profile"
              >
                {studentsList.map((s) => (
                  <option key={s.user_id} value={s.user_id} style={{ background: "#0f172a", color: "#fff" }}>
                    {s.first_name} {s.last_name} ({s.course} • {s.enrollment})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className="stp-btn stp-btn-secondary"
            onClick={fetchLiveProfile}
            disabled={loading}
            title="Sync profile from database"
          >
            <FiRefreshCw className={loading ? "stp-spin" : ""} />
            <span>Sync</span>
          </button>

          <button
            className="stp-btn stp-btn-secondary"
            onClick={handlePrintCard}
            title="Print Official Student ID Card"
          >
            <FiPrinter />
            <span>Print ID Card</span>
          </button>

          <button
            className="stp-btn stp-btn-primary"
            onClick={() => setActiveTab("edit")}
          >
            <FiEdit3 />
            <span>Edit Profile</span>
          </button>
        </div>
      </section>

      {/* 2. TWO COLUMN WORKSPACE */}
      <div className="stp-split-grid">
        {/* LEFT COLUMN: DIGITAL ID CARD & QUICK METRICS */}
        <div className="stp-col-id">
          <div className="stp-id-card-wrap">
            {/* University Hologram Header */}
            <div className="stp-id-header">
              <div className="stp-id-logo-box">N</div>
              <div>
                <h3>NavNext University</h3>
                <p>INSTITUTE OF TECHNOLOGY</p>
              </div>
            </div>

            {/* Photo & Core Bio */}
            <div className="stp-id-photo-area">
              <div className="stp-avatar-wrapper">
                {profileImage ? (
                  <img src={profileImage} alt="Student" className="stp-avatar-img" />
                ) : (
                  <div className="stp-avatar-fallback">
                    {student.first_name ? student.first_name.charAt(0).toUpperCase() : "S"}
                  </div>
                )}

                <label className="stp-camera-btn" title="Upload Student Photograph">
                  <FiCamera size={14} />
                  <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                </label>
              </div>

              <h2 className="stp-id-name">
                {student.first_name} {student.last_name}
              </h2>
              <span className="stp-id-role">{student.course} Undergrad Scholar</span>
            </div>

            {/* ID Credentials Grid */}
            <div className="stp-id-details-list">
              <div className="stp-id-row">
                <span className="k">Enrollment No</span>
                <span className="v highlight">{student.enrollment}</span>
              </div>
              <div className="stp-id-row">
                <span className="k">Current Semester</span>
                <span className="v">Semester {student.semester}</span>
              </div>
              <div className="stp-id-row">
                <span className="k">Academic Stream</span>
                <span className="v">{student.course}</span>
              </div>
              <div className="stp-id-row">
                <span className="k">Blood Group</span>
                <span className="v">{student.blood_group}</span>
              </div>
              <div className="stp-id-row">
                <span className="k">Emergency Contact</span>
                <span className="v">{student.father_mobile}</span>
              </div>
            </div>

            {/* Barcode & Hologram Strip */}
            <div className="stp-id-footer">
              <div className="stp-barcode-mock">
                <span>||||| ||| ||||||| || |||||| ||||| |||</span>
              </div>
              <span className="stp-validity">Valid Through: 2026 Academic Year</span>
            </div>
          </div>

          {/* Quick Academic Standing Card */}
          <div className="stp-deck-card">
            <h3 className="stp-deck-title">
              <FiAward />
              <span>Academic Standing</span>
            </h3>

            <div className="stp-metrics-grid">
              <div className="stp-metric-box">
                <span className="lbl">Cumulative GPA</span>
                <span className="val cyan">{student.cgpa}</span>
              </div>

              <div className="stp-metric-box">
                <span className="lbl">Class Standing</span>
                <span className="val gold">{student.rank}</span>
              </div>

              <div className="stp-metric-box">
                <span className="lbl">Account Status</span>
                <span className="val ok">🟢 Active</span>
              </div>

              <div className="stp-metric-box">
                <span className="lbl">Registry Year</span>
                <span className="val">{student.admission_year}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TABBED DETAILED CREDENTIAL PANELS */}
        <div className="stp-col-details">
          {/* TAB NAVIGATION STRIP */}
          <div className="stp-tabs-strip">
            <button
              className={`stp-tab-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <FiUser />
              <span>Personal & Academic Overview</span>
            </button>

            <button
              className={`stp-tab-btn ${activeTab === "edit" ? "active" : ""}`}
              onClick={() => setActiveTab("edit")}
            >
              <FiEdit3 />
              <span>Edit Contact Details</span>
            </button>

            <button
              className={`stp-tab-btn ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              <FiLock />
              <span>Security & Password</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <>
              {/* Personal Information Card */}
              <div className="stp-deck-card">
                <div className="stp-card-head">
                  <FiUser className="stp-head-icon" />
                  <div>
                    <h3>Personal & Contact Information</h3>
                    <p>Official student registration credentials in university database</p>
                  </div>
                </div>

                <div className="stp-info-grid">
                  <div className="stp-info-field">
                    <label>First Name</label>
                    <div className="stp-field-val">{student.first_name}</div>
                  </div>

                  <div className="stp-info-field">
                    <label>Last Name</label>
                    <div className="stp-field-val">{student.last_name || "—"}</div>
                  </div>

                  <div className="stp-info-field">
                    <label>Portal Username</label>
                    <div className="stp-field-val">@{student.username}</div>
                  </div>

                  <div className="stp-info-field">
                    <label>Email Address</label>
                    <div className="stp-field-val">{student.email}</div>
                  </div>

                  <div className="stp-info-field">
                    <label>Primary Phone</label>
                    <div className="stp-field-val">{student.mobile}</div>
                  </div>

                  <div className="stp-info-field">
                    <label>Date of Birth</label>
                    <div className="stp-field-val">{student.dob || "2004-05-15"}</div>
                  </div>

                  <div className="stp-info-field">
                    <label>Gender</label>
                    <div className="stp-field-val">{student.gender || "Male"}</div>
                  </div>

                  <div className="stp-info-field">
                    <label>Blood Group</label>
                    <div className="stp-field-val">{student.blood_group || "O+"}</div>
                  </div>

                  <div className="stp-info-field span-full">
                    <label>Residential Address</label>
                    <div className="stp-field-val">
                      {student.address}, {student.city}, {student.state} - {student.pincode}
                    </div>
                  </div>

                  <div className="stp-info-field">
                    <label>Parent / Guardian Name</label>
                    <div className="stp-field-val">{student.father_name || "Mr. Ramesh Sharma"}</div>
                  </div>

                  <div className="stp-info-field">
                    <label>Guardian Contact</label>
                    <div className="stp-field-val">{student.father_mobile || "+91 98765 00000"}</div>
                  </div>
                </div>
              </div>

              {/* Academic Enrollment Card */}
              <div className="stp-deck-card">
                <div className="stp-card-head">
                  <FiBook className="stp-head-icon" />
                  <div>
                    <h3>University & Academic Enrollment</h3>
                    <p>Institutional department and registration credentials</p>
                  </div>
                </div>

                <div className="stp-info-grid">
                  <div className="stp-info-field">
                    <label>Program / Degree</label>
                    <div className="stp-field-val">{student.course} Degree Program</div>
                  </div>

                  <div className="stp-info-field">
                    <label>Department</label>
                    <div className="stp-field-val">{student.department || "Faculty of Computer Engineering"}</div>
                  </div>

                  <div className="stp-info-field">
                    <label>Enrollment Number</label>
                    <div className="stp-field-val highlight">{student.enrollment}</div>
                  </div>

                  <div className="stp-info-field">
                    <label>Admission Batch</label>
                    <div className="stp-field-val">Batch {student.admission_year || "2023"}</div>
                  </div>

                  <div className="stp-info-field">
                    <label>Current Semester</label>
                    <div className="stp-field-val">Semester {student.semester}</div>
                  </div>

                  <div className="stp-info-field">
                    <label>Institution</label>
                    <div className="stp-field-val">{student.college || "NavNext University Institute of Technology"}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: EDIT CONTACT DETAILS */}
          {activeTab === "edit" && (
            <div className="stp-deck-card">
              <div className="stp-card-head">
                <FiEdit3 className="stp-head-icon" />
                <div>
                  <h3>Update Contact & Profile Information</h3>
                  <p>Modify personal details, address, and guardian emergency numbers</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="stp-form-body">
                <div className="stp-form-grid">
                  <div className="stp-form-field">
                    <label>First Name *</label>
                    <input
                      type="text"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm((p) => ({ ...p, first_name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="stp-form-field">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm((p) => ({ ...p, last_name: e.target.value }))}
                    />
                  </div>

                  <div className="stp-form-field">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="stp-form-field">
                    <label>Primary Contact Phone *</label>
                    <input
                      type="text"
                      value={editForm.mobile}
                      onChange={(e) => setEditForm((p) => ({ ...p, mobile: e.target.value }))}
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>

                  <div className="stp-form-field">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      value={editForm.dob}
                      onChange={(e) => setEditForm((p) => ({ ...p, dob: e.target.value }))}
                    />
                  </div>

                  <div className="stp-form-field">
                    <label>Parent / Guardian Name</label>
                    <input
                      type="text"
                      value={editForm.father_name}
                      onChange={(e) => setEditForm((p) => ({ ...p, father_name: e.target.value }))}
                      placeholder="Guardian Full Name"
                    />
                  </div>

                  <div className="stp-form-field">
                    <label>Guardian Emergency Mobile</label>
                    <input
                      type="text"
                      value={editForm.father_mobile}
                      onChange={(e) => setEditForm((p) => ({ ...p, father_mobile: e.target.value }))}
                      placeholder="+91 98765 00000"
                    />
                  </div>

                  <div className="stp-form-field span-full">
                    <label>Residential Address</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                      placeholder="Street / Society address"
                    />
                  </div>

                  <div className="stp-form-field">
                    <label>City</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}
                      placeholder="City"
                    />
                  </div>

                  <div className="stp-form-field">
                    <label>Pincode</label>
                    <input
                      type="text"
                      value={editForm.pincode}
                      onChange={(e) => setEditForm((p) => ({ ...p, pincode: e.target.value }))}
                      placeholder="Pincode"
                    />
                  </div>
                </div>

                <div className="stp-form-actions">
                  <button
                    type="button"
                    className="stp-btn stp-btn-secondary"
                    onClick={() => setActiveTab("overview")}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="stp-btn stp-btn-primary"
                    disabled={savingProfile}
                  >
                    {savingProfile ? (
                      <>
                        <FiRefreshCw className="stp-spin" />
                        <span>Saving Details...</span>
                      </>
                    ) : (
                      <>
                        <FiSave />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: SECURITY & CHANGE PASSWORD */}
          {activeTab === "security" && (
            <div className="stp-deck-card">
              <div className="stp-card-head">
                <FiLock className="stp-head-icon gold" />
                <div>
                  <h3>Account Security & Password Management</h3>
                  <p>Update your confidential student portal access password</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="stp-form-body">
                <div className="stp-form-grid single-col">
                  <div className="stp-form-field">
                    <label>Current Account Password *</label>
                    <input
                      type="password"
                      value={pwdForm.old_password}
                      onChange={(e) => setPwdForm((p) => ({ ...p, old_password: e.target.value }))}
                      placeholder="Enter your current password"
                      required
                    />
                  </div>

                  <div className="stp-form-field">
                    <label>New Account Password *</label>
                    <input
                      type="password"
                      value={pwdForm.new_password}
                      onChange={(e) => setPwdForm((p) => ({ ...p, new_password: e.target.value }))}
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </div>

                  <div className="stp-form-field">
                    <label>Confirm New Password *</label>
                    <input
                      type="password"
                      value={pwdForm.confirm_password}
                      onChange={(e) => setPwdForm((p) => ({ ...p, confirm_password: e.target.value }))}
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>
                </div>

                <div className="stp-form-actions">
                  <button
                    type="button"
                    className="stp-btn stp-btn-secondary"
                    onClick={() => setActiveTab("overview")}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="stp-btn stp-btn-primary gold"
                    disabled={changingPwd}
                  >
                    {changingPwd ? (
                      <>
                        <FiRefreshCw className="stp-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <FiCheck />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
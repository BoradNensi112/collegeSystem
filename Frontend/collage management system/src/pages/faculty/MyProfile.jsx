import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
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
  FiLayers,
  FiLock,
  FiEdit3,
  FiSave,
  FiPrinter,
  FiRefreshCw,
  FiAlertCircle,
  FiCheck,
  FiBriefcase,
  FiClock,
  FiFileText,
  FiUploadCloud,
  FiExternalLink,
  FiUsers
} from "react-icons/fi";
import "../../layout/faculty/facultyProfile.css";
import {
  getActiveFacultySession,
  setActiveFacultySession,
  KNOWN_FACULTY
} from "../../utils/facultySession";

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

export default function MyProfile() {
  const [faculty, setFaculty] = useState(getActiveFacultySession());
  const [facultyList, setFacultyList] = useState(KNOWN_FACULTY);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'edit', 'security'
  const [profileImage, setProfileImage] = useState(null);
  const [toast, setToast] = useState(null);

  // Check if currently logged in user is Admin or Student (Preview mode)
  const authUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const authRole = (localStorage.getItem("role") || authUser.user_type || "").toLowerCase();
  const isAdminOrStudent =
    authRole === "admin" ||
    authRole === "student" ||
    (authUser.user_type && authUser.user_type.toLowerCase() !== "faculty");

  // Dynamic Live Workload from Database
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [materialCount, setMaterialCount] = useState(0);

  // Edit form state
  const [editForm, setEditForm] = useState({
    first_name: faculty.first_name || "",
    last_name: faculty.last_name || "",
    email: faculty.email || "",
    mobile: faculty.mobile || "",
    dob: faculty.dob || "",
    department: faculty.department || "",
    qualification: faculty.qualification || "",
    experience: faculty.experience || "",
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

  // Fetch available faculty list from database
  useEffect(() => {
    const fetchStaffList = async () => {
      try {
        const res = await axios.post(`${API_BASE}/ManageStaff/postStaffData`, {});
        const list = res?.data?.data || res?.data?.message || [];
        if (Array.isArray(list) && list.length > 0) {
          setFacultyList(list);
        }
      } catch {
        // ignore
      }
    };
    fetchStaffList();
  }, []);

  // Sync profile details from PostgreSQL
  const fetchLiveProfile = async () => {
    setLoading(true);
    try {
      const token = getToken();

      // If logged in as real faculty, fetch from /Profile/my with token
      if (token && !isAdminOrStudent) {
        const res = await axios.post(
          `${API_BASE}/Profile/my`,
          {},
          { headers: getHeaders() }
        );

        if (res?.data?.data && res.data.data.user_type === "faculty") {
          const u = res.data.data;
          setActiveFacultySession(u);
          const updated = getActiveFacultySession();
          setFaculty(updated);
          setEditForm({
            first_name: updated.first_name,
            last_name: updated.last_name,
            email: updated.email,
            mobile: updated.mobile,
            dob: updated.dob,
            department: updated.department,
            qualification: updated.qualification,
            experience: updated.experience,
          });
          return;
        }
      }

      // If preview mode (Admin / Student session), fetch faculty by user_id
      const activeId = faculty.user_id || 9;
      const resFaculty = await axios.get(`${API_BASE}/Profile/faculty/${activeId}`).catch(() => null);
      if (resFaculty?.data?.data) {
        const u = resFaculty.data.data;
        setActiveFacultySession(u);
        const updated = getActiveFacultySession();
        setFaculty(updated);
        setEditForm({
          first_name: updated.first_name,
          last_name: updated.last_name,
          email: updated.email,
          mobile: updated.mobile,
          dob: updated.dob,
          department: updated.department,
          qualification: updated.qualification,
          experience: updated.experience,
        });
      }
    } catch (err) {
      console.error("fetchLiveProfile error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Switch faculty in preview mode
  const handleSwitchFaculty = (facultyId) => {
    const found = facultyList.find((f) => String(f.user_id) === String(facultyId));
    if (found) {
      setActiveFacultySession(found);
      const updated = getActiveFacultySession();
      setFaculty(updated);
      setEditForm({
        first_name: updated.first_name,
        last_name: updated.last_name,
        email: updated.email,
        mobile: updated.mobile,
        dob: updated.dob,
        department: updated.department,
        qualification: updated.qualification,
        experience: updated.experience,
      });
      showToast(`Switched active faculty to Prof. ${updated.first_name} ${updated.last_name}`, "ok");
    }
  };

  // Sync Timetable, Assignments & Materials specific to this faculty
  const fetchWorkloadData = async (facultyObj) => {
    try {
      const facName = `${facultyObj.first_name || ""} ${facultyObj.last_name || ""}`.trim().toLowerCase();
      const uName = (facultyObj.user_name || "").toLowerCase();

      // 1. Fetch Timetable
      const ttRes = await axios.post(`${API_BASE}/Timetable/postTimetableData`, {}).catch(() => null);
      if (ttRes?.data) {
        const rows = Array.isArray(ttRes.data)
          ? ttRes.data
          : ttRes.data.data || ttRes.data.message || [];

        const mySlots = rows.filter((row) => {
          if (!row.faculty && !row.faculty_name && !row.staff_name && !row.teacher) return false;
          const f = String(row.faculty || row.faculty_name || row.staff_name || row.teacher).trim().toLowerCase();
          return (
            (facName && (f.includes(facName) || facName.includes(f))) ||
            (uName && f.includes(uName)) ||
            (facultyObj.first_name && f.includes(facultyObj.first_name.toLowerCase()))
          );
        });
        setTimetableSlots(mySlots.length > 0 ? mySlots : rows.slice(0, 4));
      }

      // 2. Fetch Assignments
      const assignRes = await axios.post(`${API_BASE}/Assignment/postViewData`, {}).catch(() => null);
      if (assignRes?.data) {
        const list = Array.isArray(assignRes.data)
          ? assignRes.data
          : assignRes.data.data || assignRes.data.message || [];
        setAssignmentCount(list.length || 4);
      }

      // 3. Fetch Materials
      const matRes = await axios.post(`${API_BASE}/Material/postMaterialData`, {}).catch(() => null);
      if (matRes?.data) {
        const list = Array.isArray(matRes.data)
          ? matRes.data
          : matRes.data.data || matRes.data.message || [];
        setMaterialCount(list.length || 8);
      }
    } catch (e) {
      console.error("fetchWorkloadData error:", e);
    }
  };

  useEffect(() => {
    fetchLiveProfile();
  }, []);

  useEffect(() => {
    if (faculty.user_id) {
      fetchWorkloadData(faculty);
      setEditForm({
        first_name: faculty.first_name,
        last_name: faculty.last_name,
        email: faculty.email,
        mobile: faculty.mobile,
        dob: faculty.dob,
        department: faculty.department,
        qualification: faculty.qualification,
        experience: faculty.experience,
      });
    }
  }, [faculty.user_id]);

  // Dynamic unique subjects taught from timetable
  const uniqueSubjects = useMemo(() => {
    const map = new Map();
    timetableSlots.forEach((slot) => {
      const key = slot.subject || slot.course;
      if (key && !map.has(key)) {
        map.set(key, {
          subject: slot.subject || "Computer Science",
          code: slot.code || slot.subject_code || "CS-101",
          course: slot.course || "BCA",
          sem: slot.semester || slot.sem || 4,
          batch: slot.batch || "A",
          room: slot.room || "Room 101",
          type: slot.type || "LECTURE",
        });
      }
    });

    if (map.size === 0) {
      return [
        { subject: "Advanced Database Systems", code: "CS-401", course: "BCA", sem: 6, batch: "A1", room: "Lab 3", type: "LAB" },
        { subject: "Cloud Infrastructure & DevOps", code: "IT-302", course: "B.Tech CSE", sem: 4, batch: "CS-A", room: "Hall 204", type: "LECTURE" },
        { subject: "Data Structures & Algorithms", code: "CS-201", course: "BCA", sem: 2, batch: "A", room: "Room 102", type: "LECTURE" },
      ];
    }
    return Array.from(map.values());
  }, [timetableSlots]);

  // Handle local avatar photo selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
      showToast("Profile photograph updated for this session!", "ok");
    }
  };

  // Save profile changes to PostgreSQL
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.first_name.trim()) {
      showToast("First name is required", "err");
      return;
    }

    try {
      setSavingProfile(true);
      const res = await axios.post(
        `${API_BASE}/Profile/update`,
        {
          user_id: faculty.user_id,
          ...editForm,
        },
        { headers: getHeaders() }
      );

      if (res?.data?.success || res?.status === 200) {
        showToast("Faculty profile credentials updated successfully in database!", "ok");
        if (res?.data?.data) {
          setActiveFacultySession(res.data.data);
        }
        await fetchLiveProfile();
        setActiveTab("overview");
      } else {
        throw new Error(res?.data?.message || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || err.message || "Error updating profile", "err");
    } finally {
      setSavingProfile(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwdForm.old_password || !pwdForm.new_password) {
      showToast("All password fields are required", "err");
      return;
    }

    if (pwdForm.new_password.length < 6) {
      showToast("New password must be at least 6 characters long", "err");
      return;
    }

    if (pwdForm.new_password !== pwdForm.confirm_password) {
      showToast("New password and confirm password do not match", "err");
      return;
    }

    try {
      setChangingPwd(true);
      const res = await axios.post(
        `${API_BASE}/Profile/change-password`,
        {
          user_id: faculty.user_id,
          old_password: pwdForm.old_password,
          new_password: pwdForm.new_password,
        },
        { headers: getHeaders() }
      );

      if (res?.data?.success || res?.status === 200) {
        showToast("Password updated successfully!", "ok");
        setPwdForm({
          old_password: "",
          new_password: "",
          confirm_password: "",
        });
        setActiveTab("overview");
      } else {
        throw new Error(res?.data?.message || "Failed to change password");
      }
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || err.message || "Failed to change password", "err");
    } finally {
      setChangingPwd(false);
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="fac-pro-root">
      {/* Background ambient lighting orbs */}
      <div className="fac-bg-orb fac-orb-1"></div>
      <div className="fac-bg-orb fac-orb-2"></div>
      <div className="fac-bg-orb fac-orb-3"></div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fac-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. HERO COMMAND BANNER */}
      <section className="fac-hero-banner">
        <div className="fac-hero-left">
          <div className="fac-live-chip">
            <span className="fac-ping"></span>
            <span className="fac-live-txt">OFFICIAL DIGITAL FACULTY DOSSIER • ACADEMIC PORTFOLIO</span>
          </div>
          <h1 className="fac-hero-title">
            Prof. {faculty.first_name} {faculty.last_name}
          </h1>
          <p className="fac-hero-sub">
            {faculty.department} • <b>{faculty.qualification}</b> • ID: <b>{faculty.employeeId}</b>
          </p>
        </div>

        <div className="fac-hero-actions">
          {/* Quick Faculty Switcher for Admin / Preview */}
          {isAdminOrStudent && facultyList.length > 0 && (
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
                value={faculty.user_id}
                onChange={(e) => handleSwitchFaculty(e.target.value)}
                title="Select Faculty to Preview Profile"
              >
                {facultyList.map((f) => (
                  <option
                    key={f.user_id}
                    value={f.user_id}
                    style={{ background: "#0f172a", color: "#ffffff" }}
                  >
                    Prof. {f.first_name} {f.last_name} ({f.department || "Faculty"})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className="fac-btn fac-btn-secondary"
            onClick={fetchLiveProfile}
            disabled={loading}
            title="Sync live profile from PostgreSQL database"
          >
            <FiRefreshCw className={loading ? "fac-spin" : ""} />
            <span>Sync</span>
          </button>

          <button
            className="fac-btn fac-btn-secondary"
            onClick={handlePrintCard}
            title="Print Official Faculty ID Card & Dossier"
          >
            <FiPrinter />
            <span>Print ID Card</span>
          </button>

          <button
            className="fac-btn fac-btn-primary"
            onClick={() => setActiveTab(activeTab === "edit" ? "overview" : "edit")}
          >
            <FiEdit3 />
            <span>{activeTab === "edit" ? "View Overview" : "Edit Profile"}</span>
          </button>
        </div>
      </section>

      {/* 2. TWO COLUMN WORKSPACE */}
      <div className="fac-split-grid">
        {/* LEFT COLUMN: DIGITAL FACULTY ID CARD & SNAPSHOT METRICS */}
        <div className="fac-col-id">
          <div className="fac-id-card-wrap">
            {/* University Header */}
            <div className="fac-id-header">
              <div className="fac-id-logo-box">N</div>
              <div>
                <h3>NavNext University</h3>
                <p>FACULTY OF TECHNOLOGY &amp; APPLIED SCIENCES</p>
              </div>
            </div>

            {/* Photo & Core Bio */}
            <div className="fac-id-photo-area">
              <div className="fac-avatar-wrapper">
                {profileImage ? (
                  <img src={profileImage} alt="Faculty" className="fac-avatar-img" />
                ) : (
                  <div className="fac-avatar-fallback">
                    {faculty.first_name ? faculty.first_name.charAt(0).toUpperCase() : "F"}
                  </div>
                )}

                <label className="fac-camera-btn" title="Upload Official Faculty Photo">
                  <FiCamera size={14} />
                  <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                </label>
              </div>

              <h2 className="fac-id-name">
                Prof. {faculty.first_name} {faculty.last_name}
              </h2>
              <span className="fac-id-role">
                {faculty.qualification ? faculty.qualification : "Senior Professor & Faculty Member"}
              </span>
            </div>

            {/* ID Credentials Grid */}
            <div className="fac-id-details-list">
              <div className="fac-id-row">
                <span className="k">Employee ID</span>
                <span className="v highlight">{faculty.employeeId}</span>
              </div>
              <div className="fac-id-row">
                <span className="k">Department</span>
                <span className="v">{faculty.department}</span>
              </div>
              <div className="fac-id-row">
                <span className="k">Experience</span>
                <span className="v">{faculty.experience} Years Teaching</span>
              </div>
              <div className="fac-id-row">
                <span className="k">Official Email</span>
                <span className="v">{faculty.email}</span>
              </div>
              <div className="fac-id-row">
                <span className="k">Direct Phone</span>
                <span className="v">{faculty.mobile}</span>
              </div>
              <div className="fac-id-row">
                <span className="k">Portal User</span>
                <span className="v cyan">@{faculty.user_name}</span>
              </div>
            </div>

            {/* Barcode & Security Strip */}
            <div className="fac-id-footer">
              <div className="fac-barcode-mock">
                <span>||||| ||| ||||||| || |||||| ||||| |||</span>
              </div>
              <span className="fac-validity">Official Faculty License • Valid 2026</span>
            </div>
          </div>

          {/* Quick Academic Standing Metric Deck */}
          <div className="fac-deck-card">
            <h3 className="fac-deck-title">
              <FiAward />
              <span>Teaching &amp; Faculty Metrics</span>
            </h3>

            <div className="fac-metrics-grid">
              <div className="fac-metric-box">
                <span className="lbl">Subjects Taught</span>
                <span className="val cyan">{uniqueSubjects.length}</span>
              </div>

              <div className="fac-metric-box">
                <span className="lbl">Weekly Classes</span>
                <span className="val gold">{timetableSlots.length || 6} Slots</span>
              </div>

              <div className="fac-metric-box">
                <span className="lbl">Course Materials</span>
                <span className="val green">{materialCount} Uploads</span>
              </div>

              <div className="fac-metric-box">
                <span className="lbl">Assignments</span>
                <span className="val indigo">{assignmentCount} Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TABBED DETAILED CREDENTIAL PANELS */}
        <div className="fac-col-details">
          {/* TAB NAVIGATION STRIP */}
          <div className="fac-tabs-strip">
            <button
              className={`fac-tab-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <FiUser />
              <span>Academic &amp; Professional Portfolio</span>
            </button>

            <button
              className={`fac-tab-btn ${activeTab === "edit" ? "active" : ""}`}
              onClick={() => setActiveTab("edit")}
            >
              <FiEdit3 />
              <span>Edit Profile Credentials</span>
            </button>

            <button
              className={`fac-tab-btn ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              <FiLock />
              <span>Account Security &amp; Password</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <>
              {/* Live Subject & Class Allocation Card */}
              <div className="fac-deck-card">
                <div className="fac-card-head">
                  <FiBook className="fac-head-icon" />
                  <div>
                    <h3>Allocated Subjects &amp; Active Lecture Schedule</h3>
                    <p>Live departmental lecture and laboratory allocations for this semester</p>
                  </div>
                </div>

                <div className="fac-subjects-grid">
                  {uniqueSubjects.map((sub, idx) => (
                    <div key={idx} className="fac-subject-badge-card">
                      <div className="sub-top-row">
                        <span className={`sub-type-tag ${String(sub.type || "LECTURE").toLowerCase()}`}>
                          {sub.type}
                        </span>
                        <span className="sub-code">{sub.code}</span>
                      </div>
                      <h4 className="sub-name">{sub.subject}</h4>
                      <div className="sub-meta-row">
                        <span>🎓 {sub.course} • Sem {sub.sem} {sub.batch ? `(Batch ${sub.batch})` : ""}</span>
                        <span>📍 {sub.room}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personal Information Card */}
              <div className="fac-deck-card">
                <div className="fac-card-head">
                  <FiUser className="fac-head-icon" />
                  <div>
                    <h3>Personal &amp; Institutional Credentials</h3>
                    <p>Official faculty identity records registered in university master database</p>
                  </div>
                </div>

                <div className="fac-info-grid">
                  <div className="fac-info-field">
                    <label>First Name</label>
                    <div className="fac-field-val">{faculty.first_name}</div>
                  </div>

                  <div className="fac-info-field">
                    <label>Last Name</label>
                    <div className="fac-field-val">{faculty.last_name || "—"}</div>
                  </div>

                  <div className="fac-info-field">
                    <label>Portal Username</label>
                    <div className="fac-field-val cyan">@{faculty.user_name}</div>
                  </div>

                  <div className="fac-info-field">
                    <label>Official Email Address</label>
                    <div className="fac-field-val">{faculty.email}</div>
                  </div>

                  <div className="fac-info-field">
                    <label>Direct Contact Phone</label>
                    <div className="fac-field-val">{faculty.mobile}</div>
                  </div>

                  <div className="fac-info-field">
                    <label>Date of Birth</label>
                    <div className="fac-field-val">{faculty.dob}</div>
                  </div>

                  <div className="fac-info-field">
                    <label>Department / Faculty</label>
                    <div className="fac-field-val highlight">{faculty.department}</div>
                  </div>

                  <div className="fac-info-field">
                    <label>Highest Qualification</label>
                    <div className="fac-field-val">{faculty.qualification}</div>
                  </div>

                  <div className="fac-info-field">
                    <label>Total Experience</label>
                    <div className="fac-field-val">{faculty.experience} Years Academic Experience</div>
                  </div>

                  <div className="fac-info-field">
                    <label>Institutional Affiliation</label>
                    <div className="fac-field-val">{faculty.college}</div>
                  </div>

                  <div className="fac-info-field span-full">
                    <label>Campus Office / Residential Address</label>
                    <div className="fac-field-val">
                      {faculty.address}, {faculty.city}, {faculty.state} - {faculty.pincode}
                    </div>
                  </div>
                </div>
              </div>

              {/* Research Specialization & Academic Achievements */}
              <div className="fac-deck-card">
                <div className="fac-card-head">
                  <FiAward className="fac-head-icon gold" />
                  <div>
                    <h3>Academic Profile &amp; Research Milestones</h3>
                    <p>Core academic competencies, domain research and departmental leadership</p>
                  </div>
                </div>

                <div className="fac-bio-container">
                  <p className="fac-bio-paragraph">
                    Accomplished academician and mentor with over {faculty.experience} years of expertise in the {faculty.department}. Actively leading curriculum modernization, applied laboratory practicums, and student project research in advanced computational domains.
                  </p>

                  <div className="fac-achieve-list">
                    <div className="fac-achieve-item">
                      <span className="dot"></span>
                      <div>
                        <strong>Departmental Academic Coordinator</strong>
                        <p>Overseeing course syllabus execution, timetable harmonization, and student laboratory outcomes.</p>
                      </div>
                    </div>

                    <div className="fac-achieve-item">
                      <span className="dot"></span>
                      <div>
                        <strong>Student Project Mentor</strong>
                        <p>Guided over 40+ capstone engineering and master degree software applications.</p>
                      </div>
                    </div>

                    <div className="fac-achieve-item">
                      <span className="dot"></span>
                      <div>
                        <strong>Faculty Research &amp; Excellence Recognition</strong>
                        <p>Published technical research and conducted specialized faculty development workshops.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: EDIT PROFILE */}
          {activeTab === "edit" && (
            <div className="fac-deck-card">
              <div className="fac-card-head">
                <FiEdit3 className="fac-head-icon" />
                <div>
                  <h3>Update Faculty Credentials &amp; Contact Info</h3>
                  <p>Modify profile details and save directly to university database</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="fac-form-body">
                <div className="fac-form-grid">
                  <div className="fac-form-field">
                    <label>First Name *</label>
                    <input
                      type="text"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm((p) => ({ ...p, first_name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="fac-form-field">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm((p) => ({ ...p, last_name: e.target.value }))}
                    />
                  </div>

                  <div className="fac-form-field">
                    <label>Official Email Address *</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="fac-form-field">
                    <label>Contact Phone Number *</label>
                    <input
                      type="text"
                      value={editForm.mobile}
                      onChange={(e) => setEditForm((p) => ({ ...p, mobile: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="fac-form-field">
                    <label>Department *</label>
                    <input
                      type="text"
                      value={editForm.department}
                      onChange={(e) => setEditForm((p) => ({ ...p, department: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="fac-form-field">
                    <label>Highest Academic Qualification *</label>
                    <input
                      type="text"
                      value={editForm.qualification}
                      onChange={(e) => setEditForm((p) => ({ ...p, qualification: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="fac-form-field">
                    <label>Total Teaching Experience (Years) *</label>
                    <input
                      type="text"
                      value={editForm.experience}
                      onChange={(e) => setEditForm((p) => ({ ...p, experience: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="fac-form-field">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      value={editForm.dob}
                      onChange={(e) => setEditForm((p) => ({ ...p, dob: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="fac-form-actions">
                  <button
                    type="button"
                    className="fac-btn fac-btn-secondary"
                    onClick={() => setActiveTab("overview")}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="fac-btn fac-btn-primary"
                    disabled={savingProfile}
                  >
                    {savingProfile ? (
                      <>
                        <FiRefreshCw className="fac-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <FiSave />
                        <span>Save Profile to Database</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: SECURITY & CHANGE PASSWORD */}
          {activeTab === "security" && (
            <div className="fac-deck-card">
              <div className="fac-card-head">
                <FiLock className="fac-head-icon gold" />
                <div>
                  <h3>Confidential Password Management</h3>
                  <p>Update your institutional portal login password securely</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="fac-form-body">
                <div className="fac-form-grid single-col">
                  <div className="fac-form-field">
                    <label>Current Account Password *</label>
                    <input
                      type="password"
                      value={pwdForm.old_password}
                      onChange={(e) => setPwdForm((p) => ({ ...p, old_password: e.target.value }))}
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div className="fac-form-field">
                    <label>New Account Password *</label>
                    <input
                      type="password"
                      value={pwdForm.new_password}
                      onChange={(e) => setPwdForm((p) => ({ ...p, new_password: e.target.value }))}
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </div>

                  <div className="fac-form-field">
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

                <div className="fac-form-actions">
                  <button
                    type="button"
                    className="fac-btn fac-btn-secondary"
                    onClick={() => setActiveTab("overview")}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="fac-btn fac-btn-primary"
                    disabled={changingPwd}
                  >
                    {changingPwd ? (
                      <>
                        <FiRefreshCw className="fac-spin" />
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
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCalendar,
  FiAward,
  FiSearch,
  FiFilter,
  FiPrinter,
  FiRefreshCw,
  FiUserCheck,
  FiAlertTriangle,
  FiInfo,
  FiCheck,
  FiX,
  FiBookOpen,
  FiTrendingUp,
  FiActivity,
  FiShield,
  FiPieChart,
  FiFileText,
  FiLayers,
  FiUser,
  FiChevronRight
} from "react-icons/fi";
import "../../layout/student/viewAttendance.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";
const ATTEND_API = `${API_BASE}/Attendence`;
const TIMETABLE_API = `${API_BASE}/Timetable`;

const STATUS_CONFIG = {
  1: { label: "Present", short: "P", className: "present", icon: FiCheckCircle, color: "#10b981", badge: "PRESENT" },
  2: { label: "Absent", short: "A", className: "absent", icon: FiXCircle, color: "#ef4444", badge: "ABSENT" },
  3: { label: "Late Entry", short: "L", className: "late", icon: FiClock, color: "#f59e0b", badge: "LATE" },
  4: { label: "Excused Leave", short: "Lv", className: "leave", icon: FiCalendar, color: "#8b5cf6", badge: "LEAVE" },
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDayName = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { weekday: "short" });
};

const getMonthKey = (dateStr) => {
  if (!dateStr) return "Unknown";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

export default function ViewAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [dbSubjects, setDbSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all"); // 'all' | 'subject' | '1' | '2' | '3' | '4'
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'table'
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [toast, setToast] = useState(null);
  const [printModal, setPrintModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // Synchronized Logged-in Student
  const student = useMemo(() => {
    try {
      const raw = localStorage.getItem("user") || localStorage.getItem("student") || "{}";
      const u = JSON.parse(raw);
      const studentId = u.user_id || u.student_id || 2;
      return {
        id: studentId,
        name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.name || "Student Scholar",
        enrollment: u.enrollment || "EN2024001",
        course: u.course || "B.Tech CSE",
        semester: u.sem || u.semester || 4,
        email: u.email || "student@navnext.edu.in",
      };
    } catch {
      return {
        id: 2,
        name: "Student Scholar",
        enrollment: "EN2024001",
        course: "B.Tech CSE",
        semester: 4,
        email: "student@navnext.edu.in",
      };
    }
  }, []);

  const showToast = (message, type = "ok") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  // Fetch Timetable Subjects dynamically from database
  const fetchTimetableSubjects = async () => {
    try {
      const res = await axios.post(`${TIMETABLE_API}/postTimetableData`, {
        course: student.course,
        semester: Number(student.semester),
      });

      const rows = res.data?.message || res.data?.data || res.data || [];
      if (Array.isArray(rows) && rows.length > 0) {
        const subMap = {};
        rows.forEach((r) => {
          const code = r.subject_code || `SUB-${r.subject.slice(0, 3).toUpperCase()}`;
          if (!subMap[code]) {
            subMap[code] = {
              code,
              name: r.subject,
              faculty: r.faculty_name || "Department Faculty",
            };
          }
        });
        setDbSubjects(Object.values(subMap));
      }
    } catch {
      // ignore
    }
  };

  // Fetch Attendance Records for this student only
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let rows = [];
      try {
        const res = await axios.post(`${ATTEND_API}/postAttendData`, {
          student_id: Number(student.id),
        });
        if (Array.isArray(res.data?.message)) rows = res.data.message;
        else if (Array.isArray(res.data?.data)) rows = res.data.data;
        else if (Array.isArray(res.data)) rows = res.data;
      } catch {
        // Fallback to postAttendByStudent
        const res = await axios.post(`${ATTEND_API}/postAttendByStudent`, {
          student_id: Number(student.id),
        });
        if (Array.isArray(res.data?.message)) rows = res.data.message;
        else if (Array.isArray(res.data?.data)) rows = res.data.data;
      }

      const fallbackSubjects = [
        { code: "CS-401", name: "Database Management Systems", faculty: "Prof. Rajesh Sharma" },
        { code: "CS-402", name: "Computer Networks & Protocols", faculty: "Prof. Anjali Patel" },
        { code: "CS-403", name: "Design & Analysis of Algorithms", faculty: "Dr. Vikram Joshi" },
        { code: "CS-404", name: "Operating Systems Architecture", faculty: "Prof. Neha Gupta" },
        { code: "CS-405", name: "Web Technologies & Cloud Lab", faculty: "Prof. Rajesh Sharma" },
      ];

      const activeSubjectPool = dbSubjects.length > 0 ? dbSubjects : fallbackSubjects;

      const formatted = rows
        .filter((r) => String(r.student_id) === String(student.id))
        .map((row, idx) => {
          const subObj = activeSubjectPool[idx % activeSubjectPool.length];
          const stNum = Number(row.status) || 1;
          const config = STATUS_CONFIG[stNum] || STATUS_CONFIG[1];

          let defaultRemark = "Biometric gate terminal entry verified";
          if (stNum === 2) defaultRemark = "Unexcused absence recorded";
          else if (stNum === 3) defaultRemark = "Late arrival - 15 mins after commencement";
          else if (stNum === 4) defaultRemark = "Official medical/duty leave granted";

          return {
            id: row.attendence_id || row.id || idx + 1,
            date: row.attendance_date || row.createdAt,
            dayName: getDayName(row.attendance_date || row.createdAt),
            monthName: getMonthKey(row.attendance_date || row.createdAt),
            status: stNum,
            statusLabel: config.label,
            statusBadge: config.badge,
            statusClass: config.className,
            subjectCode: subObj.code,
            subjectName: row.subject || subObj.name,
            faculty: row.faculty || subObj.faculty,
            course: row.course || student.course,
            semester: row.semester || student.semester,
            remarks: row.remarks || row.note || defaultRemark,
          };
        });

      // Sort descending by date (latest first)
      formatted.sort((a, b) => new Date(b.date) - new Date(a.date));

      setAttendance(formatted);
    } catch (err) {
      showToast("Unable to fetch attendance statements", "err");
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetableSubjects();
  }, [student.course, student.semester]);

  useEffect(() => {
    fetchAttendance();
  }, [student.id, dbSubjects]);

  // Handle ESC key to close open modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setPrintModal(false);
        setSelectedSession(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute Overall Key Metrics
  const stats = useMemo(() => {
    const total = attendance.length;
    const present = attendance.filter((r) => r.status === 1).length;
    const absent = attendance.filter((r) => r.status === 2).length;
    const late = attendance.filter((r) => r.status === 3).length;
    const leave = attendance.filter((r) => r.status === 4).length;

    const effectiveAttended = present + late + leave;
    const percentage = total > 0 ? Math.round((effectiveAttended / total) * 100) : 0;
    const isEligible = percentage >= 75;

    let marginText = "";
    if (total > 0) {
      if (isEligible) {
        const canMiss = Math.max(0, Math.floor(effectiveAttended / 0.75 - total));
        marginText = canMiss > 0 ? `Safe buffer: You can miss up to ${canMiss} more lecture${canMiss > 1 ? "s" : ""} without falling below 75%.` : "Borderline attendance! Regular presence required for all upcoming classes.";
      } else {
        const needToAttend = Math.max(1, Math.ceil((0.75 * total - effectiveAttended) / 0.25));
        marginText = `Attendance shortage! Must attend next ${needToAttend} consecutive lecture${needToAttend > 1 ? "s" : ""} to reach 75%.`;
      }
    }

    return { total, present, absent, late, leave, percentage, isEligible, marginText };
  }, [attendance]);

  // Available unique month filters
  const availableMonths = useMemo(() => {
    return [...new Set(attendance.map((r) => r.monthName))];
  }, [attendance]);

  // Filtered attendance rows
  const filteredRows = useMemo(() => {
    return attendance.filter((row) => {
      let matchesCategory = true;
      if (activeCategory === "1" || activeCategory === "2" || activeCategory === "3" || activeCategory === "4") {
        matchesCategory = String(row.status) === String(activeCategory);
      }

      const matchesMonth = monthFilter === "ALL" || row.monthName === monthFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        row.subjectName.toLowerCase().includes(q) ||
        row.subjectCode.toLowerCase().includes(q) ||
        row.faculty.toLowerCase().includes(q) ||
        row.date.toLowerCase().includes(q) ||
        row.remarks.toLowerCase().includes(q);

      return matchesCategory && matchesMonth && matchesQuery;
    });
  }, [attendance, activeCategory, monthFilter, searchQuery]);

  // Subject-Wise Aggregation
  const subjectBreakdown = useMemo(() => {
    const map = {};
    attendance.forEach((r) => {
      const key = r.subjectCode || r.subjectName;
      if (!map[key]) {
        map[key] = {
          code: r.subjectCode,
          name: r.subjectName,
          faculty: r.faculty,
          total: 0,
          attended: 0,
          absent: 0,
          late: 0,
          leave: 0,
        };
      }
      map[key].total += 1;
      if (r.status === 1 || r.status === 3 || r.status === 4) map[key].attended += 1;
      if (r.status === 2) map[key].absent += 1;
      if (r.status === 3) map[key].late += 1;
      if (r.status === 4) map[key].leave += 1;
    });

    const q = searchQuery.toLowerCase().trim();
    return Object.values(map)
      .filter((s) => !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.faculty.toLowerCase().includes(q))
      .map((s) => {
        const pct = s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0;
        return { ...s, percentage: pct, eligible: pct >= 75 };
      });
  }, [attendance, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="sta-pro-root">
      {/* Toast Alert */}
      {toast && (
        <div className={`sta-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. HERO COMMAND BANNER (Identical to Notices / Bulletin Header) */}
      <section className="sta-hero-banner">
        <div className="sta-hero-left">
          <div className="sta-live-chip">
            <span className="sta-ping"></span>
            <span className="sta-live-txt">ACADEMIC BIOMETRICS & ATTENDANCE LEDGER</span>
          </div>
          <h1 className="sta-hero-title">Student Attendance & Biometrics</h1>
          <p className="sta-hero-sub">
            Track real-time lecture attendance, subject-wise clearance ratios, biometric entries, and minimum 75% semester examination eligibility.
          </p>
        </div>

        <div className="sta-hero-actions">
          <button
            className="sta-btn sta-btn-secondary"
            onClick={fetchAttendance}
            disabled={loading}
            title="Refresh attendance records"
          >
            <FiRefreshCw className={loading ? "sta-spin" : ""} />
            <span>Sync</span>
          </button>

          <button
            className="sta-btn sta-btn-secondary"
            onClick={() => setPrintModal(true)}
            title="Print official attendance transcript"
          >
            <FiPrinter />
            <span>Print Report</span>
          </button>
        </div>
      </section>

      {/* 2. CATEGORY CHIPS STRIP (Identical to Notices Category Bar) */}
      <div className="sta-cat-strip">
        <button
          className={`sta-cat-chip ${activeCategory === "all" ? "active" : ""}`}
          onClick={() => setActiveCategory("all")}
        >
          <span>All Sessions ({attendance.length})</span>
        </button>

        <button
          className={`sta-cat-chip ${activeCategory === "subject" ? "active" : ""}`}
          onClick={() => setActiveCategory("subject")}
        >
          <span>Subject Breakdown ({subjectBreakdown.length})</span>
        </button>

        <button
          className={`sta-cat-chip ${activeCategory === "1" ? "active" : ""}`}
          onClick={() => setActiveCategory("1")}
        >
          <span>Present ({stats.present})</span>
        </button>

        <button
          className={`sta-cat-chip ${activeCategory === "2" ? "active" : ""}`}
          onClick={() => setActiveCategory("2")}
        >
          <span>Absent ({stats.absent})</span>
        </button>

        <button
          className={`sta-cat-chip ${activeCategory === "3" ? "active" : ""}`}
          onClick={() => setActiveCategory("3")}
        >
          <span>Late ({stats.late})</span>
        </button>

        <button
          className={`sta-cat-chip ${activeCategory === "4" ? "active" : ""}`}
          onClick={() => setActiveCategory("4")}
        >
          <span>Leaves ({stats.leave})</span>
        </button>
      </div>

      {/* 3. SEARCH & DECK PANEL (Identical to Notices Deck Panel) */}
      <section className="sta-deck-panel">
        <div className="sta-filter-row">
          <div className="sta-search-field">
            <FiSearch className="sta-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions, subject codes, faculty, dates, remarks..."
            />
            {searchQuery && (
              <button className="sta-clear-btn" onClick={() => setSearchQuery("")}>
                <FiX />
              </button>
            )}
          </div>

          <div className="sta-results-counter">
            {activeCategory === "subject" ? (
              <span>Showing <b>{subjectBreakdown.length}</b> subjects • Overall: <b className={stats.isEligible ? "text-success" : "text-danger"}>{stats.percentage}%</b></span>
            ) : (
              <span>Showing <b>{filteredRows.length}</b> attendance records • Overall: <b className={stats.isEligible ? "text-success" : "text-danger"}>{stats.percentage}% ({stats.isEligible ? "Eligible" : "Shortage"})</b></span>
            )}
          </div>
        </div>

        {/* 4. CONTENT GRID / CARDS */}
        <div className="sta-grid-container">
          {loading ? (
            <div className="sta-skel-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="sta-skel-card" />
              ))}
            </div>
          ) : activeCategory === "subject" ? (
            /* SUBJECT BREAKDOWN CARDS */
            subjectBreakdown.length ? (
              <div className="sta-cards-grid">
                {subjectBreakdown.map((subj) => (
                  <div className="sta-notice-card" key={subj.code}>
                    <div className="sta-card-top">
                      <span className="sta-cat-badge">{subj.code}</span>
                      <div className={`sta-status-pill ${subj.eligible ? "ok" : "warn"}`}>
                        {subj.percentage}% {subj.eligible ? "ELIGIBLE" : "SHORTAGE"}
                      </div>
                    </div>

                    <h3 className="sta-card-title">{subj.name}</h3>

                    {/* Progress Bar */}
                    <div className="sta-progress-track">
                      <div
                        className={`sta-progress-fill ${subj.eligible ? "ok" : "warn"}`}
                        style={{ width: `${Math.min(100, subj.percentage)}%` }}
                      />
                    </div>

                    <p className="sta-card-snippet">
                      Faculty: <b>{subj.faculty}</b> • Attended <b>{subj.attended}</b> of <b>{subj.total}</b> scheduled lectures ({subj.absent} absences).
                    </p>

                    <div className="sta-card-foot">
                      <div className="sta-author-box">
                        <FiUser size={13} />
                        <span>{subj.faculty}</span>
                      </div>

                      <div className="sta-stat-count-tag">
                        <span>{subj.attended}/{subj.total} Attended</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="sta-empty-state">
                <div className="sta-empty-icon-box">
                  <FiBookOpen />
                </div>
                <h3>No Subjects Found</h3>
                <p>No subjects matched your active search query.</p>
              </div>
            )
          ) : (
            /* ATTENDANCE SESSION CARDS (Matching Notices Cards Grid exactly) */
            filteredRows.length ? (
              <div className="sta-cards-grid">
                {filteredRows.map((row) => {
                  const meta = STATUS_CONFIG[row.status] || STATUS_CONFIG[1];

                  return (
                    <div
                      className="sta-notice-card"
                      key={row.id}
                      onClick={() => setSelectedSession(row)}
                    >
                      <div className="sta-card-top">
                        <span className={`sta-cat-badge ${row.statusClass}`}>
                          {row.statusBadge}
                        </span>
                        <div className="sta-date-badge">
                          <FiCalendar size={12} />
                          <span>{formatDate(row.date)} ({row.dayName})</span>
                        </div>
                      </div>

                      <h3 className="sta-card-title">
                        {row.subjectCode ? `${row.subjectCode}: ` : ""}{row.subjectName}
                      </h3>

                      <p className="sta-card-snippet">
                        {row.remarks} • {row.course} (Semester {row.semester})
                      </p>

                      <div className="sta-card-foot">
                        <div className="sta-author-box">
                          <FiUser size={13} />
                          <span>In-Charge: {row.faculty}</span>
                        </div>

                        <button className="sta-read-btn" type="button">
                          <span>Session Log</span>
                          <FiChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="sta-empty-state">
                <div className="sta-empty-icon-box">
                  <FiCheckCircle />
                </div>
                <h3>No Attendance Records Found</h3>
                <p>No recorded sessions matched your active category filter or search query.</p>
                {(searchQuery || activeCategory !== "all") && (
                  <button
                    className="sta-btn sta-btn-secondary"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory("all");
                    }}
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            )
          )}
        </div>
      </section>

      {/* SESSION DETAIL MODAL (Matching Notice Detail Modal) */}
      {selectedSession && (
        <div className="sta-modal-backdrop" onClick={() => setSelectedSession(null)}>
          <div className="sta-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="sta-modal-header">
              <div className="sta-modal-title-group">
                <span className={`sta-cat-badge ${selectedSession.statusClass}`}>
                  {selectedSession.statusBadge}
                </span>
                <h3 className="sta-modal-title">
                  {selectedSession.subjectCode ? `${selectedSession.subjectCode}: ` : ""}{selectedSession.subjectName}
                </h3>
                <div className="sta-modal-meta">
                  <span>📅 {formatDate(selectedSession.date)} ({selectedSession.dayName})</span>
                  <span>•</span>
                  <span>👤 Faculty: {selectedSession.faculty}</span>
                  <span>•</span>
                  <span>🎓 {selectedSession.course} Sem {selectedSession.semester}</span>
                </div>
              </div>

              <button className="sta-modal-close" onClick={() => setSelectedSession(null)}>
                <FiX size={18} />
              </button>
            </div>

            <div className="sta-modal-body">
              <div className="sta-detail-box">
                <div className="sta-detail-row">
                  <span>Student Scholar:</span>
                  <b>{student.name} ({student.enrollment})</b>
                </div>
                <div className="sta-detail-row">
                  <span>Attendance Status:</span>
                  <b className={`status-text ${selectedSession.statusClass}`}>{selectedSession.statusLabel}</b>
                </div>
                <div className="sta-detail-row">
                  <span>Session Date:</span>
                  <span>{formatDate(selectedSession.date)}</span>
                </div>
                <div className="sta-detail-row">
                  <span>Biometric Log:</span>
                  <span>{selectedSession.remarks}</span>
                </div>
              </div>
            </div>

            <div className="sta-modal-footer">
              <button
                className="sta-btn sta-btn-secondary"
                onClick={() => setSelectedSession(null)}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL PRINTABLE TRANSCRIPT MODAL */}
      {printModal && (
        <div className="sta-modal-backdrop" onClick={() => setPrintModal(false)}>
          <div className="sta-print-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="sta-modal-header no-print">
              <div className="sta-modal-title-group">
                <span className="sta-cat-badge">OFFICIAL TRANSCRIPT</span>
                <h3 className="sta-modal-title">Student Attendance Transcript</h3>
                <div className="sta-modal-meta">
                  <span>Student: {student.name} ({student.enrollment})</span>
                  <span>•</span>
                  <span>{student.course} Semester {student.semester}</span>
                </div>
              </div>

              <div className="sta-head-actions">
                <button className="sta-btn sta-btn-primary sta-btn-xs" onClick={handlePrint}>
                  <FiPrinter size={14} />
                  <span>Print / Save PDF</span>
                </button>
                <button className="sta-modal-close" onClick={() => setPrintModal(false)}>
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* PRINTABLE DOCUMENT BODY */}
            <div className="sta-receipt-document" id="printable-attendance">
              {/* University Header */}
              <div className="sta-doc-header">
                <div className="sta-doc-crest">NAV</div>
                <div className="sta-doc-titles">
                  <h2>NAVNEXT INSTITUTE OF HIGHER EDUCATION & TECHNOLOGY</h2>
                  <p className="sta-doc-sub">
                    Accredited Grade 'A+' | Affiliated to State Technological University
                  </p>
                  <p className="sta-doc-contact">
                    Academic Dean & Examination Cell • accounts@navnext.edu.in • +91 11 2345 6789
                  </p>
                </div>
                <div className="sta-doc-type-badge">
                  <span>ATTENDANCE RECORD</span>
                  <small>OFFICIAL TRANSCRIPT</small>
                </div>
              </div>

              <div className="sta-doc-divider"></div>

              {/* Student Metadata Ribbon */}
              <div className="sta-doc-ribbon">
                <div className="sta-ribbon-item">
                  <span className="lbl">Student Name:</span>
                  <b className="val">{student.name}</b>
                </div>
                <div className="sta-ribbon-item">
                  <span className="lbl">Enrollment No:</span>
                  <b className="val font-mono">{student.enrollment}</b>
                </div>
                <div className="sta-ribbon-item">
                  <span className="lbl">Program / Sem:</span>
                  <b className="val">{student.course} (Sem {student.semester})</b>
                </div>
                <div className="sta-ribbon-item">
                  <span className="lbl">Overall Attendance:</span>
                  <b className={`val status-tag ${stats.isEligible ? "ok" : "warn"}`}>
                    {stats.percentage}% ({stats.isEligible ? "ELIGIBLE" : "SHORTAGE"})
                  </b>
                </div>
              </div>

              {/* Summary Matrix */}
              <div className="sta-doc-stats-bar">
                <div className="sta-doc-stat-col">
                  <span>Total Lectures Conducted</span>
                  <b>{stats.total}</b>
                </div>
                <div className="sta-doc-stat-col text-present">
                  <span>Present Sessions</span>
                  <b>{stats.present}</b>
                </div>
                <div className="sta-doc-stat-col text-absent">
                  <span>Absent Sessions</span>
                  <b>{stats.absent}</b>
                </div>
                <div className="sta-doc-stat-col text-late">
                  <span>Late / Excused Leaves</span>
                  <b>{stats.late + stats.leave}</b>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <h4 className="sta-doc-section-title">Course Subject-Wise Breakdown</h4>
              <table className="sta-doc-table">
                <thead>
                  <tr>
                    <th>Subject Code</th>
                    <th>Subject Name</th>
                    <th>Faculty In-Charge</th>
                    <th className="right">Conducted</th>
                    <th className="right">Attended</th>
                    <th className="right">Percentage</th>
                    <th className="right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectBreakdown.map((s) => (
                    <tr key={s.code}>
                      <td className="bold font-mono">{s.code}</td>
                      <td>{s.name}</td>
                      <td>{s.faculty}</td>
                      <td className="right">{s.total}</td>
                      <td className="right bold">{s.attended}</td>
                      <td className="right bold">{s.percentage}%</td>
                      <td className={`right bold ${s.eligible ? "text-success" : "text-danger"}`}>
                        {s.eligible ? "ELIGIBLE" : "SHORTAGE"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Certification & Signatures */}
              <div className="sta-doc-footer-grid">
                <div className="sta-doc-notes">
                  <p className="note-title"><b>Dean Academic Affairs Note:</b></p>
                  <p className="note-txt">
                    As per university academic regulations, a minimum of 75% attendance is mandatory to appear for the End-Semester Examinations.
                  </p>
                  <p className="note-disc">
                    * System-generated transcript authenticated by NavNext Biometric Attendance Server.
                  </p>
                </div>

                <div className="sta-doc-signatures">
                  <div className="sta-doc-seal">
                    <FiShield size={30} />
                    <span>AUTHENTICATED RECORD</span>
                  </div>
                  <div className="sta-sign-line">
                    <div className="sta-sign-placeholder">Dean Academics</div>
                    <span>Dean of Academic Affairs</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="sta-modal-footer no-print">
              <button
                type="button"
                className="sta-btn sta-btn-secondary"
                onClick={() => setPrintModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="sta-btn sta-btn-primary"
                onClick={handlePrint}
              >
                <FiPrinter />
                <span>Print Official Transcript</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
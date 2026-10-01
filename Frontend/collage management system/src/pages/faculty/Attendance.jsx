import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiCalendar,
  FiBook,
  FiLayers,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertCircle,
  FiSave,
  FiRefreshCw,
  FiPrinter,
  FiUserCheck,
  FiUserX,
  FiUsers,
  FiTrendingUp,
  FiFilter
} from "react-icons/fi";
import "../../layout/faculty/Attendance.css";

const API_BASE = `${import.meta.env.VITE_API_BASE || "http://localhost:5001"}/Attendence`;
const COURSE_API = `${import.meta.env.VITE_API_BASE || "http://localhost:5001"}/Course/list`;

const API = {
  students: `${API_BASE}/students`,
  dailyData: `${API_BASE}/postAttendByDateAndClass`,
  save: `${API_BASE}/saveOrUpdateDaily`,
};

const STATUS_CONFIG = [
  { value: 1, label: "Present", short: "P", color: "present", icon: FiCheckCircle },
  { value: 2, label: "Absent", short: "A", color: "absent", icon: FiXCircle },
  { value: 3, label: "Late", short: "L", color: "late", icon: FiClock },
  { value: 4, label: "Leave", short: "LV", color: "leave", icon: FiAlertCircle },
];

const DEFAULT_COURSES = [
  { code: "BCA", name: "Bachelor of Computer Applications", maxSem: 6 },
  { code: "B.Tech CSE", name: "B.Tech Computer Science", maxSem: 8 },
  { code: "MCA", name: "Master of Computer Applications", maxSem: 4 },
  { code: "BBA", name: "Bachelor of Business Administration", maxSem: 6 },
  { code: "BCom", name: "Bachelor of Commerce", maxSem: 6 },
];

const getLocalDateString = (offsetDays = 0) => {
  const d = new Date();
  if (offsetDays) d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function FacultyDailyAttendance() {
  const [coursesList, setCoursesList] = useState(DEFAULT_COURSES);
  const [students, setStudents] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [selectedDate, setSelectedDate] = useState(() => {
    return localStorage.getItem("faculty_attendance_date") || getLocalDateString();
  });

  const [selectedCourse, setSelectedCourse] = useState(() => {
    return localStorage.getItem("faculty_attendance_course") || "BCA";
  });

  const [selectedSemester, setSelectedSemester] = useState(() => {
    return Number(localStorage.getItem("faculty_attendance_semester")) || 6;
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // 'ALL', '1', '2', '3', '4'

  const showToast = (message, type = "ok") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync courses from database
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.post(COURSE_API, {}).catch(() => null);
        if (res?.data?.data && Array.isArray(res.data.data)) {
          const list = res.data.data.map((c) => ({
            code: c.course_code || c.course_name,
            name: c.course_name,
            maxSem: c.total_semesters || 6,
          }));
          if (list.length > 0) setCoursesList(list);
        }
      } catch {
        // use fallback
      }
    };
    fetchCourses();
  }, []);

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem("faculty_attendance_date", selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    localStorage.setItem("faculty_attendance_course", selectedCourse);
  }, [selectedCourse]);

  useEffect(() => {
    localStorage.setItem("faculty_attendance_semester", String(selectedSemester));
  }, [selectedSemester]);

  // Load students & attendance for selected class & date
  const loadStudentsAndAttendance = async () => {
    try {
      setLoading(true);

      const stuRes = await axios.post(API.students, {
        course: selectedCourse,
        semester: selectedSemester,
      });

      const studentList = Array.isArray(stuRes?.data?.message)
        ? stuRes.data.message
        : [];

      let dailyList = [];
      try {
        const attRes = await axios.post(API.dailyData, {
          attendance_date: selectedDate,
          course: selectedCourse,
          semester: selectedSemester,
        });

        dailyList = Array.isArray(attRes?.data?.message)
          ? attRes.data.message
          : [];
      } catch (err) {
        console.warn("attendance api warning:", err?.response?.data || err.message);
        dailyList = [];
      }

      const merged = studentList.map((stu) => {
        const found = dailyList.find(
          (a) => String(a.student_id) === String(stu.student_id)
        );

        return {
          student_id: stu.student_id,
          name: stu.name || `${stu.first_name || ""} ${stu.last_name || ""}`.trim() || "Student",
          roll_no: stu.roll_no || stu.enrollment_no || `STU-${stu.student_id}`,
          department_id: stu.department_id || 0,
          course: stu.course || selectedCourse,
          semester: Number(stu.semester) || Number(selectedSemester),
          status: found ? Number(found.status) : 1, // default present
          attendence_id: found?.attendence_id || null,
          alreadySaved: !!found,
        };
      });

      setStudents(studentList);
      setAttendanceRows(merged);
    } catch (error) {
      console.error("LOAD ERROR:", error?.response?.data || error.message);
      showToast("Failed to load students for selected class", "err");
      setStudents([]);
      setAttendanceRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentsAndAttendance();
  }, [selectedCourse, selectedSemester, selectedDate]);

  // Filtered rows for UI
  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();

    return attendanceRows.filter((row) => {
      if (statusFilter !== "ALL" && String(row.status) !== String(statusFilter)) {
        return false;
      }

      if (!q) return true;

      const blob = `
        ${row.name}
        ${row.roll_no}
        ${row.student_id}
        ${row.course}
        Sem ${row.semester}
      `.toLowerCase();

      return blob.includes(q);
    });
  }, [attendanceRows, search, statusFilter]);

  // Handle individual status change
  const handleStatusChange = (studentId, value) => {
    setAttendanceRows((prev) =>
      prev.map((row) =>
        String(row.student_id) === String(studentId)
          ? { ...row, status: Number(value) }
          : row
      )
    );
  };

  // Bulk status update
  const markAll = (statusValue) => {
    setAttendanceRows((prev) =>
      prev.map((row) => ({
        ...row,
        status: Number(statusValue),
      }))
    );
    const label = STATUS_CONFIG.find((s) => s.value === statusValue)?.label || "Updated";
    showToast(`Marked all students as ${label}`, "ok");
  };

  // Save attendance to backend
  const saveDailyAttendance = async () => {
    if (attendanceRows.length === 0) {
      showToast("No students to save attendance for", "err");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        attendance_date: selectedDate,
        attendance: attendanceRows.map((row) => ({
          student_id: row.student_id,
          roll_no: row.roll_no || null,
          name: row.name || "",
          department_id: row.department_id || 0,
          course: row.course || selectedCourse,
          semester: Number(row.semester) || Number(selectedSemester),
          status: Number(row.status) || 1,
        })),
      };

      const res = await axios.post(API.save, payload);

      if (res.status === 200 || res.data?.success) {
        showToast(
          `Daily attendance for ${selectedCourse} Sem ${selectedSemester} saved successfully!`,
          "ok"
        );
        loadStudentsAndAttendance();
      } else {
        throw new Error(res.data?.message || "Save failed");
      }
    } catch (error) {
      console.error("SAVE ERROR:", error?.response?.data || error.message);
      showToast(error?.response?.data?.message || "Failed to save attendance in database", "err");
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveDailyAttendance();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [attendanceRows, selectedDate, selectedCourse, selectedSemester]);

  // Live Attendance Metrics
  const stats = useMemo(() => {
    const total = attendanceRows.length;
    const present = attendanceRows.filter((r) => Number(r.status) === 1).length;
    const absent = attendanceRows.filter((r) => Number(r.status) === 2).length;
    const late = attendanceRows.filter((r) => Number(r.status) === 3).length;
    const leave = attendanceRows.filter((r) => Number(r.status) === 4).length;
    const presentRate = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, late, leave, presentRate };
  }, [attendanceRows]);

  const activeCourseObj = coursesList.find((c) => c.code === selectedCourse);
  const maxSemesters = activeCourseObj?.maxSem || 8;
  const semOptions = Array.from({ length: maxSemesters }, (_, i) => i + 1);

  return (
    <div className="fda-page">
      {/* Background ambient lighting */}
      <div className="fda-bg-orb fda-orb-1"></div>
      <div className="fda-bg-orb fda-orb-2"></div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fda-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. HERO HEADER BANNER */}
      <div className="fda-header">
        <div className="fda-hero-left">
          <div className="fda-live-chip">
            <span className="fda-ping"></span>
            <span className="fda-live-txt">OFFICIAL ATTENDANCE REGISTER • FACULTY DESK</span>
          </div>
          <h1 className="fda-hero-title">Daily Student Attendance</h1>
          <p className="fda-hero-sub">
            Record, verify and submit daily classroom attendance for <b>{selectedCourse}</b> (Semester {selectedSemester})
          </p>
        </div>

        <div className="fda-hero-actions">
          <button
            className="fda-btn fda-btn-secondary"
            onClick={loadStudentsAndAttendance}
            disabled={loading}
            title="Refresh student list and latest marked status"
          >
            <FiRefreshCw className={loading ? "fda-spin" : ""} />
            <span>Sync</span>
          </button>

          <button
            className="fda-btn fda-btn-secondary"
            onClick={() => window.print()}
            title="Print Attendance Sheet / Register"
          >
            <FiPrinter />
            <span>Print Sheet</span>
          </button>

          <button
            className="fda-btn fda-btn-primary"
            onClick={saveDailyAttendance}
            disabled={saving || attendanceRows.length === 0}
            title="Save daily records to PostgreSQL database (Ctrl + S)"
          >
            {saving ? (
              <>
                <FiRefreshCw className="fda-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FiSave />
                <span>Save Attendance</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. FILTER & SELECTION CONTROLS WORKBENCH */}
      <div className="fda-controls-panel">
        <div className="fda-control-group">
          <label>
            <FiCalendar className="ctrl-icon" />
            <span>Attendance Date</span>
          </label>
          <div className="date-input-wrap">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="fda-input"
            />
            <div className="quick-date-btns">
              <button
                type="button"
                className={`quick-d-btn ${selectedDate === getLocalDateString() ? "active" : ""}`}
                onClick={() => setSelectedDate(getLocalDateString())}
              >
                Today
              </button>
              <button
                type="button"
                className={`quick-d-btn ${selectedDate === getLocalDateString(-1) ? "active" : ""}`}
                onClick={() => setSelectedDate(getLocalDateString(-1))}
              >
                Yesterday
              </button>
            </div>
          </div>
        </div>

        <div className="fda-control-group">
          <label>
            <FiBook className="ctrl-icon" />
            <span>Course Degree</span>
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="fda-select"
          >
            {coursesList.map((course) => (
              <option key={course.code} value={course.code}>
                {course.name} ({course.code})
              </option>
            ))}
          </select>
        </div>

        <div className="fda-control-group">
          <label>
            <FiLayers className="ctrl-icon" />
            <span>Semester</span>
          </label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(Number(e.target.value))}
            className="fda-select"
          >
            {semOptions.map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>

        <div className="fda-control-group search-group">
          <label>
            <FiSearch className="ctrl-icon" />
            <span>Search Student</span>
          </label>
          <input
            type="text"
            placeholder="Search by name, roll no or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="fda-input search-input"
          />
        </div>
      </div>

      {/* 3. LIVE ATTENDANCE METRICS HUD */}
      <div className="fda-metrics-hud">
        <div className="fda-hud-card total">
          <div className="hud-top">
            <span className="hud-lbl">Enrolled Students</span>
            <FiUsers className="hud-icon" />
          </div>
          <strong className="hud-val">{stats.total}</strong>
          <span className="hud-sub">Class Roster</span>
        </div>

        <div className="fda-hud-card present">
          <div className="hud-top">
            <span className="hud-lbl">Present</span>
            <FiUserCheck className="hud-icon green" />
          </div>
          <strong className="hud-val green">{stats.present}</strong>
          <span className="hud-badge green">{stats.presentRate}% Attendance</span>
        </div>

        <div className="fda-hud-card absent">
          <div className="hud-top">
            <span className="hud-lbl">Absent</span>
            <FiUserX className="hud-icon red" />
          </div>
          <strong className="hud-val red">{stats.absent}</strong>
          <span className="hud-sub">{stats.total ? Math.round((stats.absent / stats.total) * 100) : 0}% Absentee</span>
        </div>

        <div className="fda-hud-card late">
          <div className="hud-top">
            <span className="hud-lbl">Late Arrival</span>
            <FiClock className="hud-icon amber" />
          </div>
          <strong className="hud-val amber">{stats.late}</strong>
          <span className="hud-sub">Flagged Late</span>
        </div>

        <div className="fda-hud-card leave">
          <div className="hud-top">
            <span className="hud-lbl">Approved Leave</span>
            <FiAlertCircle className="hud-icon purple" />
          </div>
          <strong className="hud-val purple">{stats.leave}</strong>
          <span className="hud-sub">Official Leave</span>
        </div>
      </div>

      {/* 4. FAST ACTION BAR & STATUS FILTER PILLS */}
      <div className="fda-action-bar">
        <div className="bulk-buttons">
          <span className="bar-label">⚡ Quick Mark All:</span>
          <button
            type="button"
            className="bulk-btn present"
            onClick={() => markAll(1)}
            disabled={attendanceRows.length === 0}
          >
            <FiCheckCircle />
            <span>Mark All Present</span>
          </button>

          <button
            type="button"
            className="bulk-btn absent"
            onClick={() => markAll(2)}
            disabled={attendanceRows.length === 0}
          >
            <FiXCircle />
            <span>Mark All Absent</span>
          </button>

          <button
            type="button"
            className="bulk-btn late"
            onClick={() => markAll(3)}
            disabled={attendanceRows.length === 0}
          >
            <FiClock />
            <span>Mark All Late</span>
          </button>

          <button
            type="button"
            className="bulk-btn leave"
            onClick={() => markAll(4)}
            disabled={attendanceRows.length === 0}
          >
            <FiAlertCircle />
            <span>Mark All Leave</span>
          </button>
        </div>

        <div className="status-filter-pills">
          <span className="bar-label"><FiFilter /> Filter:</span>
          <button
            type="button"
            className={`filter-pill ${statusFilter === "ALL" ? "active" : ""}`}
            onClick={() => setStatusFilter("ALL")}
          >
            All ({stats.total})
          </button>
          <button
            type="button"
            className={`filter-pill present ${statusFilter === "1" ? "active" : ""}`}
            onClick={() => setStatusFilter("1")}
          >
            Present ({stats.present})
          </button>
          <button
            type="button"
            className={`filter-pill absent ${statusFilter === "2" ? "active" : ""}`}
            onClick={() => setStatusFilter("2")}
          >
            Absent ({stats.absent})
          </button>
          <button
            type="button"
            className={`filter-pill late ${statusFilter === "3" ? "active" : ""}`}
            onClick={() => setStatusFilter("3")}
          >
            Late ({stats.late})
          </button>
          <button
            type="button"
            className={`filter-pill leave ${statusFilter === "4" ? "active" : ""}`}
            onClick={() => setStatusFilter("4")}
          >
            Leave ({stats.leave})
          </button>
        </div>
      </div>

      {/* 5. INTERACTIVE ATTENDANCE TABLE CARD */}
      <div className="fda-table-card">
        {loading ? (
          <div className="fda-loading-box">
            <FiRefreshCw className="fda-spin" size={28} />
            <span>Loading class roster from PostgreSQL database...</span>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="fda-empty-box">
            <FiUsers size={48} className="empty-ico" />
            <h3>No Students Found</h3>
            <p>
              No student records matched <b>{selectedCourse} Semester {selectedSemester}</b>. Try selecting another course or semester.
            </p>
          </div>
        ) : (
          <div className="fda-table-wrap">
            <table className="fda-table">
              <thead>
                <tr>
                  <th style={{ width: "70px" }}>Roll / ID</th>
                  <th>Student Name &amp; Identity</th>
                  <th>Enrollment No</th>
                  <th>Class / Sem</th>
                  <th style={{ minWidth: "320px" }}>Attendance Status Marking</th>
                  <th style={{ width: "130px", textAlign: "center" }}>Database Sync</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr key={row.student_id} className={`status-row-${row.status}`}>
                    <td>
                      <span className="fda-roll-badge">
                        #{row.student_id}
                      </span>
                    </td>

                    <td>
                      <div className="fda-student-cell">
                        <div className="fda-student-avatar">
                          {row.name ? row.name.charAt(0) : "S"}
                        </div>
                        <div>
                          <strong className="fda-student-name">{row.name}</strong>
                          <span className="fda-student-id-sub">ID: {row.student_id}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="fda-enrollment-badge">
                        {row.roll_no || `EN-${row.student_id}`}
                      </span>
                    </td>

                    <td>
                      <span className="fda-class-badge">
                        {row.course} • Sem {row.semester}
                      </span>
                    </td>

                    <td>
                      {/* Segmented 1-Click Status Marking Buttons */}
                      <div className="fda-status-toggle-group">
                        {STATUS_CONFIG.map((opt) => {
                          const isSelected = row.status === opt.value;
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              className={`status-btn ${opt.color} ${isSelected ? "selected" : ""}`}
                              onClick={() => handleStatusChange(row.student_id, opt.value)}
                              title={`Mark ${opt.label} for ${row.name}`}
                            >
                              <Icon size={14} />
                              <span>{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <span
                        className={`fda-sync-badge ${
                          row.alreadySaved ? "synced" : "pending"
                        }`}
                      >
                        {row.alreadySaved ? "🟢 Saved in DB" : "🟡 Unsaved / New"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. PRINTABLE OFFICIAL REGISTER SHEET */}
      <div className="fda-print-sheet">
        <div className="print-header">
          <h2>NavNext University • Official Attendance Record Register</h2>
          <p>
            Course: <strong>{selectedCourse}</strong> | Semester: <strong>{selectedSemester}</strong> | Date: <strong>{selectedDate}</strong>
          </p>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student Name</th>
              <th>Enrollment No</th>
              <th>Course / Sem</th>
              <th>Status</th>
              <th>Signature / Remarks</th>
            </tr>
          </thead>
          <tbody>
            {attendanceRows.map((row, idx) => (
              <tr key={row.student_id}>
                <td>{idx + 1}</td>
                <td><strong>{row.name}</strong></td>
                <td>{row.roll_no || `EN-${row.student_id}`}</td>
                <td>{row.course} Sem {row.semester}</td>
                <td>
                  <strong>
                    {STATUS_CONFIG.find((s) => s.value === row.status)?.label || "Present"}
                  </strong>
                </td>
                <td>__________________</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="print-footer">
          <p>Total Enrolled: {stats.total} | Present: {stats.present} | Absent: {stats.absent} | Late: {stats.late} | Rate: {stats.presentRate}%</p>
          <p>Faculty Signature: _______________________ Date: {selectedDate}</p>
        </div>
      </div>
    </div>
  );
}
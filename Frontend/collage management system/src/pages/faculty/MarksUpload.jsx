import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiAward,
  FiBook,
  FiLayers,
  FiSearch,
  FiCheckCircle,
  FiSave,
  FiRefreshCw,
  FiPrinter,
  FiUsers,
  FiTrendingUp,
  FiAlertCircle,
  FiFileText,
  FiEdit3,
  FiCheck,
  FiXCircle,
  FiPercent
} from "react-icons/fi";
import "../../layout/faculty/MarksUpload.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";
const STUDENT_API = `${API_BASE}/Attendence/students`;
const MARKS_API = `${API_BASE}/Result/upload-marks`;
const CLASS_MARKS_API = `${API_BASE}/Result/class-marks`;
const COURSE_API = `${API_BASE}/Course/list`;
const TIMETABLE_API = `${API_BASE}/Timetable/list`;

const EXAM_TYPES = [
  "Mid Semester",
  "Internal Exam",
  "Practical Exam",
  "Final Examination",
  "Unit Test 1",
  "Unit Test 2",
];

const DEFAULT_COURSES = [
  { code: "BCA", name: "Bachelor of Computer Applications", maxSem: 6 },
  { code: "B.Tech CSE", name: "B.Tech Computer Science", maxSem: 8 },
  { code: "MCA", name: "Master of Computer Applications", maxSem: 4 },
  { code: "BBA", name: "Bachelor of Business Administration", maxSem: 6 },
  { code: "BCom", name: "Bachelor of Commerce", maxSem: 6 },
];

const DEFAULT_SUBJECTS = [
  "Python Programming",
  "Database Management Systems",
  "Data Structures & Algorithms",
  "Web Technology & Frameworks",
  "Computer Networks & Security",
  "Java Programming",
  "Software Engineering",
  "Operating Systems",
];

const calcGrade = (percentage) => {
  const p = Number(percentage) || 0;
  if (p >= 90) return { grade: "A+", label: "Outstanding", color: "green" };
  if (p >= 80) return { grade: "A", label: "Excellent", color: "green" };
  if (p >= 70) return { grade: "B+", label: "Very Good", color: "cyan" };
  if (p >= 60) return { grade: "B", label: "Good", color: "cyan" };
  if (p >= 50) return { grade: "C", label: "Above Average", color: "amber" };
  if (p >= 40) return { grade: "D", label: "Pass", color: "amber" };
  return { grade: "F", label: "Fail", color: "red" };
};

export default function MarksUpload() {
  const [coursesList, setCoursesList] = useState(DEFAULT_COURSES);
  const [subjectsList, setSubjectsList] = useState(DEFAULT_SUBJECTS);

  const [examType, setExamType] = useState(() => localStorage.getItem("fac_marks_exam") || "Mid Semester");
  const [course, setCourse] = useState(() => localStorage.getItem("fac_marks_course") || "BCA");
  const [semester, setSemester] = useState(() => Number(localStorage.getItem("fac_marks_sem")) || 6);
  const [subject, setSubject] = useState(() => localStorage.getItem("fac_marks_sub") || "Python Programming");
  const [maxMarks, setMaxMarks] = useState(100);

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // 'ALL', 'SAVED', 'ENTERED', 'PENDING'

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

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
        // use default
      }
    };
    fetchCourses();
  }, []);

  // Sync subjects from timetable
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await axios.post(TIMETABLE_API, {}).catch(() => null);
        if (res?.data) {
          const rows = Array.isArray(res.data) ? res.data : res.data.data || res.data.rows || [];
          const matched = rows
            .filter((r) => r.subject && (!course || String(r.course || "").toLowerCase().includes(course.toLowerCase())))
            .map((r) => r.subject.trim());

          const unique = Array.from(new Set(matched));
          if (unique.length > 0) {
            setSubjectsList(unique);
            if (!unique.includes(subject)) {
              setSubject(unique[0]);
            }
          }
        }
      } catch {
        // use default
      }
    };
    fetchSubjects();
  }, [course]);

  // Persist selections in localStorage
  useEffect(() => {
    localStorage.setItem("fac_marks_exam", examType);
  }, [examType]);

  useEffect(() => {
    localStorage.setItem("fac_marks_course", course);
  }, [course]);

  useEffect(() => {
    localStorage.setItem("fac_marks_sem", String(semester));
  }, [semester]);

  useEffect(() => {
    localStorage.setItem("fac_marks_sub", subject);
  }, [subject]);

  // Load students & existing marks
  const fetchStudentsAndMarks = async () => {
    try {
      setLoading(true);

      // 1. Fetch Students
      const stuRes = await axios.post(STUDENT_API, {
        course,
        semester: Number(semester),
      });

      const rawStudents = Array.isArray(stuRes?.data?.message)
        ? stuRes.data.message
        : stuRes?.data?.data || [];

      // 2. Fetch Existing Marks for this class & exam
      let existingMarks = [];
      try {
        const marksRes = await axios.post(CLASS_MARKS_API, {
          course,
          semester: Number(semester),
          exam_name: examType,
        });
        existingMarks = Array.isArray(marksRes?.data?.data) ? marksRes.data.data : [];
      } catch (err) {
        console.warn("Could not fetch existing marks:", err);
      }

      // Merge Students with Existing Marks
      const merged = rawStudents.map((stu) => {
        const studentId = stu.student_id || stu.user_id || stu.id;
        const found = existingMarks.find(
          (m) => String(m.student_id) === String(studentId)
        );

        const marksVal = found && found.obtained_marks !== null && found.obtained_marks !== undefined
          ? Number(found.obtained_marks)
          : "";

        const totalVal = found?.total_marks ? Number(found.total_marks) : maxMarks;

        return {
          id: studentId,
          rollNo: stu.enrollment_no || stu.enrollment || stu.roll_no || `STU-${studentId}`,
          name: stu.name || `${stu.first_name || ""} ${stu.last_name || ""}`.trim() || "Student",
          course: stu.course || course,
          semester: Number(stu.semester || stu.sem) || Number(semester),
          marks: marksVal,
          totalMarks: totalVal,
          alreadySaved: !!found,
          status: marksVal !== "" ? (found ? "Saved" : "Entered") : "Pending",
        };
      });

      setStudents(merged);
    } catch (err) {
      console.error("fetchStudentsAndMarks error:", err);
      showToast("Failed to load students for selected class", "err");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsAndMarks();
  }, [course, semester, examType]);

  // Handle individual marks change
  const handleMarksChange = (id, rawValue) => {
    if (rawValue === "") {
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, marks: "", status: "Pending" } : s))
      );
      return;
    }

    const val = Number(rawValue);
    if (Number.isNaN(val) || val < 0 || val > maxMarks) return;

    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              marks: val,
              status: "Entered",
            }
          : s
      )
    );
  };

  // Quick fill passing score
  const handleFillPassing = (score = 60) => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        marks: s.marks === "" || s.marks === null ? score : s.marks,
        status: "Entered",
      }))
    );
    showToast(`Filled default marks (${score}/${maxMarks}) for pending students`, "ok");
  };

  // Reset marks
  const handleReset = () => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        marks: "",
        status: "Pending",
      }))
    );
    showToast("Cleared entered marks", "ok");
  };

  // Save / Upload marks to PostgreSQL database
  const handleSave = async () => {
    const validMarks = students.filter(
      (s) => s.marks !== "" && s.marks !== null && s.marks !== undefined
    );

    if (validMarks.length === 0) {
      showToast("Please enter marks for at least one student", "err");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        examType,
        course,
        semester: Number(semester),
        subject,
        marks: validMarks.map((s) => ({
          student_id: s.id,
          roll_no: s.rollNo,
          student_name: s.name,
          marks: Number(s.marks),
          total_marks: maxMarks,
          course: s.course || course,
          semester: Number(s.semester || semester),
        })),
      };

      const res = await axios.post(MARKS_API, payload);

      if (res.status === 200 || res.data?.success) {
        showToast(
          `Successfully saved & published ${validMarks.length} student marks for ${subject}!`,
          "ok"
        );
        fetchStudentsAndMarks();
      } else {
        throw new Error(res.data?.message || "Failed to upload marks");
      }
    } catch (err) {
      console.error("handleSave error:", err);
      showToast(err?.response?.data?.message || "Error saving marks to database", "err");
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcut Ctrl + S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [students, examType, course, semester, subject, maxMarks]);

  // Filtered student list for rendering
  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase().trim();

    return students.filter((s) => {
      if (statusFilter === "SAVED" && s.status !== "Saved") return false;
      if (statusFilter === "ENTERED" && s.status !== "Entered") return false;
      if (statusFilter === "PENDING" && s.status !== "Pending") return false;

      if (!q) return true;

      const blob = `
        ${s.name}
        ${s.rollNo}
        ${s.id}
        ${s.course}
        Sem ${s.semester}
      `.toLowerCase();

      return blob.includes(q);
    });
  }, [students, search, statusFilter]);

  // Class Performance Analytics HUD
  const stats = useMemo(() => {
    const total = students.length;
    const entered = students.filter((s) => s.marks !== "" && s.marks !== null);
    const enteredCount = entered.length;
    const pendingCount = total - enteredCount;

    if (enteredCount === 0) {
      return {
        total,
        enteredCount: 0,
        pendingCount: total,
        avgMarks: 0,
        avgPct: 0,
        highest: 0,
        lowest: 0,
        passCount: 0,
        failCount: 0,
        passRate: 0,
      };
    }

    const marksArr = entered.map((s) => Number(s.marks));
    const sum = marksArr.reduce((a, b) => a + b, 0);
    const avgMarks = Number((sum / enteredCount).toFixed(1));
    const avgPct = maxMarks > 0 ? Number(((avgMarks / maxMarks) * 100).toFixed(1)) : 0;
    const highest = Math.max(...marksArr);
    const lowest = Math.min(...marksArr);

    const passCutoff = maxMarks * 0.4;
    const passCount = entered.filter((s) => Number(s.marks) >= passCutoff).length;
    const failCount = enteredCount - passCount;
    const passRate = Math.round((passCount / enteredCount) * 100);

    return {
      total,
      enteredCount,
      pendingCount,
      avgMarks,
      avgPct,
      highest,
      lowest,
      passCount,
      failCount,
      passRate,
    };
  }, [students, maxMarks]);

  const activeCourseObj = coursesList.find((c) => c.code === course);
  const maxSemesters = activeCourseObj?.maxSem || 8;
  const semOptions = Array.from({ length: maxSemesters }, (_, i) => i + 1);

  return (
    <div className="fmu-page">
      {/* Background ambient lighting */}
      <div className="fmu-bg-orb fmu-orb-1"></div>
      <div className="fmu-bg-orb fmu-orb-2"></div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fmu-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. HERO COMMAND BANNER */}
      <div className="fmu-header">
        <div className="fmu-hero-left">
          <div className="fmu-live-chip">
            <span className="fmu-ping"></span>
            <span className="fmu-live-txt">OFFICIAL MARKS ENTRY &amp; EVALUATION DESK</span>
          </div>
          <h1 className="fmu-hero-title">Upload &amp; Manage Student Marks</h1>
          <p className="fmu-hero-sub">
            Publish examination results for <b>{course}</b> (Sem {semester}) • Subject: <b>{subject}</b>
          </p>
        </div>

        <div className="fmu-hero-actions">
          <button
            className="fmu-btn fmu-btn-secondary"
            onClick={fetchStudentsAndMarks}
            disabled={loading}
            title="Refresh student list and latest database marks"
          >
            <FiRefreshCw className={loading ? "fmu-spin" : ""} />
            <span>Sync</span>
          </button>

          <button
            className="fmu-btn fmu-btn-secondary"
            onClick={() => window.print()}
            title="Print Official Exam Marksheet / Ledger"
          >
            <FiPrinter />
            <span>Print Sheet</span>
          </button>

          <button
            className="fmu-btn fmu-btn-primary"
            onClick={handleSave}
            disabled={saving || students.length === 0}
            title="Save & Publish Marks to PostgreSQL database (Ctrl + S)"
          >
            {saving ? (
              <>
                <FiRefreshCw className="fmu-spin" />
                <span>Saving Marks...</span>
              </>
            ) : (
              <>
                <FiSave />
                <span>Save &amp; Publish Marks</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. FILTER & CONFIGURATION WORKBENCH */}
      <div className="fmu-controls-panel">
        <div className="fmu-control-group">
          <label>
            <FiAward className="ctrl-icon" />
            <span>Examination Type</span>
          </label>
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="fmu-select"
          >
            {EXAM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="fmu-control-group">
          <label>
            <FiBook className="ctrl-icon" />
            <span>Course Degree</span>
          </label>
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="fmu-select"
          >
            {coursesList.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        <div className="fmu-control-group">
          <label>
            <FiLayers className="ctrl-icon" />
            <span>Semester</span>
          </label>
          <select
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
            className="fmu-select"
          >
            {semOptions.map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>

        <div className="fmu-control-group">
          <label>
            <FiFileText className="ctrl-icon" />
            <span>Subject / Paper</span>
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="fmu-select"
          >
            {subjectsList.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        <div className="fmu-control-group mini-group">
          <label>
            <FiPercent className="ctrl-icon" />
            <span>Max Score</span>
          </label>
          <select
            value={maxMarks}
            onChange={(e) => setMaxMarks(Number(e.target.value))}
            className="fmu-select"
          >
            <option value={100}>100 Marks</option>
            <option value={75}>75 Marks</option>
            <option value={50}>50 Marks</option>
            <option value={30}>30 Marks</option>
            <option value={25}>25 Marks</option>
            <option value={20}>20 Marks</option>
          </select>
        </div>
      </div>

      {/* 3. CLASS PERFORMANCE ANALYTICS HUD */}
      <div className="fmu-metrics-hud">
        <div className="fmu-hud-card total">
          <div className="hud-top">
            <span className="hud-lbl">Enrolled Students</span>
            <FiUsers className="hud-icon" />
          </div>
          <strong className="hud-val">{stats.total}</strong>
          <span className="hud-sub">
            {stats.enteredCount} Entered • {stats.pendingCount} Pending
          </span>
        </div>

        <div className="fmu-hud-card avg">
          <div className="hud-top">
            <span className="hud-lbl">Class Average</span>
            <FiTrendingUp className="hud-icon cyan" />
          </div>
          <strong className="hud-val cyan">
            {stats.avgMarks} <small style={{ fontSize: "14px", color: "#94a3b8" }}>/ {maxMarks}</small>
          </strong>
          <span className="hud-badge cyan">{stats.avgPct}% Average</span>
        </div>

        <div className="fmu-hud-card highest">
          <div className="hud-top">
            <span className="hud-lbl">Top Score</span>
            <FiAward className="hud-icon gold" />
          </div>
          <strong className="hud-val gold">{stats.highest} / {maxMarks}</strong>
          <span className="hud-sub">Lowest: {stats.lowest}</span>
        </div>

        <div className="fmu-hud-card pass">
          <div className="hud-top">
            <span className="hud-lbl">Passed Students</span>
            <FiCheck className="hud-icon green" />
          </div>
          <strong className="hud-val green">{stats.passCount}</strong>
          <span className="hud-badge green">{stats.passRate}% Pass Rate</span>
        </div>

        <div className="fmu-hud-card fail">
          <div className="hud-top">
            <span className="hud-lbl">Fail / At Risk</span>
            <FiXCircle className="hud-icon red" />
          </div>
          <strong className="hud-val red">{stats.failCount}</strong>
          <span className="hud-sub">&lt; 40% Minimum Passing</span>
        </div>
      </div>

      {/* 4. FAST ACTION BAR & STATUS FILTER PILLS */}
      <div className="fmu-action-bar">
        <div className="bulk-buttons">
          <span className="bar-label">⚡ Quick Tools:</span>
          <button
            type="button"
            className="bulk-btn fill"
            onClick={() => handleFillPassing(Math.round(maxMarks * 0.6))}
            disabled={students.length === 0}
            title="Auto-fill 60% passing marks for unentered students"
          >
            <FiCheckCircle />
            <span>Fill 60% Passing</span>
          </button>

          <button
            type="button"
            className="bulk-btn clear"
            onClick={handleReset}
            disabled={students.length === 0}
            title="Clear all entered marks"
          >
            <FiRefreshCw />
            <span>Clear Unsaved</span>
          </button>
        </div>

        <div className="search-and-filters">
          <div className="fmu-search-wrap">
            <FiSearch className="s-ico" />
            <input
              type="text"
              placeholder="Search student by name or enrollment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="fmu-search-input"
            />
          </div>

          <div className="status-filter-pills">
            <button
              type="button"
              className={`filter-pill ${statusFilter === "ALL" ? "active" : ""}`}
              onClick={() => setStatusFilter("ALL")}
            >
              All ({stats.total})
            </button>
            <button
              type="button"
              className={`filter-pill saved ${statusFilter === "SAVED" ? "active" : ""}`}
              onClick={() => setStatusFilter("SAVED")}
            >
              Saved ({students.filter((s) => s.status === "Saved").length})
            </button>
            <button
              type="button"
              className={`filter-pill entered ${statusFilter === "ENTERED" ? "active" : ""}`}
              onClick={() => setStatusFilter("ENTERED")}
            >
              Unsaved ({students.filter((s) => s.status === "Entered").length})
            </button>
            <button
              type="button"
              className={`filter-pill pending ${statusFilter === "PENDING" ? "active" : ""}`}
              onClick={() => setStatusFilter("PENDING")}
            >
              Pending ({stats.pendingCount})
            </button>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE MARKS ENTRY TABLE CARD */}
      <div className="fmu-table-card">
        {loading ? (
          <div className="fmu-loading-box">
            <FiRefreshCw className="fmu-spin" size={28} />
            <span>Loading students and examination records from PostgreSQL...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="fmu-empty-box">
            <FiUsers size={48} className="empty-ico" />
            <h3>No Students Found</h3>
            <p>
              No student records matched <b>{course} Semester {semester}</b>. Try selecting another course or semester.
            </p>
          </div>
        ) : (
          <div className="fmu-table-wrap">
            <table className="fmu-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>#</th>
                  <th>Student Name &amp; Identity</th>
                  <th>Enrollment No</th>
                  <th>Subject &amp; Exam</th>
                  <th style={{ width: "180px" }}>Marks Obtained ({maxMarks})</th>
                  <th style={{ width: "120px" }}>Percentage</th>
                  <th style={{ width: "110px" }}>Grade</th>
                  <th style={{ width: "140px", textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, idx) => {
                  const hasMarks = student.marks !== "" && student.marks !== null && student.marks !== undefined;
                  const pct = hasMarks ? ((Number(student.marks) / maxMarks) * 100).toFixed(1) : "—";
                  const gradeObj = hasMarks ? calcGrade(pct) : null;

                  return (
                    <tr key={student.id} className={`status-row-${student.status.toLowerCase()}`}>
                      <td>
                        <span className="fmu-index-badge">#{idx + 1}</span>
                      </td>

                      <td>
                        <div className="fmu-student-cell">
                          <div className="fmu-student-avatar">
                            {student.name ? student.name.charAt(0) : "S"}
                          </div>
                          <div>
                            <strong className="fmu-student-name">{student.name}</strong>
                            <span className="fmu-student-id-sub">ID: {student.id}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="fmu-enrollment-badge">
                          {student.rollNo || `EN-${student.id}`}
                        </span>
                      </td>

                      <td>
                        <div className="fmu-subject-cell">
                          <span className="sub-main">{subject}</span>
                          <span className="sub-exam">{examType}</span>
                        </div>
                      </td>

                      <td>
                        <div className="fmu-marks-input-wrap">
                          <input
                            type="number"
                            min="0"
                            max={maxMarks}
                            placeholder={`0-${maxMarks}`}
                            value={student.marks}
                            onChange={(e) => handleMarksChange(student.id, e.target.value)}
                            className="fmu-marks-input"
                          />
                          <span className="fmu-max-label">/ {maxMarks}</span>
                        </div>
                      </td>

                      <td>
                        <span className="fmu-pct-badge">
                          {hasMarks ? `${pct}%` : "—"}
                        </span>
                      </td>

                      <td>
                        {gradeObj ? (
                          <span className={`fmu-grade-pill ${gradeObj.color}`}>
                            {gradeObj.grade} ({gradeObj.label})
                          </span>
                        ) : (
                          <span className="fmu-grade-pill none">—</span>
                        )}
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <span className={`fmu-status-pill ${student.status.toLowerCase()}`}>
                          {student.status === "Saved" && "🟢 Saved"}
                          {student.status === "Entered" && "🟡 Unsaved"}
                          {student.status === "Pending" && "⚪ Pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="fmu-table-footer">
          <div className="footer-left-info">
            <span>
              Showing <b>{filteredStudents.length}</b> of <b>{students.length}</b> students • Total Entered: <b>{stats.enteredCount}</b>
            </span>
          </div>

          <div className="footer-right-btns">
            <button className="fmu-btn fmu-btn-secondary" onClick={handleReset}>
              Reset Form
            </button>

            <button
              className="fmu-btn fmu-btn-primary"
              onClick={handleSave}
              disabled={saving || students.length === 0}
            >
              {saving ? (
                <>
                  <FiRefreshCw className="fmu-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiSave />
                  <span>Save All Marks</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 6. PRINTABLE OFFICIAL GRADE SHEET */}
      <div className="fmu-print-sheet">
        <div className="print-header">
          <h2>NavNext University • Official Examination Marksheet</h2>
          <p>
            Course: <strong>{course}</strong> | Semester: <strong>{semester}</strong> | Subject: <strong>{subject}</strong> | Exam: <strong>{examType}</strong>
          </p>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student Name</th>
              <th>Enrollment No</th>
              <th>Max Marks</th>
              <th>Marks Obtained</th>
              <th>Percentage</th>
              <th>Grade</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, idx) => {
              const has = s.marks !== "" && s.marks !== null;
              const p = has ? ((Number(s.marks) / maxMarks) * 100).toFixed(1) : "—";
              const g = has ? calcGrade(p) : null;
              const isPass = has && Number(s.marks) >= maxMarks * 0.4;

              return (
                <tr key={s.id}>
                  <td>{idx + 1}</td>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.rollNo}</td>
                  <td>{maxMarks}</td>
                  <td><strong>{has ? s.marks : "—"}</strong></td>
                  <td>{has ? `${p}%` : "—"}</td>
                  <td>{g ? g.grade : "—"}</td>
                  <td>{has ? (isPass ? "PASS" : "FAIL") : "PENDING"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="print-footer">
          <p>
            Total Candidates: {stats.total} | Appeared: {stats.enteredCount} | Passed: {stats.passCount} | Pass Percentage: {stats.passRate}%
          </p>
          <p>Evaluator Signature: _______________________ Date: {new Date().toLocaleDateString("en-IN")}</p>
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiUsers,
  FiUserCheck,
  FiBookOpen,
  FiFileText,
  FiCheckSquare,
  FiCalendar,
  FiUploadCloud,
  FiAward,
  FiLayers,
  FiBell,
  FiRefreshCw,
  FiChevronRight,
  FiClock,
  FiActivity,
  FiPlus,
  FiSend,
  FiCheckCircle,
  FiAlertCircle,
  FiCompass,
  FiFolder
} from "react-icons/fi";
import "../../layout/faculty/facultyDashboard.css";
import { getActiveFacultySession } from "../../utils/facultySession";

const BASE_API = `${import.meta.env.VITE_API_BASE || "http://localhost:5001"}/Faculty/dashboard`;

export default function FacultyMainDashboard() {
  const navigate = useNavigate();
  const faculty = useMemo(() => getActiveFacultySession(), []);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [overview, setOverview] = useState({
    faculty_name: faculty.name,
    department: faculty.department,
    today_classes: 3,
    total_students: 2,
    total_faculty: 3,
    total_courses: 3,
    total_materials: 6,
    total_assignments: 4,
    published_notices: 3,
    pending_leaves: 0,
    pending_submissions: 0,
    attendance_rate: 84,
  });

  const [todayClasses, setTodayClasses] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [notices, setNotices] = useState([]);

  const showToast = (message, type = "ok") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Real-time ticking clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const body = { faculty_id: faculty.id };
      const [overviewRes, todayRes, subsRes, noticesRes] = await Promise.all([
        axios.post(`${BASE_API}/overview`, body),
        axios.post(`${BASE_API}/today`, body),
        axios.post(`${BASE_API}/submissions`, { ...body, limit: 6 }),
        axios.post(`${BASE_API}/notices`, { ...body, limit: 5 }),
      ]);

      if (overviewRes?.data?.data) {
        setOverview(overviewRes.data.data);
      }
      setTodayClasses(todayRes?.data?.data || []);
      setSubmissions(subsRes?.data?.data || []);
      setNotices(noticesRes?.data?.data || []);
    } catch (err) {
      console.error("Failed to load faculty dashboard data:", err);
      showToast("Unable to fetch live telemetry. Showing cached state.", "err");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [faculty.id]);

  const formatClock = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTimeSlot = (startTime, endTime) => {
    if (!startTime) return "09:00 AM - 10:00 AM";
    const s = String(startTime).slice(0, 5);
    const e = endTime ? String(endTime).slice(0, 5) : "";
    return e ? `${s} - ${e}` : s;
  };

  return (
    <div className="fcd-pro-root">
      {/* Toast Alert */}
      {toast && (
        <div className={`fcd-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. HERO COMMAND BANNER (Identical to Admin Dashboard Theme in Screenshot) */}
      <section className="fcd-hero-banner">
        <div className="fcd-hero-left">
          <div className="fcd-live-chip">
            <span className="fcd-ping"></span>
            <span className="fcd-live-txt">FACULTY COMMAND CENTER • v3.4</span>
          </div>
          <h1 className="fcd-hero-title">
            Welcome back, {overview.faculty_name || faculty.name} 👋
          </h1>
          <p className="fcd-hero-sub">
            Live academic schedules, student attendance monitoring, assignment evaluation, and departmental telemetry.
          </p>
        </div>

        <div className="fcd-hero-right">
          {/* Live System Indicators */}
          <div className="fcd-status-strip">
            <span className="fcd-status-pill green">
              <span className="fcd-dot green"></span>
              API: ONLINE
            </span>
            <span className="fcd-status-pill blue">
              <span className="fcd-dot blue"></span>
              DB: PostgreSQL (Port 5433)
            </span>
            <span className="fcd-status-pill time">
              <FiClock size={13} />
              {formatClock(currentTime)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="fcd-actions-row">
            <button
              className="fcd-btn fcd-btn-secondary"
              onClick={fetchDashboardData}
              disabled={loading}
              title="Sync latest live database records"
            >
              <FiRefreshCw className={loading ? "fcd-spin" : ""} size={14} />
              <span>Sync Live Data</span>
            </button>

            <button
              className="fcd-btn fcd-btn-secondary"
              onClick={() => navigate("/faculty/notice")}
            >
              <FiBell size={14} />
              <span>Post Notice</span>
            </button>

            <button
              className="fcd-btn fcd-btn-primary"
              onClick={() => navigate("/faculty/Assignments")}
            >
              <FiPlus size={16} />
              <span>New Assignment</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. PRIMARY 4-CARD KPI METRICS GRID */}
      <section className="fcd-kpi-grid">
        {/* Card 1: Total Enrolled Students */}
        <div className="fcd-kpi-card" onClick={() => navigate("/faculty/Attendance")}>
          <div className="fcd-kpi-top">
            <div className="fcd-icon-box blue">
              <FiUsers size={20} />
            </div>
            <span className="fcd-badge green">+Live Active</span>
          </div>
          <div className="fcd-kpi-metric">{overview.total_students}</div>
          <h3 className="fcd-kpi-title">Total Enrolled Students</h3>
          <p className="fcd-kpi-sub">Active learners in academic roster</p>
          <div className="fcd-kpi-link">
            <span>Manage Student Directory</span>
            <FiChevronRight size={14} />
          </div>
        </div>

        {/* Card 2: Faculty & Department Peers */}
        <div className="fcd-kpi-card" onClick={() => navigate("/faculty/FacultyPro")}>
          <div className="fcd-kpi-top">
            <div className="fcd-icon-box purple">
              <FiUserCheck size={20} />
            </div>
            <span className="fcd-badge purple">Academic Staff</span>
          </div>
          <div className="fcd-kpi-metric">{overview.total_faculty}</div>
          <h3 className="fcd-kpi-title">Faculty & Professors</h3>
          <p className="fcd-kpi-sub">Teaching, department heads & staff</p>
          <div className="fcd-kpi-link">
            <span>View Faculty Profile</span>
            <FiChevronRight size={14} />
          </div>
        </div>

        {/* Card 3: Active Course Assignments */}
        <div className="fcd-kpi-card" onClick={() => navigate("/faculty/Assignments")}>
          <div className="fcd-kpi-top">
            <div className="fcd-icon-box cyan">
              <FiFileText size={20} />
            </div>
            <span className="fcd-badge cyan">Active Tasks</span>
          </div>
          <div className="fcd-kpi-metric">{overview.total_assignments}</div>
          <h3 className="fcd-kpi-title">Assignments & Labs</h3>
          <p className="fcd-kpi-sub">Practical problem sheets & evaluations</p>
          <div className="fcd-kpi-link">
            <span>Review Submissions</span>
            <FiChevronRight size={14} />
          </div>
        </div>

        {/* Card 4: Campus Attendance Average */}
        <div className="fcd-kpi-card" onClick={() => navigate("/faculty/Attendance")}>
          <div className="fcd-kpi-top">
            <div className="fcd-icon-box amber">
              <FiCheckSquare size={20} />
            </div>
            <span className="fcd-badge amber">Verified Rate</span>
          </div>
          <div className="fcd-kpi-metric">{overview.attendance_rate}%</div>
          <h3 className="fcd-kpi-title">Class Attendance Avg</h3>
          <p className="fcd-kpi-sub">Verified student lecture attendance</p>
          <div className="fcd-kpi-link">
            <span>Take Class Attendance</span>
            <FiChevronRight size={14} />
          </div>
        </div>
      </section>

      {/* 3. SECONDARY MINI-STATS ROW */}
      <section className="fcd-mini-grid">
        <div className="fcd-mini-card" onClick={() => navigate("/faculty/ViewCourses")}>
          <div className="fcd-mini-icon blue">
            <FiBookOpen size={16} />
          </div>
          <div className="fcd-mini-info">
            <span className="fcd-mini-val">{overview.total_courses}</span>
            <span className="fcd-mini-lbl">Active Degree Courses</span>
          </div>
        </div>

        <div className="fcd-mini-card" onClick={() => navigate("/faculty/UploadMaterial")}>
          <div className="fcd-mini-icon purple">
            <FiFolder size={16} />
          </div>
          <div className="fcd-mini-info">
            <span className="fcd-mini-val">{overview.total_materials}</span>
            <span className="fcd-mini-lbl">Study Repository Files</span>
          </div>
        </div>

        <div className="fcd-mini-card" onClick={() => navigate("/faculty/notice")}>
          <div className="fcd-mini-icon amber">
            <FiBell size={16} />
          </div>
          <div className="fcd-mini-info">
            <span className="fcd-mini-val">{overview.published_notices}</span>
            <span className="fcd-mini-lbl">Published Bulletins</span>
          </div>
        </div>

        <div className="fcd-mini-card" onClick={() => navigate("/faculty/LeaveRequest")}>
          <div className="fcd-mini-icon green">
            <FiCheckCircle size={16} />
          </div>
          <div className="fcd-mini-info">
            <span className="fcd-mini-val">{overview.pending_leaves} Pending</span>
            <span className="fcd-mini-lbl">Leave Applications</span>
          </div>
        </div>
      </section>

      {/* 4. ACADEMIC OPERATIONS HUB (Action Tiles) */}
      <section className="fcd-ops-hub">
        <div className="fcd-section-head">
          <div className="fcd-sec-title-wrap">
            <FiCompass className="fcd-sec-icon" />
            <h2 className="fcd-sec-title">Academic Operations Hub</h2>
          </div>
          <span className="fcd-sec-sub">1-Click quick navigation to all Faculty sub-systems</span>
        </div>

        <div className="fcd-tiles-grid">
          <button className="fcd-action-tile" onClick={() => navigate("/faculty/Attendance")}>
            <div className="fcd-tile-icon cyan">
              <FiCheckSquare size={20} />
            </div>
            <div className="fcd-tile-body">
              <h4>Mark Attendance</h4>
              <p>Daily lecture & lab attendance logging</p>
            </div>
            <FiChevronRight className="fcd-tile-arrow" />
          </button>

          <button className="fcd-action-tile" onClick={() => navigate("/faculty/Assignments")}>
            <div className="fcd-tile-icon purple">
              <FiFileText size={20} />
            </div>
            <div className="fcd-tile-body">
              <h4>Assignments & Labs</h4>
              <p>Post problem sheets & evaluate code</p>
            </div>
            <FiChevronRight className="fcd-tile-arrow" />
          </button>

          <button className="fcd-action-tile" onClick={() => navigate("/faculty/UploadMaterial")}>
            <div className="fcd-tile-icon blue">
              <FiUploadCloud size={20} />
            </div>
            <div className="fcd-tile-body">
              <h4>Study Material Vault</h4>
              <p>Upload lecture notes, PPT slides & manuals</p>
            </div>
            <FiChevronRight className="fcd-tile-arrow" />
          </button>

          <button className="fcd-action-tile" onClick={() => navigate("/faculty/FacultyViewTimetable")}>
            <div className="fcd-tile-icon amber">
              <FiCalendar size={20} />
            </div>
            <div className="fcd-tile-body">
              <h4>Academic Timetable</h4>
              <p>Weekly lecture slots & room allocation</p>
            </div>
            <FiChevronRight className="fcd-tile-arrow" />
          </button>

          <button className="fcd-action-tile" onClick={() => navigate("/faculty/MarksUpload")}>
            <div className="fcd-tile-icon green">
              <FiAward size={20} />
            </div>
            <div className="fcd-tile-body">
              <h4>Marks & Evaluation</h4>
              <p>Upload internal, practical & exam scores</p>
            </div>
            <FiChevronRight className="fcd-tile-arrow" />
          </button>

          <button className="fcd-action-tile" onClick={() => navigate("/faculty/LeaveRequest")}>
            <div className="fcd-tile-icon red">
              <FiSend size={20} />
            </div>
            <div className="fcd-tile-body">
              <h4>Leave Applications</h4>
              <p>Apply for casual, medical & academic leave</p>
            </div>
            <FiChevronRight className="fcd-tile-arrow" />
          </button>
        </div>
      </section>

      {/* 5. 2-COLUMN ACTIVITY & SCHEDULE DECK */}
      <section className="fcd-deck-grid">
        {/* Left Column: Today's Class Schedule */}
        <div className="fcd-deck-card">
          <div className="fcd-deck-head">
            <div className="fcd-deck-title-group">
              <FiCalendar className="text-cyan" />
              <h3>Today's Lecture Schedule</h3>
            </div>
            <span className="fcd-deck-counter">{todayClasses.length} Sessions</span>
          </div>

          <div className="fcd-deck-body">
            {loading ? (
              <div className="fcd-skel-list">
                <div className="fcd-skel-line" />
                <div className="fcd-skel-line" />
                <div className="fcd-skel-line" />
              </div>
            ) : todayClasses.length > 0 ? (
              <div className="fcd-schedule-list">
                {todayClasses.map((item, idx) => (
                  <div className="fcd-schedule-item" key={item.id || idx}>
                    <div className="fcd-time-box">
                      <FiClock size={13} />
                      <span>{formatTimeSlot(item.start_time, item.end_time)}</span>
                    </div>

                    <div className="fcd-sched-content">
                      <div className="fcd-sched-title-row">
                        <h4 className="fcd-sched-title">{item.subject || "Operating Systems"}</h4>
                        <span className="fcd-sched-badge">
                          {item.class_name || `B.Tech CSE - Sem ${item.semester || 4}`}
                        </span>
                      </div>
                      <div className="fcd-sched-meta">
                        <span>🚪 Room: {item.room || "Lab 402"}</span>
                        <span>•</span>
                        <span>📅 {item.day || "Today"}</span>
                      </div>
                    </div>

                    <button
                      className="fcd-btn fcd-btn-xs fcd-btn-secondary"
                      onClick={() => navigate("/faculty/Attendance")}
                    >
                      <span>Take Attendance</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="fcd-empty-box">
                <FiCalendar size={28} className="text-muted" />
                <p>No scheduled lectures found for today.</p>
                <button
                  className="fcd-btn fcd-btn-xs fcd-btn-secondary"
                  onClick={() => navigate("/faculty/FacultyViewTimetable")}
                >
                  View Full Timetable
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Submissions & Notices */}
        <div className="fcd-deck-card">
          <div className="fcd-deck-head">
            <div className="fcd-deck-title-group">
              <FiBell className="text-amber" />
              <h3>Recent Bulletins & Submissions</h3>
            </div>
            <button
              className="fcd-deck-link-btn"
              onClick={() => navigate("/faculty/notice")}
            >
              View Notices
            </button>
          </div>

          <div className="fcd-deck-body">
            {loading ? (
              <div className="fcd-skel-list">
                <div className="fcd-skel-line" />
                <div className="fcd-skel-line" />
              </div>
            ) : notices.length > 0 ? (
              <div className="fcd-notice-list">
                {notices.map((n, idx) => (
                  <div className="fcd-notice-item" key={n.notice_id || idx}>
                    <div className="fcd-notice-top">
                      <span className="fcd-notice-cat">
                        {n.category || "ACADEMIC CIRCULAR"}
                      </span>
                      <span className="fcd-notice-date">{formatDate(n.created_at)}</span>
                    </div>
                    <h4 className="fcd-notice-title">{n.title}</h4>
                    <p className="fcd-notice-snippet">{n.content || n.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="fcd-empty-box">
                <FiBell size={28} className="text-muted" />
                <p>No new academic bulletins available.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
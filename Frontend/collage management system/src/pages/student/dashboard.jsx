import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFileText,
  FiLayers,
  FiMessageSquare,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrendingUp,
  FiUser,
  FiAlertCircle,
  FiAward,
  FiCreditCard,
  FiCheck,
  FiExternalLink,
  FiShield
} from "react-icons/fi";
import "../../layout/student/dashboard.css";
import { getActiveStudentSession } from "../../utils/studentSession";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const student = useMemo(() => getActiveStudentSession(), []);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    attendancePct: 0,
    attendanceTotal: 0,
    pendingAssignments: 0,
    latestResult: "N/A",
    activeNotices: 0,
    feeStatus: "PAID",
    totalDue: 0,
  });

  const [todayClasses, setTodayClasses] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [filterType, setFilterType] = useState("ALL");

  const fetchStudentOverview = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch all core modules in parallel for logged in student
      const [ttRes, noticeRes, resultRes, attendRes, assignRes, submittedRes, feeRes] =
        await Promise.allSettled([
          axios.post(`${API_BASE}/Timetable/postTimetableData`, {
            course: student.course,
            semester: Number(student.sem),
            student_id: student.id,
          }),
          axios.post(`${API_BASE}/Notice/postNoticeData`, {}),
          axios.post(`${API_BASE}/Result/my`, { student_id: Number(student.id) }, { headers }),
          axios.post(`${API_BASE}/Attendance/postAttendanceData`, {
            student_id: Number(student.id),
            enrollment: student.enrollment,
          }),
          axios.post(`${API_BASE}/Assignment/postViewData`, {
            student_id: Number(student.id),
          }),
          axios.post(`${API_BASE}/Assignment/submitted-by-student`, {
            student_id: Number(student.id),
          }),
          axios.post(`${API_BASE}/Fees/postFeesData`, {
            student_id: Number(student.id),
            enrollment: student.enrollment,
          }),
        ]);

      const activities = [];

      // 1. Process Timetable (Today's Lecture Schedule)
      if (ttRes.status === "fulfilled") {
        const raw = ttRes.value.data?.data || ttRes.value.data?.message || ttRes.value.data || [];
        const dayMap = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        const todayDay = dayMap[new Date().getDay()];
        const todayRows = (Array.isArray(raw) ? raw : [])
          .filter((x) => String(x.day || "").toUpperCase() === (todayDay === "SUN" ? "MON" : todayDay))
          .map((x) => ({
            time: `${String(x.start_time || x.stime || "").slice(0, 5)} - ${String(x.end_time || x.etime || "").slice(0, 5)}`,
            subject: x.subject || x.sub_name || "Lecture",
            faculty: x.faculty_name || x.teacher || "Faculty",
            room: x.room || "Room 101",
            type: x.type || "LECTURE",
            meet_link: x.meet_link || "",
          }));
        setTodayClasses(todayRows);
      }

      // 2. Process Notices
      let noticeCount = 0;
      if (noticeRes.status === "fulfilled") {
        const raw = noticeRes.value.data?.data || noticeRes.value.data?.message || noticeRes.value.data || [];
        const rows = (Array.isArray(raw) ? raw : [])
          .filter((n) => String(n.status || "").toUpperCase() === "PUBLISHED")
          .slice(0, 4);
        setRecentNotices(rows);
        noticeCount = rows.length;

        rows.forEach((n, idx) => {
          activities.push({
            id: `not-${idx}`,
            type: "NOTICE",
            title: n.title || n.notice_title || "Official Announcement",
            time: `Published • ${n.category || "General"}`,
            status: "INFO",
            link: "/student/notices",
          });
        });
      }

      // 3. Process Results
      let resultText = "N/A";
      if (resultRes.status === "fulfilled") {
        const raw = resultRes.value.data?.data || resultRes.value.data?.rows || resultRes.value.data || [];
        const list = Array.isArray(raw) ? raw : [];
        if (list.length > 0) {
          const latest = list[0];
          const pct = Number(latest.percentage || 0);
          resultText = `${pct.toFixed(1)}% (Grade ${latest.grade || "A"})`;

          activities.push({
            id: "res-latest",
            type: "RESULT",
            title: `Scorecard Declared: ${latest.exam_name || "Semester Exam"}`,
            time: `Scored ${latest.obtained_marks}/${latest.total_marks} Marks (${pct.toFixed(1)}%)`,
            status: "COMPLETED",
            link: "/student/results",
          });
        }
      }

      // 4. Process Attendance
      let attendancePercentage = 0;
      let totalAttendanceRecords = 0;
      if (attendRes.status === "fulfilled") {
        const raw = attendRes.value.data?.data || attendRes.value.data?.rows || attendRes.value.data || [];
        const list = Array.isArray(raw) ? raw : [];
        totalAttendanceRecords = list.length;
        if (list.length > 0) {
          const presentCount = list.filter(
            (a) => String(a.status || "").toUpperCase() === "PRESENT" || String(a.status || "").toUpperCase() === "P"
          ).length;
          attendancePercentage = Math.round((presentCount / list.length) * 100);

          activities.push({
            id: "att-latest",
            type: "ATTENDANCE",
            title: `Biometric Attendance Logged: ${list[0]?.subject || "Lecture Session"}`,
            time: `Recorded as ${list[0]?.status || "Present"} (${attendancePercentage}% aggregate)`,
            status: "COMPLETED",
            link: "/student/ViewAttendance",
          });
        }
      }

      // 5. Process Assignments
      let pendingAssignCount = 0;
      if (assignRes.status === "fulfilled") {
        const allAssign = assignRes.value.data?.data || assignRes.value.data?.rows || assignRes.value.data || [];
        const allList = Array.isArray(allAssign) ? allAssign : [];

        let subList = [];
        if (submittedRes.status === "fulfilled") {
          const rawSub = submittedRes.value.data?.data || submittedRes.value.data?.rows || submittedRes.value.data || [];
          subList = Array.isArray(rawSub) ? rawSub : [];
        }

        const submittedIds = new Set(subList.map((s) => Number(s.assignment_id || s.id)));
        const pending = allList.filter((a) => !submittedIds.has(Number(a.assignment_id || a.id)));
        pendingAssignCount = pending.length;

        if (pending.length > 0) {
          activities.push({
            id: "ass-pending",
            type: "ASSIGNMENT",
            title: `Task Pending: ${pending[0]?.title || "Academic Assignment"}`,
            time: `Due by ${pending[0]?.due_date ? String(pending[0]?.due_date).slice(0, 10) : "End of Week"}`,
            status: "PENDING",
            link: "/student/assignment",
          });
        }
      }

      // 6. Process Fees
      let totalFeeDue = 0;
      let feeStatusStr = "PAID";
      if (feeRes.status === "fulfilled") {
        const rawFee = feeRes.value.data?.rows || feeRes.value.data?.data || feeRes.value.data || [];
        const feeList = Array.isArray(rawFee) ? rawFee : [];
        let totalInv = 0;
        let totalPaid = 0;
        feeList.forEach((f) => {
          totalInv += Number(f.total_amount || 0);
          totalPaid += Number(f.paid_amount || 0);
        });
        totalFeeDue = Math.max(0, totalInv - totalPaid);
        feeStatusStr = totalFeeDue === 0 ? "PAID" : totalPaid > 0 ? "PARTIAL" : "DUE";

        if (feeList.length > 0) {
          activities.push({
            id: "fee-stat",
            type: "FEES",
            title: `Fee Ledger: ${feeList[0]?.fee_type || "Semester Tuition"}`,
            time: totalFeeDue > 0 ? `Pending Balance: ₹${totalFeeDue.toLocaleString("en-IN")}` : "All academic dues settled",
            status: totalFeeDue > 0 ? "PENDING" : "COMPLETED",
            link: "/student/fees",
          });
        }
      }

      setStats({
        attendancePct: attendancePercentage,
        attendanceTotal: totalAttendanceRecords,
        pendingAssignments: pendingAssignCount,
        latestResult: resultText,
        activeNotices: noticeCount,
        feeStatus: feeStatusStr,
        totalDue: totalFeeDue,
      });

      setRecentActivities(activities);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentOverview();
  }, [student.id]);

  const filteredActivities = useMemo(() => {
    return recentActivities.filter((a) => {
      if (filterType === "ALL") return true;
      return a.type === filterType;
    });
  }, [recentActivities, filterType]);

  return (
    <div className="std-pro-root">
      {/* 1. HERO STUDENT COMMAND BANNER */}
      <section className="std-hero-banner">
        <div className="std-hero-left">
          <div className="std-live-chip">
            <span className="std-ping"></span>
            <span className="std-live-txt">ACADEMIC WORKSPACE • SEMESTER {student.sem} LIVE</span>
          </div>

          <h1 className="std-hero-title">Welcome back, {student.name}! 👋</h1>
          <p className="std-hero-sub">
            Enrolled in <b>{student.course}</b> (Semester {student.sem}) • Enrollment: <b>{student.enrollment}</b>
          </p>

          <div className="std-quick-tags">
            <span className="std-tag">🎓 Status: Regular Scholar</span>
            <span className="std-tag ok">🟢 Portal Active</span>
            <span className="std-tag">🏛 NavNext University</span>
          </div>
        </div>

        <div className="std-hero-actions">
          <button
            className="std-btn std-btn-secondary"
            onClick={fetchStudentOverview}
            disabled={loading}
            title="Refresh academic data"
          >
            <FiRefreshCw className={loading ? "std-spin" : ""} />
            <span>Sync</span>
          </button>

          <button
            className="std-btn std-btn-primary"
            onClick={() => navigate("/student/timetable")}
          >
            <FiCalendar />
            <span>My Timetable</span>
          </button>
        </div>
      </section>

      {/* 2. 4 DYNAMIC PERFORMANCE KPI CARDS */}
      <section className="std-kpi-grid">
        <div className="std-kpi-card" onClick={() => navigate("/student/ViewAttendance")}>
          <div className="std-kpi-header">
            <span className="std-kpi-label">Attendance Score</span>
            <div className={`std-kpi-icon-wrap ${stats.attendancePct >= 75 ? "success" : "warning"}`}>
              <FiCheckCircle size={18} />
            </div>
          </div>
          <div className={`std-kpi-val ${stats.attendancePct >= 75 ? "success" : "warning"}`}>
            {stats.attendancePct}%
          </div>
          <div className="std-kpi-meta">
            <span className="std-kpi-hint">
              {stats.attendancePct >= 75 ? "Above 75% mandatory criterion" : "Warning: Below 75% threshold"}
            </span>
          </div>
        </div>

        <div className="std-kpi-card" onClick={() => navigate("/student/assignment")}>
          <div className="std-kpi-header">
            <span className="std-kpi-label">Pending Tasks</span>
            <div className={`std-kpi-icon-wrap ${stats.pendingAssignments > 0 ? "warning" : "success"}`}>
              <FiFileText size={18} />
            </div>
          </div>
          <div className={`std-kpi-val ${stats.pendingAssignments > 0 ? "warning" : "success"}`}>
            {stats.pendingAssignments}
          </div>
          <div className="std-kpi-meta">
            <span className="std-kpi-hint">
              {stats.pendingAssignments > 0 ? "Assignments awaiting submission" : "All coursework submitted"}
            </span>
          </div>
        </div>

        <div className="std-kpi-card" onClick={() => navigate("/student/results")}>
          <div className="std-kpi-header">
            <span className="std-kpi-label">Latest Result</span>
            <div className="std-kpi-icon-wrap cyan">
              <FiAward size={18} />
            </div>
          </div>
          <div className="std-kpi-val cyan">{stats.latestResult}</div>
          <div className="std-kpi-meta">
            <span className="std-kpi-hint">Official semester evaluation</span>
          </div>
        </div>

        <div className="std-kpi-card" onClick={() => navigate("/student/notices")}>
          <div className="std-kpi-header">
            <span className="std-kpi-label">Active Notices</span>
            <div className="std-kpi-icon-wrap primary">
              <FiMessageSquare size={18} />
            </div>
          </div>
          <div className="std-kpi-val primary">{stats.activeNotices}</div>
          <div className="std-kpi-meta">
            <span className="std-kpi-hint">Institutional circulars</span>
          </div>
        </div>
      </section>

      {/* 3. MAIN DASHBOARD TWO-COLUMN WORKSPACE */}
      <div className="std-split-grid">
        {/* LEFT COLUMN: Today's Schedule & Academic Activity */}
        <div className="std-col-left">
          {/* Today's Schedule Card */}
          <div className="std-deck-card">
            <div className="std-card-head">
              <div className="std-card-title-box">
                <FiCalendar className="std-head-icon" />
                <div>
                  <h3>Today's Lecture Schedule</h3>
                  <p>Classes scheduled for your section today</p>
                </div>
              </div>
              <button
                className="std-btn std-btn-xs std-btn-secondary"
                onClick={() => navigate("/student/timetable")}
              >
                Full Week
              </button>
            </div>

            <div className="std-schedule-list">
              {todayClasses.length ? (
                todayClasses.map((cls, idx) => (
                  <div className="std-schedule-row" key={idx}>
                    <div className="std-time-badge">
                      <FiClock size={12} />
                      <span>{cls.time}</span>
                    </div>

                    <div className="std-class-info">
                      <h4>{cls.subject}</h4>
                      <span className="std-faculty-sub">{cls.faculty} • {cls.room}</span>
                    </div>

                    <div className="std-class-actions">
                      <span className={`std-type-pill ${cls.type.toLowerCase()}`}>{cls.type}</span>
                      {cls.meet_link && (
                        <a
                          href={cls.meet_link}
                          target="_blank"
                          rel="noreferrer"
                          className="std-meet-btn"
                          title="Join Live Lecture"
                        >
                          <FiExternalLink />
                          <span>Join</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="std-empty-strip">
                  <FiCheckCircle size={20} />
                  <span>No lectures scheduled for today or day off!</span>
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="std-deck-card">
            <div className="std-card-head">
              <div className="std-card-title-box">
                <FiTrendingUp className="std-head-icon" />
                <div>
                  <h3>Recent Academic Stream</h3>
                  <p>Submissions, notices, study materials & grade updates</p>
                </div>
              </div>

              <div className="std-activity-filter">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="std-mini-select"
                >
                  <option value="ALL">All Stream</option>
                  <option value="ASSIGNMENT">Assignments</option>
                  <option value="NOTICE">Notices</option>
                  <option value="RESULT">Results</option>
                  <option value="ATTENDANCE">Attendance</option>
                  <option value="FEES">Fees</option>
                </select>
              </div>
            </div>

            <div className="std-activity-list">
              {filteredActivities.length ? (
                filteredActivities.map((act) => (
                  <div
                    className="std-activity-item"
                    key={act.id}
                    onClick={() => navigate(act.link)}
                  >
                    <div className={`std-act-icon ${act.type.toLowerCase()}`}>
                      {act.type === "ASSIGNMENT" && <FiFileText size={16} />}
                      {act.type === "NOTICE" && <FiMessageSquare size={16} />}
                      {act.type === "ATTENDANCE" && <FiCheckCircle size={16} />}
                      {act.type === "RESULT" && <FiAward size={16} />}
                      {act.type === "FEES" && <FiCreditCard size={16} />}
                    </div>

                    <div className="std-act-content">
                      <h4>{act.title}</h4>
                      <span>{act.time}</span>
                    </div>

                    <div className="std-act-right">
                      <span className={`std-status-tag ${act.status.toLowerCase()}`}>
                        {act.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="std-empty-strip">
                  <span>No recent activity found.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Fast Action Hub & Recent Notices */}
        <div className="std-col-right">
          {/* Fast Navigation Quick Actions */}
          <div className="std-deck-card">
            <div className="std-card-head">
              <div className="std-card-title-box">
                <FiLayers className="std-head-icon" />
                <div>
                  <h3>Quick Action Center</h3>
                  <p>Direct shortcuts to your portals</p>
                </div>
              </div>
            </div>

            <div className="std-action-grid">
              <button className="std-action-tile" onClick={() => navigate("/student/assignment")}>
                <div className="std-tile-icon purple"><FiFileText size={20} /></div>
                <span>Assignments</span>
              </button>

              <button className="std-action-tile" onClick={() => navigate("/student/material")}>
                <div className="std-tile-icon blue"><FiBookOpen size={20} /></div>
                <span>Notes & PDFs</span>
              </button>

              <button className="std-action-tile" onClick={() => navigate("/student/results")}>
                <div className="std-tile-icon green"><FiAward size={20} /></div>
                <span>Scorecards</span>
              </button>

              <button className="std-action-tile" onClick={() => navigate("/student/fees")}>
                <div className="std-tile-icon gold"><FiCreditCard size={20} /></div>
                <span>Fee Payments</span>
              </button>

              <button className="std-action-tile" onClick={() => navigate("/student/leave")}>
                <div className="std-tile-icon cyan"><FiCalendar size={20} /></div>
                <span>Apply Leave</span>
              </button>

              <button className="std-action-tile" onClick={() => navigate("/student/profile")}>
                <div className="std-tile-icon red"><FiUser size={20} /></div>
                <span>Student ID</span>
              </button>
            </div>
          </div>

          {/* Bulletin / Notices Widget */}
          <div className="std-deck-card">
            <div className="std-card-head">
              <div className="std-card-title-box">
                <FiMessageSquare className="std-head-icon" />
                <div>
                  <h3>Campus Bulletin</h3>
                  <p>Recent notices & announcements</p>
                </div>
              </div>
              <button
                className="std-btn std-btn-xs std-btn-secondary"
                onClick={() => navigate("/student/notices")}
              >
                View All
              </button>
            </div>

            <div className="std-notices-mini-list">
              {recentNotices.length ? (
                recentNotices.map((n, idx) => (
                  <div
                    className="std-notice-mini-item"
                    key={idx}
                    onClick={() => navigate("/student/notices")}
                  >
                    <span className="std-bullet-dot" />
                    <div className="std-notice-mini-text">
                      <h5>{n.title || n.notice_title || "Notice Announcement"}</h5>
                      <span className="std-notice-mini-date">
                        {n.publish_at || n.created_at || "Recent"} • {n.category || "General"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="std-empty-strip">
                  <span>No unread circulars today.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
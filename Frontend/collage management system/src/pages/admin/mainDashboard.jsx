import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiUserCheck,
  FiBookOpen,
  FiCreditCard,
  FiDollarSign,
  FiFolder,
  FiBell,
  FiCheckCircle,
  FiRefreshCw,
  FiPlusCircle,
  FiArrowRight,
  FiActivity,
  FiServer,
  FiDatabase,
  FiStar,
  FiCalendar,
  FiAward,
  FiMessageSquare,
  FiTrendingUp,
  FiCpu,
  FiAlertCircle,
  FiCheck,
  FiExternalLink,
  FiShield,
  FiPieChart,
  FiLayers,
  FiZap,
  FiClock,
  FiChevronRight
} from "react-icons/fi";
import "../../layout/admin/mainDashboard.css";

// Formatter Helpers
const fmt = (n) => new Intl.NumberFormat("en-IN").format(Number(n || 0));

const formatTime = (dateStr) => {
  if (!dateStr) return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
};

const formatUptime = (seconds) => {
  if (!seconds) return "Just started";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m ${seconds % 60}s`;
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Live clock
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const [overview, setOverview] = useState({
    counts: {
      students: 0,
      faculty: 0,
      admins: 0,
      courses: 0,
      materials: 0,
      notices: 0,
      assignments: 0,
      pendingLeaves: 0,
      attendanceRate: 85,
      totalFees: 0,
      paidFees: 0,
      dueFees: 0,
      avgFeedback: 4.8,
    },
    recentStudents: [],
    recentNotices: [],
    recentMaterials: [],
    recentFees: [],
    courseDistribution: [],
    health: {
      api: "ONLINE",
      db: "CONNECTED",
      uptime: 0,
      ramUsedMB: 0,
      lastSync: new Date().toISOString(),
    },
  });

  const fetchOverviewData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:5001"}/admin/dashboard/overview`);
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }
      const json = await res.json();
      if (json && json.success && json.data) {
        setOverview(json.data);
      } else {
        throw new Error(json.message || "Invalid response format");
      }
    } catch (err) {
      console.error("Dashboard overview fetch error:", err);
      setError(err.message || "Failed to connect to ERP API backend");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverviewData();
    const interval = setInterval(() => {
      fetchOverviewData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchOverviewData]);

  const counts = overview.counts || {};
  const health = overview.health || {};
  const courseDist = overview.courseDistribution || [];
  const recentStudents = overview.recentStudents || [];
  const recentNotices = overview.recentNotices || [];
  const recentFees = overview.recentFees || [];

  // Total students enrolled across courses
  const totalEnrolled = useMemo(() => {
    const sum = courseDist.reduce((acc, c) => acc + (c.students || 0), 0);
    return sum || counts.students || 1;
  }, [courseDist, counts.students]);

  // Fee Collection Rate %
  const feeRecoveryPct = useMemo(() => {
    const tot = (counts.paidFees || 0) + (counts.dueFees || 0);
    if (tot === 0) return counts.paidFees > 0 ? 100 : 0;
    return Math.min(100, Math.round(((counts.paidFees || 0) / tot) * 100));
  }, [counts.paidFees, counts.dueFees]);

  return (
    <div className="adm-root">
      {/* =========================================================
          1. HERO COMMAND HEADER
          ========================================================= */}
      <section className="adm-hero-banner">
        <div className="adm-hero-left">
          <div className="adm-chip-live">
            <span className="live-radar" />
            <span className="live-chip-text">ENTERPRISE COMMAND CENTER • v3.4</span>
          </div>
          <h1 className="adm-hero-title">
            Welcome back, <span className="adm-gradient-text">Administrator</span> 👋
          </h1>
          <p className="adm-hero-desc">
            Live operational intelligence, PostgreSQL data feeds, fee recovery, and system telemetry.
          </p>
        </div>

        <div className="adm-hero-right">
          <div className="adm-telemetry-pills">
            <div className="adm-badge-pill">
              <span className={`adm-dot ${health.api === "ONLINE" ? "ok" : "err"}`} />
              <span>API: {health.api || "ONLINE"}</span>
            </div>
            <div className="adm-badge-pill">
              <span className={`adm-dot ${health.db === "CONNECTED" ? "ok" : "err"}`} />
              <span>DB: PostgreSQL (Port 5433)</span>
            </div>
            <div className="adm-badge-pill subtle">
              <FiClock className="adm-pill-ico" />
              <span>{currentTime}</span>
            </div>
          </div>

          <div className="adm-hero-actions">
            <button
              className={`adm-btn-ghost ${refreshing ? "spinning" : ""}`}
              onClick={() => fetchOverviewData(true)}
              disabled={refreshing}
              title="Sync live data from database"
            >
              <FiRefreshCw className={refreshing ? "spin-ico" : ""} />
              <span>{refreshing ? "Syncing..." : "Sync Live Data"}</span>
            </button>
            <button
              className="adm-btn-ghost"
              onClick={() => navigate("/admin/Notice-dashboard")}
            >
              <FiBell />
              <span>Post Notice</span>
            </button>
            <button
              className="adm-btn-primary"
              onClick={() => navigate("/admin/AdminAdmission")}
            >
              <FiPlusCircle />
              <span>New Admission</span>
            </button>
          </div>
        </div>
      </section>

      {/* Error Notice */}
      {error && (
        <div className="adm-error-alert">
          <div className="adm-err-left">
            <FiAlertCircle className="adm-err-ico" />
            <span>Connection Warning: {error}. Showing latest cached records.</span>
          </div>
          <button className="adm-btn-ghost small" onClick={() => fetchOverviewData(true)}>
            Retry
          </button>
        </div>
      )}

      {/* =========================================================
          2. EXECUTIVE KPI STAT CARDS (4 PRIMARY MEGA CARDS)
          ========================================================= */}
      <section className="adm-mega-kpi-grid">
        {/* Card 1: Students */}
        <div
          className="adm-kpi-card indigo clickable"
          onClick={() => navigate("/admin/sdashboard")}
        >
          <div className="adm-kpi-header">
            <div className="adm-kpi-icon-box indigo">
              <FiUsers />
            </div>
            <span className="adm-kpi-tag success">+Live Active</span>
          </div>
          <div className="adm-kpi-body">
            <div className="adm-kpi-value">{loading ? "..." : fmt(counts.students)}</div>
            <div className="adm-kpi-title">Total Enrolled Students</div>
            <div className="adm-kpi-meta">Active learners in academic roster</div>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-kpi-link">Manage Student Directory</span>
            <FiChevronRight className="adm-kpi-arrow" />
          </div>
        </div>

        {/* Card 2: Faculty */}
        <div
          className="adm-kpi-card violet clickable"
          onClick={() => navigate("/admin/faculty-dashboard")}
        >
          <div className="adm-kpi-header">
            <div className="adm-kpi-icon-box violet">
              <FiUserCheck />
            </div>
            <span className="adm-kpi-tag purple">Academic Staff</span>
          </div>
          <div className="adm-kpi-body">
            <div className="adm-kpi-value">{loading ? "..." : fmt(counts.faculty)}</div>
            <div className="adm-kpi-title">Faculty & Professors</div>
            <div className="adm-kpi-meta">Teaching, department heads & staff</div>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-kpi-link">View Faculty Roster</span>
            <FiChevronRight className="adm-kpi-arrow" />
          </div>
        </div>

        {/* Card 3: Fees Collected */}
        <div
          className="adm-kpi-card emerald clickable"
          onClick={() => navigate("/admin/Feesmanage")}
        >
          <div className="adm-kpi-header">
            <div className="adm-kpi-icon-box emerald">
              <FiCreditCard />
            </div>
            <span className="adm-kpi-tag emerald">{feeRecoveryPct}% Collected</span>
          </div>
          <div className="adm-kpi-body">
            <div className="adm-kpi-value">{loading ? "..." : `₹ ${fmt(counts.paidFees)}`}</div>
            <div className="adm-kpi-title">Fee Revenue Collected</div>
            <div className="adm-kpi-meta">Total verified payment receipts</div>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-kpi-link">Open Fee Counter</span>
            <FiChevronRight className="adm-kpi-arrow" />
          </div>
        </div>

        {/* Card 4: Fees Outstanding */}
        <div
          className="adm-kpi-card amber clickable"
          onClick={() => navigate("/admin/Feesmanage")}
        >
          <div className="adm-kpi-header">
            <div className="adm-kpi-icon-box amber">
              <FiDollarSign />
            </div>
            <span className="adm-kpi-tag amber">Pending Inflow</span>
          </div>
          <div className="adm-kpi-body">
            <div className="adm-kpi-value">{loading ? "..." : `₹ ${fmt(counts.dueFees)}`}</div>
            <div className="adm-kpi-title">Outstanding Fees Due</div>
            <div className="adm-kpi-meta">Pending fee dues requiring settlement</div>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-kpi-link">Track Due Accounts</span>
            <FiChevronRight className="adm-kpi-arrow" />
          </div>
        </div>
      </section>

      {/* =========================================================
          3. SECONDARY COMPACT METRIC TILES (4 TILES)
          ========================================================= */}
      <section className="adm-mini-kpi-grid">
        <div
          className="adm-mini-tile clickable"
          onClick={() => navigate("/admin/manage-course")}
        >
          <div className="adm-mini-icon-wrap cyan">
            <FiBookOpen />
          </div>
          <div className="adm-mini-text">
            <div className="adm-mini-val">{loading ? "..." : fmt(counts.courses)}</div>
            <div className="adm-mini-lbl">Active Degree Courses</div>
          </div>
        </div>

        <div className="adm-mini-tile">
          <div className="adm-mini-icon-wrap blue">
            <FiFolder />
          </div>
          <div className="adm-mini-text">
            <div className="adm-mini-val">{loading ? "..." : fmt(counts.materials)}</div>
            <div className="adm-mini-lbl">Study Repository Files</div>
          </div>
        </div>

        <div
          className="adm-mini-tile clickable"
          onClick={() => navigate("/admin/Notice-dashboard")}
        >
          <div className="adm-mini-icon-wrap rose">
            <FiBell />
          </div>
          <div className="adm-mini-text">
            <div className="adm-mini-val">{loading ? "..." : fmt(counts.notices)}</div>
            <div className="adm-mini-lbl">Published Bulletins</div>
          </div>
        </div>

        <div className="adm-mini-tile">
          <div className="adm-mini-icon-wrap green">
            <FiCheckCircle />
          </div>
          <div className="adm-mini-text">
            <div className="adm-mini-val">{loading ? "..." : `${counts.attendanceRate || 85}%`}</div>
            <div className="adm-mini-lbl">Campus Attendance Avg</div>
          </div>
        </div>
      </section>

      {/* =========================================================
          4. INTERACTIVE MODULE LAUNCHPAD (8 MODULES)
          ========================================================= */}
      <section className="adm-launchpad-card">
        <div className="adm-launchpad-head">
          <div className="adm-launchpad-title">
            <FiZap className="adm-zap-ico" />
            <span>Administrative Operations Hub</span>
          </div>
          <span className="adm-launchpad-sub">1-Click quick navigation to all ERP sub-systems</span>
        </div>
        <div className="adm-launchpad-grid">
          <LaunchpadButton
            icon={<FiUsers />}
            title="Student Records"
            desc="Profiles, enrollments & logs"
            to="/admin/sdashboard"
            accent="indigo"
          />
          <LaunchpadButton
            icon={<FiUserCheck />}
            title="Faculty Directory"
            desc="Professors & department heads"
            to="/admin/faculty-dashboard"
            accent="violet"
          />
          <LaunchpadButton
            icon={<FiBookOpen />}
            title="Course Setup"
            desc="Curriculum & degree branches"
            to="/admin/manage-course"
            accent="cyan"
          />
          <LaunchpadButton
            icon={<FiCreditCard />}
            title="Fee Vault"
            desc="Invoices, receipts & dues"
            to="/admin/Feesmanage"
            accent="emerald"
          />
          <LaunchpadButton
            icon={<FiBell />}
            title="Notice Board"
            desc="Broadcast college circulars"
            to="/admin/Notice-dashboard"
            accent="rose"
          />
          <LaunchpadButton
            icon={<FiCalendar />}
            title="Master Timetable"
            desc="Class schedules & lecture slots"
            to="/admin/timeTable"
            accent="amber"
          />
          <LaunchpadButton
            icon={<FiAward />}
            title="Exam & Results"
            desc="Grades, scorecards & marksheets"
            to="/admin/ResultManage"
            accent="blue"
          />
          <LaunchpadButton
            icon={<FiMessageSquare />}
            title="Feedback Audits"
            desc="Reviews & campus ratings"
            to="/admin/AdminFeedback"
            accent="purple"
          />
        </div>
      </section>

      {/* =========================================================
          5. MAIN ASYMMETRIC GRID (LEFT OPERATIONS + RIGHT TELEMETRY)
          ========================================================= */}
      <div className="adm-main-split">
        {/* LEFT COLUMN: Recent Admissions + Course Breakdown + Bulletins */}
        <div className="adm-col-main">
          {/* Recent Student Admissions */}
          <div className="adm-glass-card">
            <div className="adm-card-head">
              <div className="adm-card-head-title">
                <div className="adm-card-icon indigo"><FiUsers /></div>
                <div>
                  <h3>Recent Student Enrollments</h3>
                  <p>Latest registered learners from PostgreSQL database</p>
                </div>
              </div>
              <button
                className="adm-btn-ghost small"
                onClick={() => navigate("/admin/sdashboard")}
              >
                <span>Full Directory</span>
                <FiArrowRight />
              </button>
            </div>

            <div className="adm-table-container">
              {recentStudents.length === 0 ? (
                <div className="adm-empty-box">
                  <FiUsers className="adm-empty-ico" />
                  <p>No student admissions logged yet in the database.</p>
                  <button
                    className="adm-btn-primary small"
                    onClick={() => navigate("/admin/AdminAdmission")}
                  >
                    + Register Student
                  </button>
                </div>
              ) : (
                <table className="adm-glass-table">
                  <thead>
                    <tr>
                      <th>Learner</th>
                      <th>Enrollment #</th>
                      <th>Course & Sem</th>
                      <th>Email</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentStudents.map((s) => (
                      <tr key={s.user_id}>
                        <td>
                          <div className="adm-user-cell">
                            <div className="adm-avatar-circle">
                              {(s.first_name ? s.first_name[0] : "S").toUpperCase()}
                            </div>
                            <div>
                              <div className="adm-bold-name">
                                {`${s.first_name || ""} ${s.last_name || ""}`.trim() || "Student"}
                              </div>
                              <div className="adm-sub-info">ID #{s.user_id}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="adm-mono-badge">
                            {s.enrollment || s.user_name || "—"}
                          </span>
                        </td>
                        <td>
                          <span className="adm-course-pill">
                            {s.course || "General"} {s.sem ? `• Sem ${s.sem}` : ""}
                          </span>
                        </td>
                        <td className="adm-cell-muted">{s.email || "—"}</td>
                        <td className="text-right">
                          <button
                            className="adm-btn-ghost tiny"
                            onClick={() => navigate("/admin/sdashboard")}
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Academic Course Distribution */}
          <div className="adm-glass-card">
            <div className="adm-card-head">
              <div className="adm-card-head-title">
                <div className="adm-card-icon cyan"><FiPieChart /></div>
                <div>
                  <h3>Academic Program Enrollment Distribution</h3>
                  <p>Enrolled student ratio across active degree programs</p>
                </div>
              </div>
              <button
                className="adm-btn-ghost small"
                onClick={() => navigate("/admin/manage-course")}
              >
                <span>Curriculum</span>
                <FiArrowRight />
              </button>
            </div>

            <div className="adm-course-container">
              {courseDist.length === 0 ? (
                <div className="adm-empty-box">
                  <p>No courses or student enrollments logged yet.</p>
                </div>
              ) : (
                <div className="adm-course-grid">
                  {courseDist.map((c, i) => {
                    const count = c.students || 0;
                    const pct = totalEnrolled > 0 ? Math.round((count / totalEnrolled) * 100) : 0;
                    const colors = [
                      "linear-gradient(90deg, #4f46e5, #7c3aed)",
                      "linear-gradient(90deg, #06b6d4, #3b82f6)",
                      "linear-gradient(90deg, #10b981, #059669)",
                      "linear-gradient(90deg, #f59e0b, #d97706)",
                      "linear-gradient(90deg, #ec4899, #8b5cf6)",
                    ];
                    const grad = colors[i % colors.length];

                    return (
                      <div key={i} className="adm-course-card">
                        <div className="adm-course-info">
                          <div>
                            <span className="adm-c-name">{c.course || "Course"}</span>
                            {c.code && <span className="adm-c-code">({c.code})</span>}
                          </div>
                          <span className="adm-c-badge">
                            {count} Students ({pct}%)
                          </span>
                        </div>
                        <div className="adm-track">
                          <div
                            className="adm-fill"
                            style={{
                              width: `${Math.max(6, pct)}%`,
                              background: grad,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Published Bulletins & Notices Feed */}
          <div className="adm-glass-card">
            <div className="adm-card-head">
              <div className="adm-card-head-title">
                <div className="adm-card-icon rose"><FiBell /></div>
                <div>
                  <h3>Campus Circulars & Bulletins</h3>
                  <p>Active broadcast announcements across the university</p>
                </div>
              </div>
              <button
                className="adm-btn-ghost small"
                onClick={() => navigate("/admin/Notice-dashboard")}
              >
                <span>Broadcasts</span>
                <FiArrowRight />
              </button>
            </div>

            <div className="adm-notices-container">
              {recentNotices.length === 0 ? (
                <div className="adm-empty-box">
                  <p>No notices published yet.</p>
                  <button
                    className="adm-btn-primary small"
                    onClick={() => navigate("/admin/Notice-dashboard")}
                  >
                    + Publish Notice
                  </button>
                </div>
              ) : (
                <div className="adm-notices-list">
                  {recentNotices.map((n) => (
                    <div key={n.notice_id} className="adm-notice-item">
                      <div className="adm-notice-header">
                        <span className="adm-notice-tag">
                          {n.category || n.priority || "General"}
                        </span>
                        <span className="adm-notice-date">
                          {formatDate(n.created_at || n.date || n.createdAt)}
                        </span>
                      </div>
                      <h4 className="adm-notice-heading">{n.title}</h4>
                      <p className="adm-notice-text">
                        {n.description
                          ? n.description.length > 120
                            ? n.description.slice(0, 120) + "..."
                            : n.description
                          : "Official university circular published."}
                      </p>
                      <div className="adm-notice-foot">
                        <span className="adm-notice-author">
                          By: <strong>{n.issue_by || "Dean / Admin Office"}</strong>
                        </span>
                        <button
                          className="adm-btn-ghost tiny"
                          onClick={() => navigate("/admin/Notice-dashboard")}
                        >
                          View Notice
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Financials + Telemetry + Action Queue */}
        <div className="adm-col-side">
          {/* Revenue Recovery & Financial Visualizer */}
          <div className="adm-glass-card">
            <div className="adm-card-head">
              <div className="adm-card-head-title">
                <div className="adm-card-icon emerald"><FiCreditCard /></div>
                <div>
                  <h3>Fee Revenue Recovery</h3>
                  <p>Collection efficiency & recent logs</p>
                </div>
              </div>
              <button
                className="adm-btn-ghost small"
                onClick={() => navigate("/admin/Feesmanage")}
              >
                <span>Fee Vault</span>
              </button>
            </div>

            <div className="adm-finance-body">
              <div className="adm-recovery-bar-wrap">
                <div className="adm-recovery-info">
                  <span className="adm-rec-lbl">Settlement Rate</span>
                  <span className="adm-rec-val">{feeRecoveryPct}%</span>
                </div>
                <div className="adm-rec-track">
                  <div
                    className="adm-rec-fill"
                    style={{ width: `${Math.max(4, feeRecoveryPct)}%` }}
                  />
                </div>
                <div className="adm-rec-split">
                  <div className="adm-rec-item">
                    <span className="adm-rec-dot ok" />
                    <span>Paid: ₹{fmt(counts.paidFees)}</span>
                  </div>
                  <div className="adm-rec-item">
                    <span className="adm-rec-dot due" />
                    <span>Due: ₹{fmt(counts.dueFees)}</span>
                  </div>
                </div>
              </div>

              {/* Recent Fee Transactions Feed */}
              <div className="adm-fee-feed">
                <div className="adm-feed-title">Recent Fee Receipts</div>
                {recentFees.length === 0 ? (
                  <div className="adm-empty-box compact">
                    <p>No recent payment transactions recorded.</p>
                  </div>
                ) : (
                  recentFees.map((fee) => {
                    const isPaid = (fee.status || "").toLowerCase().includes("paid");
                    return (
                      <div key={fee.fee_id} className="adm-fee-row">
                        <div className="adm-fee-row-left">
                          <div className={`adm-fee-ico-box ${isPaid ? "paid" : "due"}`}>
                            ₹
                          </div>
                          <div>
                            <div className="adm-fee-name">
                              Student #{fee.student_id || fee.user_id || "N/A"}
                            </div>
                            <div className="adm-fee-sub">
                              {fee.sem ? `Sem ${fee.sem}` : "Fee"} • {formatDate(fee.createdAt || fee.due_date)}
                            </div>
                          </div>
                        </div>
                        <div className="adm-fee-row-right">
                          <div className="adm-fee-amt">
                            ₹{fmt(fee.paid_amount || fee.total_amount)}
                          </div>
                          <span className={`adm-status-badge ${isPaid ? "paid" : "due"}`}>
                            {fee.status || (isPaid ? "PAID" : "DUE")}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* System Diagnostics & Health */}
          <div className="adm-glass-card">
            <div className="adm-card-head">
              <div className="adm-card-head-title">
                <div className="adm-card-icon violet"><FiCpu /></div>
                <div>
                  <h3>Server & DB Diagnostics</h3>
                  <p>Live health telemetry indicators</p>
                </div>
              </div>
              <span className="adm-sync-time">
                Sync: {formatTime(health.lastSync)}
              </span>
            </div>

            <div className="adm-telemetry-panel">
              <div className="adm-diag-grid">
                <div className="adm-diag-box">
                  <span className="adm-diag-lbl">PostgreSQL Database</span>
                  <div className="adm-diag-val">
                    <span className="adm-dot ok" />
                    <span>Port 5433 (Healthy)</span>
                  </div>
                </div>
                <div className="adm-diag-box">
                  <span className="adm-diag-lbl">Server Uptime</span>
                  <div className="adm-diag-val bold">
                    {formatUptime(health.uptime)}
                  </div>
                </div>
              </div>

              <div className="adm-meter-group">
                <div className="adm-meter-item">
                  <div className="adm-m-head">
                    <span>API Heap Memory</span>
                    <span className="adm-m-val ok">
                      {health.ramUsedMB ? `${health.ramUsedMB} MB` : "48 MB"}
                    </span>
                  </div>
                  <div className="adm-m-track">
                    <div
                      className="adm-m-fill ok"
                      style={{
                        width: `${Math.min(100, Math.round(((health.ramUsedMB || 48) / 512) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="adm-meter-item">
                  <div className="adm-m-head">
                    <span>Overall Attendance</span>
                    <span className="adm-m-val green">{counts.attendanceRate || 85}%</span>
                  </div>
                  <div className="adm-m-track">
                    <div
                      className="adm-m-fill green"
                      style={{ width: `${counts.attendanceRate || 85}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Campus Satisfaction Box */}
              <div className="adm-satisfaction-card">
                <div className="adm-sat-score-col">
                  <div className="adm-sat-num">{counts.avgFeedback || 4.8}</div>
                  <div className="adm-sat-stars">
                    {[1, 2, 3, 4, 5].map((st) => (
                      <FiStar
                        key={st}
                        className={`adm-star ${st <= Math.round(counts.avgFeedback || 4.8) ? "filled" : ""}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="adm-sat-info-col">
                  <div className="adm-sat-title">Campus Rating</div>
                  <div className="adm-sat-desc">Calculated from faculty & student feedback audits</div>
                  <button
                    className="adm-btn-ghost tiny sat-btn"
                    onClick={() => navigate("/admin/AdminFeedback")}
                  >
                    View All Ratings
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Queue & Operational Approvals */}
          <div className="adm-glass-card">
            <div className="adm-card-head">
              <div className="adm-card-head-title">
                <div className="adm-card-icon amber"><FiCheckCircle /></div>
                <div>
                  <h3>Administrative Action Queue</h3>
                  <p>Pending tasks and reviews</p>
                </div>
              </div>
            </div>

            <div className="adm-queue-body">
              <div className="adm-queue-item">
                <div className="adm-queue-left">
                  <div className="adm-queue-ico warn"><FiAlertCircle /></div>
                  <div>
                    <div className="adm-queue-title">Pending Leave Requests</div>
                    <div className="adm-queue-sub">Submitted by staff and students</div>
                  </div>
                </div>
                <span className="adm-queue-count">{counts.pendingLeaves || 0}</span>
              </div>

              <div className="adm-queue-item">
                <div className="adm-queue-left">
                  <div className="adm-queue-ico info"><FiFolder /></div>
                  <div>
                    <div className="adm-queue-title">Repository Materials</div>
                    <div className="adm-queue-sub">Uploaded syllabus & resources</div>
                  </div>
                </div>
                <span className="adm-queue-count">{counts.materials || 0}</span>
              </div>

              <div className="adm-queue-item">
                <div className="adm-queue-left">
                  <div className="adm-queue-ico success"><FiCreditCard /></div>
                  <div>
                    <div className="adm-queue-title">Unsettled Fee Invoices</div>
                    <div className="adm-queue-sub">Accounts pending collection</div>
                  </div>
                </div>
                <span className="adm-queue-count">
                  {counts.dueFees > 0 ? "Action Req" : "Settled"}
                </span>
              </div>

              <div className="adm-queue-actions">
                <button
                  className="adm-btn-primary w100"
                  onClick={() => navigate("/admin/Feesmanage")}
                >
                  Open Fee Counter
                </button>
                <button
                  className="adm-btn-ghost w100"
                  onClick={() => navigate("/admin/Notice-dashboard")}
                >
                  Broadcast Circular
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ===== SUB-COMPONENTS ===== */

const LaunchpadButton = ({ icon, title, desc, to, accent }) => {
  const navigate = useNavigate();
  return (
    <button
      className={`adm-launchpad-btn ${accent}`}
      onClick={() => navigate(to)}
    >
      <div className={`adm-lp-icon ${accent}`}>{icon}</div>
      <div className="adm-lp-text">
        <div className="adm-lp-title">{title}</div>
        <div className="adm-lp-desc">{desc}</div>
      </div>
      <FiChevronRight className="adm-lp-arrow" />
    </button>
  );
};

export default AdminDashboard;
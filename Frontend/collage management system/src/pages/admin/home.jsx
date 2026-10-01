import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import "../../layout/admin/home.css";

function Home() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("student");

  const portals = [
    {
      key: "student",
      roleName: "Student",
      title: "Student Portal",
      tagline: "Academic Hub & Learning Desk",
      badge: "Student Hub",
      badgeColor: "#38bdf8",
      accentGradient: "linear-gradient(135deg, #0284c7, #38bdf8)",
      icon: "🎓",
      desc: "Track daily lecture attendance, view weekly timetables, download study notes, check semester exam results, and manage fee invoices.",
      route: "/student-login",
      registerRoute: "/student-register",
      highlights: [
        { label: "Attendance Tracking", icon: "📊" },
        { label: "Weekly Timetable", icon: "📅" },
        { label: "Results & Gradebook", icon: "🏆" },
        { label: "Materials & Notes", icon: "📚" },
        { label: "Fee Receipts", icon: "💳" },
        { label: "Leave Requests", icon: "📝" },
      ],
    },
    {
      key: "faculty",
      roleName: "Faculty",
      title: "Faculty Portal",
      tagline: "Classroom & Teaching Management",
      badge: "Staff Pro",
      badgeColor: "#a855f7",
      accentGradient: "linear-gradient(135deg, #7c3aed, #c084fc)",
      icon: "👨‍🏫",
      desc: "Mark live student attendance, upload lecture materials and assignments, enter internal/exam marks, and submit leave requests.",
      route: "/faculty-login",
      highlights: [
        { label: "Attendance Marker", icon: "📋" },
        { label: "Upload Materials", icon: "📤" },
        { label: "Publish Marks", icon: "⭐" },
        { label: "Class Timetable", icon: "⏱️" },
        { label: "Assignments Desk", icon: "📂" },
        { label: "Staff Leave App", icon: "🏖️" },
      ],
    },
    {
      key: "admin",
      roleName: "Admin",
      title: "Admin Console",
      tagline: "Master Institute Control Center",
      badge: "Root Secure",
      badgeColor: "#f59e0b",
      accentGradient: "linear-gradient(135deg, #d97706, #fbbf24)",
      icon: "🛡️",
      desc: "Institute administration, new student admissions, faculty allocations, course creation, master timetables, and financial fee ledgers.",
      route: "/admin-login",
      highlights: [
        { label: "Student & Staff Directory", icon: "👥" },
        { label: "Course & Subjects", icon: "📖" },
        { label: "Master Timetable", icon: "🗺️" },
        { label: "Fee Accounting", icon: "💰" },
        { label: "Admission Approvals", icon: "✅" },
        { label: "Notice Broadcasting", icon: "📢" },
      ],
    },
  ];

  const currentPortal = portals.find((p) => p.key === activeTab) || portals[0];

  const coreModules = [
    {
      icon: "📅",
      title: "Dynamic Timetable Engine",
      desc: "Automated schedules, room allocation, faculty timings, and semester mappings with instant updates.",
      tag: "Academic",
    },
    {
      icon: "📋",
      title: "Real-time Attendance",
      desc: "Daily lecture presence tracking, 75% threshold alerts, and instant leave approval workflows.",
      tag: "Operations",
    },
    {
      icon: "📚",
      title: "Digital Study Material",
      desc: "Centralized repository for syllabus, lecture slides, reference PDFs, and assignment submissions.",
      tag: "Learning",
    },
    {
      icon: "💳",
      title: "Fee Ledger & Invoicing",
      desc: "Automated fee receipts, online transaction records, dues breakdown, and transparent ledgers.",
      tag: "Finance",
    },
    {
      icon: "🏆",
      title: "Gradebook & Result System",
      desc: "Effortless marks upload for faculty and semester-wise GPA/CGPA transcripts for students.",
      tag: "Assessment",
    },
    {
      icon: "📢",
      title: "Digital Notice Board",
      desc: "Instant campus circulars, exam schedule notifications, urgent alerts, and event news.",
      tag: "Broadcast",
    },
  ];

  return (
    <div className="homepage">
      {/* Ambient Lighting Background */}
      <div className="bgFX" aria-hidden="true">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
        <span className="grid" />
        <span className="noise" />
      </div>

      {/* Top Navbar */}
      <header className="header">
        <div
          className="brand"
          onClick={() => navigate("/home")}
          role="button"
          tabIndex={0}
        >
          <div className="logoMark" aria-hidden="true">
            <span className="logoDot" />
          </div>
          <div className="brandText">
            <div className="logo">
              Nav<span>Next</span>
            </div>
            <div className="tag">Campus ERP & Academic System</div>
          </div>
        </div>

        {/* Center Quick Role Switchers */}
        <div className="navCenterTabs">
          {portals.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`navTabBtn ${activeTab === p.key ? "active" : ""}`}
              onClick={() => setActiveTab(p.key)}
            >
              <span>{p.icon}</span>
              <span>{p.roleName}</span>
            </button>
          ))}
        </div>

        {/* Right Navigation Actions */}
        <nav className="nav">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            type="button"
          >
            <span>{isDark ? "☀️" : "🌙"}</span>
            <span>{isDark ? "Light" : "Dark"}</span>
          </button>
          <button
            className="ghostBtn"
            onClick={() => navigate(currentPortal.route)}
            type="button"
          >
            Sign In
          </button>
          <button
            className="primaryBtn"
            onClick={() => navigate("/student-register")}
            type="button"
          >
            <span>Register Now</span>
            <span className="btnArrow">→</span>
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="main">
        {/* HERO SECTION */}
        <section className="heroSection">
          <div className="heroIntro">
            <div className="pill">
              <span className="pillDot" />
              <span>✨ 2026 Next-Gen Academic Cloud Platform</span>
            </div>

            <h1 className="heroTitle">
              Empower Your Campus with <span className="gradText">NavNext</span>
            </h1>

            <p className="heroSubtitle">
              A unified, beautifully crafted digital ecosystem for Students, Faculty, and
              Administrators. Manage attendance, dynamic timetables, study materials,
              grading, and fee ledgers with strict role-based data isolation.
            </p>
          </div>

          {/* 3 PORTAL CARDS - HORIZONTAL BALANCED GRID */}
          <div className="portalsBentoGrid">
            {portals.map((p) => {
              const isActive = activeTab === p.key;
              return (
                <div
                  key={p.key}
                  className={`portalBentoCard ${isActive ? "highlighted" : ""}`}
                  onClick={() => setActiveTab(p.key)}
                >
                  <div className="cardTop">
                    <div
                      className="portalIconCircle"
                      style={{ background: `${p.badgeColor}18`, borderColor: `${p.badgeColor}40` }}
                    >
                      <span className="pIcon">{p.icon}</span>
                    </div>
                    <span
                      className="roleBadgePill"
                      style={{
                        borderColor: `${p.badgeColor}40`,
                        color: p.badgeColor,
                        background: `${p.badgeColor}14`,
                      }}
                    >
                      {p.badge}
                    </span>
                  </div>

                  <h2 className="pTitle">{p.title}</h2>
                  <p className="pTagline">{p.tagline}</p>
                  <p className="pDesc">{p.desc}</p>

                  <div className="pFeatList">
                    {p.highlights.slice(0, 4).map((h, idx) => (
                      <div key={idx} className="pFeatItem">
                        <span className="pFeatIcon">{h.icon}</span>
                        <span>{h.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="cardBottomActions">
                    <button
                      type="button"
                      className="portalLoginBtn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(p.route);
                      }}
                    >
                      <span>Launch {p.roleName} Portal</span>
                      <span className="pArrow">→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CORE MODULES SECTION */}
        <section className="modulesSection">
          <div className="sectionHeader">
            <div className="pill">
              <span className="pillDot" />
              <span>Full-Spectrum Capabilities</span>
            </div>
            <h2 className="sectionTitle">Everything You Need to Run Your Campus</h2>
            <p className="sectionSubtitle">
              Modular architecture built with high performance, role-based privacy, and
              instant cloud synchronization.
            </p>
          </div>

          <div className="modulesGrid">
            {coreModules.map((m, index) => (
              <div key={index} className="moduleCard">
                <div className="moduleCardTop">
                  <div className="moduleIcon">{m.icon}</div>
                  <span className="moduleTag">{m.tag}</span>
                </div>
                <h3 className="moduleTitle">{m.title}</h3>
                <p className="moduleDesc">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TRUST / METRICS STRIP */}
        <section className="metricsStrip">
          <div className="metricItem">
            <div className="metricVal">100%</div>
            <div className="metricLbl">Role Data Isolation</div>
          </div>
          <div className="metricDivider" />
          <div className="metricItem">
            <div className="metricVal">3</div>
            <div className="metricLbl">Independent Portals</div>
          </div>
          <div className="metricDivider" />
          <div className="metricItem">
            <div className="metricVal">&lt;100ms</div>
            <div className="metricLbl">Lightning Navigation</div>
          </div>
          <div className="metricDivider" />
          <div className="metricItem">
            <div className="metricVal">24/7</div>
            <div className="metricLbl">Cloud Availability</div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footContainer">
          <div className="footLeft">
            <div className="footBrand">
              <div className="logoMark small" aria-hidden="true">
                <span className="logoDot small" />
              </div>
              <span>NavNext Campus ERP</span>
            </div>
            <div className="footSub">
              © {new Date().getFullYear()} NavNext College Management System. All rights reserved.
            </div>
          </div>

          <div className="footLinks">
            <span className="footStatus">
              <span className="statusDot" />
              All Systems Operational
            </span>
            <button className="footLinkBtn" onClick={() => navigate("/student-register")}>
              Registration
            </button>
            <button className="footLinkBtn" onClick={() => navigate("/student-login")}>
              Student Login
            </button>
            <button className="footLinkBtn" onClick={() => navigate("/faculty-login")}>
              Faculty Login
            </button>
            <button className="footLinkBtn" onClick={() => navigate("/admin-login")}>
              Admin Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
import React, { useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import "../admin/Sidebar.css";

function StudentSidebar({ mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menu = [
    { to: "/student/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/student/profile", label: "My Profile", icon: "👨‍🎓" },
    { to: "/student/timetable", label: "Timetable", icon: "📅" },
    { to: "/student/notices", label: "Notice Board", icon: "📢" },
    { to: "/student/ViewCourse", label: "My Courses", icon: "📚" },
    { to: "/student/fees", label: "Fee Status", icon: "💳" },
    { to: "/student/results", label: "Exam Results", icon: "🧾" },
    { to: "/student/ViewAttendance", label: "Attendance", icon: "✅" },
    { to: "/student/assignment", label: "Assignments", icon: "📑" },
    { to: "/student/material", label: "Study Material", icon: "📁" },
    { to: "/student/leave", label: "Apply Leave", icon: "📝" },
    { to: "/student/Summary", label: "Summary Report", icon: "📈" },
    { to: "/student/feedback", label: "Feedback", icon: "💬" },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/student-login");
  };

  useEffect(() => {
    if (setMobileOpen) setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  return (
    <>
      <div
        className={`sidebar-overlay ${mobileOpen ? "show" : ""}`}
        onClick={() => setMobileOpen && setMobileOpen(false)}
      />

      <aside className={`unified-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-brand-box">
          <div
            className="brand-logo-icon"
            style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
          >
            S
          </div>
          <div className="brand-text">
            <h2>NavNext</h2>
            <span>Student Portal</span>
          </div>
          {setMobileOpen && (
            <button
              className="sidebar-close-btn"
              onClick={() => setMobileOpen(false)}
              type="button"
            >
              ✕
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">STUDENT NAVIGATION</div>
          <ul>
            {menu.map((item) => (
              <li key={item.label}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `nav-link-item ${isActive ? "active-link" : ""}`
                  }
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  <span className="nav-item-text">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={handleLogout} type="button">
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default StudentSidebar;
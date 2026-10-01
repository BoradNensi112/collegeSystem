import React, { useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import "../admin/Sidebar.css";

function FacultySidebar({ mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/faculty/dashboard", icon: "📊" },
    { name: "My Profile", path: "/faculty/FacultyPro", icon: "👨‍🏫" },
    { name: "Attendance", path: "/faculty/Attendance", icon: "✅" },
    { name: "Upload Marks", path: "/faculty/MarksUpload", icon: "📝" },
    { name: "Assignments", path: "/faculty/Assignments", icon: "📑" },
    { name: "Study Material", path: "/faculty/UploadMaterial", icon: "📁" },
    { name: "Timetable", path: "/faculty/FacultyViewTimetable", icon: "📅" },
    { name: "Courses", path: "/faculty/ViewCourses", icon: "📚" },
    { name: "Notices", path: "/faculty/notice", icon: "📢" },
    { name: "Leave Requests", path: "/faculty/LeaveRequest", icon: "📋" },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/faculty-login");
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
          <div className="brand-logo-icon" style={{ background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)" }}>
            F
          </div>
          <div className="brand-text">
            <h2>NavNext</h2>
            <span>Faculty Portal</span>
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
          <div className="nav-section-label">FACULTY NAVIGATION</div>
          <ul>
            {menuItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link-item ${isActive ? "active-link" : ""}`
                  }
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  <span className="nav-item-text">{item.name}</span>
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

export default FacultySidebar;

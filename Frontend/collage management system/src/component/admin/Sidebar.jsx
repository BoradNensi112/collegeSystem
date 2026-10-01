import React, { useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: "📊" },
    { name: "Manage Students", path: "/admin/sdashboard", icon: "👨‍🎓" },
    { name: "Manage Faculty", path: "/admin/faculty-dashboard", icon: "👨‍🏫" },
    { name: "Manage Course", path: "/admin/manage-course", icon: "📚" },
    { name: "Admissions", path: "/admin/AdminAdmission", icon: "📝" },
    { name: "Notices", path: "/admin/Notice-dashboard", icon: "📢" },
    { name: "Fees Manage", path: "/admin/Feesmanage", icon: "💳" },
    { name: "Timetable", path: "/admin/timeTable", icon: "📅" },
    { name: "Result Manage", path: "/admin/ResultManage", icon: "🧾" },
    { name: "Feedback", path: "/admin/AdminFeedback", icon: "💬" },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin-login");
  };

  useEffect(() => {
    if (setMobileOpen) setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  return (
    <>
      {/* Overlay for mobile drawer */}
      <div
        className={`sidebar-overlay ${mobileOpen ? "show" : ""}`}
        onClick={() => setMobileOpen && setMobileOpen(false)}
      />

      <aside className={`unified-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-brand-box">
          <div className="brand-logo-icon">N</div>
          <div className="brand-text">
            <h2>NavNext</h2>
            <span>Admin ERP</span>
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

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">MAIN NAVIGATION</div>
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

        {/* Footer Logout */}
        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={handleLogout} type="button">
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
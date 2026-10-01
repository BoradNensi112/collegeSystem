import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { getActiveStudentSession } from "../../utils/studentSession";
import { getActiveFacultySession } from "../../utils/facultySession";

export default function Topbar({ portalTitle = "ERP Portal", subtitle = "NavNext College Management", onToggleSidebar }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const roleStored = (localStorage.getItem("role") || user.user_type || "").toLowerCase();

  // Compute Display Name and Role Tag based on Workspace
  let displayName = "Account";
  let roleTag = "User";

  if (portalTitle.includes("Student")) {
    const student = getActiveStudentSession();
    if (roleStored === "student" || user.user_type === "student") {
      displayName = student.name || `${student.first_name} ${student.last_name || ""}`.trim();
      roleTag = "STUDENT";
    } else {
      displayName = student.name || `${student.first_name} ${student.last_name || ""}`.trim();
      roleTag = "STUDENT (DEMO)";
    }
  } else if (portalTitle.includes("Faculty")) {
    const faculty = getActiveFacultySession();
    if (roleStored === "faculty" || user.user_type === "faculty") {
      displayName = faculty.name || `Prof. ${faculty.first_name} ${faculty.last_name || ""}`.trim();
      roleTag = "FACULTY";
    } else {
      displayName = faculty.name || `Prof. ${faculty.first_name} ${faculty.last_name || ""}`.trim();
      roleTag = "FACULTY (DEMO)";
    }
  } else {
    displayName = user.first_name
      ? `${user.first_name} ${user.last_name || ""}`.trim()
      : user.user_name || "Admin User";
    roleTag = (user.user_type || roleStored || "ADMIN").toUpperCase();
  }

  const initial = displayName ? displayName.charAt(0).toUpperCase() : "U";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("student");
    localStorage.removeItem("faculty");
    localStorage.removeItem("student_id");
    localStorage.removeItem("faculty_id");
    localStorage.removeItem("role");

    if (portalTitle.includes("Student")) navigate("/student-login");
    else if (portalTitle.includes("Faculty")) navigate("/faculty-login");
    else navigate("/admin-login");
  };

  return (
    <header className="unified-topbar">
      <div className="topbar-left">
        {onToggleSidebar && (
          <button
            className="topbar-mobile-toggle"
            onClick={onToggleSidebar}
            title="Toggle Menu"
            type="button"
          >
            ☰
          </button>
        )}
        <div className="topbar-title-block">
          <h2>{portalTitle}</h2>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="topbar-right">
        {/* Light / Dark Mode Toggle */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          type="button"
        >
          <span className="theme-toggle-icon">{isDark ? "☀️" : "🌙"}</span>
          <span className="theme-toggle-label">{isDark ? "Light" : "Dark"}</span>
        </button>

        {/* User Pill */}
        <div className="user-pill">
          <div className="user-avatar">{initial}</div>
          <div className="user-meta">
            <span className="name">{displayName}</span>
            <span className="role-tag">{roleTag}</span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          className="topbar-logout-btn"
          onClick={handleLogout}
          title="Sign out of account"
          type="button"
        >
          <span className="logout-text">Logout</span>
          <span className="logout-icon">➔</span>
        </button>
      </div>
    </header>
  );
}

import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import FacultySidebar from "../../component/faculty/FacultySidebar";
import Topbar from "../../component/common/Topbar";
import { getActiveFacultySession, setActiveFacultySession, KNOWN_FACULTY } from "../../utils/facultySession";
import { FiUserCheck, FiAlertTriangle, FiArrowRight, FiUsers } from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export default function FacultyLayout() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [facultyList, setFacultyList] = useState(KNOWN_FACULTY);
  const [activeFaculty, setActiveFaculty] = useState(getActiveFacultySession());

  // Check if currently logged-in account in token is Admin or Student
  const authUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const authRole = (localStorage.getItem("role") || authUser.user_type || "").toLowerCase();
  const isAdminOrStudent =
    authRole === "admin" ||
    authRole === "student" ||
    (authUser.user_type && authUser.user_type.toLowerCase() !== "faculty");

  // Fetch all faculty from DB for quick preview dropdown if Admin/Student
  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const res = await fetch(`${API_BASE}/ManageStaff/postStaffData`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (res.ok) {
          const json = await res.json();
          const list = json?.data || json?.message || [];
          if (Array.isArray(list) && list.length > 0) {
            setFacultyList(list);
          }
        }
      } catch {
        // ignore
      }
    };

    fetchFaculty();
  }, []);

  // Sync profile if logged in as a real faculty
  useEffect(() => {
    const syncFacultyProfile = async () => {
      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("authToken") ||
          "";
        if (!token) return;

        // Only sync /Profile/my if the logged-in token belongs to a faculty
        if (!isAdminOrStudent) {
          const res = await fetch(`${API_BASE}/Profile/my`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({}),
          });

          if (res.ok) {
            const json = await res.json();
            if (json?.data && json.data.user_type === "faculty") {
              const data = json.data;
              setActiveFacultySession(data);
              localStorage.setItem("user", JSON.stringify(data));
              localStorage.setItem("role", "faculty");
              setActiveFaculty(getActiveFacultySession());
            }
          }
        }
      } catch {
        // ignore
      }
    };

    syncFacultyProfile();
  }, [isAdminOrStudent]);

  // Handle switching faculty in demo / admin preview mode
  const handleSwitchFaculty = (facultyId) => {
    const found = facultyList.find((f) => String(f.user_id) === String(facultyId));
    if (found) {
      setActiveFacultySession(found);
      setActiveFaculty(getActiveFacultySession());
      window.location.reload();
    }
  };

  return (
    <div className="app-shell">
      <FacultySidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="app-main-wrapper">
        {/* Admin/Preview Active Notice Banner */}
        {isAdminOrStudent && (
          <div
            style={{
              background: "linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)",
              borderBottom: "1px solid rgba(245, 158, 11, 0.3)",
              padding: "8px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
              fontSize: "12.5px",
              color: "#fbbf24",
              fontWeight: "600",
              zIndex: 90,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FiAlertTriangle style={{ color: "#f59e0b", fontSize: "16px", flexShrink: 0 }} />
              <span>
                <b>Admin / Student Session Active:</b> You are previewing the Faculty Portal as{" "}
                <b style={{ color: "#38bdf8" }}>
                  Prof. {activeFaculty.first_name} {activeFaculty.last_name}
                </b>{" "}
                ({activeFaculty.department}).
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Faculty Switcher Dropdown */}
              {facultyList.length > 0 && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    padding: "4px 10px",
                    borderRadius: "8px",
                  }}
                >
                  <FiUsers style={{ color: "#a5b4fc" }} />
                  <select
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: "700",
                      outline: "none",
                      cursor: "pointer",
                    }}
                    value={activeFaculty.user_id}
                    onChange={(e) => handleSwitchFaculty(e.target.value)}
                    title="Switch Faculty Preview Account"
                  >
                    {facultyList.map((f) => (
                      <option
                        key={f.user_id}
                        value={f.user_id}
                        style={{ background: "#0f172a", color: "#ffffff" }}
                      >
                        Prof. {f.first_name} {f.last_name} ({f.department || "Faculty"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => navigate("/faculty-login")}
                style={{
                  background: "rgba(99, 102, 241, 0.2)",
                  border: "1px solid rgba(99, 102, 241, 0.4)",
                  color: "#ffffff",
                  padding: "4px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <span>Login as Real Faculty</span>
                <FiArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        <Topbar
          portalTitle="Faculty Workspace"
          subtitle="NavNext Academic Management"
          onToggleSidebar={() => setMobileOpen(true)}
        />
        <main className="app-content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

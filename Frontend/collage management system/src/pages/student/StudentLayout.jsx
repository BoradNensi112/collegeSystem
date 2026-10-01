import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import StudentSidebar from "../../component/student/studentSidebar";
import Topbar from "../../component/common/Topbar";
import { getActiveStudentSession, setActiveStudentSession } from "../../utils/studentSession";
import { FiUserCheck, FiAlertTriangle, FiArrowRight, FiUsers } from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export default function StudentLayout() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [studentsList, setStudentsList] = useState([]);
  const [activeStudent, setActiveStudent] = useState(getActiveStudentSession());

  // Check if currently logged-in account in token is Admin or Faculty
  const authUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const authRole = (localStorage.getItem("role") || authUser.user_type || "").toLowerCase();
  const isAdminOrFaculty = authRole === "admin" || authRole === "faculty" || (authUser.user_type && authUser.user_type.toLowerCase() !== "student");

  // Fetch all students from DB for quick account preview if Admin/Faculty
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch(`${API_BASE}/Student/list`);
        if (res.ok) {
          const json = await res.json();
          const list = json?.message || json?.data || [];
          if (Array.isArray(list) && list.length > 0) {
            setStudentsList(list);
          }
        }
      } catch {
        // ignore
      }
    };

    fetchStudents();
  }, []);

  // Sync profile if logged in as a real student
  useEffect(() => {
    const syncStudentProfile = async () => {
      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("authToken") ||
          "";
        if (!token) return;

        // Only sync /Profile/my if the logged-in token belongs to a student
        if (!isAdminOrFaculty) {
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
            if (json?.data && json.data.user_type === "student") {
              const data = json.data;
              setActiveStudentSession(data);
              localStorage.setItem("user", JSON.stringify(data));
              localStorage.setItem("role", "student");
              setActiveStudent(getActiveStudentSession());
            }
          }
        }
      } catch {
        // ignore
      }
    };

    syncStudentProfile();
  }, [isAdminOrFaculty]);

  // Handle switching student in demo / admin preview mode
  const handleSwitchStudent = (studentId) => {
    const found = studentsList.find((s) => String(s.user_id) === String(studentId));
    if (found) {
      setActiveStudentSession(found);
      setActiveStudent(getActiveStudentSession());
      window.location.reload();
    }
  };

  return (
    <div className="app-shell">
      <StudentSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="app-main-wrapper">
        {/* Admin / Faculty Role Notice & Student Switcher */}
        {isAdminOrFaculty && (
          <div
            style={{
              background: "linear-gradient(90deg, rgba(245, 158, 11, 0.18), rgba(99, 102, 241, 0.18))",
              borderBottom: "1px solid rgba(245, 158, 11, 0.35)",
              padding: "10px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              fontSize: "13px",
              color: "#fef3c7",
              backdropFilter: "blur(10px)",
              zIndex: 90,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FiAlertTriangle style={{ color: "#fbbf24", fontSize: "16px", flexShrink: 0 }} />
              <span>
                <b>Admin / Faculty Session Active:</b> You are previewing the Student Portal as{" "}
                <strong style={{ color: "#38bdf8" }}>{activeStudent.name}</strong> ({activeStudent.course} • Sem {activeStudent.semester}).
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {studentsList.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <FiUsers style={{ color: "#a5b4fc" }} />
                  <select
                    style={{
                      background: "rgba(15, 23, 42, 0.85)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#ffffff",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      outline: "none",
                      cursor: "pointer",
                    }}
                    value={activeStudent.user_id}
                    onChange={(e) => handleSwitchStudent(e.target.value)}
                  >
                    {studentsList.map((s) => (
                      <option key={s.user_id} value={s.user_id}>
                        {s.first_name} {s.last_name} ({s.course} • Sem {s.sem || 4})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  localStorage.removeItem("role");
                  navigate("/student-login");
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  padding: "4px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>Login as Real Student</span>
                <FiArrowRight />
              </button>
            </div>
          </div>
        )}

        <Topbar
          portalTitle="Student Workspace"
          subtitle="NavNext Academic Center"
          onToggleSidebar={() => setMobileOpen(true)}
        />
        <main className="app-content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
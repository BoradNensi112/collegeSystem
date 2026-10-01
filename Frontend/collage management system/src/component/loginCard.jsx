import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./login.css";

function LoginCard({ role: initialRole = "Student" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeRole, setActiveRole] = useState(initialRole);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setActiveRole(initialRole);
    setMessage("");
  }, [initialRole]);

  useEffect(() => {
    document.body.classList.add("nx-auth");
    return () => document.body.classList.remove("nx-auth");
  }, []);

  const roleMeta = {
    Admin: {
      key: "Admin",
      title: "Admin Console",
      subtitle: "Institute Administration & Management",
      icon: "🛡️",
      badge: "Administrator",
      badgeColor: "#f59e0b",
      route: "/admin-login",
      desc: "Sign in with your administrator credentials to configure courses, manage student admissions, and oversee campus records.",
      features: [
        "Institute Student & Staff Directory",
        "Course & Fee Structure Management",
        "Master Timetable & Notice Broadcast",
      ],
    },
    Student: {
      key: "Student",
      title: "Student Portal",
      subtitle: "Academic Hub & Learning Desk",
      icon: "🎓",
      badge: "Student Hub",
      badgeColor: "#38bdf8",
      route: "/student-login",
      desc: "Access your personalized class timetable, live attendance percentages, study materials, semester results, and fee receipts.",
      features: [
        "Live Lecture Attendance & Leaves",
        "Class Timetable & Room Directory",
        "Study Notes, Results & Fee Receipts",
      ],
    },
    Faculty: {
      key: "Faculty",
      title: "Faculty Portal",
      subtitle: "Classroom Schedules & Teaching",
      icon: "👨‍🏫",
      badge: "Faculty Staff",
      badgeColor: "#a855f7",
      route: "/faculty-login",
      desc: "Manage live student attendance, upload lecture materials and assignments, enter internal/exam marks, and submit leaves.",
      features: [
        "Live Attendance Marking Engine",
        "Upload Study Materials & Notes",
        "Student Marks Grading & Leaves",
      ],
    },
  };

  const currentMeta = roleMeta[activeRole] || roleMeta.Student;

  const handleRoleSwitch = (newRole) => {
    setActiveRole(newRole);
    setMessage("");
    if (newRole === "Admin") navigate("/admin-login");
    else if (newRole === "Faculty") navigate("/faculty-login");
    else navigate("/student-login");
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();

    if (!userName.trim() || !password) {
      setMessage("⚠️ Please enter both username and password");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const expectedRole = (activeRole || "").toLowerCase();

      const response = await axios.post(`${import.meta.env.VITE_API_BASE || "http://localhost:5001"}/Auth/login`, {
        user_name: userName.trim(),
        password,
        role: expectedRole,
      });

      const ok = response.data?.success === true || response.data?.ok === true;

      if (ok) {
        const user = response.data?.user || {};
        const actualRole = String(user.user_type || "").toLowerCase();

        if (expectedRole && actualRole && expectedRole !== actualRole) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setMessage(
            `⚠️ You are registered as "${actualRole}". You cannot log in via the "${expectedRole}" portal.`
          );
          return;
        }

        setMessage("✅ Login successful! Redirecting...");

        if (response.data?.token) localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(user));
        if (user.user_id) {
          localStorage.setItem("student_id", String(user.user_id));
          localStorage.setItem("faculty_id", String(user.user_id));
          localStorage.setItem("user_id", String(user.user_id));
        }
        if (actualRole) localStorage.setItem("role", actualRole);

        setTimeout(() => {
          if (actualRole === "admin") navigate("/admin/dashboard");
          else if (actualRole === "student") navigate("/student/dashboard");
          else if (actualRole === "faculty") navigate("/faculty/dashboard");
          else navigate("/");
        }, 500);
      } else {
        setMessage("❌ " + (response.data?.message || "Invalid credentials"));
      }
    } catch (err) {
      console.error(err.response?.data);
      setMessage("❌ " + (err.response?.data?.message || "Invalid credentials. Please check password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginPage">
      {/* Ambient background glows */}
      <div className="loginGlow loginGlow1" />
      <div className="loginGlow loginGlow2" />

      {/* Top Floating Navigation Bar */}
      <div className="loginTopNav">
        <button className="backHomeBtn" onClick={() => navigate("/home")} type="button">
          <span>←</span>
          <span>Back to Home</span>
        </button>

        <div className="loginBrand">
          <div className="loginLogoMark">N</div>
          <span className="loginBrandName">NavNext</span>
        </div>

        <button
          className="topRegisterBtn"
          onClick={() => navigate("/student-register")}
          type="button"
        >
          <span>Need an account? Register</span>
          <span>→</span>
        </button>
      </div>

      {/* 2-Column Balanced Authentication Grid */}
      <div className="loginContainerSplit">
        {/* Left Column: Role Details & Security Highlights */}
        <div className="loginLeftCol">
          <div className="loginLeftCard">
            <div className="roleHeaderStrip">
              <span
                className="roleBadgeLarge"
                style={{
                  borderColor: `${currentMeta.badgeColor}40`,
                  color: currentMeta.badgeColor,
                  background: `${currentMeta.badgeColor}15`,
                }}
              >
                {currentMeta.badge}
              </span>
              <span className="secureTag">🔒 Role-Isolated</span>
            </div>

            <div className="loginRoleShowcase">
              <div
                className="loginRoleOrb"
                style={{
                  borderColor: `${currentMeta.badgeColor}40`,
                  background: `${currentMeta.badgeColor}18`,
                }}
              >
                <span className="orbIconLarge">{currentMeta.icon}</span>
              </div>
              <h3>{currentMeta.title}</h3>
              <p className="roleSubtitle">{currentMeta.subtitle}</p>
              <p className="roleDescText">{currentMeta.desc}</p>
            </div>

            {/* Feature Highlights */}
            <div className="roleFeaturesMini">
              {currentMeta.features.map((feat, idx) => (
                <div key={idx} className="featMiniItem">
                  <span className="featMiniCheck">✓</span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Institutional Security Notice */}
            <div className="institutionalSecurityBox">
              <div className="secBoxHeader">
                <span className="secShieldIcon">🛡️</span>
                <span className="secBoxTitle">Institutional Security</span>
              </div>
              <p className="secBoxDesc">
                Please enter your registered college credentials. Unauthorized access attempts are monitored and logged.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Main Login Form */}
        <div className="loginRightCol">
          <div className="loginFormCard">
            {/* Top Role Switcher Tabs */}
            <div className="roleTabsRow">
              {["Student", "Faculty", "Admin"].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`roleTabBtn ${activeRole === r ? "active" : ""}`}
                  onClick={() => handleRoleSwitch(r)}
                >
                  <span>{roleMeta[r].icon}</span>
                  <span>{r}</span>
                </button>
              ))}
            </div>

            <div className="loginFormHead">
              <h2>Welcome Back</h2>
              <p className="loginSub">Sign in to your {activeRole} account to continue</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="loginForm" autoComplete="off">
              {/* Username */}
              <div className="inputGroup">
                <label htmlFor="nx-username">Username</label>
                <input
                  id="nx-username"
                  name="user_name"
                  type="text"
                  placeholder={`Enter ${activeRole.toLowerCase()} username`}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>

              {/* Password */}
              <div className="inputGroup">
                <div className="labelRow">
                  <label htmlFor="nx-password">Password</label>
                  <span
                    className="forgotLink"
                    onClick={() => navigate("/forgot-password")}
                    role="button"
                    tabIndex={0}
                  >
                    Forgot Password?
                  </span>
                </div>
                <div className="inputFieldWrap">
                  <input
                    id="nx-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="pwToggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              {/* Message alert */}
              {message && (
                <div className={`loginAlert ${String(message).includes("✅") ? "ok" : "err"}`}>
                  {message}
                </div>
              )}

              {/* Submit CTA */}
              <button type="submit" className="loginBtn" disabled={loading}>
                {loading ? (
                  <span className="btnLoadingRow">
                    <span className="btnSpinner" />
                    <span>Authenticating...</span>
                  </span>
                ) : (
                  <span>Sign In to {activeRole} Portal →</span>
                )}
              </button>
            </form>

            {/* Registration Redirect */}
            <div className="loginFooterRow">
              <span>Don't have an account yet?</span>
              <button
                type="button"
                className="registerLinkBtn"
                onClick={() => navigate("/student-register")}
              >
                Create Account →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginCard;
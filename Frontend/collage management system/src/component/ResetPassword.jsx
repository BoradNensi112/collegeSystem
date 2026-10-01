import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./login.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add("nx-auth");
    return () => document.body.classList.remove("nx-auth");
  }, []);

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const handleReset = async (e) => {
    if (e) e.preventDefault();
    if (!email || !otp.trim() || !newPassword) {
      setMessage("⚠️ All fields are required");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await axios.post(`${import.meta.env.VITE_API_BASE || "http://localhost:5001"}/Auth/reset-password`, {
        email: email.trim(),
        otp: otp.trim(),
        new_password: newPassword,
      });

      if (res.data.success) {
        setMessage("✅ Password reset successful! Redirecting to login...");
        setTimeout(() => {
          navigate("/student-login");
        }, 1200);
      } else {
        setMessage("❌ " + (res.data.message || "Reset failed"));
      }
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.message || "Reset failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginPage">
      <div className="loginGlow loginGlow1" />
      <div className="loginGlow loginGlow2" />

      <div className="loginTopNav">
        <button className="backHomeBtn" onClick={() => navigate("/forgot-password")} type="button">
          <span>←</span>
          <span>Back</span>
        </button>

        <div className="loginBrand">
          <div className="loginLogoMark">N</div>
          <span className="loginBrandName">NavNext</span>
        </div>
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="loginCardHead">
            <div className="loginOrb">
              <span className="orbIcon">🔑</span>
            </div>
            <h2>Set New Password</h2>
            <p className="loginSub">Enter the OTP sent to your email and your new password</p>
          </div>

          <form onSubmit={handleReset} className="loginForm">
            <div className="inputGroup">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                readOnly
                style={{ opacity: 0.7, cursor: "not-allowed" }}
              />
            </div>

            <div className="inputGroup">
              <label htmlFor="nx-otp">One-Time Password (OTP)</label>
              <input
                id="nx-otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>

            <div className="inputGroup">
              <label htmlFor="nx-newpw">New Password</label>
              <div className="inputFieldWrap">
                <input
                  id="nx-newpw"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            {message && (
              <div className={`loginAlert ${String(message).includes("✅") ? "ok" : "err"}`}>
                {message}
              </div>
            )}

            <button type="submit" className="loginBtn" disabled={loading}>
              {loading ? (
                <span className="btnLoadingRow">
                  <span className="btnSpinner" />
                  <span>Updating Password...</span>
                </span>
              ) : (
                <span>Confirm New Password →</span>
              )}
            </button>
          </form>

          <div className="loginFooterRow">
            <span>Didn't receive code?</span>
            <button
              type="button"
              className="registerLinkBtn"
              onClick={() => navigate("/forgot-password")}
            >
              Resend OTP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./login.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add("nx-auth");
    return () => document.body.classList.remove("nx-auth");
  }, []);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setMessage("⚠️ Email address is required");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await axios.post(`${import.meta.env.VITE_API_BASE || "http://localhost:5001"}/Auth/forgot-password`, {
        email: email.trim(),
      });

      if (res.data.success) {
        setMessage("✅ OTP code sent! Check your email / server console.");
        setTimeout(() => {
          navigate("/reset-password", { state: { email: email.trim() } });
        }, 1200);
      } else {
        setMessage("❌ " + (res.data.message || "Error sending OTP"));
      }
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.message || "Error sending OTP"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginPage">
      <div className="loginGlow loginGlow1" />
      <div className="loginGlow loginGlow2" />

      <div className="loginTopNav">
        <button className="backHomeBtn" onClick={() => navigate(-1)} type="button">
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
              <span className="orbIcon">🔐</span>
            </div>
            <h2>Password Recovery</h2>
            <p className="loginSub">Enter your registered email to receive a reset OTP</p>
          </div>

          <form onSubmit={handleSendOtp} className="loginForm">
            <div className="inputGroup">
              <label htmlFor="nx-email">Registered Email Address</label>
              <input
                id="nx-email"
                type="email"
                placeholder="e.g. yourname@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
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
                  <span>Sending OTP...</span>
                </span>
              ) : (
                <span>Send Reset OTP →</span>
              )}
            </button>
          </form>

          <div className="loginFooterRow">
            <span>Remembered your credentials?</span>
            <button
              type="button"
              className="registerLinkBtn"
              onClick={() => navigate("/student-login")}
            >
              Sign In →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiMessageSquare,
  FiStar,
  FiUserCheck,
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiSend,
  FiRefreshCw,
  FiClock,
  FiInfo,
  FiCheck
} from "react-icons/fi";
import "../../layout/student/StudentFeedback.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  "";

const getHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const CAMPUS_CATEGORIES = [
  "Library & Digital Resources",
  "Computer Laboratories",
  "Classrooms & Audio-Visual",
  "Cafeteria & Dining",
  "Sports & Gymnasium",
  "Campus Wi-Fi & IT Infrastructure",
  "Hostel & Residential Facilities",
  "Administrative & Student Support",
];

const RATING_LABELS = {
  1: "1 Star - Needs Improvement",
  2: "2 Stars - Below Expectations",
  3: "3 Stars - Satisfactory & Average",
  4: "4 Stars - Very Good & Commendable",
  5: "5 Stars - Outstanding & Exceptional",
};

export default function StudentFeedback() {
  const [activeSession, setActiveSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [facultyList, setFacultyList] = useState([]);
  const [activeTab, setActiveTab] = useState("FACULTY"); // 'FACULTY' or 'COLLEGE'
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Form State
  const [facultyId, setFacultyId] = useState("");
  const [facultyRating, setFacultyRating] = useState(5);
  const [facultyHoverRating, setFacultyHoverRating] = useState(0);
  const [facultyComment, setFacultyComment] = useState("");

  const [collegeCategory, setCollegeCategory] = useState(CAMPUS_CATEGORIES[0]);
  const [collegeRating, setCollegeRating] = useState(5);
  const [collegeHoverRating, setCollegeHoverRating] = useState(0);
  const [collegeComment, setCollegeComment] = useState("");

  const showToast = (message, type = "ok") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchActiveSessionAndFaculty = async () => {
    setSessionLoading(true);
    try {
      // 1. Fetch Active Session
      const sessRes = await fetch(`${API_BASE}/Feedback/active-session`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({}),
      });
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        setActiveSession(sessData?.data || null);
      }

      // 2. Fetch Faculty List
      const facRes = await axios.post(
        `${API_BASE}/Faculty/postFacultyData`,
        {},
        { headers: getHeaders() }
      );
      const raw = Array.isArray(facRes.data)
        ? facRes.data
        : Array.isArray(facRes.data?.data)
        ? facRes.data.data
        : Array.isArray(facRes.data?.message)
        ? facRes.data.message
        : [];

      const parsed = raw.map((f) => ({
        id: f.faculty_id || f.user_id || f.id,
        name:
          `${f.first_name || ""} ${f.last_name || ""}`.trim() ||
          f.name ||
          f.user_name ||
          `Faculty #${f.faculty_id || f.user_id || f.id}`,
        department: f.department || f.dept || "Academic Department",
        email: f.email || "",
      }));

      setFacultyList(parsed);
      if (parsed.length > 0 && !facultyId) {
        setFacultyId(parsed[0].id);
      }
    } catch {
      // ignore
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSessionAndFaculty();
  }, []);

  const handleFacultySubmit = async (e) => {
    e.preventDefault();
    if (!facultyId) {
      showToast("Please select a faculty member", "err");
      return;
    }
    if (!facultyRating) {
      showToast("Please select a star rating", "err");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/Feedback/submit`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          feedback_type: "FACULTY",
          faculty_id: facultyId,
          rating: facultyRating,
          comment: facultyComment.trim() || "Positive appraisal submitted.",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to submit faculty review");
      }

      showToast("Faculty feedback submitted successfully!", "ok");
      setFacultyComment("");
      setSubmittedSuccess(true);
    } catch (err) {
      showToast(err.message || "Error submitting feedback", "err");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCollegeSubmit = async (e) => {
    e.preventDefault();
    if (!collegeCategory) {
      showToast("Please select a campus category", "err");
      return;
    }
    if (!collegeRating) {
      showToast("Please select a star rating", "err");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/Feedback/submit`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          feedback_type: "COLLEGE",
          category: collegeCategory,
          rating: collegeRating,
          comment: collegeComment.trim() || "Campus feedback recorded.",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to submit college review");
      }

      showToast("Campus infrastructure feedback submitted successfully!", "ok");
      setCollegeComment("");
      setSubmittedSuccess(true);
    } catch (err) {
      showToast(err.message || "Error submitting feedback", "err");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sfb-pro-root">
      {/* Toast Alert */}
      {toast && (
        <div className={`sfb-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* HERO COMMAND BANNER */}
      <section className="sfb-hero-banner">
        <div className="sfb-hero-left">
          <div className="sfb-live-chip">
            <span className="sfb-ping"></span>
            <span className="sfb-live-txt">CONFIDENTIAL ACADEMIC & INSTITUTIONAL FEEDBACK PORTAL</span>
          </div>
          <h1 className="sfb-hero-title">Submit Course & Campus Feedback</h1>
          <p className="sfb-hero-sub">
            Your constructive evaluations help enhance teaching excellence, curriculum delivery, and institutional facilities.
          </p>
        </div>

        <div className="sfb-hero-actions">
          <button
            className="sfb-btn sfb-btn-secondary"
            onClick={fetchActiveSessionAndFaculty}
            disabled={sessionLoading}
            title="Refresh active survey status"
          >
            <FiRefreshCw className={sessionLoading ? "sfb-spin" : ""} />
            <span>Sync</span>
          </button>
        </div>
      </section>

      {/* ACTIVE CYCLE STATUS STRIP */}
      {activeSession ? (
        <div className="sfb-active-session-strip">
          <div className="sfb-active-session-left">
            <div className="sfb-active-icon-badge">
              <FiCalendar size={20} />
            </div>
            <div>
              <div className="sfb-active-session-title">
                Active Survey Cycle: <b>{activeSession.title || "Academic Survey"}</b>
              </div>
              <div className="sfb-active-session-dates">
                <span>Evaluation Window: {activeSession.start_date} to {activeSession.end_date}</span>
                <span className="sfb-active-badge">🟢 Portal Open for Submission</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="sfb-closed-session-strip">
          <FiAlertCircle size={22} className="sfb-closed-icon" />
          <div>
            <h4 className="sfb-closed-title">Feedback Portal Currently Inactive</h4>
            <p className="sfb-closed-sub">
              No institutional survey cycle is currently active. Feedback submissions will resume once the administration opens the next cycle.
            </p>
          </div>
        </div>
      )}

      {/* MAIN FEEDBACK CARD */}
      <div className="sfb-main-card">
        {/* TABS HEADER */}
        <div className="sfb-tabs-row">
          <button
            type="button"
            className={`sfb-tab-item ${activeTab === "FACULTY" ? "active" : ""}`}
            onClick={() => setActiveTab("FACULTY")}
          >
            <FiUserCheck size={18} />
            <span>Faculty Appraisal & Teaching Review</span>
          </button>

          <button
            type="button"
            className={`sfb-tab-item ${activeTab === "COLLEGE" ? "active" : ""}`}
            onClick={() => setActiveTab("COLLEGE")}
          >
            <FiAward size={18} />
            <span>Campus Infrastructure & Facilities Review</span>
          </button>
        </div>

        {/* TAB 1: FACULTY FORM */}
        {activeTab === "FACULTY" && (
          <form onSubmit={handleFacultySubmit} className="sfb-form-body">
            <div className="sfb-info-notice">
              <FiInfo size={18} />
              <span>
                Select an assigned instructor to evaluate lecture clarity, syllabus coverage, accessibility, and mentor guidance.
              </span>
            </div>

            <div className="sfb-field-group">
              <label className="sfb-label">Select Faculty Member *</label>
              <select
                className="sfb-select"
                value={facultyId}
                onChange={(e) => setFacultyId(e.target.value)}
                required
                disabled={!activeSession}
              >
                {facultyList.length === 0 ? (
                  <option value="">Loading faculty directory...</option>
                ) : (
                  facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {f.department}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* RATING SELECTOR */}
            <div className="sfb-field-group">
              <label className="sfb-label">Overall Teaching Performance Rating *</label>
              <div className="sfb-rating-picker">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    className={`sfb-star-picker-btn ${
                      (facultyHoverRating || facultyRating) >= star ? "active" : ""
                    }`}
                    onMouseEnter={() => setFacultyHoverRating(star)}
                    onMouseLeave={() => setFacultyHoverRating(0)}
                    onClick={() => setFacultyRating(star)}
                    disabled={!activeSession}
                  >
                    ★
                  </button>
                ))}
                <span className="sfb-rating-desc">
                  {RATING_LABELS[facultyHoverRating || facultyRating]}
                </span>
              </div>
            </div>

            {/* COMMENT AREA */}
            <div className="sfb-field-group">
              <label className="sfb-label">Observations, Strengths & Constructive Feedback</label>
              <textarea
                className="sfb-textarea"
                rows={4}
                value={facultyComment}
                onChange={(e) => setFacultyComment(e.target.value)}
                placeholder="Share your experience regarding lecture delivery, practical labs, doubt resolution, and subject engagement..."
                disabled={!activeSession}
              />
            </div>

            <div className="sfb-form-actions">
              <button
                type="submit"
                className="sfb-btn sfb-btn-primary"
                disabled={submitting || !activeSession}
              >
                {submitting ? (
                  <>
                    <FiRefreshCw className="sfb-spin" />
                    <span>Submitting Appraisal...</span>
                  </>
                ) : (
                  <>
                    <FiSend />
                    <span>Submit Faculty Evaluation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: COLLEGE INFRASTRUCTURE FORM */}
        {activeTab === "COLLEGE" && (
          <form onSubmit={handleCollegeSubmit} className="sfb-form-body">
            <div className="sfb-info-notice cyan">
              <FiInfo size={18} />
              <span>
                Provide feedback regarding laboratory instruments, library subscriptions, sports amenities, dining, and IT infrastructure.
              </span>
            </div>

            <div className="sfb-field-group">
              <label className="sfb-label">Campus Facility / Infrastructure Category *</label>
              <select
                className="sfb-select"
                value={collegeCategory}
                onChange={(e) => setCollegeCategory(e.target.value)}
                required
                disabled={!activeSession}
              >
                {CAMPUS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* RATING SELECTOR */}
            <div className="sfb-field-group">
              <label className="sfb-label">Facility Quality & Service Satisfaction Rating *</label>
              <div className="sfb-rating-picker">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    className={`sfb-star-picker-btn cyan ${
                      (collegeHoverRating || collegeRating) >= star ? "active" : ""
                    }`}
                    onMouseEnter={() => setCollegeHoverRating(star)}
                    onMouseLeave={() => setCollegeHoverRating(0)}
                    onClick={() => setCollegeRating(star)}
                    disabled={!activeSession}
                  >
                    ★
                  </button>
                ))}
                <span className="sfb-rating-desc cyan">
                  {RATING_LABELS[collegeHoverRating || collegeRating]}
                </span>
              </div>
            </div>

            {/* COMMENT AREA */}
            <div className="sfb-field-group">
              <label className="sfb-label">Detailed Feedback & Improvement Suggestions</label>
              <textarea
                className="sfb-textarea"
                rows={4}
                value={collegeComment}
                onChange={(e) => setCollegeComment(e.target.value)}
                placeholder="Mention specific facilities, equipment availability, cleanliness, Wi-Fi connectivity, or services that could be upgraded..."
                disabled={!activeSession}
              />
            </div>

            <div className="sfb-form-actions">
              <button
                type="submit"
                className="sfb-btn sfb-btn-primary cyan"
                disabled={submitting || !activeSession}
              >
                {submitting ? (
                  <>
                    <FiRefreshCw className="sfb-spin" />
                    <span>Submitting Review...</span>
                  </>
                ) : (
                  <>
                    <FiSend />
                    <span>Submit Campus Review</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* REASSURANCE BANNER */}
      <div className="sfb-footer-notice">
        <div className="sfb-notice-icon-box">
          <FiCheck size={18} />
        </div>
        <div className="sfb-notice-text">
          <h5>Institutional Quality Assurance & Privacy Policy</h5>
          <p>
            All submitted feedback is processed with academic integrity to continuously upgrade institutional education standards.
          </p>
        </div>
      </div>
    </div>
  );
}

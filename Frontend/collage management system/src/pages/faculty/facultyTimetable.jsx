import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiClock,
  FiBook,
  FiLayers,
  FiMapPin,
  FiUser,
  FiUsers,
  FiVideo,
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiExternalLink,
  FiCopy,
  FiAward,
  FiGrid,
  FiList,
  FiPrinter,
  FiInfo,
  FiX,
  FiArrowRight,
  FiCheck,
  FiActivity
} from "react-icons/fi";
import "../../layout/faculty/facultyTimetable.css";
import { getActiveFacultySession } from "../../utils/facultySession";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";
const API = {
  list: `${API_BASE}/Timetable/postTimetableData`,
  listAlt: `${API_BASE}/Timetable/list`,
};

const DAYS = [
  { key: "MON", label: "Monday", short: "Mon" },
  { key: "TUE", label: "Tuesday", short: "Tue" },
  { key: "WED", label: "Wednesday", short: "Wed" },
  { key: "THU", label: "Thursday", short: "Thu" },
  { key: "FRI", label: "Friday", short: "Fri" },
  { key: "SAT", label: "Saturday", short: "Sat" },
];

const COURSES = ["All Courses", "BCA", "B.Tech CSE", "MCA", "BBA", "BCom"];
const TYPES = ["ALL", "LECTURE", "LAB", "TUTORIAL"];

// Helper: Day key from Date
const getTodayKey = () => {
  const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const d = new Date().getDay();
  return map[d] === "SUN" ? "MON" : map[d];
};

// Helper: Convert "HH:MM:SS" or "HH:MM" to minutes from midnight
const toMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = String(timeStr).split(":");
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  return h * 60 + m;
};

// Helper: 12-Hour formatted time (e.g. 10:00 AM)
const format12Hour = (timeStr) => {
  if (!timeStr) return "--:--";
  const parts = String(timeStr).split(":");
  let h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
};

// Helper: Check if slot is live right now
const checkSlotStatus = (day, start, end) => {
  const currentDay = getTodayKey();
  if (day !== currentDay) return "UPCOMING";

  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);

  if (currentMin >= startMin && currentMin <= endMin) return "LIVE";
  if (currentMin > endMin) return "COMPLETED";
  return "TODAY_UPCOMING";
};

// Helper: Duration in minutes
const getDurationMinutes = (start, end) => {
  const diff = toMinutes(end) - toMinutes(start);
  return diff > 0 ? diff : 60;
};

// Helper: Normalize DB rows
const normalizeRows = (res) => {
  const raw = Array.isArray(res) ? res : res?.message || res?.data || [];
  const arr = Array.isArray(raw) ? raw : [];

  return arr
    .map((x, idx) => ({
      timeTable_id: x.timeTable_id ?? x.id ?? idx + 1,
      course: x.course || x.class_name || "BCA",
      semester: Number(x.semester || x.sem || 1),
      batch: x.batch || "A1",
      subject: x.subject || x.sub_name || "Subject",
      subject_code: x.subject_code || x.code || "",
      day: String(x.day || x.day_name || "MON").toUpperCase(),
      start_time: String(x.start_time || x.start || "").slice(0, 5),
      end_time: String(x.end_time || x.end || "").slice(0, 5),
      faculty_name: x.faculty_name || x.faculty || "Faculty",
      room: x.room || x.classroom || "Room-101",
      type: String(x.type || "LECTURE").toUpperCase(),
      note: x.note || x.remark || "",
      meet_link: x.meet_link || x.link || "",
      status: String(x.status || "ACTIVE").toUpperCase(),
    }))
    .filter((r) => r.day && r.start_time && r.end_time);
};

export default function FacultyTimeTable() {
  const navigate = useNavigate();
  const facultyUser = useMemo(() => getActiveFacultySession(), []);
  const todayKey = useMemo(() => getTodayKey(), []);

  // State Management
  const [activeDay, setActiveDay] = useState(todayKey);
  const [scheduleScope, setScheduleScope] = useState("MY_CLASSES"); // 'MY_CLASSES' | 'ALL_CLASSES'
  const [timetableRows, setTimetableRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("All Courses");
  const [selectedSemester, setSelectedSemester] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [viewLayout, setViewLayout] = useState("timeline"); // 'timeline' | 'grid' | 'weekly'

  // Modal Detail State
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "ok") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch Timetable Data
  const fetchTimetable = async () => {
    try {
      setRefreshing(true);
      setErrorMsg("");
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let rows = [];
      try {
        const res = await axios.post(API.list, {}, { headers });
        rows = normalizeRows(res.data);
      } catch {
        const resAlt = await axios.get(API.listAlt, { headers });
        rows = normalizeRows(resAlt.data);
      }

      setTimetableRows(rows);
    } catch (err) {
      console.error("Error fetching timetable:", err);
      setErrorMsg("Unable to load timetable schedule from server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  // Filtered Timetable Slots for Current Scope
  const scopedSlots = useMemo(() => {
    if (scheduleScope === "ALL_CLASSES") return timetableRows;

    // In 'MY_CLASSES' mode: Match faculty name or keywords
    const facultyNameLower = facultyUser.name.toLowerCase();
    const facultyWords = facultyNameLower.split(" ").filter((w) => w.length > 2 && w !== "prof" && w !== "dr.");

    const myMatches = timetableRows.filter((item) => {
      const slotFaculty = (item.faculty_name || "").toLowerCase();
      if (slotFaculty.includes(facultyNameLower)) return true;
      return facultyWords.some((word) => slotFaculty.includes(word));
    });

    // Fallback: If no direct name match in database (e.g. demo data), return all active rows
    return myMatches.length > 0 ? myMatches : timetableRows;
  }, [timetableRows, scheduleScope, facultyUser.name]);

  // Daily Filtered & Sorted Slots
  const currentDaySlots = useMemo(() => {
    return scopedSlots
      .filter((item) => {
        // Day filter
        if (item.day !== activeDay) return false;

        // Course filter
        if (selectedCourse !== "All Courses" && item.course !== selectedCourse) return false;

        // Semester filter
        if (selectedSemester !== "ALL" && String(item.semester) !== String(selectedSemester)) return false;

        // Type filter
        if (selectedType !== "ALL" && item.type !== selectedType) return false;

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchSub = (item.subject || "").toLowerCase().includes(q);
          const matchCode = (item.subject_code || "").toLowerCase().includes(q);
          const matchRoom = (item.room || "").toLowerCase().includes(q);
          const matchFaculty = (item.faculty_name || "").toLowerCase().includes(q);
          const matchCourse = (item.course || "").toLowerCase().includes(q);
          if (!matchSub && !matchCode && !matchRoom && !matchFaculty && !matchCourse) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
  }, [scopedSlots, activeDay, selectedCourse, selectedSemester, selectedType, searchQuery]);

  // Weekly Overview Matrix (All 6 Days grouped)
  const weeklyMatrix = useMemo(() => {
    const grouped = {};
    DAYS.forEach((d) => {
      grouped[d.key] = scopedSlots
        .filter((item) => item.day === d.key)
        .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
    });
    return grouped;
  }, [scopedSlots]);

  // Computed HUD Metrics
  const metrics = useMemo(() => {
    const totalWeekly = scopedSlots.length;
    const todayCount = scopedSlots.filter((x) => x.day === todayKey).length;
    const labCount = scopedSlots.filter((x) => x.type === "LAB").length;
    const lectureCount = scopedSlots.filter((x) => x.type === "LECTURE").length;
    const uniqueCourses = new Set(scopedSlots.map((x) => `${x.course} Sem ${x.semester}`)).size;

    // Find Live / Next Lecture
    let liveNowSlot = null;
    let nextUpcomingSlot = null;
    const todaySlots = scopedSlots
      .filter((x) => x.day === todayKey)
      .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));

    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();

    for (const slot of todaySlots) {
      const sMin = toMinutes(slot.start_time);
      const eMin = toMinutes(slot.end_time);
      if (currentMin >= sMin && currentMin <= eMin) {
        liveNowSlot = slot;
        break;
      } else if (currentMin < sMin && !nextUpcomingSlot) {
        nextUpcomingSlot = slot;
      }
    }

    return {
      totalWeekly,
      todayCount,
      labCount,
      lectureCount,
      uniqueCourses,
      liveNowSlot,
      nextUpcomingSlot,
    };
  }, [scopedSlots, todayKey]);

  // Copy Meet Link Helper
  const handleCopyLink = (link) => {
    if (!link) return;
    navigator.clipboard?.writeText(link);
    showToast("Virtual classroom meet link copied!", "ok");
  };

  // Quick Action Navigators
  const navigateToAttendance = (slot) => {
    navigate("/faculty/Attendance", {
      state: {
        course: slot.course,
        semester: slot.semester,
        subject: slot.subject,
      },
    });
  };

  const navigateToMarks = (slot) => {
    navigate("/faculty/MarksUpload", {
      state: {
        course: slot.course,
        semester: slot.semester,
        subject: slot.subject,
      },
    });
  };

  // Print Timetable
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="ftt-vault-root">
      {/* Toast */}
      {toast && (
        <div className={`ftt-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheckCircle className="ftt-toast-ic" /> : <FiAlertCircle className="ftt-toast-ic" />}
          <span>{toast.message}</span>
          <button className="ftt-toast-close" onClick={() => setToast(null)}>
            <FiX />
          </button>
        </div>
      )}

      {/* Hero Header */}
      <header className="ftt-hero">
        <div className="ftt-hero-mesh" />
        <div className="ftt-hero-content">
          <div className="ftt-hero-top-row">
            <div className="ftt-badge-live">
              <span className="ftt-pulse-dot" />
              <span>FACULTY ACADEMIC SCHEDULE & CLASS TIMETABLE</span>
            </div>

            <div className="ftt-user-pill">
              <FiUser className="ftt-pill-ic" />
              <span>{facultyUser.name}</span>
              <span className="ftt-pill-divider">•</span>
              <span className="ftt-pill-sub">{facultyUser.dept}</span>
            </div>
          </div>

          <div className="ftt-hero-main">
            <div className="ftt-hero-titles">
              <h1 className="ftt-hero-title">
                Academic <span className="ftt-gradient-text">Timetable</span> 📅
              </h1>
              <p className="ftt-hero-desc">
                Review your weekly teaching workload, room allocations, practical lab slots, and jump directly to student attendance or marks entry.
              </p>
            </div>

            <div className="ftt-hero-actions">
              {/* Schedule Scope Toggle */}
              <div className="ftt-scope-toggle">
                <button
                  className={`ftt-scope-btn ${scheduleScope === "MY_CLASSES" ? "active" : ""}`}
                  onClick={() => setScheduleScope("MY_CLASSES")}
                >
                  <FiUser /> My Schedule
                </button>
                <button
                  className={`ftt-scope-btn ${scheduleScope === "ALL_CLASSES" ? "active" : ""}`}
                  onClick={() => setScheduleScope("ALL_CLASSES")}
                >
                  <FiUsers /> Master Schedule
                </button>
              </div>

              <button
                className={`ftt-btn-glow secondary ${refreshing ? "spinning" : ""}`}
                onClick={fetchTimetable}
                title="Refresh Timetable"
              >
                <FiRefreshCw className="ftt-btn-ic" />
                <span>Refresh</span>
              </button>

              <button className="ftt-btn-glow secondary print-hide" onClick={handlePrint} title="Print Schedule">
                <FiPrinter className="ftt-btn-ic" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* HUD Analytics Metrics */}
          <div className="ftt-hud-grid">
            <div className="ftt-hud-card">
              <div className="ftt-hud-icon ic-cyan">
                <FiCalendar />
              </div>
              <div className="ftt-hud-info">
                <span className="ftt-hud-val">{metrics.totalWeekly}</span>
                <span className="ftt-hud-lbl">Total Weekly Sessions</span>
              </div>
            </div>

            <div className="ftt-hud-card">
              <div className="ftt-hud-icon ic-emerald">
                <FiActivity />
              </div>
              <div className="ftt-hud-info">
                <span className="ftt-hud-val">{metrics.todayCount}</span>
                <span className="ftt-hud-lbl">Scheduled Today ({todayKey})</span>
              </div>
            </div>

            <div className="ftt-hud-card">
              <div className="ftt-hud-icon ic-indigo">
                <FiBook />
              </div>
              <div className="ftt-hud-info">
                <span className="ftt-hud-val">
                  {metrics.lectureCount} Lec / {metrics.labCount} Lab
                </span>
                <span className="ftt-hud-lbl">Session Breakdown</span>
              </div>
            </div>

            <div className="ftt-hud-card highlight">
              <div className="ftt-hud-icon ic-amber">
                <FiClock />
              </div>
              <div className="ftt-hud-info">
                {metrics.liveNowSlot ? (
                  <>
                    <span className="ftt-hud-val live">LIVE NOW</span>
                    <span className="ftt-hud-lbl">
                      {metrics.liveNowSlot.subject} ({metrics.liveNowSlot.room})
                    </span>
                  </>
                ) : metrics.nextUpcomingSlot ? (
                  <>
                    <span className="ftt-hud-val">
                      {format12Hour(metrics.nextUpcomingSlot.start_time)}
                    </span>
                    <span className="ftt-hud-lbl">
                      Next: {metrics.nextUpcomingSlot.subject}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="ftt-hud-val">All Done</span>
                    <span className="ftt-hud-lbl">No more classes today</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Day Selector Navigation */}
      <section className="ftt-day-tabs-wrap print-hide">
        <div className="ftt-day-tabs">
          {DAYS.map((d) => {
            const countForDay = scopedSlots.filter((s) => s.day === d.key).length;
            const isToday = d.key === todayKey;
            const isActive = activeDay === d.key;

            return (
              <button
                key={d.key}
                className={`ftt-day-tab ${isActive ? "active" : ""} ${isToday ? "is-today" : ""}`}
                onClick={() => {
                  setActiveDay(d.key);
                  if (viewLayout === "weekly") setViewLayout("timeline");
                }}
              >
                <div className="ftt-dt-top">
                  <span className="ftt-dt-short">{d.short}</span>
                  {isToday && <span className="ftt-today-badge">TODAY</span>}
                </div>
                <div className="ftt-dt-bottom">
                  <span className="ftt-dt-name">{d.label}</span>
                  <span className="ftt-dt-count">{countForDay} {countForDay === 1 ? "Slot" : "Slots"}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Filter & Controls Workbench */}
      <section className="ftt-workbench print-hide">
        <div className="ftt-wb-top">
          {/* Search Box */}
          <div className="ftt-search-box">
            <FiSearch className="ftt-search-ic" />
            <input
              type="text"
              placeholder="Search by subject, subject code, room number, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="ftt-search-clear" onClick={() => setSearchQuery("")}>
                <FiX />
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="ftt-wb-views">
            <button
              className={`ftt-view-btn ${viewLayout === "timeline" ? "active" : ""}`}
              onClick={() => setViewLayout("timeline")}
            >
              <FiList /> Timeline View
            </button>
            <button
              className={`ftt-view-btn ${viewLayout === "grid" ? "active" : ""}`}
              onClick={() => setViewLayout("grid")}
            >
              <FiGrid /> Period Cards
            </button>
            <button
              className={`ftt-view-btn ${viewLayout === "weekly" ? "active" : ""}`}
              onClick={() => setViewLayout("weekly")}
            >
              <FiCalendar /> Weekly Matrix
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="ftt-wb-filters">
          <div className="ftt-filter-group">
            <span className="ftt-fg-lbl">Course:</span>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              {COURSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="ftt-filter-group">
            <span className="ftt-fg-lbl">Semester:</span>
            <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
              <option value="ALL">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={String(s)}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          <div className="ftt-filter-group">
            <span className="ftt-fg-lbl">Type:</span>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              <option value="ALL">All Types</option>
              <option value="LECTURE">Lectures Only</option>
              <option value="LAB">Practical Labs Only</option>
              <option value="TUTORIAL">Tutorials / Review</option>
            </select>
          </div>

          {(selectedCourse !== "All Courses" || selectedSemester !== "ALL" || selectedType !== "ALL" || searchQuery) && (
            <button
              className="ftt-reset-btn"
              onClick={() => {
                setSelectedCourse("All Courses");
                setSelectedSemester("ALL");
                setSelectedType("ALL");
                setSearchQuery("");
              }}
            >
              Reset Filters
            </button>
          )}

          <div className="ftt-results-info">
            <span>
              Showing {currentDaySlots.length} sessions for {DAYS.find((d) => d.key === activeDay)?.label || activeDay}
            </span>
          </div>
        </div>
      </section>

      {/* Main Schedule Display */}
      <main className="ftt-schedule-board">
        {loading ? (
          <div className="ftt-loading-wrap">
            <div className="ftt-spinner" />
            <p>Loading academic timetable schedule...</p>
          </div>
        ) : errorMsg ? (
          <div className="ftt-error-wrap">
            <FiAlertCircle className="ftt-err-ic" />
            <p>{errorMsg}</p>
            <button className="ftt-btn-glow primary" onClick={fetchTimetable}>
              Try Again
            </button>
          </div>
        ) : viewLayout === "weekly" ? (
          /* ========================================================
             WEEKLY MATRIX OVERVIEW (All 6 Days)
          ======================================================== */
          <div className="ftt-weekly-grid">
            {DAYS.map((d) => {
              const dayList = weeklyMatrix[d.key] || [];
              const isToday = d.key === todayKey;

              return (
                <div key={d.key} className={`ftt-weekly-col ${isToday ? "is-today" : ""}`}>
                  <div className="ftt-wcol-header">
                    <div>
                      <span className="ftt-wcol-name">{d.label}</span>
                      {isToday && <span className="ftt-wcol-today-pill">TODAY</span>}
                    </div>
                    <span className="ftt-wcol-badge">{dayList.length}</span>
                  </div>

                  <div className="ftt-wcol-slots">
                    {dayList.length === 0 ? (
                      <div className="ftt-wcol-empty">
                        <span>No classes scheduled</span>
                      </div>
                    ) : (
                      dayList.map((slot, idx) => {
                        const typeCls = slot.type === "LAB" ? "type-lab" : slot.type === "TUTORIAL" ? "type-tut" : "type-lec";

                        return (
                          <div
                            key={`${slot.timeTable_id}-${idx}`}
                            className={`ftt-wcol-card ${typeCls}`}
                            onClick={() => setSelectedSlot(slot)}
                          >
                            <div className="ftt-wc-time">
                              <FiClock />
                              <span>
                                {format12Hour(slot.start_time)} – {format12Hour(slot.end_time)}
                              </span>
                            </div>

                            <strong className="ftt-wc-sub">{slot.subject}</strong>

                            <div className="ftt-wc-meta">
                              <span>
                                🏫 {slot.course} (Sem {slot.semester})
                              </span>
                              <span>📍 {slot.room}</span>
                            </div>

                            <div className="ftt-wc-bottom">
                              <span className={`ftt-type-tag ${typeCls}`}>{slot.type}</span>
                              <span className="ftt-wc-fac">{slot.faculty_name}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : currentDaySlots.length === 0 ? (
          /* EMPTY STATE */
          <div className="ftt-empty-state">
            <div className="ftt-empty-icon">🏖️</div>
            <h3>No classes scheduled for {DAYS.find((d) => d.key === activeDay)?.label || activeDay}</h3>
            <p>
              {searchQuery || selectedCourse !== "All Courses" || selectedSemester !== "ALL" || selectedType !== "ALL"
                ? "No schedule matches your active filters. Try resetting the filters above."
                : `You have a free period or no classes allocated on this day.`}
            </p>
            {scheduleScope === "MY_CLASSES" && (
              <button
                className="ftt-btn-glow secondary"
                onClick={() => setScheduleScope("ALL_CLASSES")}
              >
                View Department Master Schedule
              </button>
            )}
          </div>
        ) : viewLayout === "timeline" ? (
          /* ========================================================
             TIMELINE VIEW
          ======================================================== */
          <div className="ftt-timeline-container">
            {currentDaySlots.map((slot, idx) => {
              const status = checkSlotStatus(slot.day, slot.start_time, slot.end_time);
              const duration = getDurationMinutes(slot.start_time, slot.end_time);
              const typeCls = slot.type === "LAB" ? "type-lab" : slot.type === "TUTORIAL" ? "type-tut" : "type-lec";

              return (
                <div
                  key={slot.timeTable_id}
                  className={`ftt-timeline-item ${status === "LIVE" ? "is-live" : ""} ${typeCls}`}
                >
                  {/* Timeline Time Indicator */}
                  <div className="ftt-tl-time-block">
                    <div className="ftt-tl-start">{format12Hour(slot.start_time)}</div>
                    <div className="ftt-tl-dur">{duration} mins</div>
                    <div className="ftt-tl-end">{format12Hour(slot.end_time)}</div>

                    {status === "LIVE" && <span className="ftt-live-glow-tag">LIVE NOW</span>}
                  </div>

                  {/* Connector Line & Dot */}
                  <div className="ftt-tl-spine">
                    <div className={`ftt-tl-dot ${status === "LIVE" ? "live" : ""}`} />
                    <div className="ftt-tl-line" />
                  </div>

                  {/* Card Content */}
                  <div className="ftt-tl-card" onClick={() => setSelectedSlot(slot)}>
                    <div className="ftt-tlc-head">
                      <div className="ftt-tlc-badges">
                        <span className={`ftt-type-tag ${typeCls}`}>{slot.type}</span>
                        <span className="ftt-course-tag">
                          {slot.course} • Sem {slot.semester} {slot.batch ? `(${slot.batch})` : ""}
                        </span>
                        {slot.subject_code && (
                          <span className="ftt-code-tag">Code: {slot.subject_code}</span>
                        )}
                      </div>

                      <div className="ftt-tlc-room">
                        <FiMapPin />
                        <span>{slot.room}</span>
                      </div>
                    </div>

                    <div className="ftt-tlc-body">
                      <h3 className="ftt-tlc-subject">{slot.subject}</h3>
                      {slot.note && <p className="ftt-tlc-note">📝 {slot.note}</p>}
                    </div>

                    <div className="ftt-tlc-footer">
                      <div className="ftt-tlc-faculty">
                        <FiUser className="ftt-fac-ic" />
                        <span>{slot.faculty_name}</span>
                      </div>

                      <div className="ftt-tlc-quick-actions" onClick={(e) => e.stopPropagation()}>
                        {slot.meet_link && (
                          <a
                            href={slot.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ftt-btn-mini meet"
                            title="Join Virtual Meet"
                          >
                            <FiVideo /> Online Link
                          </a>
                        )}

                        <button
                          className="ftt-btn-mini attendance"
                          onClick={() => navigateToAttendance(slot)}
                          title="Take Attendance for this Batch"
                        >
                          <FiCheckCircle /> Attendance
                        </button>

                        <button
                          className="ftt-btn-mini marks"
                          onClick={() => navigateToMarks(slot)}
                          title="Upload Marks for this Subject"
                        >
                          <FiAward /> Marks
                        </button>

                        <button
                          className="ftt-btn-mini inspect"
                          onClick={() => setSelectedSlot(slot)}
                          title="Inspect Details"
                        >
                          <FiInfo />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ========================================================
             GRID PERIOD CARDS VIEW
          ======================================================== */
          <div className="ftt-grid-cards">
            {currentDaySlots.map((slot, idx) => {
              const status = checkSlotStatus(slot.day, slot.start_time, slot.end_time);
              const duration = getDurationMinutes(slot.start_time, slot.end_time);
              const typeCls = slot.type === "LAB" ? "type-lab" : slot.type === "TUTORIAL" ? "type-tut" : "type-lec";

              return (
                <div
                  key={slot.timeTable_id}
                  className={`ftt-period-card ${typeCls} ${status === "LIVE" ? "is-live" : ""}`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  <div className="ftt-pc-top">
                    <div className="ftt-pc-num">P{idx + 1}</div>
                    <span className={`ftt-type-tag ${typeCls}`}>{slot.type}</span>
                    {status === "LIVE" && <span className="ftt-live-pill">LIVE NOW</span>}
                  </div>

                  <div className="ftt-pc-time">
                    <FiClock />
                    <span>
                      {format12Hour(slot.start_time)} – {format12Hour(slot.end_time)} ({duration}m)
                    </span>
                  </div>

                  <h3 className="ftt-pc-subject">{slot.subject}</h3>

                  <div className="ftt-pc-meta">
                    <div className="ftt-pcm-item">
                      <FiLayers />
                      <span>
                        {slot.course} (Sem {slot.semester})
                      </span>
                    </div>
                    <div className="ftt-pcm-item">
                      <FiMapPin />
                      <span>{slot.room}</span>
                    </div>
                    <div className="ftt-pcm-item">
                      <FiUser />
                      <span>{slot.faculty_name}</span>
                    </div>
                  </div>

                  <div className="ftt-pc-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="ftt-pc-btn attend"
                      onClick={() => navigateToAttendance(slot)}
                    >
                      <FiCheckCircle /> Attendance
                    </button>
                    <button
                      className="ftt-pc-btn view"
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <FiInfo /> Inspect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ========================================================
          SLOT DETAIL MODAL
      ======================================================== */}
      {selectedSlot && (
        <div className="ftt-modal-overlay" onClick={() => setSelectedSlot(null)}>
          <div className="ftt-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="ftt-modal-header">
              <div className="ftt-modal-title-block">
                <span className={`ftt-type-tag ${selectedSlot.type === "LAB" ? "type-lab" : selectedSlot.type === "TUTORIAL" ? "type-tut" : "type-lec"}`}>
                  {selectedSlot.type}
                </span>
                <h2>{selectedSlot.subject}</h2>
                <p>
                  {selectedSlot.course} • Semester {selectedSlot.semester} {selectedSlot.batch ? `• Batch ${selectedSlot.batch}` : ""}
                </p>
              </div>
              <button className="ftt-modal-close" onClick={() => setSelectedSlot(null)}>
                <FiX />
              </button>
            </div>

            <div className="ftt-modal-body">
              <div className="ftt-detail-grid">
                <div className="ftt-detail-item">
                  <span className="ftt-di-lbl">Scheduled Day</span>
                  <span className="ftt-di-val">
                    {DAYS.find((d) => d.key === selectedSlot.day)?.label || selectedSlot.day}
                  </span>
                </div>

                <div className="ftt-detail-item">
                  <span className="ftt-di-lbl">Session Timing</span>
                  <span className="ftt-di-val">
                    {format12Hour(selectedSlot.start_time)} – {format12Hour(selectedSlot.end_time)}
                  </span>
                </div>

                <div className="ftt-detail-item">
                  <span className="ftt-di-lbl">Classroom / Lab Venue</span>
                  <span className="ftt-di-val">{selectedSlot.room}</span>
                </div>

                <div className="ftt-detail-item">
                  <span className="ftt-di-lbl">Faculty Instructor</span>
                  <span className="ftt-di-val">{selectedSlot.faculty_name}</span>
                </div>

                <div className="ftt-detail-item">
                  <span className="ftt-di-lbl">Subject Code</span>
                  <span className="ftt-di-val">{selectedSlot.subject_code || "N/A"}</span>
                </div>

                <div className="ftt-detail-item">
                  <span className="ftt-di-lbl">Session Status</span>
                  <span className="ftt-di-val green">{selectedSlot.status}</span>
                </div>
              </div>

              {selectedSlot.note && (
                <div className="ftt-note-box">
                  <strong>Notes & Syllabus Topics:</strong>
                  <p>{selectedSlot.note}</p>
                </div>
              )}

              {selectedSlot.meet_link && (
                <div className="ftt-meet-box">
                  <div className="ftt-mb-info">
                    <FiVideo className="ftt-mb-ic" />
                    <div>
                      <strong>Virtual Classroom Link</strong>
                      <span>{selectedSlot.meet_link}</span>
                    </div>
                  </div>
                  <div className="ftt-mb-actions">
                    <button
                      className="ftt-btn-glow secondary"
                      onClick={() => handleCopyLink(selectedSlot.meet_link)}
                    >
                      <FiCopy /> Copy
                    </button>
                    <a
                      href={selectedSlot.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ftt-btn-glow primary"
                    >
                      <FiExternalLink /> Join
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="ftt-modal-footer">
              <button
                className="ftt-btn-glow secondary"
                onClick={() => {
                  const s = selectedSlot;
                  setSelectedSlot(null);
                  navigateToMarks(s);
                }}
              >
                <FiAward /> Go to Marks Upload
              </button>

              <button
                className="ftt-btn-glow primary"
                onClick={() => {
                  const s = selectedSlot;
                  setSelectedSlot(null);
                  navigateToAttendance(s);
                }}
              >
                <FiCheckCircle /> Mark Student Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
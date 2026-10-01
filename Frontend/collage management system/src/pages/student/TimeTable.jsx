import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiCalendar,
  FiClock,
  FiBook,
  FiUser,
  FiMapPin,
  FiSearch,
  FiFilter,
  FiPrinter,
  FiDownload,
  FiLayers,
  FiVideo,
  FiCheckCircle,
  FiRefreshCw,
  FiExternalLink,
  FiX
} from "react-icons/fi";
import "../../layout/student/TimeTable.css";
import { getActiveStudentSession } from "../../utils/studentSession";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";
const API = {
  list: `${API_BASE}/Timetable/postTimetableData`,
};

const DAYS = [
  { key: "MON", label: "Monday", short: "Mon" },
  { key: "TUE", label: "Tuesday", short: "Tue" },
  { key: "WED", label: "Wednesday", short: "Wed" },
  { key: "THU", label: "Thursday", short: "Thu" },
  { key: "FRI", label: "Friday", short: "Fri" },
  { key: "SAT", label: "Saturday", short: "Sat" },
];

const dayKeyFromDate = (d = new Date()) => {
  const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return map[d.getDay()];
};

const fmt12 = (hhmm) => {
  if (!hhmm) return "--:--";
  const [h, m] = String(hhmm).split(":").map(Number);
  if (isNaN(h)) return hhmm;
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m || 0).padStart(2, "0")} ${ampm}`;
};

const normalizeRows = (res) => {
  const raw = Array.isArray(res) ? res : res?.message || res?.data || [];
  const arr = Array.isArray(raw) ? raw : [];

  return arr
    .map((x, idx) => ({
      id: x.id ?? x.tt_id ?? x.timetable_id ?? idx + 1,
      day: String(x.day || x.day_name || "").toUpperCase(),
      start: String(x.start || x.start_time || x.stime || "").slice(0, 5),
      end: String(x.end || x.end_time || x.etime || "").slice(0, 5),
      subject: x.subject || x.sub_name || x.title || "—",
      code: x.code || x.sub_code || x.subject_code || "",
      faculty:
        x.faculty ||
        x.staff_name ||
        x.teacher ||
        x.faculty_name ||
        x.teacher_name ||
        x.staff ||
        x.user_name ||
        x.name ||
        "—",
      room: x.room || x.classroom || x.location || "—",
      type: String(x.type || x.class_type || "LECTURE").toUpperCase(),
      note: x.note || x.remark || "",
      meet_link: x.meet_link || "",
    }))
    .filter((r) => r.day && r.start && r.end);
};

export default function StudentTimeTableTable() {
  const todayKey = dayKeyFromDate(new Date());
  const [activeDay, setActiveDay] = useState(todayKey === "SUN" ? "MON" : todayKey);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [type, setType] = useState("ALL");

  const student = useMemo(() => getActiveStudentSession(), []);

  const fetchTT = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await axios.post(
        API.list,
        {
          student_id: student.id,
          course: student.course,
          semester: student.semester,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const rows = normalizeRows(data);
      setItems(rows);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load timetable");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTT();
  }, [student]);

  const filteredDayItems = useMemo(() => {
    return items
      .filter((x) => x.day === activeDay)
      .filter((x) => {
        if (type !== "ALL" && x.type !== type) return false;
        if (!q.trim()) return true;
        const s = q.trim().toLowerCase();
        return (
          x.subject.toLowerCase().includes(s) ||
          x.faculty.toLowerCase().includes(s) ||
          x.room.toLowerCase().includes(s) ||
          x.code.toLowerCase().includes(s)
        );
      })
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [items, activeDay, type, q]);

  const dayCounts = useMemo(() => {
    const map = { MON: 0, TUE: 0, WED: 0, THU: 0, FRI: 0, SAT: 0 };
    items.forEach((x) => {
      if (map[x.day] !== undefined) map[x.day]++;
    });
    return map;
  }, [items]);

  const handlePrint = () => {
    window.print();
  };

  const activeDayObj = DAYS.find((d) => d.key === activeDay) || DAYS[0];

  return (
    <div className="stt-pro-root">
      {/* 1. HERO COMMAND BANNER */}
      <section className="stt-hero-banner">
        <div className="stt-hero-left">
          <div className="stt-live-chip">
            <span className="stt-ping"></span>
            <span className="stt-live-txt">
              ACADEMIC SCHEDULE • {student.course} SEMESTER {student.semester}
            </span>
          </div>
          <h1 className="stt-hero-title">Academic Class Timetable</h1>
          <p className="stt-hero-sub">
            Track daily classroom lecture periods, practical laboratory sessions, and direct Google Meet lecture links.
          </p>
        </div>

        <div className="stt-hero-actions">
          <button
            className="stt-btn stt-btn-secondary"
            onClick={handlePrint}
            title="Print weekly schedule"
          >
            <FiPrinter />
            <span>Print Schedule</span>
          </button>

          <button
            className="stt-btn stt-btn-secondary"
            onClick={fetchTT}
            disabled={loading}
            title="Refresh timetable"
          >
            <FiRefreshCw className={loading ? "stt-spin" : ""} />
            <span>Sync</span>
          </button>
        </div>
      </section>

      {/* 2. INTERACTIVE DAY SELECTOR STRIP */}
      <div className="stt-days-strip">
        {DAYS.map((d) => {
          const isActive = activeDay === d.key;
          const isToday = todayKey === d.key;
          const count = dayCounts[d.key] || 0;

          return (
            <button
              key={d.key}
              className={`stt-day-tab ${isActive ? "active" : ""}`}
              onClick={() => setActiveDay(d.key)}
            >
              <div className="stt-day-tab-head">
                <span className="stt-day-label">{d.label}</span>
                {isToday && <span className="stt-today-badge">TODAY</span>}
              </div>
              <span className="stt-day-count">
                {count} {count === 1 ? "Session" : "Sessions"}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. SEARCH & TYPE FILTER TOOLBAR */}
      <section className="stt-deck-panel">
        <div className="stt-filter-row">
          <div className="stt-search-field">
            <FiSearch className="stt-search-icon" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search subject title, professor name, classroom hall..."
            />
            {q && (
              <button
                style={{
                  position: "absolute",
                  right: "12px",
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                onClick={() => setQ("")}
              >
                <FiX />
              </button>
            )}
          </div>

          <div className="stt-select-group">
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="ALL">All Session Formats</option>
              <option value="LECTURE">Theory Lectures</option>
              <option value="LAB">Lab Practicals</option>
              <option value="TUTORIAL">Tutorials & Discussions</option>
            </select>
          </div>

          <div style={{ fontSize: "13px", color: "#94a3b8", fontWeight: "600" }}>
            Showing <b>{filteredDayItems.length}</b> periods on {activeDayObj.label}
          </div>
        </div>

        {/* 4. PERIOD SCHEDULE CARDS GRID */}
        <div className="stt-schedule-container">
          {loading ? (
            <div className="stt-skel-container">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="stt-skel-card" />
              ))}
            </div>
          ) : filteredDayItems.length ? (
            <div className="stt-slots-grid">
              {filteredDayItems.map((slot, idx) => (
                <div className="stt-slot-card" key={slot.id || idx}>
                  <div className="stt-slot-head">
                    <div className="stt-time-pill">
                      <FiClock size={13} />
                      <span>
                        {fmt12(slot.start)} – {fmt12(slot.end)}
                      </span>
                    </div>

                    <span className={`stt-type-tag ${slot.type.toLowerCase()}`}>
                      {slot.type}
                    </span>
                  </div>

                  <div className="stt-slot-body">
                    <div className="stt-subject-line">
                      <h3 className="stt-subject-title">{slot.subject}</h3>
                      {slot.code && <span className="stt-code-badge">{slot.code}</span>}
                    </div>

                    <div className="stt-meta-item">
                      <FiUser className="stt-meta-icon" />
                      <span>Faculty: <b>{slot.faculty}</b></span>
                    </div>

                    <div className="stt-meta-item">
                      <FiMapPin className="stt-meta-icon" />
                      <span>Room / Hall: <b>{slot.room}</b></span>
                    </div>

                    {slot.note && (
                      <p className="stt-slot-note">📝 Note: {slot.note}</p>
                    )}
                  </div>

                  {slot.meet_link && (
                    <div className="stt-slot-foot">
                      <a
                        href={slot.meet_link}
                        target="_blank"
                        rel="noreferrer"
                        className="stt-meet-link-btn"
                      >
                        <FiVideo />
                        <span>Join Online Classroom</span>
                        <FiExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="stt-empty-state">
              <div className="stt-empty-icon-box">
                <FiCalendar />
              </div>
              <h3>No Classes Scheduled for {activeDayObj.label}</h3>
              <p>You have no scheduled class periods for this day or no sessions match your search filter.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
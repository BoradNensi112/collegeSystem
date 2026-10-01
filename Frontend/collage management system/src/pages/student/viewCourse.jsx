import React, { useEffect, useMemo, useState } from "react";
import {
  FiBook,
  FiSearch,
  FiLayers,
  FiAward,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiEye,
  FiX,
  FiRefreshCw,
  FiChevronRight,
  FiBookOpen
} from "react-icons/fi";
import "../../layout/student/viewCourse.css";

const API_URL = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export default function StudentCourseView() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/Course/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: 1,
          limit: 200,
          search: "",
          status: "ACTIVE",
        }),
      });

      const data = await res.json();
      if (data?.success) {
        setCourses(Array.isArray(data.rows) ? data.rows : []);
      } else {
        setCourses([]);
      }
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;

    return courses.filter((item) => {
      const name = String(item.course_name || "").toLowerCase();
      const code = String(item.course_code || "").toLowerCase();
      const desc = String(item.description || "").toLowerCase();
      return name.includes(q) || code.includes(q) || desc.includes(q);
    });
  }, [courses, search]);

  const totalSubjects = useMemo(() => {
    return filteredCourses.reduce((sum, item) => {
      return sum + (Array.isArray(item.subjects) ? item.subjects.length : 0);
    }, 0);
  }, [filteredCourses]);

  const getGroupedSubjects = (subjects = []) => {
    const grouped = {};
    subjects.forEach((sub) => {
      const sem = Number(sub.semester || 1);
      if (!grouped[sem]) grouped[sem] = [];
      grouped[sem].push(sub);
    });
    return grouped;
  };

  return (
    <div className="scv-pro-root">
      {/* 1. HERO COMMAND BANNER */}
      <section className="scv-hero-banner">
        <div className="scv-hero-left">
          <div className="scv-live-chip">
            <span className="scv-ping"></span>
            <span className="scv-live-txt">UNIVERSITY CURRICULUM & DEGREE PROGRAMS</span>
          </div>
          <h1 className="scv-hero-title">Academic Courses & Syllabi</h1>
          <p className="scv-hero-sub">
            Browse registered undergraduate & postgraduate degree streams, semester structures, and subject credit curriculums.
          </p>
        </div>

        <div className="scv-hero-actions">
          <button
            className="scv-btn scv-btn-secondary"
            onClick={fetchCourses}
            disabled={loading}
            title="Refresh courses"
          >
            <FiRefreshCw className={loading ? "scv-spin" : ""} />
            <span>Sync</span>
          </button>
        </div>
      </section>

      {/* 2. KPI METRIC STATS */}
      <section className="scv-kpi-grid">
        <div className="scv-kpi-card">
          <div className="scv-kpi-header">
            <span className="scv-kpi-label">Active Degree Programs</span>
            <div className="scv-kpi-icon-wrap primary">
              <FiBookOpen size={18} />
            </div>
          </div>
          <div className="scv-kpi-val">{courses.length}</div>
          <div className="scv-kpi-meta">
            <span className="scv-kpi-hint">Accredited university streams</span>
          </div>
        </div>

        <div className="scv-kpi-card">
          <div className="scv-kpi-header">
            <span className="scv-kpi-label">Total Core Subjects</span>
            <div className="scv-kpi-icon-wrap cyan">
              <FiLayers size={18} />
            </div>
          </div>
          <div className="scv-kpi-val cyan">{totalSubjects}</div>
          <div className="scv-kpi-meta">
            <span className="scv-kpi-hint">Theory & practical lab modules</span>
          </div>
        </div>

        <div className="scv-kpi-card">
          <div className="scv-kpi-header">
            <span className="scv-kpi-label">Academic Evaluation</span>
            <div className="scv-kpi-icon-wrap success">
              <FiAward size={18} />
            </div>
          </div>
          <div className="scv-kpi-val success">CBCS / UGC</div>
          <div className="scv-kpi-meta">
            <span className="scv-kpi-hint">Choice Based Credit System</span>
          </div>
        </div>
      </section>

      {/* 3. SEARCH & DECK PANEL */}
      <section className="scv-deck-panel">
        <div className="scv-filter-row">
          <div className="scv-search-field">
            <FiSearch className="scv-search-icon" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search course title, program code, syllabus keywords..."
            />
            {search && (
              <button className="scv-clear-btn" onClick={() => setSearch("")}>
                <FiX />
              </button>
            )}
          </div>

          <div className="scv-results-counter">
            <span>Showing <b>{filteredCourses.length}</b> degree programs</span>
          </div>
        </div>

        {/* 4. COURSES GRID */}
        <div className="scv-grid-container">
          {loading ? (
            <div className="scv-skel-grid">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="scv-skel-card" />
              ))}
            </div>
          ) : filteredCourses.length ? (
            <div className="scv-cards-grid">
              {filteredCourses.map((c) => {
                const subCount = Array.isArray(c.subjects) ? c.subjects.length : 0;
                return (
                  <div
                    className="scv-course-card"
                    key={c.course_id || c.id}
                    onClick={() => setSelectedCourse(c)}
                  >
                    <div className="scv-card-top">
                      <span className="scv-code-badge">{c.course_code || "DEGREE"}</span>
                      <span className="scv-sem-tag">{c.total_semesters || 6} Semesters</span>
                    </div>

                    <h3 className="scv-course-title">{c.course_name}</h3>
                    <p className="scv-course-desc">{c.description || "Comprehensive university academic degree syllabus curriculum."}</p>

                    <div className="scv-course-meta-grid">
                      <div className="scv-meta-box">
                        <span className="k">Duration</span>
                        <span className="v">{c.duration_years || (c.total_semesters ? Math.ceil(c.total_semesters / 2) : 3)} Years</span>
                      </div>
                      <div className="scv-meta-box">
                        <span className="k">Curriculum</span>
                        <span className="v">{subCount} Subjects</span>
                      </div>
                    </div>

                    <div className="scv-card-foot">
                      <button className="scv-view-btn">
                        <span>View Semester Curriculum</span>
                        <FiChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="scv-empty-state">
              <div className="scv-empty-icon-box">
                <FiBookOpen />
              </div>
              <h3>No Academic Courses Found</h3>
              <p>No registered courses match your active search query.</p>
            </div>
          )}
        </div>
      </section>

      {/* CURRICULUM DRAWER MODAL */}
      {selectedCourse && (
        <div className="scv-modal-backdrop" onClick={() => setSelectedCourse(null)}>
          <div className="scv-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="scv-modal-header">
              <div className="scv-modal-title-group">
                <span className="scv-code-badge">{selectedCourse.course_code}</span>
                <h3 className="scv-modal-title">{selectedCourse.course_name}</h3>
                <p className="scv-modal-sub">
                  {selectedCourse.total_semesters || 6} Semesters • {selectedCourse.duration_years || 3} Years Duration
                </p>
              </div>

              <button className="scv-modal-close" onClick={() => setSelectedCourse(null)}>
                <FiX size={18} />
              </button>
            </div>

            <div className="scv-modal-body">
              <div className="scv-syllabus-container">
                {Object.entries(getGroupedSubjects(selectedCourse.subjects || [])).length ? (
                  Object.entries(getGroupedSubjects(selectedCourse.subjects || [])).map(([sem, subs]) => (
                    <div className="scv-sem-block" key={sem}>
                      <div className="scv-sem-head">
                        <h4>Semester {sem}</h4>
                        <span className="scv-sem-badge">{subs.length} Subjects</span>
                      </div>

                      <div className="scv-subs-grid">
                        {subs.map((s, idx) => (
                          <div className="scv-sub-item" key={s.subject_id || idx}>
                            <div className="scv-sub-info">
                              <h5>{s.subject_name || s.name}</h5>
                              <span className="scv-sub-code">{s.subject_code || `SUB-${idx + 1}`}</span>
                            </div>
                            <span className="scv-sub-type">{s.type || "Theory"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="scv-empty-strip">
                    <span>Full subject breakdown will be uploaded for upcoming semester cycles.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="scv-modal-footer">
              <button
                className="scv-btn scv-btn-secondary"
                onClick={() => setSelectedCourse(null)}
              >
                Close Syllabus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
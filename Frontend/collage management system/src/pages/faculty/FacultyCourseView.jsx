import React, { useEffect, useMemo, useState } from "react";
import {
  FiBook,
  FiSearch,
  FiX,
  FiLayers,
  FiCalendar,
  FiAward,
  FiRefreshCw,
  FiChevronRight
} from "react-icons/fi";
import "../../layout/faculty/viewCourses.css";

const API_URL = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export default function FacultyCourseView() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/Course/list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
    } catch (error) {
      console.error("FACULTY COURSE FETCH ERROR =>", error);
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

    return courses.filter((item) => {
      const name = String(item.course_name || "").toLowerCase();
      const code = String(item.course_code || "").toLowerCase();
      const desc = String(item.description || "").toLowerCase();

      const matchesSearch = !q || name.includes(q) || code.includes(q) || desc.includes(q);

      let matchesCat = true;
      if (categoryFilter === "ug") {
        matchesCat = name.includes("bachelor") || code.includes("b") || code.includes("bca") || code.includes("b.tech") || code.includes("bba");
      } else if (categoryFilter === "pg") {
        matchesCat = name.includes("master") || code.includes("m") || code.includes("mca") || code.includes("m.tech");
      }

      return matchesSearch && matchesCat;
    });
  }, [courses, search, categoryFilter]);

  const totalSubjects = useMemo(() => {
    return filteredCourses.reduce((sum, item) => {
      return sum + (Array.isArray(item.subjects) ? item.subjects.length : 0);
    }, 0);
  }, [filteredCourses]);

  const groupedSubjects = (subjects = []) => {
    const grouped = {};
    subjects.forEach((sub) => {
      const sem = Number(sub.semester || 1);
      if (!grouped[sem]) grouped[sem] = [];
      grouped[sem].push(sub);
    });
    return grouped;
  };

  return (
    <div className="fcv-page">
      {/* 1. HERO COMMAND BANNER */}
      <section className="fcv-hero">
        <div className="fcv-hero-content">
          <div className="fcv-badge">
            <span className="fcv-ping"></span>
            <span className="fcv-badge-txt">ACADEMIC CURRICULUM • COURSE STRUCTURE</span>
          </div>
          <h1>Academic Courses &amp; Syllabus</h1>
          <p>
            Explore degree programs, semester breakdowns, departmental subjects, and credit distribution for the current academic session.
          </p>
        </div>

        <div className="fcv-hero-stats">
          <div className="fcv-stat-card">
            <span>Total Programs</span>
            <strong>{filteredCourses.length}</strong>
          </div>
          <div className="fcv-stat-card">
            <span>Total Subjects</span>
            <strong className="purple">{totalSubjects}</strong>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY FILTER CHIPS STRIP */}
      <div className="fcv-cat-strip">
        <button
          className={`fcv-cat-chip ${categoryFilter === "all" ? "active" : ""}`}
          onClick={() => setCategoryFilter("all")}
        >
          All Programs ({courses.length})
        </button>
        <button
          className={`fcv-cat-chip ${categoryFilter === "ug" ? "active" : ""}`}
          onClick={() => setCategoryFilter("ug")}
        >
          Undergraduate (UG)
        </button>
        <button
          className={`fcv-cat-chip ${categoryFilter === "pg" ? "active" : ""}`}
          onClick={() => setCategoryFilter("pg")}
        >
          Postgraduate (PG)
        </button>
      </div>

      {/* 3. SEARCH & DECK PANEL */}
      <section className="fcv-deck-panel">
        <div className="fcv-filter-row">
          <div className="fcv-search-field">
            <FiSearch className="fcv-search-icon" />
            <input
              type="text"
              placeholder="Search by degree title, course code or departmental description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="fcv-clear-btn" onClick={() => setSearch("")}>
                <FiX />
              </button>
            )}
          </div>

          <div className="fcv-results-counter">
            Showing <b>{filteredCourses.length}</b> active academic courses
          </div>
        </div>

        {/* 4. COURSE CARDS GRID */}
        <div className="fcv-grid-container">
          {loading ? (
            <div className="fcv-empty">
              <FiRefreshCw style={{ animation: "spin 1s linear infinite", fontSize: "20px" }} />
              <p style={{ marginTop: "10px" }}>Loading university course curricula...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="fcv-empty">No matching courses found in academic records.</div>
          ) : (
            <div className="fcv-grid">
              {filteredCourses.map((item) => {
                const subjects = Array.isArray(item.subjects) ? item.subjects : [];
                const previewSubjects = subjects.slice(0, 4);

                return (
                  <div className="fcv-card" key={item.course_id}>
                    <div className="fcv-card-top">
                      <div>
                        <h2>{item.course_name}</h2>
                        <p>{item.course_code}</p>
                      </div>

                      <span className="fcv-pill">{item.status || "ACTIVE"}</span>
                    </div>

                    <div className="fcv-meta">
                      <div className="fcv-meta-box">
                        <small>Duration</small>
                        <strong>{item.duration_years || 0} Years</strong>
                      </div>
                      <div className="fcv-meta-box">
                        <small>Semesters</small>
                        <strong>{item.total_semesters || 0} Sems</strong>
                      </div>
                      <div className="fcv-meta-box">
                        <small>Subjects</small>
                        <strong>{subjects.length} Total</strong>
                      </div>
                    </div>

                    <div className="fcv-description">
                      {item.description?.trim()
                        ? item.description
                        : "Comprehensive degree curriculum approved by university academic board."}
                    </div>

                    <div className="fcv-subject-preview">
                      <h4>Core Curriculum Sample</h4>

                      {previewSubjects.length ? (
                        <div className="fcv-chip-wrap">
                          {previewSubjects.map((sub, index) => (
                            <div className="fcv-chip" key={index}>
                              <strong>{sub.subject_name}</strong>
                              <span>
                                {sub.subject_code || "Code"} • Sem {sub.semester || 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="fcv-no-subjects">No detailed subjects listed.</div>
                      )}
                    </div>

                    <div className="fcv-actions">
                      <button
                        className="fcv-btn-primary"
                        onClick={() => setSelectedCourse(item)}
                      >
                        <span>View Full Structure</span>
                        <FiChevronRight />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 5. COURSE DETAILS MODAL */}
      {selectedCourse && (
        <div className="fcv-modal-overlay" onClick={() => setSelectedCourse(null)}>
          <div className="fcv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fcv-modal-head">
              <div>
                <h2>{selectedCourse.course_name}</h2>
                <p>{selectedCourse.course_code} • Departmental Syllabus Structure</p>
              </div>

              <button
                className="fcv-close-btn"
                onClick={() => setSelectedCourse(null)}
              >
                <FiX />
              </button>
            </div>

            <div className="fcv-modal-meta">
              <div className="fcv-meta-box">
                <small>Duration</small>
                <strong>{selectedCourse.duration_years || 0} Years</strong>
              </div>
              <div className="fcv-meta-box">
                <small>Total Semesters</small>
                <strong>{selectedCourse.total_semesters || 0} Semesters</strong>
              </div>
              <div className="fcv-meta-box">
                <small>Total Subjects</small>
                <strong>
                  {Array.isArray(selectedCourse.subjects)
                    ? selectedCourse.subjects.length
                    : 0}
                </strong>
              </div>
            </div>

            <div className="fcv-modal-desc">
              {selectedCourse.description?.trim()
                ? selectedCourse.description
                : "Official university academic course outline."}
            </div>

            <div className="fcv-semester-list">
              {Object.keys(groupedSubjects(selectedCourse.subjects || [])).length === 0 ? (
                <div className="fcv-empty">No semester syllabus data uploaded for this course yet.</div>
              ) : (
                Object.keys(groupedSubjects(selectedCourse.subjects || []))
                  .sort((a, b) => Number(a) - Number(b))
                  .map((sem) => (
                    <div className="fcv-sem-card" key={sem}>
                      <div className="fcv-sem-head">Semester {sem} Subjects</div>

                      <div className="fcv-sem-body">
                        {groupedSubjects(selectedCourse.subjects || [])[sem].map(
                          (sub, index) => (
                            <div className="fcv-subject-item" key={index}>
                              <div>
                                <strong>{sub.subject_name || "-"}</strong>
                                <span>{sub.subject_code || "No Code"}</span>
                              </div>
                              <b>{sub.credits || 4} Credits</b>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
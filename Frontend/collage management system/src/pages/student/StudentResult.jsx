import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiAward,
  FiTrendingUp,
  FiBook,
  FiCheckCircle,
  FiPrinter,
  FiDownload,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiFileText,
  FiClock,
  FiCheck,
  FiX,
  FiCalendar,
  FiUser,
  FiChevronRight,
  FiShield,
  FiAlertTriangle
} from "react-icons/fi";
import "../../layout/student/studentResult.css";
import { getActiveStudentSession } from "../../utils/studentSession";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";
const API = {
  view: `${API_BASE}/Result/my`,
};

const autoGrade = (p) => {
  const x = Number(p || 0);
  if (x >= 90) return "A+";
  if (x >= 80) return "A";
  if (x >= 70) return "B+";
  if (x >= 60) return "B";
  if (x >= 50) return "C";
  if (x >= 40) return "D";
  return "F";
};

const formatDate = (dateStr) => {
  if (!dateStr) return "Published";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function StudentResult() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [results, setResults] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all"); // 'all' | 'A+' | 'A' | 'mid' | 'end' | sem
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const [printModal, setPrintModal] = useState(false);

  const student = useMemo(() => getActiveStudentSession(), []);

  const showToast = (message, type = "ok") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  const fetchResults = async () => {
    setLoading(true);
    setErr("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        API.view,
        { student_id: Number(student.id) },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      const raw = res?.data?.data || res?.data?.rows || res?.data || [];
      const list = Array.isArray(raw) ? raw : [];
      setResults(list);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load examination results");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [student.id]);

  // Handle ESC key to close open modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedResult(null);
        setPrintModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute Overall Performance Summary
  const summary = useMemo(() => {
    if (!results.length) {
      return { totalExams: 0, totalMarks: 0, obtainedMarks: 0, overallPct: 0, overallGrade: "N/A" };
    }

    let tot = 0;
    let obt = 0;
    results.forEach((r) => {
      tot += Number(r.total_marks || 0);
      obt += Number(r.obtained_marks || 0);
    });

    const pct = tot > 0 ? (obt / tot) * 100 : 0;
    return {
      totalExams: results.length,
      totalMarks: tot,
      obtainedMarks: obt,
      overallPct: Number(pct.toFixed(2)),
      overallGrade: autoGrade(pct),
    };
  }, [results]);

  // Unique dynamic category filter options
  const categoryOptions = useMemo(() => {
    const list = [{ key: "all", label: `All Evaluations (${results.length})` }];

    const hasGradeAPlus = results.some((r) => String(r.grade).toUpperCase() === "A+");
    if (hasGradeAPlus) {
      const count = results.filter((r) => String(r.grade).toUpperCase() === "A+").length;
      list.push({ key: "A+", label: `Grade A+ (${count})` });
    }

    const hasGradeA = results.some((r) => String(r.grade).toUpperCase() === "A");
    if (hasGradeA) {
      const count = results.filter((r) => String(r.grade).toUpperCase() === "A").length;
      list.push({ key: "A", label: `Grade A (${count})` });
    }

    const sems = [...new Set(results.map((r) => r.semester).filter(Boolean))];
    sems.forEach((s) => {
      const count = results.filter((r) => r.semester === s).length;
      list.push({ key: `sem-${s}`, label: `Semester ${s} (${count})` });
    });

    return list;
  }, [results]);

  // Filtered Results based on search and active category
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      let matchesCategory = true;
      if (activeCategory === "A+" || activeCategory === "A") {
        matchesCategory = String(r.grade).toUpperCase() === activeCategory;
      } else if (activeCategory.startsWith("sem-")) {
        const semNum = Number(activeCategory.replace("sem-", ""));
        matchesCategory = Number(r.semester) === semNum;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        String(r.exam_name || "").toLowerCase().includes(q) ||
        String(r.course || "").toLowerCase().includes(q) ||
        String(r.grade || "").toLowerCase().includes(q) ||
        String(r.remark || "").toLowerCase().includes(q) ||
        String(r.semester || "").includes(q);

      return matchesCategory && matchesQuery;
    });
  }, [results, activeCategory, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="str-pro-root">
      {/* Toast Alert */}
      {toast && (
        <div className={`str-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. HERO COMMAND BANNER (Identical to Notices / Bulletin Header) */}
      <section className="str-hero-banner">
        <div className="str-hero-left">
          <div className="str-live-chip">
            <span className="str-ping"></span>
            <span className="str-live-txt">OFFICIAL EXAMINATION SCORECARDS & GRADE TRANSCRIPTS</span>
          </div>
          <h1 className="str-hero-title">Academic Results & Transcripts</h1>
          <p className="str-hero-sub">
            Verified institutional evaluation scorecards, honors letter grades, percentage distributions, and degree transcripts.
          </p>
        </div>

        <div className="str-hero-actions">
          <button
            className="str-btn str-btn-secondary"
            onClick={fetchResults}
            disabled={loading}
            title="Refresh examination records"
          >
            <FiRefreshCw className={loading ? "str-spin" : ""} />
            <span>Sync</span>
          </button>

          <button
            className="str-btn str-btn-secondary"
            onClick={() => setPrintModal(true)}
            title="Print official degree transcript"
          >
            <FiPrinter />
            <span>Print Grade Card</span>
          </button>
        </div>
      </section>

      {/* 2. CATEGORY CHIPS STRIP (Identical to Notices Category Bar) */}
      <div className="str-cat-strip">
        {categoryOptions.map((cat) => (
          <button
            key={cat.key}
            className={`str-cat-chip ${activeCategory === cat.key ? "active" : ""}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* 3. SEARCH & DECK PANEL (Identical to Notices Deck Panel) */}
      <section className="str-deck-panel">
        <div className="str-filter-row">
          <div className="str-search-field">
            <FiSearch className="str-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search examination title, subject, semester, grade, remarks..."
            />
            {searchQuery && (
              <button className="str-clear-btn" onClick={() => setSearchQuery("")}>
                <FiX />
              </button>
            )}
          </div>

          <div className="str-results-counter">
            <span>
              Showing <b>{filteredResults.length}</b> official results • Cumulative: <b className="text-success">{summary.overallPct}%</b> (Grade <b className="text-gold">{summary.overallGrade}</b>)
            </span>
          </div>
        </div>

        {/* 4. CONTENT CARDS GRID (Identical to Notices 2-Column Cards Grid) */}
        <div className="str-grid-container">
          {loading ? (
            <div className="str-skel-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="str-skel-card" />
              ))}
            </div>
          ) : filteredResults.length ? (
            <div className="str-cards-grid">
              {filteredResults.map((r) => {
                const pct = Number(r.percentage || 0);
                const grade = r.grade || autoGrade(pct);

                return (
                  <div
                    className="str-notice-card"
                    key={r.result_id}
                    onClick={() => setSelectedResult(r)}
                  >
                    <div className="str-card-top">
                      <span className={`str-cat-badge grade-${grade.toLowerCase().replace("+", "plus")}`}>
                        GRADE {grade}
                      </span>
                      <div className="str-date-badge">
                        <FiCalendar size={12} />
                        <span>{r.exam_year || new Date().getFullYear()} Session • {formatDate(r.declared_on)}</span>
                      </div>
                    </div>

                    <h3 className="str-card-title">{r.exam_name || "Mid-Semester Examination"}</h3>

                    {/* Progress Bar & Score Pill */}
                    <div className="str-score-box">
                      <div className="str-score-header">
                        <span className="str-score-marks">
                          Score: <b>{r.obtained_marks}</b> / {r.total_marks} Marks
                        </span>
                        <span className="str-score-pct">{pct.toFixed(2)}%</span>
                      </div>

                      <div className="str-progress-track">
                        <div
                          className={`str-progress-fill ${pct >= 75 ? "top" : pct >= 50 ? "good" : "pass"}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>

                    <p className="str-card-snippet">
                      {r.remark || "Standard university evaluation verified."} • {r.course || student.course} (Semester {r.semester ?? student.semester})
                    </p>

                    <div className="str-card-foot">
                      <div className="str-author-box">
                        <FiUser size={13} />
                        <span>Evaluator: Exam Committee</span>
                      </div>

                      <button className="str-read-btn" type="button">
                        <span>Scorecard Details</span>
                        <FiChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="str-empty-state">
              <div className="str-empty-icon-box">
                <FiAward />
              </div>
              <h3>No Examination Results Found</h3>
              <p>No declared results matched your active search query or selected category filter.</p>
              {(searchQuery || activeCategory !== "all") && (
                <button
                  className="str-btn str-btn-secondary"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                >
                  Reset Filter
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* SCORECARD DETAIL MODAL (Matching Notice Details Modal) */}
      {selectedResult && (
        <div className="str-modal-backdrop" onClick={() => setSelectedResult(null)}>
          <div className="str-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="str-modal-header">
              <div className="str-modal-title-group">
                <span className={`str-cat-badge grade-${(selectedResult.grade || autoGrade(selectedResult.percentage)).toLowerCase().replace("+", "plus")}`}>
                  GRADE {selectedResult.grade || autoGrade(selectedResult.percentage)}
                </span>
                <h3 className="str-modal-title">{selectedResult.exam_name}</h3>
                <div className="str-modal-meta">
                  <span>📅 Declared: {formatDate(selectedResult.declared_on)}</span>
                  <span>•</span>
                  <span>🎓 {selectedResult.course || student.course} Semester {selectedResult.semester || student.semester}</span>
                  <span>•</span>
                  <span>Session {selectedResult.exam_year || new Date().getFullYear()}</span>
                </div>
              </div>

              <button className="str-modal-close" onClick={() => setSelectedResult(null)}>
                <FiX size={18} />
              </button>
            </div>

            <div className="str-modal-body">
              <div className="str-detail-box">
                <div className="str-detail-row">
                  <span>Student Name:</span>
                  <b>{student.name} ({student.enrollment})</b>
                </div>
                <div className="str-detail-row">
                  <span>Marks Scored:</span>
                  <b className="text-success">{selectedResult.obtained_marks} / {selectedResult.total_marks} Marks</b>
                </div>
                <div className="str-detail-row">
                  <span>Calculated Percentage:</span>
                  <b className="text-success">{Number(selectedResult.percentage || 0).toFixed(2)}%</b>
                </div>
                <div className="str-detail-row">
                  <span>Letter Grade:</span>
                  <b className="text-gold">{selectedResult.grade || autoGrade(selectedResult.percentage)}</b>
                </div>
                <div className="str-detail-row">
                  <span>Institutional Remarks:</span>
                  <span>{selectedResult.remark || "First Class with Distinction - Standard university examination authenticated."}</span>
                </div>
              </div>
            </div>

            <div className="str-modal-footer">
              <button
                className="str-btn str-btn-secondary"
                onClick={() => setSelectedResult(null)}
              >
                Close Scorecard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL PRINTABLE TRANSCRIPT MODAL */}
      {printModal && (
        <div className="str-modal-backdrop" onClick={() => setPrintModal(false)}>
          <div className="str-print-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="str-modal-header no-print">
              <div className="str-modal-title-group">
                <span className="str-cat-badge">OFFICIAL GRADE TRANSCRIPT</span>
                <h3 className="str-modal-title">Cumulative Grade Sheet & Transcript</h3>
                <div className="str-modal-meta">
                  <span>Student: {student.name} ({student.enrollment})</span>
                  <span>•</span>
                  <span>{student.course} Semester {student.semester}</span>
                </div>
              </div>

              <div className="str-head-actions">
                <button className="str-btn str-btn-primary str-btn-xs" onClick={handlePrint}>
                  <FiPrinter size={14} />
                  <span>Print / Save PDF</span>
                </button>
                <button className="str-modal-close" onClick={() => setPrintModal(false)}>
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* PRINTABLE TRANSCRIPT DOCUMENT */}
            <div className="str-receipt-document" id="printable-results">
              {/* University Header */}
              <div className="str-doc-header">
                <div className="str-doc-crest">NAV</div>
                <div className="str-doc-titles">
                  <h2>NAVNEXT INSTITUTE OF HIGHER EDUCATION & TECHNOLOGY</h2>
                  <p className="str-doc-sub">
                    Accredited Grade 'A+' | Affiliated to State Technological University
                  </p>
                  <p className="str-doc-contact">
                    Office of the Controller of Examinations • exams@navnext.edu.in • +91 11 2345 6789
                  </p>
                </div>
                <div className="str-doc-type-badge">
                  <span>GRADE CARD</span>
                  <small>OFFICIAL TRANSCRIPT</small>
                </div>
              </div>

              <div className="str-doc-divider"></div>

              {/* Student Metadata Ribbon */}
              <div className="str-doc-ribbon">
                <div className="str-ribbon-item">
                  <span className="lbl">Student Scholar:</span>
                  <b className="val">{student.name}</b>
                </div>
                <div className="str-ribbon-item">
                  <span className="lbl">Enrollment No:</span>
                  <b className="val font-mono">{student.enrollment}</b>
                </div>
                <div className="str-ribbon-item">
                  <span className="lbl">Academic Program:</span>
                  <b className="val">{student.course} (Sem {student.semester})</b>
                </div>
                <div className="str-ribbon-item">
                  <span className="lbl">Cumulative Grade:</span>
                  <b className="val text-gold">{summary.overallGrade} ({summary.overallPct}%)</b>
                </div>
              </div>

              {/* Statistical Summary Bar */}
              <div className="str-doc-stats-bar">
                <div className="str-doc-stat-col">
                  <span>Total Evaluations</span>
                  <b>{summary.totalExams}</b>
                </div>
                <div className="str-doc-stat-col text-present">
                  <span>Total Marks Scored</span>
                  <b>{summary.obtainedMarks} / {summary.totalMarks}</b>
                </div>
                <div className="str-doc-stat-col text-present">
                  <span>Aggregate Percentage</span>
                  <b>{summary.overallPct}%</b>
                </div>
                <div className="str-doc-stat-col text-gold">
                  <span>Final Classification</span>
                  <b>{summary.overallGrade}</b>
                </div>
              </div>

              {/* Results Table */}
              <h4 className="str-doc-section-title">Evaluation Breakdown & Statement of Marks</h4>
              <table className="str-doc-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Examination Title</th>
                    <th>Semester / Session</th>
                    <th className="right">Max Marks</th>
                    <th className="right">Marks Obtained</th>
                    <th className="right">Percentage</th>
                    <th className="right">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={r.result_id || i}>
                      <td>{i + 1}</td>
                      <td className="bold">{r.exam_name}</td>
                      <td>Sem {r.semester} ({r.exam_year || 2026})</td>
                      <td className="right">{r.total_marks}</td>
                      <td className="right bold">{r.obtained_marks}</td>
                      <td className="right bold">{Number(r.percentage || 0).toFixed(2)}%</td>
                      <td className="right bold text-gold">{r.grade || autoGrade(r.percentage)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="bold right">Cumulative Total:</td>
                    <td className="bold right">{summary.totalMarks}</td>
                    <td className="bold right text-present">{summary.obtainedMarks}</td>
                    <td className="bold right text-present">{summary.overallPct}%</td>
                    <td className="bold right text-gold">{summary.overallGrade}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Certification & Signatures */}
              <div className="str-doc-footer-grid">
                <div className="str-doc-notes">
                  <p className="note-title"><b>Controller of Examinations Note:</b></p>
                  <p className="note-txt">
                    This official transcript is generated by the NavNext University ERP Examination Module.
                  </p>
                  <p className="note-disc">
                    * Minimum passing standard is 40% in each individual component and aggregate.
                  </p>
                </div>

                <div className="str-doc-signatures">
                  <div className="str-doc-seal">
                    <FiShield size={30} />
                    <span>AUTHENTICATED RECORD</span>
                  </div>
                  <div className="str-sign-line">
                    <div className="str-sign-placeholder">Controller of Exams</div>
                    <span>Controller of Examinations</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="str-modal-footer no-print">
              <button
                type="button"
                className="str-btn str-btn-secondary"
                onClick={() => setPrintModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="str-btn str-btn-primary"
                onClick={handlePrint}
              >
                <FiPrinter />
                <span>Print Official Grade Sheet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
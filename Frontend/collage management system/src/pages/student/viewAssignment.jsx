import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  FiFileText,
  FiSearch,
  FiDownload,
  FiUploadCloud,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiRefreshCw,
  FiX,
  FiCheck,
  FiCalendar,
  FiUser,
  FiChevronRight,
  FiExternalLink,
  FiLayers,
  FiAward,
  FiPaperclip
} from "react-icons/fi";
import "../../layout/student/viewAssignment.css";
import { getActiveStudentSession } from "../../utils/studentSession";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

const API = {
  list: `${API_BASE}/Assignment/postViewData`,
  details: `${API_BASE}/Assignment/postOneData`,
  submit: `${API_BASE}/Assignment/submit`,
  submittedByStudent: `${API_BASE}/Assignment/submitted-by-student`,
};

const allowedExt = ["pdf", "doc", "docx", "ppt", "pptx", "zip", "rar", "png", "jpg", "jpeg"];
const maxFileMB = 50;

function bytesToSize(bytes = 0) {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (!bytes) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function getExt(name = "") {
  const parts = String(name).split(".");
  return (parts[parts.length - 1] || "").toLowerCase();
}

function isOverdue(dueDate, status) {
  if (!dueDate) return false;
  if (String(status).toUpperCase() === "SUBMITTED") return false;
  const now = new Date();
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return false;
  return now.getTime() > due.getTime();
}

function formatDate(dateStr) {
  if (!dateStr) return "End of Term";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function resolveFileUrl(path = "") {
  if (!path) return "";
  const p = String(path).trim();
  if (!p) return "";
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  if (p.startsWith("/")) return `${API_BASE}${p}`;
  return `${API_BASE}/uploads/${p}`;
}

export default function StudentViewAssignment() {
  const student = useMemo(() => getActiveStudentSession(), []);

  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [submittedMap, setSubmittedMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all"); // 'all' | 'PENDING' | 'SUBMITTED' | 'OVERDUE' | subject

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form State
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    message: "",
    link: "",
    file: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "ok") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpenModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchSubmittedAssignments = async () => {
    try {
      const res = await axios.post(`${API_BASE}/Assignment/submitted-by-student`, {
        student_id: Number(student.id),
      });

      const raw = res?.data?.data || res?.data?.rows || res?.data || [];
      const rows = Array.isArray(raw) ? raw : [];

      const latestMap = {};
      for (const row of rows) {
        const aId = row.assignment_id || row.assignmentId || row.id;
        if (!aId) continue;
        const cId = Number(row.submit_id || row.id || 0);
        const pId = Number(latestMap[aId]?.submit_id || 0);
        if (!latestMap[aId] || cId > pId) {
          latestMap[aId] = row;
        }
      }
      return latestMap;
    } catch {
      return {};
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const [assignmentRes, submittedLatestMap] = await Promise.all([
        axios.post(`${API_BASE}/Assignment/postViewData`, {
          student_id: Number(student.id),
          course: student.course,
          semester: Number(student.sem),
        }),
        fetchSubmittedAssignments(),
      ]);

      const raw = assignmentRes?.data?.data || assignmentRes?.data?.rows || assignmentRes?.data || [];
      const rows = Array.isArray(raw) ? raw : [];

      setList(rows);
      setSubmittedMap(submittedLatestMap || {});
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to load coursework assignments", "err");
      setList([]);
      setSubmittedMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [student.id]);

  // Normalized Assignments with live submission status
  const normalizedAssignments = useMemo(() => {
    return (list || []).map((a, idx) => {
      const id = a.assignment_id || a.id || idx + 1;
      const latestSubmission = submittedMap[id] || null;

      const title = a.title || a.assignment_title || "Coursework Assignment";
      const dueDate = a.due_date || a.dueDate || a.deadline || null;
      const subj = a.subject || a.course || "General Subject";
      const totalMarks = a.total_marks || 100;

      const isSub = !!latestSubmission;
      const overdue = isOverdue(dueDate, isSub ? "SUBMITTED" : "PENDING");
      const status = isSub ? "SUBMITTED" : overdue ? "OVERDUE" : "PENDING";

      const rawFile = a.file_url || a.fileUrl || a.file || a.attachment || "";

      return {
        ...a,
        _id: id,
        _title: title,
        _due: dueDate,
        _subject: subj,
        _totalMarks: totalMarks,
        _status: status,
        _isSubmitted: isSub,
        _isOverdue: overdue,
        _fileUrl: resolveFileUrl(rawFile),
        _fileName: a.file_name || a.filename || "problem_statement.pdf",
        _desc: a.description || a.desc || "Comprehensive coursework task and evaluation guidelines.",
        _submission: latestSubmission
          ? {
              submit_id: latestSubmission.submit_id || "",
              message: latestSubmission.message || "",
              link: latestSubmission.link || "",
              file_url: resolveFileUrl(latestSubmission.file_url || ""),
              file_name: latestSubmission.file_name || "",
              status: latestSubmission.status || "SUBMITTED",
            }
          : null,
      };
    });
  }, [list, submittedMap]);

  // Dynamic Statistics
  const stats = useMemo(() => {
    const total = normalizedAssignments.length;
    const submitted = normalizedAssignments.filter((a) => a._isSubmitted).length;
    const pending = normalizedAssignments.filter((a) => !a._isSubmitted && !a._isOverdue).length;
    const overdue = normalizedAssignments.filter((a) => a._isOverdue).length;
    return { total, submitted, pending, overdue };
  }, [normalizedAssignments]);

  // Category Filter Options
  const categoryOptions = useMemo(() => {
    const list = [
      { key: "all", label: `All Coursework (${stats.total})` },
      { key: "PENDING", label: `Pending Tasks (${stats.pending})` },
      { key: "SUBMITTED", label: `Submitted & Graded (${stats.submitted})` },
    ];
    if (stats.overdue > 0) {
      list.push({ key: "OVERDUE", label: `Overdue (${stats.overdue})` });
    }

    const uniqueSubjects = [...new Set(normalizedAssignments.map((a) => a._subject).filter(Boolean))];
    uniqueSubjects.forEach((sub) => {
      const count = normalizedAssignments.filter((a) => a._subject === sub).length;
      list.push({ key: `sub-${sub}`, label: `${sub} (${count})` });
    });

    return list;
  }, [normalizedAssignments, stats]);

  // Filtered Assignments List
  const filteredAssignments = useMemo(() => {
    return normalizedAssignments.filter((a) => {
      let matchesCategory = true;
      if (activeCategory === "PENDING") matchesCategory = !a._isSubmitted && !a._isOverdue;
      else if (activeCategory === "SUBMITTED") matchesCategory = a._isSubmitted;
      else if (activeCategory === "OVERDUE") matchesCategory = a._isOverdue;
      else if (activeCategory.startsWith("sub-")) {
        const subName = activeCategory.replace("sub-", "");
        matchesCategory = a._subject === subName;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        a._title.toLowerCase().includes(q) ||
        a._subject.toLowerCase().includes(q) ||
        a._desc.toLowerCase().includes(q) ||
        String(a._id).includes(q);

      return matchesCategory && matchesQuery;
    });
  }, [normalizedAssignments, activeCategory, searchQuery]);

  // Open Details / Submission Modal
  const handleOpenDetails = async (a) => {
    setSelectedAssignment(a);
    setOpenModal(true);
    setProgress(0);
    setForm({
      message: a._submission?.message || "",
      link: a._submission?.link || "",
      file: null,
    });
    if (fileRef.current) fileRef.current.value = "";

    try {
      setDetailsLoading(true);
      const res = await axios.post(`${API_BASE}/Assignment/postOneData`, {
        assignment_id: a._id,
        id: a._id,
      });
      const data = res?.data?.data || res?.data;
      if (data && typeof data === "object") {
        setSelectedAssignment((prev) => ({
          ...prev,
          ...data,
          _desc: data.description || prev._desc,
          _fileUrl: data.file_url ? resolveFileUrl(data.file_url) : prev._fileUrl,
          _fileName: data.file_name || prev._fileName,
        }));
      }
    } catch {
      // ignore
    } finally {
      setDetailsLoading(false);
    }
  };

  const validateFile = (file) => {
    if (!file) return true;
    const sizeMB = file.size / (1024 * 1024);
    const ext = getExt(file.name);
    if (sizeMB > maxFileMB) return `Max file size is ${maxFileMB}MB`;
    if (!allowedExt.includes(ext)) return `File type .${ext} is not allowed`;
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validateFile(file);
    if (check !== true) {
      showToast(check, "err");
      if (fileRef.current) fileRef.current.value = "";
      setForm((p) => ({ ...p, file: null }));
      return;
    }
    setForm((p) => ({ ...p, file }));
  };

  // Submit Solution to Backend
  const handleSubmitAssignment = async (e) => {
    if (e) e.preventDefault();
    if (!selectedAssignment?._id) return;

    if (!form.file && !form.message.trim() && !form.link.trim()) {
      showToast("Please provide a solution file, repository link, or message note", "err");
      return;
    }

    try {
      setSubmitting(true);
      setProgress(0);

      const fd = new FormData();
      fd.append("assignment_id", selectedAssignment._id);
      fd.append("student_id", student.id);
      fd.append("studentId", student.id);
      fd.append("message", form.message.trim() || "");
      fd.append("link", form.link.trim() || "");

      if (form.file) {
        fd.append("file", form.file);
      }

      await axios.post(API.submit, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const percent = Math.round((evt.loaded * 100) / evt.total);
          setProgress(percent);
        },
      });

      showToast("Assignment solution submitted successfully for faculty evaluation!", "ok");
      setOpenModal(false);
      await fetchAssignments();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to submit assignment", "err");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stas-pro-root">
      {/* Toast Alert */}
      {toast && (
        <div className={`stas-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. HERO COMMAND BANNER (Identical to Notice Board / Attendance Header) */}
      <section className="stas-hero-banner">
        <div className="stas-hero-left">
          <div className="stas-live-chip">
            <span className="stas-ping"></span>
            <span className="stas-live-txt">COURSEWORK ASSIGNMENTS & LAB EVALUATIONS</span>
          </div>
          <h1 className="stas-hero-title">Academic Coursework & Submissions</h1>
          <p className="stas-hero-sub">
            Review assigned projects, practical lab problem sheets, track deadlines, and submit solution files directly for faculty grading.
          </p>
        </div>

        <div className="stas-hero-actions">
          <button
            className="stas-btn stas-btn-secondary"
            onClick={fetchAssignments}
            disabled={loading}
            title="Refresh assignments"
          >
            <FiRefreshCw className={loading ? "stas-spin" : ""} />
            <span>Sync</span>
          </button>
        </div>
      </section>

      {/* 2. CATEGORY CHIPS STRIP (Identical to Notice Board Category Bar) */}
      <div className="stas-cat-strip">
        {categoryOptions.map((cat) => (
          <button
            key={cat.key}
            className={`stas-cat-chip ${activeCategory === cat.key ? "active" : ""}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* 3. SEARCH & DECK PANEL (Identical to Notice Board Deck Panel) */}
      <section className="stas-deck-panel">
        <div className="stas-filter-row">
          <div className="stas-search-field">
            <FiSearch className="stas-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assignment title, subject, problem statement, task ID..."
            />
            {searchQuery && (
              <button className="stas-clear-btn" onClick={() => setSearchQuery("")}>
                <FiX />
              </button>
            )}
          </div>

          <div className="stas-results-counter">
            <span>
              Showing <b>{filteredAssignments.length}</b> tasks • Pending: <b className="text-danger">{stats.pending}</b> • Submitted: <b className="text-success">{stats.submitted}</b>
            </span>
          </div>
        </div>

        {/* 4. CONTENT CARDS GRID (Identical to Notice Board 2-Column Cards Grid) */}
        <div className="stas-grid-container">
          {loading ? (
            <div className="stas-skel-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="stas-skel-card" />
              ))}
            </div>
          ) : filteredAssignments.length ? (
            <div className="stas-cards-grid">
              {filteredAssignments.map((a) => {
                return (
                  <div
                    className="stas-notice-card"
                    key={a._id}
                    onClick={() => handleOpenDetails(a)}
                  >
                    <div className="stas-card-top">
                      <span className={`stas-cat-badge ${a._status.toLowerCase()}`}>
                        {a._status === "SUBMITTED"
                          ? "SUBMITTED"
                          : a._status === "OVERDUE"
                          ? "OVERDUE DEADLINE"
                          : "PENDING SUBMISSION"}
                      </span>
                      <div className="stas-date-badge">
                        <FiCalendar size={12} />
                        <span>Due: {formatDate(a._due)}</span>
                      </div>
                    </div>

                    <h3 className="stas-card-title">
                      {a._title}
                      <span className="stas-marks-tag">{a._totalMarks} Marks</span>
                    </h3>

                    {/* Subject & Class Info Box */}
                    <div className="stas-info-box">
                      <span className="stas-sub-pill">{a._subject}</span>
                      <span className="stas-class-text">{a.class_name || `${student.course} • Sem ${a.sem || student.sem}`}</span>
                    </div>

                    <p className="stas-card-snippet">{a._desc}</p>

                    <div className="stas-card-foot" onClick={(e) => e.stopPropagation()}>
                      <div className="stas-author-box">
                        <FiUser size={13} />
                        <span>Faculty Instructor</span>
                      </div>

                      <div className="stas-foot-actions">
                        {a._fileUrl && a._fileUrl !== "#" && (
                          <a
                            href={a._fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="stas-btn stas-btn-xs stas-btn-secondary"
                            title="Download problem sheet"
                          >
                            <FiPaperclip size={13} />
                            <span>Attachment</span>
                          </a>
                        )}

                        <button
                          className={`stas-btn stas-btn-xs ${a._isSubmitted ? "stas-btn-secondary" : "stas-btn-primary"}`}
                          onClick={() => handleOpenDetails(a)}
                        >
                          {a._isSubmitted ? (
                            <>
                              <FiCheck size={13} />
                              <span>View Submission</span>
                            </>
                          ) : (
                            <>
                              <FiUploadCloud size={13} />
                              <span>Submit Task</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="stas-empty-state">
              <div className="stas-empty-icon-box">
                <FiFileText />
              </div>
              <h3>No Coursework Tasks Found</h3>
              <p>No coursework assignments matched your active search query or selected category filter.</p>
              {(searchQuery || activeCategory !== "all") && (
                <button
                  className="stas-btn stas-btn-secondary"
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

      {/* 5. ASSIGNMENT DETAILS & SUBMISSION MODAL */}
      {openModal && selectedAssignment && (
        <div className="stas-modal-backdrop" onClick={() => setOpenModal(false)}>
          <div className="stas-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="stas-modal-header">
              <div className="stas-modal-title-group">
                <span className={`stas-cat-badge ${selectedAssignment._status.toLowerCase()}`}>
                  {selectedAssignment._status === "SUBMITTED"
                    ? "SUBMISSION CONFIRMED"
                    : selectedAssignment._status === "OVERDUE"
                    ? "OVERDUE SUBMISSION"
                    : "PENDING EVALUATION"}
                </span>
                <h3 className="stas-modal-title">{selectedAssignment._title}</h3>
                <div className="stas-modal-meta">
                  <span>📚 {selectedAssignment._subject}</span>
                  <span>•</span>
                  <span>🏆 {selectedAssignment._totalMarks} Marks</span>
                  <span>•</span>
                  <span>📅 Due: {formatDate(selectedAssignment._due)}</span>
                </div>
              </div>

              <button className="stas-modal-close" onClick={() => setOpenModal(false)}>
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment}>
              <div className="stas-modal-body">
                {/* Description Box */}
                <div className="stas-detail-box">
                  <span className="stas-field-lbl">Problem Statement & Faculty Guidelines:</span>
                  <p className="stas-detail-txt">{selectedAssignment._desc}</p>

                  {selectedAssignment._fileUrl && selectedAssignment._fileUrl !== "#" && (
                    <div className="stas-attach-row">
                      <span className="stas-attach-lbl">Attached Resource / Problem Sheet:</span>
                      <a
                        href={selectedAssignment._fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="stas-btn stas-btn-xs stas-btn-secondary"
                      >
                        <FiDownload size={13} />
                        <span>Download {selectedAssignment._fileName}</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Existing Submission Details if already submitted */}
                {selectedAssignment._submission && (
                  <div className="stas-submitted-banner">
                    <div className="stas-submitted-head">
                      <FiCheckCircle size={18} className="text-success" />
                      <b>Current Submission Record</b>
                    </div>
                    {selectedAssignment._submission.message && (
                      <p className="stas-submitted-sub">
                        <b>Student Notes:</b> {selectedAssignment._submission.message}
                      </p>
                    )}
                    {selectedAssignment._submission.link && (
                      <p className="stas-submitted-sub">
                        <b>Project URL:</b>{" "}
                        <a href={selectedAssignment._submission.link} target="_blank" rel="noreferrer">
                          {selectedAssignment._submission.link}
                        </a>
                      </p>
                    )}
                    {selectedAssignment._submission.file_url && (
                      <div className="stas-attach-row">
                        <span>Submitted Document:</span>
                        <a
                          href={selectedAssignment._submission.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="stas-btn stas-btn-xs stas-btn-secondary"
                        >
                          <FiDownload size={13} />
                          <span>Download Submitted Solution</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Solution Upload Form */}
                <div className="stas-form-grid">
                  <div className="stas-form-field">
                    <label>
                      {selectedAssignment._submission ? "Re-upload / Solution Notes" : "Solution Notes & Comments"}
                    </label>
                    <textarea
                      rows={3}
                      value={form.message}
                      onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                      placeholder="Explain your approach, libraries used, or execution steps..."
                    />
                  </div>

                  <div className="stas-form-field">
                    <label>Project Repository / Live URL (Optional)</label>
                    <input
                      type="url"
                      value={form.link}
                      onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))}
                      placeholder="https://github.com/username/project-repo"
                    />
                  </div>

                  <div className="stas-form-field">
                    <label>Upload Solution Document / Source Code (.pdf, .docx, .zip, .ppt)</label>
                    <div className="stas-dropzone" onClick={() => fileRef.current?.click()}>
                      <FiUploadCloud size={24} className="stas-drop-icon" />
                      <div className="stas-drop-text">
                        <span>{form.file ? form.file.name : "Click to select or drag solution file"}</span>
                        <small>{form.file ? bytesToSize(form.file.size) : "Max allowed size: 50MB"}</small>
                      </div>
                      <input
                        type="file"
                        ref={fileRef}
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar,.png,.jpg,.jpeg"
                        hidden
                      />
                    </div>
                  </div>

                  {progress > 0 && progress < 100 && (
                    <div className="stas-progress-box">
                      <div className="stas-progress-track">
                        <div className="stas-progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="stas-progress-text">Uploading... {progress}%</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="stas-modal-footer">
                <button
                  type="button"
                  className="stas-btn stas-btn-secondary"
                  onClick={() => setOpenModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="stas-btn stas-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <FiRefreshCw className="stas-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <FiUploadCloud />
                      <span>
                        {selectedAssignment._submission ? "Update Submission" : "Submit Assignment"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
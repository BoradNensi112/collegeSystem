import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiBookOpen,
  FiSearch,
  FiDownload,
  FiExternalLink,
  FiRefreshCw,
  FiFileText,
  FiUser,
  FiCalendar,
  FiFolder,
  FiLayers,
  FiX,
  FiEye,
  FiAward,
  FiCheckCircle,
  FiAlertCircle
} from "react-icons/fi";
import "../../layout/student/viewMaterial.css";
import { getActiveStudentSession } from "../../utils/studentSession";

const API_URL = `${import.meta.env.VITE_API_BASE || "http://localhost:5001"}/Material/postMaterialData`;
const FILE_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

// Format date helper
function formatDate(dateStr) {
  if (!dateStr) return "Recent";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Convert relative path to absolute URL
function resolveFileUrl(url) {
  if (!url || url === "#") return "";
  const s = String(url).trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `${FILE_BASE}${s}`;
  return `${FILE_BASE}/uploads/material/${s}`;
}

export default function StudentMaterials() {
  const student = useMemo(() => getActiveStudentSession(), []);

  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all"); // 'all' | 'Notes' | 'Slides' | 'Lab Manual' | 'Question Bank' | subject
  const [activeFormat, setActiveFormat] = useState("ALL"); // 'ALL' | 'PDF' | 'PPT' | 'DOC' | 'ZIP'
  const [selectedSemester, setSelectedSemester] = useState("ALL"); // 'ALL' | '4' | '6'
  const [sortBy, setSortBy] = useState("latest"); // 'latest' | 'oldest' | 'title'

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "ok") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpenModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await axios.post(API_URL, {});
      const raw = res?.data?.data || res?.data?.materials || res?.data || [];
      const list = Array.isArray(raw) ? raw : [];

      const normalized = list.map((m, idx) => {
        const id = m.id || m.material_id || idx + 1;
        const rawFile = m.fileUrl || m.file_path || m.file || m.url || "";
        const type = (m.type || (rawFile ? rawFile.split(".").pop() : "PDF")).toUpperCase();

        return {
          _id: id,
          title: m.title || "Academic Study Material",
          subject: m.subject || "General Science",
          courseId: m.courseId || m.course_id || null,
          semester: m.semester !== undefined ? Number(m.semester) : null,
          category: m.category || "Lecture Notes",
          type: type,
          description: m.description || "Comprehensive academic reference materials and notes uploaded by course faculty.",
          faculty: m.faculty || m.uploaded_by || "Faculty Instructor",
          fileUrl: resolveFileUrl(rawFile),
          fileName: m.file_name || `${(m.title || "study_resource").replace(/[^a-zA-Z0-9]/g, "_")}.${type.toLowerCase()}`,
          uploadedAt: m.createdAt || m.created_at || m.date || new Date(),
          active: m.active !== false,
          visibility: String(m.visibility || "ALL").toUpperCase(),
        };
      });

      setMaterials(normalized);
    } catch (err) {
      console.error("Failed to load study materials:", err);
      showToast("Unable to connect to academic repository", "err");
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Filtered List
  const filteredMaterials = useMemo(() => {
    let result = materials.filter((m) => m.active);

    // Filter by Semester if specified
    if (selectedSemester !== "ALL") {
      result = result.filter((m) => String(m.semester) === String(selectedSemester));
    }

    // Filter by Format
    if (activeFormat !== "ALL") {
      result = result.filter((m) => m.type.toUpperCase() === activeFormat);
    }

    // Filter by Category or Subject
    if (activeCategory !== "all") {
      if (activeCategory.startsWith("sub-")) {
        const targetSub = activeCategory.replace("sub-", "");
        result = result.filter((m) => m.subject === targetSub);
      } else {
        result = result.filter((m) => m.category.toLowerCase().includes(activeCategory.toLowerCase()));
      }
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.subject.toLowerCase().includes(q) ||
          m.faculty.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "latest") return new Date(b.uploadedAt) - new Date(a.uploadedAt);
      if (sortBy === "oldest") return new Date(a.uploadedAt) - new Date(b.uploadedAt);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });

    return result;
  }, [materials, selectedSemester, activeFormat, activeCategory, searchQuery, sortBy]);

  // Dynamic Categories & Subjects
  const categoryOptions = useMemo(() => {
    const list = [
      { key: "all", label: `All Resources (${materials.length})` },
      { key: "Lecture Notes", label: "Lecture Notes" },
      { key: "Presentation", label: "Slide Decks" },
      { key: "Lab Manual", label: "Lab Workbooks" },
      { key: "Question Bank", label: "Question Banks" },
      { key: "Reference", label: "Reference Books" },
    ];

    const uniqueSubjects = [...new Set(materials.map((m) => m.subject).filter(Boolean))];
    uniqueSubjects.forEach((sub) => {
      const count = materials.filter((m) => m.subject === sub).length;
      list.push({ key: `sub-${sub}`, label: `${sub} (${count})` });
    });

    return list;
  }, [materials]);

  // Dynamic Statistics
  const stats = useMemo(() => {
    const total = materials.length;
    const pdfCount = materials.filter((m) => m.type === "PDF").length;
    const currentSemCount = materials.filter((m) => m.semester === student.sem).length;
    const uniqueSubjects = new Set(materials.map((m) => m.subject)).size;

    return { total, pdfCount, currentSemCount, uniqueSubjects };
  }, [materials, student.sem]);

  const handleOpenDetails = (material) => {
    setSelectedMaterial(material);
    setOpenModal(true);
  };

  const handleDownload = (material, e) => {
    if (e) e.stopPropagation();
    if (!material.fileUrl || material.fileUrl === "#") {
      showToast("Download link not available for this resource", "err");
      return;
    }
    window.open(material.fileUrl, "_blank");
    showToast(`Opening ${material.title}...`, "ok");
  };

  return (
    <div className="stmat-pro-root">
      {/* Toast Alert */}
      {toast && (
        <div className={`stmat-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. HERO COMMAND BANNER (Identical to Notice Board / Assignment Theme) */}
      <section className="stmat-hero-banner">
        <div className="stmat-hero-left">
          <div className="stmat-live-chip">
            <span className="stmat-ping"></span>
            <span className="stmat-live-txt">ACADEMIC DIGITAL REPOSITORY & LECTURE NOTES</span>
          </div>
          <h1 className="stmat-hero-title">Study Materials & Course Resources</h1>
          <p className="stmat-hero-sub">
            Explore verified unit-wise lecture notes, interactive presentation decks, lab workbooks, previous university question banks, and faculty reference materials.
          </p>
        </div>

        <div className="stmat-hero-actions">
          <button
            className="stmat-btn stmat-btn-secondary"
            onClick={fetchMaterials}
            disabled={loading}
            title="Sync latest materials"
          >
            <FiRefreshCw className={loading ? "stmat-spin" : ""} />
            <span>Sync Library</span>
          </button>
        </div>
      </section>

      {/* 2. CATEGORY CHIPS STRIP */}
      <div className="stmat-cat-strip">
        {categoryOptions.map((cat) => (
          <button
            key={cat.key}
            className={`stmat-cat-chip ${activeCategory === cat.key ? "active" : ""}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* 3. DECK & FILTER CONTROLS PANEL */}
      <section className="stmat-deck-panel">
        <div className="stmat-filter-row">
          {/* Search Input */}
          <div className="stmat-search-field">
            <FiSearch className="stmat-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resource title, subject, faculty instructor, keywords..."
            />
            {searchQuery && (
              <button className="stmat-clear-btn" onClick={() => setSearchQuery("")}>
                <FiX />
              </button>
            )}
          </div>

          {/* Format Selector Pills */}
          <div className="stmat-filter-controls">
            <div className="stmat-select-wrap">
              <label>Semester:</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="stmat-select"
              >
                <option value="ALL">All Semesters</option>
                <option value="4">Semester 4 (Current)</option>
                <option value="6">Semester 6</option>
              </select>
            </div>

            <div className="stmat-select-wrap">
              <label>Format:</label>
              <select
                value={activeFormat}
                onChange={(e) => setActiveFormat(e.target.value)}
                className="stmat-select"
              >
                <option value="ALL">All Formats</option>
                <option value="PDF">PDF Documents</option>
                <option value="PPT">Slide Decks (PPT)</option>
                <option value="DOC">Word Docs (DOC)</option>
                <option value="ZIP">Lab Archives (ZIP)</option>
              </select>
            </div>

            <div className="stmat-select-wrap">
              <label>Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="stmat-select"
              >
                <option value="latest">Latest Uploads</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title (A → Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter Bar */}
        <div className="stmat-counter-bar">
          <span>
            Showing <b>{filteredMaterials.length}</b> course resources • Total in Repository: <b>{stats.total}</b> • Subjects Covered: <b>{stats.uniqueSubjects}</b>
          </span>
        </div>

        {/* 4. CARDS GRID */}
        <div className="stmat-grid-container">
          {loading ? (
            <div className="stmat-skel-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="stmat-skel-card" />
              ))}
            </div>
          ) : filteredMaterials.length ? (
            <div className="stmat-cards-grid">
              {filteredMaterials.map((m) => (
                <div
                  className="stmat-card"
                  key={m._id}
                  onClick={() => handleOpenDetails(m)}
                >
                  <div className="stmat-card-top">
                    <span className={`stmat-type-badge ${m.type.toLowerCase()}`}>
                      {m.type}
                    </span>
                    <div className="stmat-date-badge">
                      <FiCalendar size={12} />
                      <span>{formatDate(m.uploadedAt)}</span>
                    </div>
                  </div>

                  <h3 className="stmat-card-title">{m.title}</h3>

                  {/* Subject & Category Tags */}
                  <div className="stmat-tags-row">
                    <span className="stmat-sub-pill">{m.subject}</span>
                    {m.semester && (
                      <span className="stmat-sem-pill">Sem {m.semester}</span>
                    )}
                    <span className="stmat-cat-pill">{m.category}</span>
                  </div>

                  <p className="stmat-card-desc">{m.description}</p>

                  <div className="stmat-card-foot" onClick={(e) => e.stopPropagation()}>
                    <div className="stmat-faculty-box">
                      <FiUser size={13} />
                      <span>{m.faculty}</span>
                    </div>

                    <div className="stmat-foot-actions">
                      <button
                        className="stmat-btn stmat-btn-xs stmat-btn-secondary"
                        onClick={() => handleOpenDetails(m)}
                        title="View details and synopsis"
                      >
                        <FiEye size={13} />
                        <span>Preview</span>
                      </button>

                      <button
                        className="stmat-btn stmat-btn-xs stmat-btn-primary"
                        onClick={(e) => handleDownload(m, e)}
                        title="Download file"
                      >
                        <FiDownload size={13} />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="stmat-empty-state">
              <div className="stmat-empty-icon-box">
                <FiBookOpen />
              </div>
              <h3>No Study Resources Found</h3>
              <p>No coursework materials matched your search query or selected category filter.</p>
              {(searchQuery || activeCategory !== "all" || activeFormat !== "ALL" || selectedSemester !== "ALL") && (
                <button
                  className="stmat-btn stmat-btn-secondary"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                    setActiveFormat("ALL");
                    setSelectedSemester("ALL");
                  }}
                >
                  Reset All Filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 5. RESOURCE DETAILS & PREVIEW MODAL */}
      {openModal && selectedMaterial && (
        <div className="stmat-modal-backdrop" onClick={() => setOpenModal(false)}>
          <div className="stmat-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="stmat-modal-header">
              <div className="stmat-modal-title-group">
                <div className="stmat-modal-badges">
                  <span className={`stmat-type-badge ${selectedMaterial.type.toLowerCase()}`}>
                    {selectedMaterial.type} DOCUMENT
                  </span>
                  <span className="stmat-cat-pill">{selectedMaterial.category}</span>
                </div>
                <h3 className="stmat-modal-title">{selectedMaterial.title}</h3>
                <div className="stmat-modal-meta">
                  <span>📚 {selectedMaterial.subject}</span>
                  {selectedMaterial.semester && (
                    <>
                      <span>•</span>
                      <span>🎓 Semester {selectedMaterial.semester}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>👨‍🏫 {selectedMaterial.faculty}</span>
                  <span>•</span>
                  <span>📅 {formatDate(selectedMaterial.uploadedAt)}</span>
                </div>
              </div>

              <button className="stmat-modal-close" onClick={() => setOpenModal(false)}>
                <FiX size={18} />
              </button>
            </div>

            <div className="stmat-modal-body">
              {/* Synopsis & Overview */}
              <div className="stmat-detail-box">
                <span className="stmat-field-lbl">Resource Description & Faculty Synopsis:</span>
                <p className="stmat-detail-txt">{selectedMaterial.description}</p>
              </div>

              {/* Resource Metadata Highlights */}
              <div className="stmat-meta-grid">
                <div className="stmat-meta-card">
                  <span className="stmat-meta-lbl">Target Course / Class</span>
                  <span className="stmat-meta-val">
                    {student.course} (Sem {selectedMaterial.semester || student.sem})
                  </span>
                </div>
                <div className="stmat-meta-card">
                  <span className="stmat-meta-lbl">Uploaded By</span>
                  <span className="stmat-meta-val">{selectedMaterial.faculty}</span>
                </div>
                <div className="stmat-meta-card">
                  <span className="stmat-meta-lbl">File Classification</span>
                  <span className="stmat-meta-val">{selectedMaterial.type} Format</span>
                </div>
                <div className="stmat-meta-card">
                  <span className="stmat-meta-lbl">Access Level</span>
                  <span className="stmat-meta-val">Verified Student Portal</span>
                </div>
              </div>

              {/* File Download / View Bar */}
              <div className="stmat-download-banner">
                <div className="stmat-download-info">
                  <FiFileText size={28} className="stmat-file-icon" />
                  <div>
                    <h4 className="stmat-file-title">{selectedMaterial.fileName}</h4>
                    <p className="stmat-file-sub">Official verified departmental study material</p>
                  </div>
                </div>

                <div className="stmat-download-btn-group">
                  <button
                    className="stmat-btn stmat-btn-primary"
                    onClick={(e) => handleDownload(selectedMaterial, e)}
                  >
                    <FiDownload size={15} />
                    <span>Download Resource</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="stmat-modal-footer">
              <button
                type="button"
                className="stmat-btn stmat-btn-secondary"
                onClick={() => setOpenModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
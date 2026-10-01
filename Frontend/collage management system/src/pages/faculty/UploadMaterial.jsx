import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  FiBook,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEdit2,
  FiExternalLink,
  FiFileText,
  FiFilter,
  FiFolder,
  FiGrid,
  FiLayers,
  FiList,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUploadCloud,
  FiUser,
  FiUsers,
  FiX,
  FiAlertCircle,
  FiAward,
  FiCheck,
  FiCopy,
  FiFile,
  FiVideo,
  FiImage,
  FiCode,
  FiArchive,
  FiShare2,
  FiEye
} from "react-icons/fi";
import "../../layout/faculty/UploadMaterial.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

const API = {
  list: `${API_BASE}/Material/postMaterialData`,
  listAlt: `${API_BASE}/Material/list`,
  create: `${API_BASE}/Material/Madd`,
  update: `${API_BASE}/Material/update`,
  remove: `${API_BASE}/Material/delete`,
  count: `${API_BASE}/Material/count`,
};

const COURSE_MAP = {
  1: "BCA",
  2: "B.Tech CSE",
  3: "MCA",
  4: "BBA",
  5: "BCom",
};

const COURSES_LIST = [
  { id: "1", code: "BCA", name: "Bachelor of Computer Applications", maxSem: 6 },
  { id: "2", code: "B.Tech CSE", name: "B.Tech Computer Science & Eng.", maxSem: 8 },
  { id: "3", code: "MCA", name: "Master of Computer Applications", maxSem: 4 },
  { id: "4", code: "BBA", name: "Bachelor of Business Administration", maxSem: 6 },
  { id: "5", code: "BCom", name: "Bachelor of Commerce", maxSem: 6 },
];

const CATEGORIES = [
  "Lecture Notes",
  "Question Bank",
  "Lab Manual",
  "Cheatsheets & Handouts",
  "Presentation Slides",
  "Reference Book",
  "Syllabus & Outline",
  "Assignment Resource",
  "Other",
];

const SUGGESTED_SUBJECTS = [
  "Operating Systems",
  "Database Management Systems",
  "Data Structures & Algorithms",
  "Computer Networks & Security",
  "Web Technologies",
  "Python Programming",
  "Object Oriented Programming (Java)",
  "Software Engineering",
  "Artificial Intelligence",
  "Cloud Computing & DevOps",
  "Discrete Mathematics",
  "Cyber Security",
];

const ALLOWED_EXTS = [
  "pdf",
  "ppt",
  "pptx",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "zip",
  "rar",
  "mp4",
  "mkv",
  "txt",
  "py",
  "java",
  "cpp",
  "c",
  "html",
  "css",
  "js",
];

const MAX_FILE_SIZE_MB = 100;

// Resolve File URL
function resolveFileUrl(url) {
  if (!url || url === "#") return "";
  const s = String(url).trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `${API_BASE}${s}`;
  return `${API_BASE}/uploads/material/${s}`;
}

// Guess format from filename
function guessTypeFromFile(filename) {
  const name = (filename || "").toLowerCase();
  if (name.endsWith(".pdf")) return "PDF";
  if (name.endsWith(".ppt") || name.endsWith(".pptx")) return "PPT";
  if (name.endsWith(".doc") || name.endsWith(".docx")) return "DOC";
  if (name.endsWith(".xls") || name.endsWith(".xlsx")) return "XLS";
  if (name.endsWith(".zip") || name.endsWith(".rar") || name.endsWith(".7z") || name.endsWith(".tar.gz")) return "ZIP";
  if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".webp")) return "IMAGE";
  if (name.endsWith(".mp4") || name.endsWith(".mov") || name.endsWith(".mkv") || name.endsWith(".avi")) return "VIDEO";
  if (name.endsWith(".py") || name.endsWith(".java") || name.endsWith(".cpp") || name.endsWith(".c") || name.endsWith(".js") || name.endsWith(".html")) return "CODE";
  return "FILE";
}

// Pretty format file size
function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "-";
  const num = Number(bytes);
  if (Number.isNaN(num) || num === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(num) / Math.log(1024)), sizes.length - 1);
  return `${(num / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

// Format date helper
function formatDate(d) {
  if (!d) return "Recent";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(d).slice(0, 10);
  }
}

// Extract list from various response formats
function extractList(res) {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.rows)) return d.rows;
  if (Array.isArray(d?.result)) return d.result;
  if (Array.isArray(d?.items)) return d.items;
  return [];
}

// Get logged faculty details
const getLoggedFaculty = () => {
  try {
    const raw = localStorage.getItem("user") || localStorage.getItem("faculty") || localStorage.getItem("profile") || "{}";
    const u = JSON.parse(raw);
    const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.name || u.faculty_name || u.username || "Prof. Faculty";
    return {
      id: u.user_id || u.id || 1,
      name: fullName,
      dept: u.department || u.dept || "Computer Science & Applications",
      designation: u.designation || "Assistant Professor",
      email: u.email || "faculty@navnext.edu",
    };
  } catch {
    return {
      id: 1,
      name: "Prof. Faculty",
      dept: "Computer Science & Applications",
      designation: "Assistant Professor",
      email: "faculty@navnext.edu",
    };
  }
};

export default function UploadMaterial() {
  const facultyUser = useMemo(() => getLoggedFaculty(), []);
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  // Main Data States
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedCourse, setSelectedCourse] = useState("ALL");
  const [selectedSemester, setSelectedSemester] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'oldest' | 'title' | 'subject'
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

  // Modals & Drawers
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "ok") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    title: "",
    subject: "",
    courseId: "1",
    semester: "4",
    category: "Lecture Notes",
    type: "PDF",
    visibility: "ALL",
    description: "",
    faculty: facultyUser.name,
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDragging, setUploadDragging] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    id: null,
    title: "",
    subject: "",
    courseId: "1",
    semester: "4",
    category: "Lecture Notes",
    type: "PDF",
    visibility: "ALL",
    description: "",
    faculty: facultyUser.name,
    fileUrl: "",
  });
  const [editFile, setEditFile] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // Fetch Materials
  const fetchMaterials = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let list = [];
      try {
        const res = await axios.post(API.list, {}, { headers });
        list = extractList(res);
      } catch {
        const resAlt = await axios.get(API.listAlt, { headers });
        list = extractList(resAlt);
      }

      setMaterials(list);
    } catch (err) {
      console.error("Error fetching study materials:", err);
      showToast("Could not load study materials. Please check server.", "err");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Keyboard shortcut: ESC to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsUploadOpen(false);
        setIsEditOpen(false);
        setIsPreviewOpen(false);
        setDeleteId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Computed Metrics
  const metrics = useMemo(() => {
    const total = materials.length;
    const subjects = new Set(materials.map((m) => (m.subject || "").trim().toLowerCase()).filter(Boolean)).size;
    const notesCount = materials.filter((m) => {
      const c = (m.category || "").toLowerCase();
      const t = (m.type || "").toLowerCase();
      return c.includes("note") || c.includes("cheat") || t === "pdf" || t === "doc";
    }).length;
    const qbAndLabsCount = materials.filter((m) => {
      const c = (m.category || "").toLowerCase();
      return c.includes("question") || c.includes("lab") || c.includes("manual") || c.includes("slide");
    }).length;

    return {
      total,
      subjects,
      notesCount,
      qbAndLabsCount,
    };
  }, [materials]);

  // Filtered & Sorted Materials
  const filteredMaterials = useMemo(() => {
    return materials
      .filter((item) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (item.title || "").toLowerCase().includes(q);
          const matchSubject = (item.subject || "").toLowerCase().includes(q);
          const matchDesc = (item.description || "").toLowerCase().includes(q);
          const matchFaculty = (item.faculty || "").toLowerCase().includes(q);
          const matchCat = (item.category || "").toLowerCase().includes(q);
          if (!matchTitle && !matchSubject && !matchDesc && !matchFaculty && !matchCat) {
            return false;
          }
        }

        // Category
        if (selectedCategory !== "ALL") {
          const cat = (item.category || "").toLowerCase();
          const target = selectedCategory.toLowerCase();
          if (!cat.includes(target) && cat !== target) {
            return false;
          }
        }

        // Course
        if (selectedCourse !== "ALL") {
          const courseCode = COURSE_MAP[item.courseId] || String(item.courseId);
          if (String(item.courseId) !== String(selectedCourse) && courseCode !== selectedCourse) {
            return false;
          }
        }

        // Semester
        if (selectedSemester !== "ALL") {
          if (String(item.semester) !== String(selectedSemester)) {
            return false;
          }
        }

        // File Format / Type
        if (selectedType !== "ALL") {
          const t = (item.type || guessTypeFromFile(item.fileUrl)).toUpperCase();
          if (t !== selectedType.toUpperCase()) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
        if (sortBy === "title") {
          return (a.title || "").localeCompare(b.title || "");
        }
        if (sortBy === "subject") {
          return (a.subject || "").localeCompare(b.subject || "");
        }
        return 0;
      });
  }, [materials, searchQuery, selectedCategory, selectedCourse, selectedSemester, selectedType, sortBy]);

  // Reset Upload Form
  const resetUploadForm = () => {
    setUploadForm({
      title: "",
      subject: "",
      courseId: "1",
      semester: "4",
      category: "Lecture Notes",
      type: "PDF",
      visibility: "ALL",
      description: "",
      faculty: facultyUser.name,
    });
    setUploadFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // On Pick Upload File
  const onPickUploadFile = (f) => {
    if (!f) return;
    const ext = (f.name.split(".").pop() || "").toLowerCase();
    if (ALLOWED_EXTS.length && !ALLOWED_EXTS.includes(ext)) {
      showToast(`Unsupported file .${ext}. Please select PDF, PPT, DOC, ZIP, or Code file.`, "err");
      return;
    }
    const sizeMB = f.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      showToast(`File is too large (${sizeMB.toFixed(1)}MB). Max allowed: ${MAX_FILE_SIZE_MB}MB.`, "err");
      return;
    }

    setUploadFile(f);
    const guessedType = guessTypeFromFile(f.name);
    setUploadForm((prev) => ({
      ...prev,
      type: guessedType,
    }));
  };

  // Submit Upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!uploadForm.title.trim()) {
      return showToast("Please enter a title for the study material.", "err");
    }
    if (!uploadForm.subject.trim()) {
      return showToast("Please specify the subject name.", "err");
    }
    if (!uploadForm.semester) {
      return showToast("Please select the target semester.", "err");
    }
    if (!uploadFile) {
      return showToast("Please attach a document or archive file to upload.", "err");
    }

    try {
      setUploadLoading(true);
      setUploadProgress(0);

      const fd = new FormData();
      fd.append("title", uploadForm.title.trim());
      fd.append("subject", uploadForm.subject.trim());
      fd.append("courseId", uploadForm.courseId);
      fd.append("semester", uploadForm.semester);
      fd.append("category", uploadForm.category);
      fd.append("type", (uploadForm.type || guessTypeFromFile(uploadFile.name)).toUpperCase());
      fd.append("visibility", uploadForm.visibility || "ALL");
      fd.append("description", uploadForm.description.trim());
      fd.append("faculty", (uploadForm.faculty || facultyUser.name).trim());
      fd.append("file", uploadFile);

      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post(API.create, fd, {
        headers,
        onUploadProgress: (p) => {
          const total = p.total || 0;
          const pct = total ? Math.round((p.loaded * 100) / total) : 0;
          setUploadProgress(pct);
        },
      });

      showToast(res?.data?.message || "Study material published successfully!", "ok");
      resetUploadForm();
      setIsUploadOpen(false);
      fetchMaterials();
    } catch (err) {
      console.error("Upload error:", err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to upload study material.";
      showToast(serverMsg, "err");
    } finally {
      setUploadLoading(false);
      setTimeout(() => setUploadProgress(0), 600);
    }
  };

  // Open Edit Modal
  const openEditModal = (item) => {
    setEditForm({
      id: item.id || item.material_id,
      title: item.title || "",
      subject: item.subject || "",
      courseId: item.courseId || "1",
      semester: String(item.semester || 4),
      category: item.category || "Lecture Notes",
      type: item.type || "PDF",
      visibility: item.visibility || "ALL",
      description: item.description || "",
      faculty: item.faculty || facultyUser.name,
      fileUrl: item.fileUrl || "",
    });
    setEditFile(null);
    setIsEditOpen(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editForm.id) {
      return showToast("Invalid material record.", "err");
    }
    if (!editForm.title.trim()) {
      return showToast("Title is required.", "err");
    }
    if (!editForm.subject.trim()) {
      return showToast("Subject is required.", "err");
    }

    try {
      setEditLoading(true);
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let res;
      if (editFile) {
        const fd = new FormData();
        fd.append("id", editForm.id);
        fd.append("title", editForm.title.trim());
        fd.append("subject", editForm.subject.trim());
        fd.append("courseId", editForm.courseId);
        fd.append("semester", editForm.semester);
        fd.append("category", editForm.category);
        fd.append("type", (editForm.type || guessTypeFromFile(editFile.name)).toUpperCase());
        fd.append("visibility", editForm.visibility);
        fd.append("description", editForm.description.trim());
        fd.append("faculty", editForm.faculty.trim());
        fd.append("file", editFile);

        res = await axios.post(API.update, fd, { headers });
      } else {
        res = await axios.post(
          API.update,
          {
            id: editForm.id,
            title: editForm.title.trim(),
            subject: editForm.subject.trim(),
            courseId: editForm.courseId,
            semester: editForm.semester,
            category: editForm.category,
            type: editForm.type,
            visibility: editForm.visibility,
            description: editForm.description.trim(),
            faculty: editForm.faculty.trim(),
            fileUrl: editForm.fileUrl,
          },
          { headers }
        );
      }

      showToast(res?.data?.message || "Material updated successfully!", "ok");
      setIsEditOpen(false);
      fetchMaterials();
    } catch (err) {
      console.error("Edit material error:", err);
      const serverMsg = err?.response?.data?.message || err?.message || "Failed to update material.";
      showToast(serverMsg, "err");
    } finally {
      setEditLoading(false);
    }
  };

  // Submit Delete
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post(API.remove, { id: deleteId }, { headers });
      showToast(res?.data?.message || "Material deleted from repository.", "ok");

      setMaterials((prev) => prev.filter((m) => (m.id || m.material_id) !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error("Delete material error:", err);
      const serverMsg = err?.response?.data?.message || err?.message || "Could not delete material.";
      showToast(serverMsg, "err");
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Direct Download / File
  const handleDownload = (fileUrl, title) => {
    if (!fileUrl) {
      showToast("No attachment file found for this material.", "err");
      return;
    }
    const resolved = resolveFileUrl(fileUrl);
    window.open(resolved, "_blank", "noopener,noreferrer");
  };

  // Open Preview Modal
  const openPreviewModal = (item) => {
    setPreviewItem(item);
    setIsPreviewOpen(true);
  };

  // Copy Link Helper
  const handleCopyLink = (url) => {
    if (!url) return;
    const resolved = resolveFileUrl(url);
    navigator.clipboard?.writeText(resolved);
    showToast("Direct resource link copied to clipboard!", "ok");
  };

  // Format Icon Component
  const renderFormatBadge = (type, fileUrl) => {
    const t = (type || guessTypeFromFile(fileUrl)).toUpperCase();
    let badgeClass = "fmt-pdf";
    let icon = <FiFileText />;

    if (t === "PPT" || t === "PPTX") {
      badgeClass = "fmt-ppt";
      icon = <FiLayers />;
    } else if (t === "DOC" || t === "DOCX") {
      badgeClass = "fmt-doc";
      icon = <FiFile />;
    } else if (t === "ZIP" || t === "RAR" || t === "7Z") {
      badgeClass = "fmt-zip";
      icon = <FiArchive />;
    } else if (t === "VIDEO" || t === "MP4") {
      badgeClass = "fmt-video";
      icon = <FiVideo />;
    } else if (t === "IMAGE" || t === "PNG" || t === "JPG") {
      badgeClass = "fmt-image";
      icon = <FiImage />;
    } else if (t === "CODE" || t === "PY" || t === "JAVA") {
      badgeClass = "fmt-code";
      icon = <FiCode />;
    }

    return (
      <span className={`sm-fmt-badge ${badgeClass}`}>
        {icon}
        <span>{t}</span>
      </span>
    );
  };

  return (
    <div className="sm-vault-root">
      {/* Toast Notification */}
      {toast && (
        <div className={`sm-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheckCircle className="sm-toast-ic" /> : <FiAlertCircle className="sm-toast-ic" />}
          <span>{toast.message}</span>
          <button className="sm-toast-close" onClick={() => setToast(null)}>
            <FiX />
          </button>
        </div>
      )}

      {/* Hero Header */}
      <header className="sm-vault-hero">
        <div className="sm-hero-glass-mesh" />
        <div className="sm-hero-content">
          <div className="sm-hero-top-row">
            <div className="sm-hero-tag">
              <span className="sm-tag-pulse" />
              <span>FACULTY COURSEWARE REPOSITORY</span>
            </div>
            <div className="sm-faculty-pill">
              <FiUser className="sm-pill-ic" />
              <span>{facultyUser.name}</span>
              <span className="sm-pill-divider">•</span>
              <span className="sm-pill-sub">{facultyUser.designation}</span>
            </div>
          </div>

          <div className="sm-hero-main">
            <div className="sm-hero-titles">
              <h1 className="sm-hero-title">
                Study Material <span className="sm-gradient-text">Vault</span> 📚
              </h1>
              <p className="sm-hero-desc">
                Organize, upload, and distribute syllabus units, lecture notes, lab manuals, question banks, and multimedia resources directly to your student batches.
              </p>
            </div>

            <div className="sm-hero-actions">
              <button
                className="sm-btn-glow primary"
                onClick={() => {
                  resetUploadForm();
                  setIsUploadOpen(true);
                }}
              >
                <FiPlus className="sm-btn-ic" />
                <span>Upload Material</span>
              </button>

              <button
                className={`sm-btn-glow secondary ${refreshing ? "spinning" : ""}`}
                onClick={fetchMaterials}
                title="Refresh Repository"
              >
                <FiRefreshCw className="sm-btn-ic" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Quick HUD Metrics */}
          <div className="sm-hud-grid">
            <div className="sm-hud-card">
              <div className="sm-hud-icon-wrap ic-cyan">
                <FiBookOpen />
              </div>
              <div className="sm-hud-info">
                <span className="sm-hud-num">{metrics.total}</span>
                <span className="sm-hud-label">Total Documents</span>
              </div>
              <span className="sm-hud-glow cyan" />
            </div>

            <div className="sm-hud-card">
              <div className="sm-hud-icon-wrap ic-indigo">
                <FiLayers />
              </div>
              <div className="sm-hud-info">
                <span className="sm-hud-num">{metrics.subjects}</span>
                <span className="sm-hud-label">Active Subjects</span>
              </div>
              <span className="sm-hud-glow indigo" />
            </div>

            <div className="sm-hud-card">
              <div className="sm-hud-icon-wrap ic-emerald">
                <FiFileText />
              </div>
              <div className="sm-hud-info">
                <span className="sm-hud-num">{metrics.notesCount}</span>
                <span className="sm-hud-label">Lecture Notes & Handouts</span>
              </div>
              <span className="sm-hud-glow emerald" />
            </div>

            <div className="sm-hud-card">
              <div className="sm-hud-icon-wrap ic-amber">
                <FiAward />
              </div>
              <div className="sm-hud-info">
                <span className="sm-hud-num">{metrics.qbAndLabsCount}</span>
                <span className="sm-hud-label">Question Banks & Labs</span>
              </div>
              <span className="sm-hud-glow amber" />
            </div>
          </div>
        </div>
      </header>

      {/* Filter & Search Workbench */}
      <section className="sm-filter-workbench">
        <div className="sm-workbench-top">
          {/* Search Box */}
          <div className="sm-search-box">
            <FiSearch className="sm-search-ic" />
            <input
              type="text"
              placeholder="Search by topic, unit, subject name, or notes summary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="sm-search-clear" onClick={() => setSearchQuery("")}>
                <FiX />
              </button>
            )}
          </div>

          {/* View Mode Toggle & Sorters */}
          <div className="sm-workbench-controls">
            <div className="sm-select-control">
              <label>Sort:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title (A-Z)</option>
                <option value="subject">Subject (A-Z)</option>
              </select>
            </div>

            <div className="sm-view-toggle">
              <button
                className={`sm-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                <FiGrid />
              </button>
              <button
                className={`sm-toggle-btn ${viewMode === "table" ? "active" : ""}`}
                onClick={() => setViewMode("table")}
                title="Table View"
              >
                <FiList />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills / Dropdowns */}
        <div className="sm-filter-pills-row">
          <div className="sm-filter-group">
            <span className="sm-fg-label">Course:</span>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              <option value="ALL">All Courses</option>
              {COURSES_LIST.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>

          <div className="sm-filter-group">
            <span className="sm-fg-label">Semester:</span>
            <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
              <option value="ALL">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={String(s)}>
                  Sem {s}
                </option>
              ))}
            </select>
          </div>

          <div className="sm-filter-group">
            <span className="sm-fg-label">Category:</span>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="sm-filter-group">
            <span className="sm-fg-label">File Type:</span>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              <option value="ALL">All Formats</option>
              <option value="PDF">PDF Documents</option>
              <option value="PPT">Presentations (PPT)</option>
              <option value="DOC">Word Docs</option>
              <option value="ZIP">ZIP Archives</option>
              <option value="VIDEO">Videos / Media</option>
              <option value="IMAGE">Diagrams / Images</option>
              <option value="CODE">Source Code</option>
            </select>
          </div>

          {(selectedCourse !== "ALL" ||
            selectedSemester !== "ALL" ||
            selectedCategory !== "ALL" ||
            selectedType !== "ALL" ||
            searchQuery) && (
            <button
              className="sm-reset-filters-btn"
              onClick={() => {
                setSelectedCourse("ALL");
                setSelectedSemester("ALL");
                setSelectedCategory("ALL");
                setSelectedType("ALL");
                setSearchQuery("");
              }}
            >
              Reset Filters
            </button>
          )}

          <div className="sm-results-badge">
            <span>Showing {filteredMaterials.length} of {materials.length} resources</span>
          </div>
        </div>
      </section>

      {/* Main Content Area: Grid / Table View */}
      <main className="sm-materials-container">
        {loading ? (
          <div className="sm-loading-state">
            <div className="sm-spinner" />
            <p>Accessing study material repository...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="sm-empty-state">
            <div className="sm-empty-icon">📁</div>
            <h3>No study materials found</h3>
            <p>
              {searchQuery || selectedCategory !== "ALL" || selectedCourse !== "ALL" || selectedSemester !== "ALL"
                ? "Try relaxing your search keywords or filter options."
                : "No files have been uploaded to the courseware repository yet."}
            </p>
            <button
              className="sm-btn-glow primary"
              onClick={() => {
                resetUploadForm();
                setIsUploadOpen(true);
              }}
            >
              <FiPlus /> Upload First Material
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* GRID VIEW */
          <div className="sm-cards-grid">
            {filteredMaterials.map((item) => {
              const itemId = item.id || item.material_id;
              const courseTitle = COURSE_MAP[item.courseId] || (item.courseId ? `Course #${item.courseId}` : "BCA");

              return (
                <div key={itemId} className="sm-mat-card">
                  <div className="sm-card-top">
                    <div className="sm-card-badges">
                      {renderFormatBadge(item.type, item.fileUrl)}
                      <span className="sm-cat-pill">{item.category || "Lecture Notes"}</span>
                    </div>

                    <div className="sm-course-sem-badge">
                      <span>{courseTitle}</span>
                      <span className="sm-badge-dot">•</span>
                      <span>Sem {item.semester}</span>
                    </div>
                  </div>

                  <div className="sm-card-body">
                    <h3 className="sm-mat-title" title={item.title}>
                      {item.title}
                    </h3>

                    <div className="sm-mat-subject">
                      <FiBook className="sm-sbj-ic" />
                      <span>{item.subject || "General Computer Science"}</span>
                    </div>

                    <p className="sm-mat-desc">
                      {item.description ? item.description : "Comprehensive study resource uploaded for students."}
                    </p>
                  </div>

                  <div className="sm-card-meta">
                    <div className="sm-meta-item">
                      <FiUser className="sm-meta-ic" />
                      <span>{item.faculty || "Faculty"}</span>
                    </div>
                    <div className="sm-meta-item">
                      <FiClock className="sm-meta-ic" />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>

                  <div className="sm-card-actions">
                    <button
                      className="sm-action-btn view"
                      onClick={() => openPreviewModal(item)}
                      title="Inspect & View Details"
                    >
                      <FiEye />
                      <span>Inspect</span>
                    </button>

                    <button
                      className="sm-action-btn download"
                      onClick={() => handleDownload(item.fileUrl, item.title)}
                      title="Download / Open File"
                    >
                      <FiDownload />
                      <span>Download</span>
                    </button>

                    <div className="sm-action-menu">
                      <button
                        className="sm-icon-btn edit"
                        onClick={() => openEditModal(item)}
                        title="Edit Details"
                      >
                        <FiEdit2 />
                      </button>

                      <button
                        className="sm-icon-btn share"
                        onClick={() => handleCopyLink(item.fileUrl)}
                        title="Copy Share Link"
                      >
                        <FiShare2 />
                      </button>

                      <button
                        className="sm-icon-btn delete"
                        onClick={() => setDeleteId(itemId)}
                        title="Delete Material"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="sm-table-wrap">
            <table className="sm-table">
              <thead>
                <tr>
                  <th>Resource Title & Subject</th>
                  <th>Target Batch</th>
                  <th>Category</th>
                  <th>Format</th>
                  <th>Uploaded By</th>
                  <th>Date</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((item) => {
                  const itemId = item.id || item.material_id;
                  const courseTitle = COURSE_MAP[item.courseId] || (item.courseId ? `Course #${item.courseId}` : "BCA");

                  return (
                    <tr key={itemId}>
                      <td className="sm-td-title">
                        <div className="sm-tbl-title-block">
                          <strong className="sm-tbl-title">{item.title}</strong>
                          <span className="sm-tbl-sub">
                            <FiBook /> {item.subject}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="sm-tbl-batch">
                          {courseTitle} (Sem {item.semester})
                        </span>
                      </td>
                      <td>
                        <span className="sm-cat-pill sm">{item.category || "Notes"}</span>
                      </td>
                      <td>{renderFormatBadge(item.type, item.fileUrl)}</td>
                      <td>
                        <div className="sm-tbl-user">
                          <FiUser /> {item.faculty || "Faculty"}
                        </div>
                      </td>
                      <td>{formatDate(item.createdAt)}</td>
                      <td style={{ textAlign: "right" }}>
                        <div className="sm-tbl-actions">
                          <button
                            className="sm-icon-btn preview"
                            onClick={() => openPreviewModal(item)}
                            title="Quick View"
                          >
                            <FiEye />
                          </button>
                          <button
                            className="sm-icon-btn download"
                            onClick={() => handleDownload(item.fileUrl, item.title)}
                            title="Download File"
                          >
                            <FiDownload />
                          </button>
                          <button
                            className="sm-icon-btn edit"
                            onClick={() => openEditModal(item)}
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            className="sm-icon-btn delete"
                            onClick={() => setDeleteId(itemId)}
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ========================================================
          UPLOAD NEW MATERIAL DRAWER / MODAL
      ======================================================== */}
      {isUploadOpen && (
        <div className="sm-modal-overlay" onClick={() => !uploadLoading && setIsUploadOpen(false)}>
          <div className="sm-modal-panel large" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal-header">
              <div className="sm-modal-title-wrap">
                <div className="sm-modal-icon-badge">
                  <FiUploadCloud />
                </div>
                <div>
                  <h2>Upload Study Material</h2>
                  <p>Publish lectures, questions, solutions, and syllabi to student portals</p>
                </div>
              </div>
              <button
                className="sm-modal-close-btn"
                onClick={() => !uploadLoading && setIsUploadOpen(false)}
                disabled={uploadLoading}
              >
                <FiX />
              </button>
            </div>

            <form className="sm-modal-form" onSubmit={handleUploadSubmit}>
              <div className="sm-form-grid">
                {/* Title */}
                <div className="sm-field full">
                  <label>
                    Document / Topic Title <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit 3: Concurrency & Deadlocks Complete Lecture Notes"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  />
                </div>

                {/* Subject */}
                <div className="sm-field full">
                  <label>
                    Subject Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operating Systems"
                    value={uploadForm.subject}
                    onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}
                  />
                  {/* Subject Suggestion Chips */}
                  <div className="sm-subject-chips">
                    <span className="sm-sc-label">Quick suggestions:</span>
                    {SUGGESTED_SUBJECTS.slice(0, 5).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="sm-sc-chip"
                        onClick={() => setUploadForm({ ...uploadForm, subject: s })}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Course */}
                <div className="sm-field">
                  <label>
                    Target Course <span className="req">*</span>
                  </label>
                  <select
                    value={uploadForm.courseId}
                    onChange={(e) => setUploadForm({ ...uploadForm, courseId: e.target.value })}
                  >
                    {COURSES_LIST.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Semester */}
                <div className="sm-field">
                  <label>
                    Target Semester <span className="req">*</span>
                  </label>
                  <select
                    value={uploadForm.semester}
                    onChange={(e) => setUploadForm({ ...uploadForm, semester: e.target.value })}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={String(sem)}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div className="sm-field">
                  <label>Material Category</label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* File Format / Type */}
                <div className="sm-field">
                  <label>Format / Type</label>
                  <select
                    value={uploadForm.type}
                    onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="PPT">Presentation (PPT/PPTX)</option>
                    <option value="DOC">Word Document (DOCX)</option>
                    <option value="ZIP">ZIP / Compressed Archive</option>
                    <option value="VIDEO">Video / Multimedia</option>
                    <option value="IMAGE">Diagram / Image</option>
                    <option value="CODE">Source Code</option>
                  </select>
                </div>

                {/* Visibility */}
                <div className="sm-field">
                  <label>Visibility Scope</label>
                  <select
                    value={uploadForm.visibility}
                    onChange={(e) => setUploadForm({ ...uploadForm, visibility: e.target.value })}
                  >
                    <option value="ALL">All Enrolled Students (Public)</option>
                    <option value="SEMESTER">Target Semester Batch Only</option>
                    <option value="FACULTY">Faculty Draft / Private</option>
                  </select>
                </div>

                {/* Faculty Name */}
                <div className="sm-field">
                  <label>Faculty / Author Name</label>
                  <input
                    type="text"
                    value={uploadForm.faculty}
                    onChange={(e) => setUploadForm({ ...uploadForm, faculty: e.target.value })}
                    placeholder="Prof. Name"
                  />
                </div>

                {/* Description */}
                <div className="sm-field full">
                  <label>Summary & Key Learning Objectives (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Provide a brief context or notes for students studying this document..."
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Drag & Drop File Zone */}
              <div
                className={`sm-dropzone ${uploadDragging ? "dragging" : ""} ${uploadFile ? "has-file" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setUploadDragging(true);
                }}
                onDragLeave={() => setUploadDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setUploadDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) onPickUploadFile(f);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  onChange={(e) => onPickUploadFile(e.target.files?.[0])}
                />

                <div className="sm-drop-icon">
                  {uploadFile ? <FiCheckCircle className="ic-ok" /> : <FiUploadCloud />}
                </div>

                <div className="sm-drop-text">
                  {uploadFile ? (
                    <>
                      <strong className="sm-drop-fname">{uploadFile.name}</strong>
                      <span className="sm-drop-fmeta">
                        {formatBytes(uploadFile.size)} • Type: {guessTypeFromFile(uploadFile.name)}
                      </span>
                    </>
                  ) : (
                    <>
                      <strong>Drag & drop material file here, or click to browse</strong>
                      <span>Supports PDF, DOCX, PPTX, ZIP, Code, MP4, and images up to 100MB</span>
                    </>
                  )}
                </div>

                {uploadFile && (
                  <div className="sm-drop-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="sm-mini-btn"
                      onClick={() => {
                        setUploadFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      Remove File
                    </button>
                    <button
                      type="button"
                      className="sm-mini-btn alt"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change File
                    </button>
                  </div>
                )}
              </div>

              {/* Upload Progress Bar */}
              {uploadLoading && (
                <div className="sm-progress-wrap">
                  <div className="sm-progress-bar-head">
                    <span>Publishing material to server...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="sm-progress-track">
                    <div className="sm-progress-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="sm-modal-footer">
                <button
                  type="button"
                  className="sm-btn-glow secondary"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={uploadLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="sm-btn-glow primary" disabled={uploadLoading}>
                  {uploadLoading ? "Uploading Document..." : "Publish to Vault"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT MATERIAL MODAL
      ======================================================== */}
      {isEditOpen && (
        <div className="sm-modal-overlay" onClick={() => !editLoading && setIsEditOpen(false)}>
          <div className="sm-modal-panel large" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal-header">
              <div className="sm-modal-title-wrap">
                <div className="sm-modal-icon-badge edit">
                  <FiEdit2 />
                </div>
                <div>
                  <h2>Edit Study Material</h2>
                  <p>Update title, categorisation, course targeting, or replace resource attachment</p>
                </div>
              </div>
              <button
                className="sm-modal-close-btn"
                onClick={() => !editLoading && setIsEditOpen(false)}
                disabled={editLoading}
              >
                <FiX />
              </button>
            </div>

            <form className="sm-modal-form" onSubmit={handleEditSubmit}>
              <div className="sm-form-grid">
                {/* Title */}
                <div className="sm-field full">
                  <label>
                    Document Title <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>

                {/* Subject */}
                <div className="sm-field full">
                  <label>
                    Subject Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.subject}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                  />
                </div>

                {/* Course */}
                <div className="sm-field">
                  <label>Target Course</label>
                  <select
                    value={editForm.courseId}
                    onChange={(e) => setEditForm({ ...editForm, courseId: e.target.value })}
                  >
                    {COURSES_LIST.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Semester */}
                <div className="sm-field">
                  <label>Semester</label>
                  <select
                    value={editForm.semester}
                    onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={String(sem)}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div className="sm-field">
                  <label>Material Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Format / Type */}
                <div className="sm-field">
                  <label>Format</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="PPT">Presentation (PPT/PPTX)</option>
                    <option value="DOC">Word Document (DOCX)</option>
                    <option value="ZIP">ZIP / Compressed Archive</option>
                    <option value="VIDEO">Video / Multimedia</option>
                    <option value="IMAGE">Diagram / Image</option>
                    <option value="CODE">Source Code</option>
                  </select>
                </div>

                {/* Visibility */}
                <div className="sm-field">
                  <label>Visibility</label>
                  <select
                    value={editForm.visibility}
                    onChange={(e) => setEditForm({ ...editForm, visibility: e.target.value })}
                  >
                    <option value="ALL">All Enrolled Students (Public)</option>
                    <option value="SEMESTER">Target Semester Batch Only</option>
                    <option value="FACULTY">Faculty Draft / Private</option>
                  </select>
                </div>

                {/* Faculty Author */}
                <div className="sm-field">
                  <label>Faculty / Author</label>
                  <input
                    type="text"
                    value={editForm.faculty}
                    onChange={(e) => setEditForm({ ...editForm, faculty: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div className="sm-field full">
                  <label>Summary & Key Objectives</label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Optional Replacement File */}
              <div className="sm-replace-file-section">
                <label>Replace Attached File (Optional)</label>
                <div className="sm-replace-box">
                  <div className="sm-replace-info">
                    {editFile ? (
                      <div>
                        <strong>Selected: {editFile.name}</strong> ({formatBytes(editFile.size)})
                      </div>
                    ) : (
                      <div>
                        <span>Current file: </span>
                        <code className="sm-file-link">{editForm.fileUrl || "No file attached"}</code>
                      </div>
                    )}
                  </div>

                  <input
                    ref={editFileInputRef}
                    type="file"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setEditFile(f);
                    }}
                  />

                  <div className="sm-replace-btns">
                    {editFile && (
                      <button
                        type="button"
                        className="sm-mini-btn"
                        onClick={() => {
                          setEditFile(null);
                          if (editFileInputRef.current) editFileInputRef.current.value = "";
                        }}
                      >
                        Clear Replacement
                      </button>
                    )}
                    <button
                      type="button"
                      className="sm-btn-glow secondary"
                      onClick={() => editFileInputRef.current?.click()}
                    >
                      <FiUploadCloud /> {editFile ? "Choose Other" : "Upload Replacement"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sm-modal-footer">
                <button
                  type="button"
                  className="sm-btn-glow secondary"
                  onClick={() => setIsEditOpen(false)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="sm-btn-glow primary" disabled={editLoading}>
                  {editLoading ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          PREVIEW / INSPECT MODAL
      ======================================================== */}
      {isPreviewOpen && previewItem && (
        <div className="sm-modal-overlay" onClick={() => setIsPreviewOpen(false)}>
          <div className="sm-modal-panel preview" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal-header">
              <div className="sm-modal-title-wrap">
                <div className="sm-modal-icon-badge preview">
                  <FiBookOpen />
                </div>
                <div>
                  <h2>{previewItem.title}</h2>
                  <p>
                    {previewItem.subject} • {COURSE_MAP[previewItem.courseId] || "BCA"} (Semester {previewItem.semester})
                  </p>
                </div>
              </div>
              <button className="sm-modal-close-btn" onClick={() => setIsPreviewOpen(false)}>
                <FiX />
              </button>
            </div>

            <div className="sm-preview-body">
              <div className="sm-preview-chips">
                {renderFormatBadge(previewItem.type, previewItem.fileUrl)}
                <span className="sm-cat-pill">{previewItem.category || "Notes"}</span>
                <span className="sm-vis-pill">Visibility: {previewItem.visibility || "ALL"}</span>
              </div>

              <div className="sm-preview-details-grid">
                <div className="sm-pd-item">
                  <span className="sm-pd-lbl">Subject</span>
                  <span className="sm-pd-val">{previewItem.subject}</span>
                </div>

                <div className="sm-pd-item">
                  <span className="sm-pd-lbl">Course & Semester</span>
                  <span className="sm-pd-val">
                    {COURSE_MAP[previewItem.courseId] || "BCA"} — Semester {previewItem.semester}
                  </span>
                </div>

                <div className="sm-pd-item">
                  <span className="sm-pd-lbl">Uploaded By</span>
                  <span className="sm-pd-val">{previewItem.faculty || "Faculty"}</span>
                </div>

                <div className="sm-pd-item">
                  <span className="sm-pd-lbl">Upload Date</span>
                  <span className="sm-pd-val">{formatDate(previewItem.createdAt)}</span>
                </div>
              </div>

              <div className="sm-preview-desc-box">
                <h4>Description & Learning Objectives:</h4>
                <p>
                  {previewItem.description
                    ? previewItem.description
                    : "No specific textual description provided. Use the download link below to access the full document content."}
                </p>
              </div>

              <div className="sm-preview-file-card">
                <div className="sm-pfc-info">
                  <FiFileText className="sm-pfc-ic" />
                  <div>
                    <strong>Resource Asset</strong>
                    <span>{previewItem.fileUrl ? previewItem.fileUrl.split("/").pop() : "File attached"}</span>
                  </div>
                </div>

                <div className="sm-pfc-actions">
                  <button
                    className="sm-btn-glow secondary"
                    onClick={() => handleCopyLink(previewItem.fileUrl)}
                  >
                    <FiCopy /> Copy Link
                  </button>

                  <button
                    className="sm-btn-glow primary"
                    onClick={() => handleDownload(previewItem.fileUrl, previewItem.title)}
                  >
                    <FiDownload /> Open Document
                  </button>
                </div>
              </div>
            </div>

            <div className="sm-modal-footer">
              <button
                className="sm-btn-glow secondary"
                onClick={() => {
                  setIsPreviewOpen(false);
                  openEditModal(previewItem);
                }}
              >
                <FiEdit2 /> Edit Resource
              </button>
              <button className="sm-btn-glow primary" onClick={() => setIsPreviewOpen(false)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          DELETE CONFIRMATION DIALOG
      ======================================================== */}
      {deleteId && (
        <div className="sm-modal-overlay" onClick={() => !isDeleting && setDeleteId(null)}>
          <div className="sm-modal-panel confirm" onClick={(e) => e.stopPropagation()}>
            <div className="sm-confirm-icon-wrap">
              <FiTrash2 />
            </div>

            <h3 className="sm-confirm-title">Delete Study Material?</h3>
            <p className="sm-confirm-desc">
              Are you sure you want to permanently delete this document from the faculty repository? Enrolled students will no longer be able to download it.
            </p>

            <div className="sm-confirm-actions">
              <button
                className="sm-btn-glow secondary"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="sm-btn-glow danger"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Yes, Delete Material"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
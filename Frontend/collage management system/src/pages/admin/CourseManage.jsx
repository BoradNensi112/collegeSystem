import React, { useEffect, useMemo, useState } from "react";
import {
  FiBookOpen,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiRefreshCw,
  FiCheckCircle,
  FiLayers,
  FiClock,
  FiAward,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
  FiFileText,
  FiPlusCircle
} from "react-icons/fi";
import "../../layout/admin/CourseManage.css";

const API_URL = import.meta.env.VITE_API_BASE || "http://localhost:5001";

const emptySubject = {
  subject_name: "",
  subject_code: "",
  semester: 1,
  credits: 4,
};

const initialForm = {
  course_id: "",
  course_name: "",
  course_code: "",
  duration_years: 3,
  total_semesters: 6,
  description: "",
  status: "ACTIVE",
  subjects: [{ ...emptySubject }],
};

export default function CourseManage() {
  const [form, setForm] = useState(initialForm);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [toast, setToast] = useState(null);

  const isEdit = useMemo(() => !!form.course_id, [form.course_id]);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCourses = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`${API_URL}/Course/list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page: 1,
          limit: 200,
          search,
          status: "",
        }),
      });

      const data = await res.json();

      if (data?.success) {
        setCourses(Array.isArray(data.rows) ? data.rows : []);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error("COURSE LIST ERROR =>", error);
      setCourses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [search]);

  const handleCourseChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "duration_years" || name === "total_semesters"
          ? Number(value)
          : value,
    }));
  };

  const handleSubjectChange = (index, field, value) => {
    setForm((prev) => {
      const updatedSubjects = [...prev.subjects];
      updatedSubjects[index] = {
        ...updatedSubjects[index],
        [field]:
          field === "semester" || field === "credits" ? Number(value) : value,
      };

      return {
        ...prev,
        subjects: updatedSubjects,
      };
    });
  };

  const addSubjectRow = () => {
    setForm((prev) => ({
      ...prev,
      subjects: [...prev.subjects, { ...emptySubject }],
    }));
  };

  const removeSubjectRow = (index) => {
    setForm((prev) => {
      const updatedSubjects = prev.subjects.filter((_, i) => i !== index);
      return {
        ...prev,
        subjects: updatedSubjects.length ? updatedSubjects : [{ ...emptySubject }],
      };
    });
  };

  const resetForm = () => {
    setForm(initialForm);
  };

  const buildPayload = () => {
    const cleanSubjects = form.subjects
      .filter((s) => s.subject_name.trim())
      .map((s) => ({
        subject_name: s.subject_name.trim(),
        subject_code: s.subject_code.trim(),
        semester: Number(s.semester) || 1,
        credits: Number(s.credits) || 4,
      }));

    return {
      course_id: form.course_id || undefined,
      course_name: form.course_name.trim(),
      course_code: form.course_code.trim().toUpperCase(),
      duration_years: Number(form.duration_years) || 3,
      total_semesters: Number(form.total_semesters) || 6,
      description: form.description.trim(),
      status: form.status,
      subjects: cleanSubjects,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.course_name.trim()) {
      alert("Course name is required");
      return;
    }

    if (!form.course_code.trim()) {
      alert("Course code is required");
      return;
    }

    const validSubjects = form.subjects.filter((s) => s.subject_name.trim());
    if (!validSubjects.length) {
      alert("At least one subject is required in curriculum");
      return;
    }

    try {
      setSaving(true);
      const payload = buildPayload();
      const url = isEdit
        ? `${API_URL}/Course/update`
        : `${API_URL}/Course/create`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data?.success) {
        showToast("ok", isEdit ? "Course updated successfully" : "New course registered successfully");
        resetForm();
        fetchCourses();
      } else {
        showToast("err", data?.message || "Failed to save course");
      }
    } catch (error) {
      console.error("COURSE SAVE ERROR =>", error);
      showToast("err", "Server error while saving course");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    const subjects =
      Array.isArray(item.subjects) && item.subjects.length
        ? item.subjects.map((sub) => ({
          subject_name: sub.subject_name || "",
          subject_code: sub.subject_code || "",
          semester: Number(sub.semester || 1),
          credits: Number(sub.credits || 4),
        }))
        : [{ ...emptySubject }];

    setForm({
      course_id: item.course_id || "",
      course_name: item.course_name || "",
      course_code: item.course_code || "",
      duration_years: Number(item.duration_years || 3),
      total_semesters: Number(item.total_semesters || 6),
      description: item.description || "",
      status: item.status || "ACTIVE",
      subjects,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (course_id, course_name) => {
    const ok = window.confirm(`Are you sure you want to delete ${course_name || "this course"}?`);
    if (!ok) return;

    try {
      const res = await fetch(`${API_URL}/Course/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ course_id }),
      });

      const data = await res.json();

      if (data?.success) {
        showToast("ok", "Course deleted successfully");
        fetchCourses();
        if (Number(form.course_id) === Number(course_id)) {
          resetForm();
        }
      } else {
        showToast("err", data?.message || "Delete failed");
      }
    } catch (error) {
      console.error("DELETE ERROR =>", error);
      showToast("err", "Server error");
    }
  };

  const toggleExpand = (id) => {
    setExpandedCourse((prev) => (prev === id ? null : id));
  };

  const totalSubjects = useMemo(() => {
    return courses.reduce(
      (sum, item) =>
        sum + (Array.isArray(item.subjects) ? item.subjects.length : 0),
      0
    );
  }, [courses]);

  return (
    <div className="cm-root">
      {/* Toast Alert */}
      {toast && (
        <div className={`cm-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheck /> : <FiAlertCircle />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* =========================================================
          1. HEADER HERO BANNER
          ========================================================= */}
      <section className="cm-hero">
        <div className="cm-hero-left">
          <div className="cm-live-chip">
            <span className="cm-ping" />
            <span className="cm-live-txt">ACADEMIC CURRICULUM & DEGREE SETUP • ACTIVE</span>
          </div>
          <h1 className="cm-title">Course &amp; Curriculum Manager</h1>
          <p className="cm-sub">
            Create academic degree programs, configure semester-wise subjects, credits, and syllabus structure.
          </p>
        </div>

        <div className="cm-hero-right">
          {/* KPI Summary Badges */}
          <div className="cm-kpi-row">
            <div className="cm-kpi-pill cyan">
              <span className="cm-kpi-lbl">Total Courses</span>
              <span className="cm-kpi-val">{courses.length}</span>
            </div>
            <div className="cm-kpi-pill indigo">
              <span className="cm-kpi-lbl">Curriculum Subjects</span>
              <span className="cm-kpi-val">{totalSubjects}</span>
            </div>
          </div>

          <div className="cm-hero-actions">
            <button
              className={`cm-btn ghost ${refreshing ? "spinning" : ""}`}
              onClick={() => fetchCourses(true)}
              disabled={refreshing}
              title="Refresh courses"
            >
              <FiRefreshCw className={refreshing ? "spin-ico" : ""} />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
            <button
              className="cm-btn primary"
              onClick={resetForm}
            >
              <FiPlusCircle />
              <span>+ New Course Form</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          2. TWO-COLUMN WORKBENCH (FORM LEFT + DIRECTORY RIGHT)
          ========================================================= */}
      <div className="cm-grid-layout">
        {/* LEFT PANEL: Course Creation & Subject Builder Form */}
        <div className="cm-card cm-form-panel">
          <div className="cm-card-head">
            <div className="cm-head-title">
              <div className="cm-head-icon">
                <FiBookOpen />
              </div>
              <div>
                <h3>{isEdit ? "Update Course Structure" : "Create New Academic Course"}</h3>
                <p>Define degree parameters and curriculum modules</p>
              </div>
            </div>

            {isEdit && (
              <button className="cm-btn ghost small cancel-btn" type="button" onClick={resetForm}>
                <FiX />
                <span>Cancel Edit</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="cm-form-body">
            {/* Step 1: Course Info */}
            <div className="cm-form-section">
              <div className="cm-section-title">
                <span className="cm-step-num">01</span>
                <span>Program Specifications</span>
              </div>

              <div className="cm-inputs-grid-2">
                <div className="cm-field">
                  <label>Course Title <span className="req">*</span></label>
                  <input
                    type="text"
                    name="course_name"
                    value={form.course_name}
                    onChange={handleCourseChange}
                    placeholder="e.g. Bachelor of Computer Applications"
                    required
                  />
                </div>

                <div className="cm-field">
                  <label>Course Code <span className="req">*</span></label>
                  <input
                    type="text"
                    name="course_code"
                    value={form.course_code}
                    onChange={handleCourseChange}
                    placeholder="e.g. BCA, MCA, BTECH"
                    required
                  />
                </div>
              </div>

              <div className="cm-inputs-grid-3">
                <div className="cm-field">
                  <label>Duration (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    name="duration_years"
                    value={form.duration_years}
                    onChange={handleCourseChange}
                  />
                </div>

                <div className="cm-field">
                  <label>Total Semesters</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    name="total_semesters"
                    value={form.total_semesters}
                    onChange={handleCourseChange}
                  />
                </div>

                <div className="cm-field">
                  <label>Course Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleCourseChange}
                    className="cm-select"
                  >
                    <option value="ACTIVE">ACTIVE (Enrolling)</option>
                    <option value="INACTIVE">INACTIVE (Archived)</option>
                  </select>
                </div>
              </div>

              <div className="cm-field">
                <label>Program Overview / Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleCourseChange}
                  rows="3"
                  placeholder="Outline syllabus highlights, prerequisites, and learning outcomes..."
                />
              </div>
            </div>

            {/* Step 2: Subjects Builder */}
            <div className="cm-form-section">
              <div className="cm-section-head-row">
                <div className="cm-section-title">
                  <span className="cm-step-num">02</span>
                  <span>Curriculum Subjects ({form.subjects.length})</span>
                </div>

                <button
                  type="button"
                  className="cm-btn ghost small add-sub-btn"
                  onClick={addSubjectRow}
                >
                  <FiPlus />
                  <span>Add Subject</span>
                </button>
              </div>

              <div className="cm-subjects-builder">
                {form.subjects.map((subject, index) => (
                  <div className="cm-sub-row-card" key={index}>
                    <div className="cm-sub-row-head">
                      <span className="cm-sub-idx">Subject #{index + 1}</span>
                      {form.subjects.length > 1 && (
                        <button
                          type="button"
                          className="cm-sub-del-btn"
                          onClick={() => removeSubjectRow(index)}
                          title="Remove subject"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>

                    <div className="cm-inputs-grid-2">
                      <div className="cm-field">
                        <label>Subject Name</label>
                        <input
                          type="text"
                          value={subject.subject_name}
                          onChange={(e) =>
                            handleSubjectChange(index, "subject_name", e.target.value)
                          }
                          placeholder="e.g. Data Structures & Algorithms"
                        />
                      </div>

                      <div className="cm-field">
                        <label>Subject Code</label>
                        <input
                          type="text"
                          value={subject.subject_code}
                          onChange={(e) =>
                            handleSubjectChange(index, "subject_code", e.target.value)
                          }
                          placeholder="e.g. CS201"
                        />
                      </div>
                    </div>

                    <div className="cm-inputs-grid-2">
                      <div className="cm-field">
                        <label>Semester</label>
                        <input
                          type="number"
                          min="1"
                          max={form.total_semesters || 12}
                          value={subject.semester}
                          onChange={(e) =>
                            handleSubjectChange(index, "semester", e.target.value)
                          }
                        />
                      </div>

                      <div className="cm-field">
                        <label>Credits</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={subject.credits}
                          onChange={(e) =>
                            handleSubjectChange(index, "credits", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="cm-form-footer">
              <button type="submit" className="cm-btn primary" disabled={saving}>
                {saving ? "Saving Program..." : isEdit ? "Update Course" : "Create Degree Course"}
              </button>

              <button type="button" className="cm-btn ghost" onClick={resetForm}>
                Reset Form
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT PANEL: Course Records List */}
        <div className="cm-card cm-records-panel">
          <div className="cm-card-head">
            <div className="cm-head-title">
              <div className="cm-head-icon cyan">
                <FiLayers />
              </div>
              <div>
                <h3>Registered Degree Programs</h3>
                <p>Configured academic courses in PostgreSQL</p>
              </div>
            </div>
          </div>

          <div className="cm-search-container">
            <div className="cm-search-input-wrap">
              <FiSearch className="cm-search-ico" />
              <input
                type="text"
                placeholder="Search by degree name or code (e.g. BCA, MCA)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="cm-clear-btn" onClick={() => setSearch("")}>✕</button>
              )}
            </div>
          </div>

          <div className="cm-course-list">
            {loading ? (
              <div className="cm-empty-state">
                <FiRefreshCw className="spin-ico" />
                <p>Loading course records...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="cm-empty-state">
                <FiBookOpen className="cm-empty-ico" />
                <h4>No courses found</h4>
                <p>Create your first academic degree course using the form on the left.</p>
              </div>
            ) : (
              courses.map((item) => {
                const isExpanded = expandedCourse === item.course_id;
                const subs = Array.isArray(item.subjects) ? item.subjects : [];
                const isActive = item.status === "ACTIVE";

                return (
                  <div key={item.course_id} className="cm-course-card">
                    <div className="cm-course-card-top">
                      <div className="cm-course-badge-row">
                        <span className="cm-code-badge">{item.course_code || "DEGREE"}</span>
                        <span className={`cm-status-tag ${isActive ? "active" : "inactive"}`}>
                          <span className="status-dot" />
                          {item.status || "ACTIVE"}
                        </span>
                      </div>

                      <div className="cm-card-actions">
                        <button
                          className="cm-icon-btn edit"
                          onClick={() => handleEdit(item)}
                          title="Edit Course"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="cm-icon-btn delete"
                          onClick={() => handleDelete(item.course_id, item.course_name)}
                          title="Delete Course"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>

                    <h4 className="cm-card-name">{item.course_name}</h4>
                    {item.description && (
                      <p className="cm-card-desc">{item.description}</p>
                    )}

                    <div className="cm-card-specs">
                      <div className="cm-spec-item">
                        <FiClock className="spec-ico" />
                        <span>{item.duration_years || 3} Years</span>
                      </div>
                      <div className="cm-spec-item">
                        <FiLayers className="spec-ico" />
                        <span>{item.total_semesters || 6} Semesters</span>
                      </div>
                      <div className="cm-spec-item">
                        <FiFileText className="spec-ico" />
                        <span>{subs.length} Subjects</span>
                      </div>
                    </div>

                    {/* Expandable Subjects Accordion */}
                    {subs.length > 0 && (
                      <div className="cm-accordion-section">
                        <button
                          className="cm-accordion-btn"
                          onClick={() => toggleExpand(item.course_id)}
                          type="button"
                        >
                          <span>{isExpanded ? "Hide Curriculum Subjects" : `View Curriculum (${subs.length} Subjects)`}</span>
                          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                        </button>

                        {isExpanded && (
                          <div className="cm-subs-expanded-list">
                            {subs.map((s, sIdx) => (
                              <div key={sIdx} className="cm-sub-item-pill">
                                <div className="cm-sub-left">
                                  <span className="cm-s-name">{s.subject_name}</span>
                                  {s.subject_code && <span className="cm-s-code">({s.subject_code})</span>}
                                </div>
                                <div className="cm-sub-right">
                                  <span className="cm-s-sem">Sem {s.semester || 1}</span>
                                  <span className="cm-s-cred">{s.credits || 4} Cr</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
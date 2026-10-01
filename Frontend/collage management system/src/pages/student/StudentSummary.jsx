import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../../layout/student/summaryStudent.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

function StudentSummary() {
  const [formData, setFormData] = useState({
    student_id: "",
    from_date: "",
    to_date: "",
    report_type: "semester",
  });

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    const today = new Date();
    const end = today.toISOString().split("T")[0];

    const beforeSixMonths = new Date();
    beforeSixMonths.setMonth(beforeSixMonths.getMonth() - 6);
    const start = beforeSixMonths.toISOString().split("T")[0];

    let studentId = "";

    try {
      const userData =
        JSON.parse(localStorage.getItem("user")) ||
        JSON.parse(localStorage.getItem("userdata")) ||
        JSON.parse(localStorage.getItem("student")) ||
        {};

      studentId =
        userData?.user_id ||
        userData?.student_id ||
        userData?.id ||
        userData?._id ||
        "";
    } catch (error) {
      studentId = "";
    }

    setFormData((prev) => ({
      ...prev,
      student_id: studentId,
      from_date: start,
      to_date: end,
    }));

    if (studentId) {
      (async () => {
        try {
          setLoading(true);
          setPageError("");
          const response = await axios.post(`${API_BASE}/Summary/student`, {
            student_id: studentId,
            from_date: start,
            to_date: end,
            report_type: "semester",
          });
          if (response?.data?.success) {
            setSummary(response.data.data);
          }
        } catch {
          // ignore
        } finally {
          setLoading(false);
        }
      })();
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const generateSummary = async () => {
    try {
      setLoading(true);
      setPageError("");
      setSummary(null);

      if (!formData.student_id) {
        setPageError("Student ID not found. Please login again.");
        return;
      }

      if (!formData.from_date || !formData.to_date) {
        setPageError("Please select from date and to date.");
        return;
      }

      const response = await axios.post(`${API_BASE}/Summary/student`, {
        student_id: formData.student_id,
        from_date: formData.from_date,
        to_date: formData.to_date,
        report_type: formData.report_type,
      });

      if (response?.data?.success) {
        setSummary(response.data.data);
      } else {
        setPageError(response?.data?.message || "Failed to fetch summary.");
      }
    } catch (error) {
      setPageError(
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Something went wrong while fetching summary."
      );
    } finally {
      setLoading(false);
    }
  };

  const attendancePercent = useMemo(() => {
    return Number(summary?.attendance?.attendance_percentage || 0);
  }, [summary]);

  const attendanceStyle = useMemo(() => {
    const safeValue = Math.min(Math.max(attendancePercent, 0), 100);
    return {
      background: `conic-gradient(#22c55e ${safeValue * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
    };
  }, [attendancePercent]);

  const feeStatusClass = useMemo(() => {
    const status = summary?.fees?.status || "NO_RECORD";
    if (status === "PAID") return "ss-badge paid";
    if (status === "PARTIAL") return "ss-badge partial";
    if (status === "DUE") return "ss-badge due";
    return "ss-badge neutral";
  }, [summary]);

  const resultGradeClass = useMemo(() => {
    const grade = summary?.result?.grade || "-";
    if (grade === "A+" || grade === "A") return "ss-badge paid";
    if (grade === "B" || grade === "C") return "ss-badge partial";
    if (grade === "D" || grade === "F") return "ss-badge due";
    return "ss-badge neutral";
  }, [summary]);

  return (
    <div className="ss-page">
      <div className="ss-bg ss-bg-one"></div>
      <div className="ss-bg ss-bg-two"></div>

      <div className="ss-wrap">
        <div className="ss-header-card">
          <div className="ss-title-block">
            <p className="ss-kicker">Student Report</p>
            <h1 className="ss-title">Your Report</h1>
            <p className="ss-subtitle">
              Generate semester or yearly report with attendance, fees,
              assignments, result and final remark.
            </p>
          </div>

          <div className="ss-top-chip">
            <span className="ss-chip-dot"></span>
            Live Report
          </div>
        </div>

        <div className="ss-filter-card">
          <div className="ss-field">
            <label>Student ID</label>
            <input
              type="text"
              name="student_id"
              value={formData.student_id}
              onChange={handleChange}
              placeholder="Student ID"
            />
          </div>

          <div className="ss-field">
            <label>From Date</label>
            <input
              type="date"
              name="from_date"
              value={formData.from_date}
              onChange={handleChange}
            />
          </div>

          <div className="ss-field">
            <label>To Date</label>
            <input
              type="date"
              name="to_date"
              value={formData.to_date}
              onChange={handleChange}
            />
          </div>

          <div className="ss-field">
            <label>Report Type</label>
            <select
              name="report_type"
              value={formData.report_type}
              onChange={handleChange}
            >
              <option value="semester">Semester</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="ss-btn-wrap">
            <button
              className="ss-generate-btn"
              onClick={generateSummary}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </div>

        {pageError ? (
          <div className="ss-message ss-error">{pageError}</div>
        ) : null}

        {!summary && !loading ? (
          <div className="ss-empty-card">
            <h3>No Report Generated Yet</h3>
            <p>
              Select date range and click on <strong>Generate Report</strong> to
              view student report.
            </p>
          </div>
        ) : null}

        {loading ? (
          <div className="ss-loading-card">
            <div className="ss-loader"></div>
            <p>Preparing report ...</p>
          </div>
        ) : null}

        {summary ? (
          <>
            <div className="ss-student-card">
              <div className="ss-student-left">
                <div className="ss-avatar">
                  {summary?.student?.name?.charAt(0)?.toUpperCase() || "S"}
                </div>

                <div>
                  <h2>{summary?.student?.name || "-"}</h2>
                  <p>@{summary?.student?.user_name || "-"}</p>
                </div>
              </div>

              <div className="ss-student-grid">
                <div className="ss-mini-info">
                  <span>Email</span>
                  <strong>{summary?.student?.email || "-"}</strong>
                </div>

                <div className="ss-mini-info">
                  <span>Enrollment</span>
                  <strong>{summary?.student?.enrollment || "-"}</strong>
                </div>

                <div className="ss-mini-info">
                  <span>Course</span>
                  <strong>{summary?.student?.course || "-"}</strong>
                </div>

                <div className="ss-mini-info">
                  <span>Semester</span>
                  <strong>{summary?.student?.sem ?? "-"}</strong>
                </div>

                <div className="ss-mini-info">
                  <span>Report Type</span>
                  <strong>{summary?.report_type || "-"}</strong>
                </div>

                <div className="ss-mini-info">
                  <span>Date Range</span>
                  <strong>
                    {summary?.from_date || "-"} to {summary?.to_date || "-"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="ss-main-grid">
              <div className="ss-attendance-card">
                <div className="ss-card-head">
                  <h3>Attendance Overview</h3>
                  <span className="ss-soft-tag">Performance</span>
                </div>

                <div className="ss-circle-wrap">
                  <div className="ss-circle" style={attendanceStyle}>
                    <div className="ss-circle-inner">
                      <h2>{attendancePercent}%</h2>
                      <p>Attendance</p>
                    </div>
                  </div>
                </div>

                <div className="ss-stat-grid">
                  <div className="ss-stat-box">
                    <span>Total Classes</span>
                    <strong>{summary?.attendance?.total_classes || 0}</strong>
                  </div>

                  <div className="ss-stat-box">
                    <span>Present</span>
                    <strong>{summary?.attendance?.present || 0}</strong>
                  </div>

                  <div className="ss-stat-box">
                    <span>Absent</span>
                    <strong>{summary?.attendance?.absent || 0}</strong>
                  </div>

                  <div className="ss-stat-box">
                    <span>Late / Leave</span>
                    <strong>
                      {(summary?.attendance?.late || 0) +
                        (summary?.attendance?.leave || 0)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="ss-side-grid">
                <div className="ss-card">
                  <div className="ss-card-head">
                    <h3>Fees Report</h3>
                    <span className={feeStatusClass}>
                      {summary?.fees?.status || "NO_RECORD"}
                    </span>
                  </div>

                  <div className="ss-data-list">
                    <div className="ss-data-row">
                      <span>Total Fees</span>
                      <strong>₹ {summary?.fees?.total_fees || 0}</strong>
                    </div>
                    <div className="ss-data-row">
                      <span>Paid Amount</span>
                      <strong>₹ {summary?.fees?.paid_amount || 0}</strong>
                    </div>
                    <div className="ss-data-row">
                      <span>Due Amount</span>
                      <strong>₹ {summary?.fees?.due_amount || 0}</strong>
                    </div>
                  </div>
                </div>

                <div className="ss-card">
                  <div className="ss-card-head">
                    <h3>Assignment Report</h3>
                    <span className="ss-badge neutral">
                      {summary?.assignments?.submission_percentage || 0}%
                    </span>
                  </div>

                  <div className="ss-data-list">
                    <div className="ss-data-row">
                      <span>Total Assignments</span>
                      <strong>
                        {summary?.assignments?.total_assignments || 0}
                      </strong>
                    </div>
                    <div className="ss-data-row">
                      <span>Submitted</span>
                      <strong>{summary?.assignments?.submitted || 0}</strong>
                    </div>
                    <div className="ss-data-row">
                      <span>Pending</span>
                      <strong>{summary?.assignments?.pending || 0}</strong>
                    </div>
                  </div>
                </div>

                <div className="ss-card">
                  <div className="ss-card-head">
                    <h3>Result Report</h3>
                    <span className={resultGradeClass}>
                      {summary?.result?.grade || "-"}
                    </span>
                  </div>

                  <div className="ss-data-list">
                    <div className="ss-data-row">
                      <span>Total Marks</span>
                      <strong>{summary?.result?.total_marks || 0}</strong>
                    </div>
                    <div className="ss-data-row">
                      <span>Obtained Marks</span>
                      <strong>{summary?.result?.obtained_marks || 0}</strong>
                    </div>
                    <div className="ss-data-row">
                      <span>Percentage</span>
                      <strong>{summary?.result?.percentage || 0}%</strong>
                    </div>
                  </div>
                </div>

                <div className="ss-card ss-remark-card">
                  <div className="ss-card-head">
                    <h3>Final Remark</h3>
                    <span className="ss-soft-tag">Overall</span>
                  </div>

                  <div className="ss-remark-box">
                    <h2>{summary?.final_remark || "-"}</h2>
                    <p>
                      This final remark is based on attendance, fees,
                      assignments and result performance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default StudentSummary;
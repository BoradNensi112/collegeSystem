import React, { useEffect, useMemo, useState } from "react";
import {
  FiDollarSign,
  FiCreditCard,
  FiTrendingUp,
  FiAlertTriangle,
  FiSearch,
  FiFilter,
  FiDownload,
  FiPlus,
  FiRefreshCw,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiUser,
  FiCalendar,
  FiTag,
  FiBookOpen
} from "react-icons/fi";
import "../../layout/admin/Feesmanage.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";
const FEES_API = `${API_BASE}/Fees`;
const STUDENT_API = `${API_BASE}/Student/postStudentData`;

const initialForm = {
  fee_id: "",
  student_id: "",
  student_name: "",
  enrollment: "",
  course: "",
  sem: "",
  fee_type: "Tuition",
  total_amount: "",
  paid_amount: "",
  due_date: "",
  status: "DUE",
  remarks: "",
};

const initialPayment = {
  fee_id: "",
  amount: "",
  payment_mode: "Cash",
  transaction_id: "",
  note: "",
};

const money = (value) => {
  const num = Number(value || 0);
  return `₹${num.toLocaleString("en-IN")}`;
};

const getId = (row) =>
  row?.fee_id || row?.id || row?.fees_id || row?.feesId || row?._id || "";

const getStudentId = (row) =>
  row?.student_id ||
  row?.studentId ||
  row?.user_id ||
  row?.userId ||
  row?.id ||
  row?._id ||
  "";

const extractArrayFromResponse = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.students)) return payload.students;
  if (Array.isArray(payload?.fees)) return payload.fees;
  if (Array.isArray(payload?.message)) return payload.message;

  if (payload?.data) {
    if (Array.isArray(payload.data?.rows)) return payload.data.rows;
    if (Array.isArray(payload.data?.data)) return payload.data.data;
    if (Array.isArray(payload.data?.result)) return payload.data.result;
    if (Array.isArray(payload.data?.records)) return payload.data.records;
    if (Array.isArray(payload.data?.students)) return payload.data.students;
    if (Array.isArray(payload.data?.fees)) return payload.data.fees;
    if (Array.isArray(payload.data?.message)) return payload.data.message;
  }

  return [];
};

const normalizeStatus = (row) => {
  const status = String(
    row?.status || row?.fee_status || row?.payment_status || ""
  )
    .trim()
    .toUpperCase();

  if (status) return status;

  const total = Number(row?.total_amount ?? row?.total ?? row?.amount ?? row?.fee_amount ?? 0);
  const paid = Number(row?.paid_amount ?? row?.paid ?? row?.paidAmount ?? 0);

  const dueDateRaw = row?.due_date || row?.dueDate || row?.duedate || null;
  const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;
  const today = new Date();

  if (paid >= total && total > 0) return "PAID";
  if (paid > 0 && paid < total) return "PARTIAL";
  if (dueDate && dueDate < today && paid < total) return "OVERDUE";
  return "DUE";
};

const normalizeFeeRow = (row) => {
  const total_amount = Number(
    row?.total_amount ??
      row?.total ??
      row?.amount ??
      row?.fee_amount ??
      row?.totalFee ??
      0
  );

  const paid_amount = Number(
    row?.paid_amount ??
      row?.paid ??
      row?.paidAmount ??
      row?.received_amount ??
      0
  );

  return {
    ...row,
    fee_id: getId(row),
    student_id: row?.student_id || row?.studentId || row?.sid || row?.user_id || "",
    student_name:
      row?.student_name ||
      row?.studentname ||
      row?.name ||
      row?.student ||
      `${row?.first_name || ""} ${row?.last_name || ""}`.trim() ||
      "",
    enrollment:
      row?.enrollment ||
      row?.enroll_no ||
      row?.enrollment_no ||
      row?.roll_no ||
      "",
    course: row?.course || row?.course_name || row?.department || "",
    sem: row?.sem || row?.semester || "",
    fee_type: row?.fee_type || row?.feestype || row?.type || "Tuition",
    total_amount,
    paid_amount,
    due_date: row?.due_date || row?.dueDate || row?.duedate || "",
    remarks: row?.remarks || row?.remark || "",
    status: normalizeStatus(row),
    has_fee_record: true,
  };
};

const normalizeStudent = (row) => {
  return {
    ...row,
    student_id: getStudentId(row),
    student_name:
      row?.student_name ||
      row?.name ||
      `${row?.first_name || ""} ${row?.last_name || ""}`.trim() ||
      row?.user_name ||
      "",
    enrollment: row?.enrollment || row?.enrollment_no || row?.roll_no || "",
    course: row?.course || row?.department || "",
    sem: row?.sem || row?.semester || "",
  };
};

const studentToFeeLikeRow = (student) => ({
  fee_id: "",
  student_id: student.student_id || "",
  student_name: student.student_name || "",
  enrollment: student.enrollment || "",
  course: student.course || "",
  sem: student.sem || "",
  fee_type: "Tuition",
  total_amount: 0,
  paid_amount: 0,
  due_date: "",
  remarks: "",
  status: "NOT_CREATED",
  has_fee_record: false,
});

export default function FeesManage() {
  const [feeRows, setFeeRows] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);

  const [summary, setSummary] = useState({
    total: 0,
    paid: 0,
    due: 0,
    overdue: 0,
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [courseFilter, setCourseFilter] = useState("ALL");

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [selectedIds, setSelectedIds] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const [form, setForm] = useState(initialForm);
  const [paymentData, setPaymentData] = useState(initialPayment);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchStudents = async () => {
    setStudentLoading(true);
    try {
      const res = await fetch(STUDENT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const json = await res.json();
      const rawRows = extractArrayFromResponse(json);
      const cleaned = rawRows.map(normalizeStudent).filter((s) => s.student_id);
      setStudents(cleaned);
    } catch (error) {
      console.error("Student fetch error:", error);
      setStudents([]);
    } finally {
      setStudentLoading(false);
    }
  };

  const fetchSummary = async (localRows = null) => {
    try {
      const res = await fetch(`${FEES_API}/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const json = await res.json();
      const src = json?.data || json || {};

      const total = Number(src.total || 0);
      const paid = Number(src.paid || 0);
      const due = Number(src.due || 0);
      const overdue = Number(src.overdue || 0);

      if (total || paid || due || overdue) {
        setSummary({ total, paid, due, overdue });
        return;
      }
    } catch (error) {
      console.error("Summary fetch error:", error);
    }

    const sourceRows = Array.isArray(localRows) ? localRows : feeRows;

    if (sourceRows.length) {
      const total = sourceRows.reduce((sum, r) => sum + Number(r.total_amount || 0), 0);
      const paid = sourceRows.reduce((sum, r) => sum + Number(r.paid_amount || 0), 0);
      const due = sourceRows.reduce(
        (sum, r) => sum + (Number(r.total_amount || 0) - Number(r.paid_amount || 0)),
        0
      );
      const overdue = sourceRows
        .filter((r) => r.status === "OVERDUE")
        .reduce(
          (sum, r) => sum + (Number(r.total_amount || 0) - Number(r.paid_amount || 0)),
          0
        );

      setSummary({ total, paid, due, overdue });
    } else {
      setSummary({ total: 0, paid: 0, due: 0, overdue: 0 });
    }
  };

  const fetchFees = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      let rawRows = [];

      try {
        const res = await fetch(`${FEES_API}/list`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: 1,
            limit: 1000,
            search: "",
            status: "",
            course: "",
          }),
        });

        const rawJson = await res.json();
        rawRows = extractArrayFromResponse(rawJson);
      } catch (err) {
        console.error("/list fetch failed:", err);
      }

      if (!rawRows.length) {
        try {
          const res2 = await fetch(`${FEES_API}/postFeesData`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });

          const rawJson2 = await res2.json();
          rawRows = extractArrayFromResponse(rawJson2);
        } catch (err) {
          console.error("/postFeesData fetch failed:", err);
        }
      }

      const cleaned = rawRows
        .map(normalizeFeeRow)
        .filter((r) => r.fee_id || r.student_id);

      setFeeRows(cleaned);
      fetchSummary(cleaned);
    } catch (error) {
      console.error("Fees list error:", error);
      setFeeRows([]);
      setAllRows([]);
      setRows([]);
      setSummary({ total: 0, paid: 0, due: 0, overdue: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFees();
    fetchStudents();
  }, []);

  useEffect(() => {
    const feeMap = new Map();

    feeRows.forEach((fee) => {
      const key =
        String(fee.student_id || "").trim() ||
        String(fee.enrollment || "").trim() ||
        String(fee.student_name || "").trim();

      if (key) feeMap.set(key, fee);
    });

    const merged = students.map((student) => {
      const key =
        String(student.student_id || "").trim() ||
        String(student.enrollment || "").trim() ||
        String(student.student_name || "").trim();

      const matchedFee = feeMap.get(key);

      return matchedFee
        ? {
            ...studentToFeeLikeRow(student),
            ...matchedFee,
            student_id: matchedFee.student_id || student.student_id,
            student_name: matchedFee.student_name || student.student_name,
            enrollment: matchedFee.enrollment || student.enrollment,
            course: matchedFee.course || student.course,
            sem: matchedFee.sem || student.sem,
            has_fee_record: true,
          }
        : studentToFeeLikeRow(student);
    });

    const feeOnlyRows = feeRows.filter((fee) => {
      return !students.some((student) => {
        const sKey =
          String(student.student_id || "").trim() ||
          String(student.enrollment || "").trim() ||
          String(student.student_name || "").trim();
        const fKey =
          String(fee.student_id || "").trim() ||
          String(fee.enrollment || "").trim() ||
          String(fee.student_name || "").trim();
        return sKey && fKey && sKey === fKey;
      });
    });

    setAllRows([...merged, ...feeOnlyRows]);
  }, [students, feeRows]);

  const filteredRows = useMemo(() => {
    let data = [...allRows];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((r) =>
        [
          r.student_name,
          r.student_id,
          r.enrollment,
          r.course,
          r.fee_type,
          r.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    if (statusFilter !== "ALL") {
      data = data.filter((r) => String(r.status).toUpperCase() === statusFilter);
    }

    if (courseFilter !== "ALL") {
      data = data.filter((r) => String(r.course || "") === courseFilter);
    }

    return data;
  }, [allRows, search, statusFilter, courseFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / limit));

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return filteredRows.slice(start, end);
  }, [filteredRows, page, limit]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  useEffect(() => {
    setRows(paginatedRows);
  }, [paginatedRows]);

  const courseOptions = useMemo(() => {
    const set = new Set(allRows.map((r) => r.course).filter(Boolean));
    return ["ALL", ...Array.from(set).sort()];
  }, [allRows]);

  const studentOptions = useMemo(() => students.filter((s) => s.student_id), [students]);

  const pageTotal = useMemo(
    () =>
      rows
        .filter((r) => r.has_fee_record)
        .reduce((sum, r) => sum + Number(r.total_amount || 0), 0),
    [rows]
  );

  const pagePaid = useMemo(
    () =>
      rows
        .filter((r) => r.has_fee_record)
        .reduce((sum, r) => sum + Number(r.paid_amount || 0), 0),
    [rows]
  );

  const pageDue = useMemo(
    () =>
      rows
        .filter((r) => r.has_fee_record)
        .reduce(
          (sum, r) => sum + (Number(r.total_amount || 0) - Number(r.paid_amount || 0)),
          0
        ),
    [rows]
  );

  // Collection recovery percent
  const recoveryPct = useMemo(() => {
    if (!summary.total) return 0;
    return Math.min(100, Math.round((summary.paid / summary.total) * 100));
  }, [summary]);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStudentChange = (e) => {
    const selectedId = e.target.value;
    const selectedStudent = students.find(
      (s) => String(s.student_id) === String(selectedId)
    );

    if (!selectedStudent) {
      setForm((prev) => ({
        ...prev,
        student_id: "",
        student_name: "",
        enrollment: "",
        course: "",
        sem: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      student_id: selectedStudent.student_id || "",
      student_name: selectedStudent.student_name || "",
      enrollment: selectedStudent.enrollment || "",
      course: selectedStudent.course || "",
      sem: selectedStudent.sem || "",
    }));
  };

  const handlePaymentInput = (e) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({ ...prev, [name]: value }));
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(initialForm);
  };

  const closePayment = () => {
    setShowPayment(false);
    setPaymentData(initialPayment);
  };

  const openAdd = () => {
    setForm(initialForm);
    setShowForm(true);
  };

  const openCreateFromRow = (row) => {
    setForm({
      fee_id: "",
      student_id: row.student_id || "",
      student_name: row.student_name || "",
      enrollment: row.enrollment || "",
      course: row.course || "",
      sem: row.sem || "",
      fee_type: "Tuition",
      total_amount: "",
      paid_amount: "",
      due_date: "",
      status: "DUE",
      remarks: "",
    });
    setShowForm(true);
  };

  const openEdit = async (row) => {
    if (!row.has_fee_record || !getId(row)) {
      openCreateFromRow(row);
      return;
    }

    const feeId = getId(row);
    if (!feeId) return showToast("err", "Fee ID not found");

    try {
      const res = await fetch(`${FEES_API}/postOneData`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fee_id: feeId }),
      });

      const json = await res.json();
      const one = normalizeFeeRow(json?.data || json?.row || json || row);

      setForm({
        fee_id: one.fee_id || "",
        student_id: one.student_id || "",
        student_name: one.student_name || "",
        enrollment: one.enrollment || "",
        course: one.course || "",
        sem: one.sem || "",
        fee_type: one.fee_type || "Tuition",
        total_amount: one.total_amount || "",
        paid_amount: one.paid_amount || "",
        due_date: one.due_date ? String(one.due_date).slice(0, 10) : "",
        status: one.status || "DUE",
        remarks: one.remarks || "",
      });

      setShowForm(true);
    } catch (error) {
      console.error("Fetch one fee error:", error);
      const one = normalizeFeeRow(row);

      setForm({
        fee_id: one.fee_id || "",
        student_id: one.student_id || "",
        student_name: one.student_name || "",
        enrollment: one.enrollment || "",
        course: one.course || "",
        sem: one.sem || "",
        fee_type: one.fee_type || "Tuition",
        total_amount: one.total_amount || "",
        paid_amount: one.paid_amount || "",
        due_date: one.due_date ? String(one.due_date).slice(0, 10) : "",
        status: one.status || "DUE",
        remarks: one.remarks || "",
      });

      setShowForm(true);
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const isEdit = !!form.fee_id;
      const endpoint = isEdit ? "/Fupdate" : "/Fadd";

      const payload = {
        ...form,
        total_amount: Number(form.total_amount || 0),
        paid_amount: Number(form.paid_amount || 0),
      };

      const res = await fetch(`${FEES_API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok) {
        showToast("ok", isEdit ? "Fee schedule updated" : "New fee record generated");
        closeForm();
        fetchFees();
      } else {
        showToast("err", json?.message || "Save failed");
      }
    } catch (error) {
      console.error("Save fee error:", error);
      showToast("err", "Failed to save fee record");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const feeId = getId(row);
    if (!feeId) return showToast("err", "Fee record not created yet");

    if (!window.confirm(`Are you sure you want to delete fee ledger for ${row.student_name || "this student"}?`)) return;

    try {
      const res = await fetch(`${FEES_API}/Fdelete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fee_id: feeId }),
      });

      const json = await res.json();

      if (res.ok) {
        setSelectedIds((prev) => prev.filter((id) => id !== feeId));
        showToast("ok", "Fee record removed");
        fetchFees();
      } else {
        showToast("err", json?.message || "Delete failed");
      }
    } catch (error) {
      console.error("Delete fee error:", error);
      showToast("err", "Failed to delete fee record");
    }
  };

  const openPaymentModal = (row) => {
    if (!row.has_fee_record || !getId(row)) {
      showToast("err", "Pehle is student ke liye fee record create karo");
      return;
    }

    const dueAmount = Math.max(0, Number(row.total_amount || 0) - Number(row.paid_amount || 0));

    setPaymentData({
      fee_id: getId(row),
      student_name: row.student_name,
      amount: dueAmount > 0 ? dueAmount : "",
      payment_mode: "Cash",
      transaction_id: "",
      note: "",
    });
    setShowPayment(true);
  };

  const submitPayment = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${FEES_API}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paymentData,
          amount: Number(paymentData.amount || 0),
        }),
      });

      const json = await res.json();

      if (res.ok) {
        showToast("ok", `Payment of ₹${Number(paymentData.amount || 0).toLocaleString()} recorded`);
        closePayment();
        fetchFees();
      } else {
        showToast("err", json?.message || "Payment recording failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      showToast("err", "Something went wrong while saving payment");
    }
  };

  const toggleSelect = (id) => {
    if (!id) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const ids = rows.map((r) => getId(r)).filter(Boolean);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const handleBulkStatus = async (status) => {
    if (!selectedIds.length) return showToast("err", "Please select at least one fee row");

    try {
      const res = await fetch(`${FEES_API}/bulkStatus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fee_ids: selectedIds,
          status,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        showToast("ok", `Bulk status marked as ${status} for ${selectedIds.length} records`);
        setSelectedIds([]);
        fetchFees();
      } else {
        showToast("err", json?.message || "Bulk update failed");
      }
    } catch (error) {
      console.error("Bulk status error:", error);
      showToast("err", "Failed to update bulk status");
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`${FEES_API}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          search,
          status: statusFilter === "ALL" ? "" : statusFilter,
          course: courseFilter === "ALL" ? "" : courseFilter,
        }),
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fees-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("ok", "Fees report downloaded");
    } catch (error) {
      console.error("Export error:", error);
      showToast("err", "Export failed");
    }
  };

  const handleReceipt = async (row) => {
    const feeId = getId(row);
    if (!feeId) return showToast("err", "Pehle fee record create karo");

    try {
      const res = await fetch(`${FEES_API}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fee_id: feeId }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/pdf")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      } else {
        const json = await res.json();
        showToast("ok", `Receipt generated for ${row.student_name}`);
      }
    } catch (error) {
      console.error("Receipt error:", error);
      showToast("err", "Receipt generation failed");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setCourseFilter("ALL");
    setPage(1);
  };

  return (
    <div className="fees-pro-root">
      {/* Toast Alert */}
      {toast && (
        <div className={`fees-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheck /> : <FiAlertCircle />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* =========================================================
          1. HERO COMMAND BANNER
          ========================================================= */}
      <section className="fees-hero-banner">
        <div className="fees-hero-left">
          <div className="fees-live-chip">
            <span className="fees-ping" />
            <span className="fees-live-txt">FINANCIAL OPERATIONS &amp; FEE RECOVERY • CONTROL DESK</span>
          </div>
          <h1 className="fees-hero-title">Fees Management &amp; Accounts</h1>
          <p className="fees-hero-sub">
            Monitor tuition revenue pipelines, track overdue balances, issue receipts, and manage student fee schedules.
          </p>
        </div>

        <div className="fees-hero-right">
          <div className="fees-hero-actions">
            <button
              className={`fees-btn ghost ${refreshing ? "spinning" : ""}`}
              onClick={() => fetchFees(true)}
              disabled={refreshing}
              title="Refresh financial records"
            >
              <FiRefreshCw className={refreshing ? "spin-ico" : ""} />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>

            <button className="fees-btn ghost" onClick={handleExport} title="Download CSV report">
              <FiDownload />
              <span>Export Ledger</span>
            </button>

            <button className="fees-btn primary" onClick={openAdd}>
              <FiPlus />
              <span>+ Create Fee</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          2. FINANCIAL KPI MEGA STATS GRID
          ========================================================= */}
      <div className="fees-kpi-grid">
        <div className="fees-kpi-card total">
          <div className="kpi-top">
            <span className="kpi-title">Total Invoiced Fees</span>
            <div className="kpi-icon-box total">
              <FiDollarSign />
            </div>
          </div>
          <div className="kpi-amount">{money(summary.total)}</div>
          <div className="kpi-foot">
            <span>All active registered students</span>
          </div>
        </div>

        <div className="fees-kpi-card paid">
          <div className="kpi-top">
            <span className="kpi-title">Fee Revenue Collected</span>
            <div className="kpi-icon-box paid">
              <FiTrendingUp />
            </div>
          </div>
          <div className="kpi-amount paid-val">{money(summary.paid)}</div>
          <div className="kpi-foot">
            <div className="recovery-bar-wrap">
              <div className="recovery-bar-fill" style={{ width: `${recoveryPct}%` }} />
            </div>
            <span className="pct-txt">{recoveryPct}% Settled</span>
          </div>
        </div>

        <div className="fees-kpi-card due">
          <div className="kpi-top">
            <span className="kpi-title">Pending Due Balance</span>
            <div className="kpi-icon-box due">
              <FiClock />
            </div>
          </div>
          <div className="kpi-amount due-val">{money(summary.due)}</div>
          <div className="kpi-foot">
            <span>Outstanding follow-up balance</span>
          </div>
        </div>

        <div className="fees-kpi-card overdue">
          <div className="kpi-top">
            <span className="kpi-title">Overdue Arrears</span>
            <div className="kpi-icon-box overdue">
              <FiAlertTriangle />
            </div>
          </div>
          <div className="kpi-amount overdue-val">{money(summary.overdue)}</div>
          <div className="kpi-foot">
            <span>Passed payment deadline</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          3. FILTER, SEARCH & BULK ACTION BAR
          ========================================================= */}
      <div className="fees-controls-card">
        <div className="fees-search-row">
          <div className="fees-search-box">
            <FiSearch className="search-ico" />
            <input
              type="text"
              placeholder="Search by student name, enrollment, student ID, course..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && <button className="clear-search-btn" onClick={() => setSearch("")}>✕</button>}
          </div>

          <div className="fees-dropdown-group">
            <div className="select-wrap">
              <FiFilter className="select-ico" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Paid Only</option>
                <option value="PARTIAL">Partial Only</option>
                <option value="DUE">Due Only</option>
                <option value="OVERDUE">Overdue Only</option>
                <option value="NOT_CREATED">Not Created</option>
              </select>
            </div>

            <div className="select-wrap">
              <FiBookOpen className="select-ico" />
              <select
                value={courseFilter}
                onChange={(e) => {
                  setCourseFilter(e.target.value);
                  setPage(1);
                }}
              >
                {courseOptions.map((c) => (
                  <option key={c} value={c}>
                    {c === "ALL" ? "All Degree Courses" : c}
                  </option>
                ))}
              </select>
            </div>

            {(search || statusFilter !== "ALL" || courseFilter !== "ALL") && (
              <button className="fees-btn ghost small" onClick={resetFilters}>
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Bulk Actions & Page Stats Row */}
        <div className="fees-bulk-row">
          <div className="bulk-actions-group">
            <span className="bulk-label">
              {selectedIds.length > 0 ? `${selectedIds.length} records selected:` : "Bulk Status Actions:"}
            </span>
            <button
              className="bulk-btn due"
              disabled={!selectedIds.length}
              onClick={() => handleBulkStatus("DUE")}
            >
              Mark Due
            </button>
            <button
              className="bulk-btn overdue"
              disabled={!selectedIds.length}
              onClick={() => handleBulkStatus("OVERDUE")}
            >
              Mark Overdue
            </button>
            <button
              className="bulk-btn paid"
              disabled={!selectedIds.length}
              onClick={() => handleBulkStatus("PAID")}
            >
              Mark Paid
            </button>
          </div>

          <div className="page-summary-pills">
            <span className="summary-pill">
              Page Total: <strong>{money(pageTotal)}</strong>
            </span>
            <span className="summary-pill paid">
              Collected: <strong>{money(pagePaid)}</strong>
            </span>
            <span className="summary-pill due">
              Pending: <strong>{money(pageDue)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================
          4. GLASSMORPHIC LEDGER TABLE
          ========================================================= */}
      <div className="fees-table-card">
        <div className="fees-table-wrap">
          <table className="fees-table">
            <thead>
              <tr>
                <th className="th-chk">
                  <input
                    type="checkbox"
                    checked={
                      rows.length > 0 &&
                      rows.filter((r) => getId(r)).every((r) => selectedIds.includes(getId(r)))
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Student Details</th>
                <th>Enrollment</th>
                <th>Course &amp; Sem</th>
                <th>Fee Type</th>
                <th>Total Invoiced</th>
                <th>Amount Paid</th>
                <th>Pending Due</th>
                <th>Payment Due Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading || studentLoading ? (
                <tr>
                  <td colSpan={11} className="empty-cell">
                    <div className="loading-state">
                      <FiRefreshCw className="spin-ico" />
                      <span>Loading financial records from PostgreSQL...</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="empty-cell">
                    <div className="no-data-state">
                      <FiDollarSign className="no-ico" />
                      <h4>No fee records found</h4>
                      <p>Try modifying your search or reset active filters.</p>
                      <button className="fees-btn primary small" onClick={openAdd}>
                        + Create Fee Record
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const id = getId(row) || `student-${row.student_id || index}`;
                  const total = Number(row.total_amount || 0);
                  const paid = Number(row.paid_amount || 0);
                  const due = total - paid;
                  const st = String(row.status || "DUE").toUpperCase();
                  const isChecked = getId(row) ? selectedIds.includes(getId(row)) : false;

                  return (
                    <tr key={id} className={isChecked ? "selected-row" : ""}>
                      <td className="td-chk">
                        <input
                          type="checkbox"
                          disabled={!getId(row)}
                          checked={isChecked}
                          onChange={() => toggleSelect(getId(row))}
                        />
                      </td>

                      <td>
                        <div className="student-profile-cell">
                          <div className="student-avatar-circle">
                            {(row.student_name?.[0] || "S").toUpperCase()}
                          </div>
                          <div>
                            <div className="student-name">{row.student_name || "—"}</div>
                            <div className="student-id-tag">ID: {row.student_id || "—"}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="mono-code">{row.enrollment || "—"}</span>
                      </td>

                      <td>
                        <div className="course-sem-cell">
                          <span className="course-tag">{row.course || "—"}</span>
                          {row.sem && <span className="sem-pill">Sem {row.sem}</span>}
                        </div>
                      </td>

                      <td>
                        <span className="fee-type-badge">
                          <FiTag className="type-ico" />
                          {row.fee_type || "Tuition"}
                        </span>
                      </td>

                      <td>
                        <strong className="amount-val">{money(total)}</strong>
                      </td>

                      <td>
                        <span className="amount-paid">{money(paid)}</span>
                      </td>

                      <td>
                        <span className={`amount-due ${due > 0 ? "due-high" : "settled"}`}>
                          {money(due)}
                        </span>
                      </td>

                      <td>
                        <div className="due-date-cell">
                          <FiCalendar className="date-ico" />
                          <span>{row.due_date ? new Date(row.due_date).toLocaleDateString("en-IN") : "—"}</span>
                        </div>
                      </td>

                      <td>
                        <span className={`fee-status-badge ${st.toLowerCase()}`}>
                          <span className="dot" />
                          {st === "NOT_CREATED" ? "NOT CREATED" : st}
                        </span>
                      </td>

                      <td className="text-right">
                        <div className="fee-action-bar">
                          {row.has_fee_record ? (
                            <>
                              <button
                                className="fee-act-btn pay"
                                onClick={() => openPaymentModal(row)}
                                title="Collect Fee Payment"
                              >
                                <FiCreditCard />
                              </button>
                              <button
                                className="fee-act-btn edit"
                                onClick={() => openEdit(row)}
                                title="Edit Fee Record"
                              >
                                <FiEdit2 />
                              </button>
                              <button
                                className="fee-act-btn receipt"
                                onClick={() => handleReceipt(row)}
                                title="Generate Receipt"
                              >
                                <FiFileText />
                              </button>
                              <button
                                className="fee-act-btn delete"
                                onClick={() => handleDelete(row)}
                                title="Delete Record"
                              >
                                <FiTrash2 />
                              </button>
                            </>
                          ) : (
                            <button
                              className="fees-btn primary small"
                              onClick={() => openCreateFromRow(row)}
                            >
                              + Create Fee
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* =========================================================
            5. PAGINATION BAR
            ========================================================= */}
        <div className="fees-pagination">
          <div className="page-count-info">
            Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({filteredRows.length} total records)
          </div>

          <div className="pager-controls">
            <button
              className="page-nav-btn"
              onClick={() => setPage(1)}
              disabled={page === 1}
              title="First Page"
            >
              <FiChevronsLeft />
            </button>
            <button
              className="page-nav-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              title="Previous Page"
            >
              <FiChevronLeft />
            </button>

            <span className="active-page-num">{page}</span>

            <button
              className="page-nav-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              title="Next Page"
            >
              <FiChevronRight />
            </button>
            <button
              className="page-nav-btn"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              title="Last Page"
            >
              <FiChevronsRight />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          6. CREATE / EDIT FEE MODAL
          ========================================================= */}
      {showForm && (
        <div className="fees-modal-backdrop" onClick={closeForm}>
          <div className="fees-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="fees-modal-header">
              <div className="modal-title-box">
                <div className="modal-icon-box">
                  {form.fee_id ? <FiEdit2 /> : <FiDollarSign />}
                </div>
                <div>
                  <h3 className="modal-title">{form.fee_id ? "Update Fee Schedule" : "Create New Fee Record"}</h3>
                  <p className="modal-sub">Configure academic fee dues and collection timeline</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeForm}>
                <FiX />
              </button>
            </div>

            <form onSubmit={submitForm} className="fees-modal-body">
              <div className="form-grid-2">
                <div className="form-field full-width">
                  <label>Select Enrolled Student <span className="req">*</span></label>
                  <select
                    name="selected_student"
                    value={form.student_id}
                    onChange={handleStudentChange}
                    disabled={studentLoading || !!form.fee_id}
                    required
                  >
                    <option value="">
                      {studentLoading ? "Loading student list..." : "Choose Student from PostgreSQL Database..."}
                    </option>
                    {studentOptions.map((student) => (
                      <option key={student.student_id} value={student.student_id}>
                        {student.student_name} ({student.course || "General"} - {student.enrollment || student.student_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Student Name</label>
                  <input name="student_name" value={form.student_name} readOnly placeholder="Auto-filled" />
                </div>

                <div className="form-field">
                  <label>Enrollment / Roll No</label>
                  <input name="enrollment" value={form.enrollment} readOnly placeholder="Auto-filled" />
                </div>

                <div className="form-field">
                  <label>Degree Course</label>
                  <input name="course" value={form.course} readOnly placeholder="Auto-filled" />
                </div>

                <div className="form-field">
                  <label>Semester</label>
                  <input name="sem" value={form.sem} readOnly placeholder="Auto-filled" />
                </div>

                <div className="form-field">
                  <label>Fee Classification / Type <span className="req">*</span></label>
                  <select name="fee_type" value={form.fee_type} onChange={handleInput} required>
                    <option value="Tuition">Tuition Fee</option>
                    <option value="Exam">Examination Fee</option>
                    <option value="Hostel">Hostel &amp; Mess Fee</option>
                    <option value="Transport">Campus Transport</option>
                    <option value="Library">Library &amp; Lab Fee</option>
                    <option value="Other">Other / Miscellaneous</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Total Invoiced Amount (₹) <span className="req">*</span></label>
                  <input
                    name="total_amount"
                    type="number"
                    value={form.total_amount}
                    onChange={handleInput}
                    placeholder="e.g. 45000"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Paid Amount (₹)</label>
                  <input
                    name="paid_amount"
                    type="number"
                    value={form.paid_amount}
                    onChange={handleInput}
                    placeholder="e.g. 0 or 20000"
                  />
                </div>

                <div className="form-field">
                  <label>Payment Due Date <span className="req">*</span></label>
                  <input
                    name="due_date"
                    type="date"
                    value={form.due_date}
                    onChange={handleInput}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Status Classification</label>
                  <select name="status" value={form.status} onChange={handleInput}>
                    <option value="DUE">DUE (Unpaid)</option>
                    <option value="PARTIAL">PARTIAL (Partially Paid)</option>
                    <option value="PAID">PAID (Fully Settled)</option>
                    <option value="OVERDUE">OVERDUE (Delayed)</option>
                  </select>
                </div>

                <div className="form-field full-width">
                  <label>Remarks &amp; Payment Notes</label>
                  <textarea
                    name="remarks"
                    value={form.remarks}
                    onChange={handleInput}
                    placeholder="Optional remarks, installment notes, concession details..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="fees-btn ghost" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="fees-btn primary" disabled={saving}>
                  {saving ? "Processing..." : form.fee_id ? "Update Fee Schedule" : "Save Fee Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          7. COLLECT PAYMENT MODAL
          ========================================================= */}
      {showPayment && (
        <div className="fees-modal-backdrop" onClick={closePayment}>
          <div className="fees-modal-panel small" onClick={(e) => e.stopPropagation()}>
            <div className="fees-modal-header">
              <div className="modal-title-box">
                <div className="modal-icon-box paid">
                  <FiCreditCard />
                </div>
                <div>
                  <h3 className="modal-title">Record Fee Payment</h3>
                  <p className="modal-sub">
                    Student: <strong>{paymentData.student_name}</strong>
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closePayment}>
                <FiX />
              </button>
            </div>

            <form onSubmit={submitPayment} className="fees-modal-body">
              <div className="form-grid-1">
                <div className="form-field">
                  <label>Payment Amount Received (₹) <span className="req">*</span></label>
                  <input
                    name="amount"
                    type="number"
                    value={paymentData.amount}
                    onChange={handlePaymentInput}
                    placeholder="Enter collected amount"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Payment Mode / Method <span className="req">*</span></label>
                  <select
                    name="payment_mode"
                    value={paymentData.payment_mode}
                    onChange={handlePaymentInput}
                    required
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cash">Cash at Counter</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Bank Transfer">Net Banking / NEFT / RTGS</option>
                    <option value="Cheque">Demand Draft / Cheque</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Transaction ID / Reference No</label>
                  <input
                    name="transaction_id"
                    value={paymentData.transaction_id}
                    onChange={handlePaymentInput}
                    placeholder="e.g. UPI-923847293847"
                  />
                </div>

                <div className="form-field">
                  <label>Payment Remarks / Note</label>
                  <textarea
                    name="note"
                    value={paymentData.note}
                    onChange={handlePaymentInput}
                    placeholder="e.g. Received via GPay from student father"
                    rows={2}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="fees-btn ghost" onClick={closePayment}>
                  Cancel
                </button>
                <button type="submit" className="fees-btn primary">
                  <FiCheckCircle />
                  <span>Confirm Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
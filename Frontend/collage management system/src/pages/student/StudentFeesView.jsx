import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiDollarSign,
  FiCreditCard,
  FiAlertTriangle,
  FiSearch,
  FiDownload,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiRefreshCw,
  FiPrinter,
  FiShield,
  FiChevronRight,
  FiPercent,
  FiLock,
  FiSmartphone,
  FiCalendar,
  FiUser
} from "react-icons/fi";
import "../../layout/student/StudentFeesView.css";
import { getActiveStudentSession } from "../../utils/studentSession";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";
const FEES_API = `${API_BASE}/Fees`;

const money = (value) => {
  const num = Number(value || 0);
  return `₹${num.toLocaleString("en-IN")}`;
};

const extractArrayFromResponse = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.fees)) return payload.fees;
  if (Array.isArray(payload?.message)) return payload.message;
  return [];
};

const normalizeStatus = (row) => {
  const status = String(row?.status || row?.fee_status || "").trim().toUpperCase();
  if (status) return status;

  const total = Number(row?.total_amount || 0);
  const paid = Number(row?.paid_amount || 0);
  if (paid >= total && total > 0) return "PAID";
  if (paid > 0 && paid < total) return "PARTIAL";
  return "DUE";
};

const formatDate = (dateStr) => {
  if (!dateStr) return "End of Session";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function StudentFeesView() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Search & Category Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all"); // 'all' | 'PAID' | 'PARTIAL' | 'DUE' | 'sem-X'

  // Payment Gateway Modal State
  const [payModal, setPayModal] = useState(false);
  const [payRow, setPayRow] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("UPI / Online QR");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Official Fee Receipt Modal State
  const [receiptModal, setReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Official Cumulative Statement Modal State
  const [statementModal, setStatementModal] = useState(false);

  const student = useMemo(() => getActiveStudentSession(), []);

  const showToast = (message, type = "ok") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  const fetchStudentFees = async () => {
    setLoading(true);
    try {
      let res = await axios.post(`${FEES_API}/postFeesData`, {
        student_id: student.id,
        enrollment: student.enrollment,
      });

      let rawRows = extractArrayFromResponse(res.data);
      if (!rawRows.length) {
        // Fallback fetch all and filter client-side if needed
        res = await axios.post(`${FEES_API}/postFeesData`, {});
        const all = extractArrayFromResponse(res.data);
        rawRows = all.filter(
          (f) =>
            String(f.student_id) === String(student.id) ||
            String(f.enrollment).toLowerCase() === String(student.enrollment).toLowerCase() ||
            (f.student_name && f.student_name.toLowerCase().includes(student.name.toLowerCase()))
        );
      }

      setFees(rawRows);
    } catch (err) {
      showToast("Failed to load fee statements", "err");
      setFees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentFees();
  }, [student.id]);

  // Handle ESC key to close open modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setPayModal(false);
        setReceiptModal(false);
        setStatementModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Overall Financial Summary
  const summary = useMemo(() => {
    let total = 0;
    let paid = 0;
    fees.forEach((f) => {
      total += Number(f.total_amount || 0);
      paid += Number(f.paid_amount || 0);
    });
    const pending = Math.max(0, total - paid);
    const pct = total > 0 ? (paid / total) * 100 : 100;
    return {
      total,
      paid,
      pending,
      overallPct: Number(pct.toFixed(1)),
      recordsCount: fees.length,
      allClear: pending === 0 && total > 0,
    };
  }, [fees]);

  // Unique Dynamic Category Options
  const categoryOptions = useMemo(() => {
    const list = [{ key: "all", label: `All Invoices (${fees.length})` }];

    const paidCount = fees.filter((f) => normalizeStatus(f) === "PAID").length;
    if (paidCount > 0) list.push({ key: "PAID", label: `Paid / Cleared (${paidCount})` });

    const partialCount = fees.filter((f) => normalizeStatus(f) === "PARTIAL").length;
    if (partialCount > 0) list.push({ key: "PARTIAL", label: `Partial Due (${partialCount})` });

    const dueCount = fees.filter((f) => normalizeStatus(f) === "DUE" || normalizeStatus(f) === "OVERDUE").length;
    if (dueCount > 0) list.push({ key: "DUE", label: `Pending Dues (${dueCount})` });

    const sems = [...new Set(fees.map((f) => f.semester || f.sem).filter(Boolean))];
    sems.forEach((s) => {
      const count = fees.filter((f) => (f.semester || f.sem) === s).length;
      list.push({ key: `sem-${s}`, label: `Semester ${s} (${count})` });
    });

    return list;
  }, [fees]);

  // Filtered fee records based on search and active category
  const filteredFees = useMemo(() => {
    return fees.filter((item) => {
      const status = normalizeStatus(item);
      let matchesCategory = true;

      if (activeCategory === "PAID" || activeCategory === "PARTIAL") {
        matchesCategory = status === activeCategory;
      } else if (activeCategory === "DUE") {
        matchesCategory = status === "DUE" || status === "OVERDUE";
      } else if (activeCategory.startsWith("sem-")) {
        const semNum = Number(activeCategory.replace("sem-", ""));
        matchesCategory = Number(item.semester || item.sem) === semNum;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        String(item.fee_id).includes(q) ||
        String(item.fee_type || "").toLowerCase().includes(q) ||
        String(item.course || "").toLowerCase().includes(q) ||
        String(item.semester || item.sem || "").includes(q) ||
        String(item.note || item.remarks || "").toLowerCase().includes(q) ||
        String(item.status || "").toLowerCase().includes(q);

      return matchesCategory && matchesQuery;
    });
  }, [fees, searchQuery, activeCategory]);

  // Open Payment Modal
  const handleOpenPay = (row) => {
    const due = Math.max(0, Number(row.total_amount || 0) - Number(row.paid_amount || 0));
    setPayRow(row);
    setPayAmount(String(due));
    setPayMode("UPI / Online QR");
    setUpiId("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setPayModal(true);
  };

  // Open Official Receipt Modal
  const handleOpenReceipt = (row) => {
    const total = Number(row.total_amount || 0);
    const paid = Number(row.paid_amount || 0);
    const due = Math.max(0, total - paid);
    const txnId = `TXN-NAV-${(row.fee_id * 83721).toString().slice(0, 8)}`;
    const today = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    setReceiptData({
      fee_id: row.fee_id,
      receiptNo: `REC-2026-${String(row.fee_id).padStart(4, "0")}`,
      date: row.due_date ? formatDate(row.due_date) : today,
      generatedDate: today,
      studentName: row.student_name || student.name,
      enrollment: row.enrollment || student.enrollment,
      course: row.course || student.course,
      semester: row.semester || row.sem || student.semester,
      academicYear: row.year || "2025-2026",
      feeType: row.fee_type || "Semester Tuition & Laboratory Dues",
      totalAmount: total,
      paidAmount: paid,
      dueAmount: due,
      status: normalizeStatus(row),
      paymentMode: paid >= total ? "Online Bank Transfer / UPI Gateway" : "Partial Online Advance",
      transactionId: txnId,
      remarks: row.note || row.remarks || "Semester fee acknowledgment confirmed by Accounts Division.",
    });
    setReceiptModal(true);
  };

  // Process Online Payment
  const handleProcessPayment = async (e) => {
    if (e) e.preventDefault();
    if (!payRow) return;

    const amt = Number(payAmount || 0);
    if (amt <= 0) {
      showToast("Payment amount must be greater than ₹0", "err");
      return;
    }

    const due = Math.max(0, Number(payRow.total_amount || 0) - Number(payRow.paid_amount || 0));
    if (amt > due) {
      showToast(`Amount cannot exceed pending balance of ${money(due)}`, "err");
      return;
    }

    try {
      setPaySubmitting(true);
      const txnId = `TXN-STU-${Date.now().toString().slice(-8)}`;

      await axios.post(`${FEES_API}/pay`, {
        fee_id: payRow.fee_id,
        amount: amt,
        payment_mode: payMode,
        transaction_id: txnId,
        note: `Online student self-service fee payment via ${payMode}`,
      });

      showToast(`Payment of ${money(amt)} received! Official receipt generated.`, "ok");
      setPayModal(false);

      // Refresh Ledger
      await fetchStudentFees();

      // Automatically launch receipt for updated record
      const updatedTotal = Number(payRow.total_amount || 0);
      const updatedPaid = Number(payRow.paid_amount || 0) + amt;
      const updatedDue = Math.max(0, updatedTotal - updatedPaid);

      setReceiptData({
        fee_id: payRow.fee_id,
        receiptNo: `REC-2026-${String(payRow.fee_id).padStart(4, "0")}`,
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        generatedDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        studentName: student.name,
        enrollment: student.enrollment,
        course: payRow.course || student.course,
        semester: payRow.semester || payRow.sem || student.semester,
        academicYear: payRow.year || "2025-2026",
        feeType: payRow.fee_type || "Semester Tuition",
        totalAmount: updatedTotal,
        paidAmount: updatedPaid,
        dueAmount: updatedDue,
        status: updatedDue === 0 ? "PAID" : "PARTIAL",
        paymentMode: payMode,
        transactionId: txnId,
        remarks: `Payment authorized online via ${payMode}. Transaction ID: ${txnId}`,
      });
      setReceiptModal(true);
    } catch (err) {
      showToast(err?.response?.data?.message || "Payment transaction failed", "err");
    } finally {
      setPaySubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="stf-pro-root">
      {/* Toast Alert */}
      {toast && (
        <div className={`stf-toast ${toast.type}`}>
          {toast.type === "ok" ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. HERO COMMAND BANNER (Identical to Notice Board / Attendance Header) */}
      <section className="stf-hero-banner">
        <div className="stf-hero-left">
          <div className="stf-live-chip">
            <span className="stf-ping"></span>
            <span className="stf-live-txt">UNIVERSITY ACCOUNTS & STUDENT FINANCIAL LEDGER</span>
          </div>
          <h1 className="stf-hero-title">Academic Fee Statements & Invoices</h1>
          <p className="stf-hero-sub">
            Review semester tuition fees, examination dues, online payment settlement records, and download official institutional tax receipts.
          </p>
        </div>

        <div className="stf-hero-actions">
          <button
            className="stf-btn stf-btn-secondary"
            onClick={fetchStudentFees}
            disabled={loading}
            title="Refresh fee ledger"
          >
            <FiRefreshCw className={loading ? "stf-spin" : ""} />
            <span>Sync</span>
          </button>

          <button
            className="stf-btn stf-btn-secondary"
            onClick={() => setStatementModal(true)}
            title="Print official fee statement"
          >
            <FiPrinter />
            <span>Print Ledger</span>
          </button>
        </div>
      </section>

      {/* 2. CATEGORY CHIPS STRIP (Identical to Notice Board Category Bar) */}
      <div className="stf-cat-strip">
        {categoryOptions.map((cat) => (
          <button
            key={cat.key}
            className={`stf-cat-chip ${activeCategory === cat.key ? "active" : ""}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* 3. SEARCH & DECK PANEL (Identical to Notice Board Deck Panel) */}
      <section className="stf-deck-panel">
        <div className="stf-filter-row">
          <div className="stf-search-field">
            <FiSearch className="stf-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search voucher ID, fee head, semester, remarks..."
            />
            {searchQuery && (
              <button className="stf-clear-btn" onClick={() => setSearchQuery("")}>
                <FiX />
              </button>
            )}
          </div>

          <div className="stf-results-counter">
            <span>
              Showing <b>{filteredFees.length}</b> vouchers • Invoiced: <b>{money(summary.total)}</b> • Paid: <b className="text-success">{money(summary.paid)}</b> • Due: <b className={summary.pending > 0 ? "text-danger" : "text-success"}>{money(summary.pending)}</b>
            </span>
          </div>
        </div>

        {/* 4. CONTENT CARDS GRID (Identical to Notice Board 2-Column Cards Grid) */}
        <div className="stf-grid-container">
          {loading ? (
            <div className="stf-skel-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="stf-skel-card" />
              ))}
            </div>
          ) : filteredFees.length ? (
            <div className="stf-cards-grid">
              {filteredFees.map((row) => {
                const status = normalizeStatus(row);
                const total = Number(row.total_amount || 0);
                const paid = Number(row.paid_amount || 0);
                const due = Math.max(0, total - paid);
                const paidPct = total > 0 ? Math.min(100, (paid / total) * 100) : 100;

                return (
                  <div
                    className="stf-notice-card"
                    key={row.fee_id}
                    onClick={() => {
                      if (due > 0) handleOpenPay(row);
                      else handleOpenReceipt(row);
                    }}
                  >
                    <div className="stf-card-top">
                      <span className={`stf-cat-badge ${status.toLowerCase()}`}>
                        {status === "PAID" ? "SETTLED / PAID" : status === "PARTIAL" ? "PARTIAL PAYMENT" : "DUE PAYMENT"}
                      </span>
                      <div className="stf-date-badge">
                        <FiCalendar size={12} />
                        <span>Session {row.year || "2025-2026"} • Due {formatDate(row.due_date)}</span>
                      </div>
                    </div>

                    <h3 className="stf-card-title">
                      {row.fee_type || "Semester Tuition & Academic Dues"}
                      <span className="stf-id-tag">INV-#{row.fee_id}</span>
                    </h3>

                    {/* Progress Bar & Financial Metric Box */}
                    <div className="stf-fee-box">
                      <div className="stf-fee-header">
                        <span className="stf-fee-stat">
                          Invoiced: <b>{money(total)}</b> • Paid: <b className="text-success">{money(paid)}</b>
                        </span>
                        <span className={`stf-fee-due-tag ${due > 0 ? "text-danger" : "text-success"}`}>
                          {due > 0 ? `Due: ${money(due)}` : "Zero Dues"}
                        </span>
                      </div>

                      <div className="stf-progress-track">
                        <div
                          className={`stf-progress-fill ${status === "PAID" ? "top" : status === "PARTIAL" ? "good" : "fail"}`}
                          style={{ width: `${paidPct}%` }}
                        />
                      </div>
                    </div>

                    <p className="stf-card-snippet">
                      {row.remarks || row.note || "Institutional academic dues & facility charges."} • {row.course || student.course} (Semester {row.semester || row.sem || student.semester})
                    </p>

                    <div className="stf-card-foot" onClick={(e) => e.stopPropagation()}>
                      <div className="stf-author-box">
                        <FiShield size={13} />
                        <span>Accounts Division</span>
                      </div>

                      <div className="stf-foot-actions">
                        {due > 0 && (
                          <button
                            className="stf-btn stf-btn-xs stf-btn-primary"
                            onClick={() => handleOpenPay(row)}
                            title="Pay outstanding dues online"
                          >
                            <FiCreditCard size={13} />
                            <span>Pay {money(due)}</span>
                          </button>
                        )}

                        {paid > 0 && (
                          <button
                            className="stf-btn stf-btn-xs stf-btn-secondary"
                            onClick={() => handleOpenReceipt(row)}
                            title="View official tax receipt"
                          >
                            <FiFileText size={13} />
                            <span>Receipt</span>
                          </button>
                        )}

                        {due === 0 && paid === 0 && (
                          <span className="stf-read-btn">
                            <FiCheck size={14} />
                            <span>All Cleared</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="stf-empty-state">
              <div className="stf-empty-icon-box">
                <FiDollarSign />
              </div>
              <h3>No Fee Invoices Found</h3>
              <p>No fee vouchers matched your active search query or selected category filter.</p>
              {(searchQuery || activeCategory !== "all") && (
                <button
                  className="stf-btn stf-btn-secondary"
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

      {/* =========================================================
          4. ONLINE PAYMENT GATEWAY CHECKOUT MODAL
          ========================================================= */}
      {payModal && payRow && (
        <div className="stf-modal-backdrop" onClick={() => setPayModal(false)}>
          <div className="stf-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="stf-modal-header">
              <div className="stf-modal-title-group">
                <span className="stf-cat-badge partial">SECURE 256-BIT PAYMENT GATEWAY</span>
                <h3 className="stf-modal-title">Online Fee Payment Checkout</h3>
                <div className="stf-modal-meta">
                  <span>Voucher #{payRow.fee_id}</span>
                  <span>•</span>
                  <span>{student.name} ({student.enrollment})</span>
                </div>
              </div>

              <button className="stf-modal-close" onClick={() => setPayModal(false)}>
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleProcessPayment}>
              <div className="stf-modal-body">
                {/* Summary Voucher Card */}
                <div className="stf-detail-box">
                  <div className="stf-detail-row">
                    <span>Fee Particulars:</span>
                    <b>{payRow.fee_type || "Semester Tuition"}</b>
                  </div>
                  <div className="stf-detail-row">
                    <span>Program & Term:</span>
                    <b>{payRow.course || student.course} (Sem {payRow.semester || payRow.sem || student.semester})</b>
                  </div>
                  <div className="stf-detail-row">
                    <span>Total Invoiced:</span>
                    <span>{money(payRow.total_amount)}</span>
                  </div>
                  <div className="stf-detail-row">
                    <span>Already Settled:</span>
                    <b className="text-success">{money(payRow.paid_amount)}</b>
                  </div>
                  <div className="stf-detail-row highlight">
                    <span>Outstanding Balance Due:</span>
                    <b className="text-danger">
                      {money(Math.max(0, Number(payRow.total_amount || 0) - Number(payRow.paid_amount || 0)))}
                    </b>
                  </div>
                </div>

                {/* Quick Preset Buttons */}
                <div className="stf-preset-group">
                  <label className="stf-field-lbl">Quick Pay Presets:</label>
                  <div className="stf-preset-buttons">
                    <button
                      type="button"
                      className="stf-preset-btn"
                      onClick={() =>
                        setPayAmount(
                          String(Math.max(0, Number(payRow.total_amount || 0) - Number(payRow.paid_amount || 0)))
                        )
                      }
                    >
                      Pay Full Due ({money(Math.max(0, Number(payRow.total_amount || 0) - Number(payRow.paid_amount || 0)))})
                    </button>
                    {Math.max(0, Number(payRow.total_amount || 0) - Number(payRow.paid_amount || 0)) > 5000 && (
                      <button
                        type="button"
                        className="stf-preset-btn"
                        onClick={() =>
                          setPayAmount(
                            String(
                              Math.round(
                                Math.max(0, Number(payRow.total_amount || 0) - Number(payRow.paid_amount || 0)) / 2
                              )
                            )
                          )
                        }
                      >
                        Pay 50% ({money(
                          Math.round(
                            Math.max(0, Number(payRow.total_amount || 0) - Number(payRow.paid_amount || 0)) / 2
                          )
                        )})
                      </button>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="stf-form-grid">
                  <div className="stf-form-field">
                    <label>Amount to Pay (INR ₹) *</label>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      min="1"
                      max={Math.max(0, Number(payRow.total_amount || 0) - Number(payRow.paid_amount || 0))}
                      required
                    />
                  </div>

                  <div className="stf-form-field">
                    <label>Payment Gateway Mode *</label>
                    <select
                      value={payMode}
                      onChange={(e) => setPayMode(e.target.value)}
                    >
                      <option value="UPI / Online QR">Instant UPI / Bharat QR (GPay, PhonePe, Paytm)</option>
                      <option value="Debit Card">Debit Card / ATM Card (RuPay, Visa, MasterCard)</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Net Banking">Internet Banking (HDFC, SBI, ICICI, Axis)</option>
                    </select>
                  </div>

                  {/* Dynamic payment mode fields */}
                  {payMode === "UPI / Online QR" && (
                    <div className="stf-upi-box">
                      <div className="stf-upi-header">
                        <FiSmartphone size={16} />
                        <span>Enter UPI Virtual Payment Address (VPA)</span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. rahul@oksbi / 9876543210@paytm"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                    </div>
                  )}

                  {(payMode === "Debit Card" || payMode === "Credit Card") && (
                    <div className="stf-card-box">
                      <div className="stf-form-field">
                        <label>Card Number</label>
                        <input
                          type="text"
                          placeholder="4532 •••• •••• 8921"
                          maxLength="19"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                        />
                      </div>
                      <div className="stf-card-row">
                        <div className="stf-form-field">
                          <label>Expiry Date</label>
                          <input
                            type="text"
                            placeholder="MM / YY"
                            maxLength="5"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                          />
                        </div>
                        <div className="stf-form-field">
                          <label>CVV / CVC</label>
                          <input
                            type="password"
                            placeholder="•••"
                            maxLength="4"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {payMode === "Net Banking" && (
                    <div className="stf-form-field">
                      <label>Select Financial Institution</label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                      >
                        <option value="HDFC Bank">HDFC Bank</option>
                        <option value="State Bank of India">State Bank of India (SBI)</option>
                        <option value="ICICI Bank">ICICI Bank</option>
                        <option value="Axis Bank">Axis Bank</option>
                        <option value="Punjab National Bank">Punjab National Bank</option>
                        <option value="Bank of Baroda">Bank of Baroda</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="stf-security-badge">
                  <FiLock size={14} />
                  <span>Payments are processed with 256-bit SSL encryption & RBI compliant gateway</span>
                </div>
              </div>

              <div className="stf-modal-footer">
                <button
                  type="button"
                  className="stf-btn stf-btn-secondary"
                  onClick={() => setPayModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="stf-btn stf-btn-primary"
                  disabled={paySubmitting}
                >
                  {paySubmitting ? (
                    <>
                      <FiRefreshCw className="stf-spin" />
                      <span>Authorizing Payment...</span>
                    </>
                  ) : (
                    <>
                      <FiCheck />
                      <span>Authorize Payment of {money(payAmount)}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          5. OFFICIAL INDIVIDUAL FEE RECEIPT MODAL
          ========================================================= */}
      {receiptModal && receiptData && (
        <div className="stf-modal-backdrop" onClick={() => setReceiptModal(false)}>
          <div className="stf-print-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="stf-modal-header no-print">
              <div className="stf-modal-title-group">
                <span className="stf-cat-badge paid">TAX-COMPLIANT E-RECEIPT</span>
                <h3 className="stf-modal-title">Official Institutional Fee Receipt</h3>
                <div className="stf-modal-meta">
                  <span>Receipt No: {receiptData.receiptNo}</span>
                  <span>•</span>
                  <span>{receiptData.studentName} ({receiptData.enrollment})</span>
                </div>
              </div>

              <div className="stf-head-actions">
                <button className="stf-btn stf-btn-primary stf-btn-xs" onClick={handlePrint}>
                  <FiPrinter size={14} />
                  <span>Print / Save PDF</span>
                </button>
                <button className="stf-modal-close" onClick={() => setReceiptModal(false)}>
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* PRINTABLE RECEIPT DOCUMENT */}
            <div className="stf-receipt-document" id="printable-receipt">
              {/* Institutional Header */}
              <div className="stf-doc-header">
                <div className="stf-doc-crest">NAV</div>
                <div className="stf-doc-titles">
                  <h2>NAVNEXT INSTITUTE OF HIGHER EDUCATION & TECHNOLOGY</h2>
                  <p className="stf-doc-sub">
                    Accredited Grade 'A+' | Affiliated to State Technological University
                  </p>
                  <p className="stf-doc-contact">
                    Knowledge Park Sector IV • accounts@navnext.edu.in • +91 11 2345 6789
                  </p>
                </div>
                <div className="stf-doc-type-badge">
                  <span>E-FEE RECEIPT</span>
                  <small>OFFICIAL COPY</small>
                </div>
              </div>

              <div className="stf-doc-divider"></div>

              {/* Receipt Metadata Ribbon */}
              <div className="stf-doc-ribbon">
                <div className="stf-ribbon-item">
                  <span className="lbl">Receipt Number:</span>
                  <b className="val">{receiptData.receiptNo}</b>
                </div>
                <div className="stf-ribbon-item">
                  <span className="lbl">Issue Date:</span>
                  <b className="val">{receiptData.generatedDate}</b>
                </div>
                <div className="stf-ribbon-item">
                  <span className="lbl">Transaction Ref:</span>
                  <b className="val font-mono">{receiptData.transactionId}</b>
                </div>
                <div className="stf-ribbon-item">
                  <span className="lbl">Settlement Status:</span>
                  <b className="val text-present">
                    {receiptData.status}
                  </b>
                </div>
              </div>

              {/* Student Metadata Bar */}
              <div className="stf-doc-stats-bar">
                <div className="stf-doc-stat-col">
                  <span>Student Scholar</span>
                  <b>{receiptData.studentName}</b>
                </div>
                <div className="stf-doc-stat-col">
                  <span>Enrollment Number</span>
                  <b className="font-mono">{receiptData.enrollment}</b>
                </div>
                <div className="stf-doc-stat-col">
                  <span>Academic Program</span>
                  <b>{receiptData.course} (Sem {receiptData.semester})</b>
                </div>
                <div className="stf-doc-stat-col text-present">
                  <span>Payment Channel</span>
                  <b>{receiptData.paymentMode}</b>
                </div>
              </div>

              {/* Fee Breakdown Table */}
              <h4 className="stf-doc-section-title">Itemized Fee Particulars</h4>
              <table className="stf-doc-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Fee Description / Particulars</th>
                    <th className="right">Invoiced Amount</th>
                    <th className="right">Settled Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>
                      <b>{receiptData.feeType}</b>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        Institutional semester tuition, laboratory assessment & academic facilities levy.
                      </div>
                    </td>
                    <td className="right">{money(receiptData.totalAmount)}</td>
                    <td className="right bold text-present">{money(receiptData.paidAmount)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="2" className="right bold">Total Invoiced Dues:</td>
                    <td colSpan="2" className="right bold">{money(receiptData.totalAmount)}</td>
                  </tr>
                  <tr>
                    <td colSpan="2" className="right bold text-present">Total Amount Settled / Credited:</td>
                    <td colSpan="2" className="right bold text-present">{money(receiptData.paidAmount)}</td>
                  </tr>
                  <tr>
                    <td colSpan="2" className="right bold text-gold">Outstanding Balance Remaining:</td>
                    <td colSpan="2" className="right bold text-gold">{money(receiptData.dueAmount)}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Remarks & Signatures */}
              <div className="stf-doc-footer-grid">
                <div className="stf-doc-notes">
                  <p className="note-title"><b>Accounts Department Note:</b></p>
                  <p className="note-txt">{receiptData.remarks}</p>
                  <p className="note-disc">
                    * This is a computer-generated institutional receipt authenticated by NavNext University ERP.
                  </p>
                </div>

                <div className="stf-doc-signatures">
                  <div className="stf-doc-seal">
                    <FiShield size={30} />
                    <span>VERIFIED & CLEARED</span>
                  </div>
                  <div className="stf-sign-line">
                    <div className="stf-sign-placeholder">Finance Controller</div>
                    <span>Authorized Accounts Officer</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="stf-modal-footer no-print">
              <button
                type="button"
                className="stf-btn stf-btn-secondary"
                onClick={() => setReceiptModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="stf-btn stf-btn-primary"
                onClick={handlePrint}
              >
                <FiPrinter />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          6. OFFICIAL CUMULATIVE FINANCIAL STATEMENT MODAL
          ========================================================= */}
      {statementModal && (
        <div className="stf-modal-backdrop" onClick={() => setStatementModal(false)}>
          <div className="stf-print-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="stf-modal-header no-print">
              <div className="stf-modal-title-group">
                <span className="stf-cat-badge">OFFICIAL FINANCIAL STATEMENT</span>
                <h3 className="stf-modal-title">Cumulative Academic Fee Ledger</h3>
                <div className="stf-modal-meta">
                  <span>Student: {student.name} ({student.enrollment})</span>
                  <span>•</span>
                  <span>{student.course} Semester {student.semester}</span>
                </div>
              </div>

              <div className="stf-head-actions">
                <button className="stf-btn stf-btn-primary stf-btn-xs" onClick={handlePrint}>
                  <FiPrinter size={14} />
                  <span>Print / Save PDF</span>
                </button>
                <button className="stf-modal-close" onClick={() => setStatementModal(false)}>
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* PRINTABLE STATEMENT DOCUMENT */}
            <div className="stf-receipt-document" id="printable-statement">
              {/* Institutional Header */}
              <div className="stf-doc-header">
                <div className="stf-doc-crest">NAV</div>
                <div className="stf-doc-titles">
                  <h2>NAVNEXT INSTITUTE OF HIGHER EDUCATION & TECHNOLOGY</h2>
                  <p className="stf-doc-sub">
                    Accredited Grade 'A+' | Affiliated to State Technological University
                  </p>
                  <p className="stf-doc-contact">
                    Office of Finance & Student Accounts • accounts@navnext.edu.in • +91 11 2345 6789
                  </p>
                </div>
                <div className="stf-doc-type-badge">
                  <span>FEE STATEMENT</span>
                  <small>OFFICIAL LEDGER</small>
                </div>
              </div>

              <div className="stf-doc-divider"></div>

              {/* Student Metadata Ribbon */}
              <div className="stf-doc-ribbon">
                <div className="stf-ribbon-item">
                  <span className="lbl">Student Scholar:</span>
                  <b className="val">{student.name}</b>
                </div>
                <div className="stf-ribbon-item">
                  <span className="lbl">Enrollment No:</span>
                  <b className="val font-mono">{student.enrollment}</b>
                </div>
                <div className="stf-ribbon-item">
                  <span className="lbl">Academic Program:</span>
                  <b className="val">{student.course} (Sem {student.semester})</b>
                </div>
                <div className="stf-ribbon-item">
                  <span className="lbl">Ledger Clearance:</span>
                  <b className={`val ${summary.pending === 0 ? "text-present" : "text-gold"}`}>
                    {summary.pending === 0 ? "ALL CLEAR" : `${money(summary.pending)} DUE`}
                  </b>
                </div>
              </div>

              {/* Statistical Summary Bar */}
              <div className="stf-doc-stats-bar">
                <div className="stf-doc-stat-col">
                  <span>Total Invoiced</span>
                  <b>{money(summary.total)}</b>
                </div>
                <div className="stf-doc-stat-col text-present">
                  <span>Total Settled</span>
                  <b>{money(summary.paid)}</b>
                </div>
                <div className="stf-doc-stat-col text-gold">
                  <span>Pending Dues</span>
                  <b>{money(summary.pending)}</b>
                </div>
                <div className="stf-doc-stat-col text-present">
                  <span>Settlement Ratio</span>
                  <b>{summary.overallPct}%</b>
                </div>
              </div>

              {/* Statement Table */}
              <h4 className="stf-doc-section-title">Itemized Fee Vouchers & Payment History</h4>
              <table className="stf-doc-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Voucher & Description</th>
                    <th>Academic Period</th>
                    <th className="right">Invoiced</th>
                    <th className="right">Paid Amount</th>
                    <th className="right">Balance Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((r, i) => {
                    const status = normalizeStatus(r);
                    const total = Number(r.total_amount || 0);
                    const paid = Number(r.paid_amount || 0);
                    const due = Math.max(0, total - paid);

                    return (
                      <tr key={r.fee_id || i}>
                        <td>{i + 1}</td>
                        <td className="bold">
                          {r.fee_type || "Semester Tuition"}
                          <div style={{ fontSize: "11px", color: "#64748b" }}>INV-#{r.fee_id}</div>
                        </td>
                        <td>Sem {r.semester || r.sem || student.semester} ({r.year || 2026})</td>
                        <td className="right">{money(total)}</td>
                        <td className="right bold text-present">{money(paid)}</td>
                        <td className="right bold text-gold">{money(due)}</td>
                        <td className="bold">{status}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="bold right">Cumulative Total:</td>
                    <td className="bold right">{money(summary.total)}</td>
                    <td className="bold right text-present">{money(summary.paid)}</td>
                    <td className="bold right text-gold">{money(summary.pending)}</td>
                    <td className="bold">{summary.pending === 0 ? "PAID" : "ACTIVE"}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Certification & Signatures */}
              <div className="stf-doc-footer-grid">
                <div className="stf-doc-notes">
                  <p className="note-title"><b>Finance Controller Certification:</b></p>
                  <p className="note-txt">
                    This official statement reflects all institutional debits and credits recorded in the student financial ledger.
                  </p>
                  <p className="note-disc">
                    * Eligible for semester examination clearance and admit card generation upon complete dues settlement.
                  </p>
                </div>

                <div className="stf-doc-signatures">
                  <div className="stf-doc-seal">
                    <FiShield size={30} />
                    <span>AUTHENTICATED RECORD</span>
                  </div>
                  <div className="stf-sign-line">
                    <div className="stf-sign-placeholder">Chief Finance Officer</div>
                    <span>Controller of Student Accounts</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="stf-modal-footer no-print">
              <button
                type="button"
                className="stf-btn str-btn-secondary"
                onClick={() => setStatementModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="stf-btn stf-btn-primary"
                onClick={handlePrint}
              >
                <FiPrinter />
                <span>Print Official Statement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
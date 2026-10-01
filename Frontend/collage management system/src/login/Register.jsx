import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Register.css";

const ADMIN_CODE = "NAVNEXT@ADMIN";
const API_URL = `${import.meta.env.VITE_API_BASE || "http://localhost:5001"}/Auth/register`;

const Register = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add("navnext-register-dark");
    document.body.classList.add("navnext-register-dark");
    return () => {
      document.documentElement.classList.remove("navnext-register-dark");
      document.body.classList.remove("navnext-register-dark");
    };
  }, []);

  const [userType, setUserType] = useState("student");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    user_name: "",
    email: "",
    password: "",
    course: "",
    sem: "",
    enrollment: "",
    mobile: "",
    father_name: "",
    father_mobile: "",
    dob: "",
    department: "",
    qualification: "",
    experience: "",
    admin_code: "",
  });

  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const abortRef = useRef(null);

  useEffect(() => {
    return () => {
      try {
        abortRef.current?.abort();
      } catch { }
    };
  }, []);

  const handleRoleChange = (role) => {
    try {
      abortRef.current?.abort();
    } catch { }

    setUserType(role);
    setMessage("");
    setErrors({});
    setTouched({});
    setSubmitted(false);
    setLoading(false);

    setFormData((prev) => ({
      ...prev,
      course: "",
      sem: "",
      enrollment: "",
      father_name: "",
      father_mobile: "",
      department: "",
      qualification: "",
      experience: "",
      admin_code: role === "admin" ? "" : prev.admin_code,
    }));
  };

  const validate = (data, role) => {
    const e = {};

    if (!data.first_name || !data.first_name.trim()) e.first_name = "First name is required";
    else if (data.first_name.trim().length < 2) e.first_name = "Must be at least 2 characters";

    if (!data.last_name || !data.last_name.trim()) e.last_name = "Last name is required";
    else if (data.last_name.trim().length < 2) e.last_name = "Must be at least 2 characters";

    if (!data.user_name || !data.user_name.trim()) e.user_name = "Username is required";
    else if (data.user_name.trim().length < 3) e.user_name = "Must be at least 3 characters";
    else if (!/^[a-zA-Z0-9._]+$/.test(data.user_name.trim())) {
      e.user_name = "Letters, numbers, dot (.) and underscore (_) only";
    }

    if (!data.email || !data.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(data.email.trim())) e.email = "Enter a valid email address";

    if (!data.password) e.password = "Password is required";
    else if (data.password.length < 6) e.password = "Password must be at least 6 characters";

    if (data.mobile && String(data.mobile).trim() !== "") {
      const m = String(data.mobile).trim();
      if (!/^\d+$/.test(m)) e.mobile = "Digits only";
      else if (m.length !== 10) e.mobile = "Must be 10 digits";
    }

    if (data.dob && String(data.dob).trim() !== "") {
      const d = new Date(data.dob);
      const today = new Date();
      if (isNaN(d.getTime())) e.dob = "Invalid date";
      else if (d > today) e.dob = "DOB cannot be in future";
    }

    if (role === "admin") {
      if (!data.admin_code || !data.admin_code.trim()) e.admin_code = "Admin security passcode required";
      else if (data.admin_code.trim() !== ADMIN_CODE) e.admin_code = "Invalid administrator security passcode";
    }

    if (role === "student") {
      if (!data.course || !data.course.trim()) e.course = "Course required (e.g. BCA, BTech)";
      if (data.sem === "" || data.sem === null || data.sem === undefined) e.sem = "Semester required";
      else {
        const semNum = Number(data.sem);
        if (!Number.isFinite(semNum) || semNum < 1 || semNum > 8) e.sem = "Semester must be 1 to 8";
      }

      if (!data.enrollment || !data.enrollment.trim()) e.enrollment = "Enrollment number required";
      else if (data.enrollment.trim().length < 4) e.enrollment = "Must be at least 4 characters";

      if (data.father_mobile && String(data.father_mobile).trim() !== "") {
        const fm = String(data.father_mobile).trim();
        if (!/^\d+$/.test(fm) || fm.length !== 10) e.father_mobile = "Must be 10 digits";
      }
    }

    if (role === "faculty") {
      if (!data.department || !data.department.trim()) e.department = "Department required";
      if (!data.qualification || !data.qualification.trim()) e.qualification = "Qualification required";

      if (data.experience !== "" && data.experience !== null && data.experience !== undefined) {
        const expNum = Number(data.experience);
        if (!Number.isFinite(expNum) || expNum < 0 || expNum > 60) e.experience = "Between 0 and 60 years";
      }
    }

    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name] || submitted) {
      const nextData = { ...formData, [name]: value };
      const eobj = validate(nextData, userType);
      setErrors((prev) => ({ ...prev, [name]: eobj[name] }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const eobj = validate(formData, userType);
    setErrors((prev) => ({ ...prev, [name]: eobj[name] }));
  };

  const errMsg = (field) => {
    if (!submitted && !touched[field]) return "";
    return errors[field] || "";
  };

  const errCls = (field) => {
    return errMsg(field) ? "input-err" : "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setMessage("");
    setSubmitted(true);

    const eobj = validate(formData, userType);
    setErrors(eobj);

    if (Object.keys(eobj).length) {
      const firstKey = Object.keys(eobj)[0];
      setMessage("⚠️ " + eobj[firstKey]);
      return;
    }

    const payload = {
      ...formData,
      user_type: userType,
      sem: formData.sem === "" ? null : Number(formData.sem),
      experience: formData.experience === "" ? null : Number(formData.experience),
    };

    if (userType !== "admin") delete payload.admin_code;

    try {
      abortRef.current?.abort();
    } catch { }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);

      const response = await axios.post(API_URL, payload, {
        signal: controller.signal,
        timeout: 12000,
      });

      setMessage("✅ " + (response.data?.message || "Account created successfully!"));

      setTimeout(() => {
        if (userType === "admin") navigate("/admin-login");
        else if (userType === "faculty") navigate("/faculty-login");
        else navigate("/student-login");
      }, 1500);

      setFormData({
        first_name: "",
        last_name: "",
        user_name: "",
        email: "",
        password: "",
        course: "",
        sem: "",
        enrollment: "",
        mobile: "",
        father_name: "",
        father_mobile: "",
        dob: "",
        department: "",
        qualification: "",
        experience: "",
        admin_code: "",
      });

      setErrors({});
      setTouched({});
      setSubmitted(false);
    } catch (err) {
      if (err?.code === "ERR_CANCELED") return;

      const api = err?.response?.data;
      const msg = api?.message || "Error creating account. Please check your data.";
      setMessage("❌ " + msg);

      if (api?.errors && typeof api.errors === "object") {
        setErrors(api.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const roleMeta = {
    student: {
      title: "Student Account",
      badge: "Student Hub",
      badgeColor: "#38bdf8",
      icon: "🎓",
      desc: "Enroll in your degree course, get automated weekly timetables, track real-time attendance, and view semester results.",
      loginRoute: "/student-login",
    },
    faculty: {
      title: "Faculty Staff",
      badge: "Faculty Pro",
      badgeColor: "#a855f7",
      icon: "👨‍🏫",
      desc: "Register as teaching faculty to mark classroom attendance, publish study materials, and manage student grades.",
      loginRoute: "/faculty-login",
    },
    admin: {
      title: "Administrator",
      badge: "Root Secure",
      badgeColor: "#f59e0b",
      icon: "🛡️",
      desc: "Institute administrative authority for student admissions, master timetable setup, and financial fee records.",
      loginRoute: "/admin-login",
    },
  };

  const currentRole = roleMeta[userType] || roleMeta.student;

  return (
    <div className="rgWrap">
      {/* Background Ambient Glows */}
      <div className="rgGlow rgGlow1" />
      <div className="rgGlow rgGlow2" />

      {/* Top Floating Header */}
      <div className="rgTopNav">
        <button className="rgBackBtn" onClick={() => navigate("/home")} type="button">
          <span>←</span>
          <span>Back to Home</span>
        </button>

        <div className="rgBrand">
          <div className="rgLogoMark">N</div>
          <span className="rgBrandName">NavNext</span>
        </div>

        <button
          className="rgSignInBtn"
          onClick={() => navigate(currentRole.loginRoute)}
          type="button"
        >
          <span>Already registered? Sign In</span>
          <span>→</span>
        </button>
      </div>

      {/* Main Registration Grid */}
      <div className="rgContainer">
        {/* Left Side: Role Selector & Feature Highlights */}
        <div className="rgLeftCol">
          <div className="rgLeftCard">
            <div className="rgRoleHeader">
              <span className="rgRoleSub">Select Your Account Type</span>
              <h3>Choose Role</h3>
            </div>

            {/* Role Switcher Cards */}
            <div className="rgRoleCardsList">
              {[
                { id: "student", label: "Student", icon: "🎓", color: "#38bdf8", sub: "For Enrolled Students" },
                { id: "faculty", label: "Faculty", icon: "👨‍🏫", color: "#a855f7", sub: "For Teaching Staff" },
                { id: "admin", label: "Admin", icon: "🛡️", color: "#f59e0b", sub: "For Institute Admins" },
              ].map((r) => (
                <div
                  key={r.id}
                  className={`rgRoleItem ${userType === r.id ? "active" : ""}`}
                  onClick={() => handleRoleChange(r.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="rgRoleItemIcon" style={{ borderColor: `${r.color}40`, background: `${r.color}15` }}>
                    <span>{r.icon}</span>
                  </div>
                  <div className="rgRoleItemText">
                    <span className="rgRoleItemTitle">{r.label}</span>
                    <span className="rgRoleItemDesc">{r.sub}</span>
                  </div>
                  <div className="rgRoleRadio">
                    <div className={`radioDot ${userType === r.id ? "checked" : ""}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Dynamic Role Info Preview */}
            <div className="rgRoleInfoBox">
              <div className="rgRoleInfoTop">
                <span className="roleIconSmall">{currentRole.icon}</span>
                <span className="roleNameSmall">{currentRole.title}</span>
                <span
                  className="roleBadgeSmall"
                  style={{
                    color: currentRole.badgeColor,
                    borderColor: `${currentRole.badgeColor}40`,
                    background: `${currentRole.badgeColor}15`,
                  }}
                >
                  {currentRole.badge}
                </span>
              </div>
              <p className="rgRoleInfoDesc">{currentRole.desc}</p>
            </div>

            {/* Security Guarantee List */}
            <div className="rgBenefitsList">
              <div className="benefitRow">
                <span className="benIcon">🔒</span>
                <span>256-Bit SSL Encrypted Storage</span>
              </div>
              <div className="benefitRow">
                <span className="benIcon">⚡</span>
                <span>Instant Role & Session Provisioning</span>
              </div>
              <div className="benefitRow">
                <span className="benIcon">🛡️</span>
                <span>Role-Isolated Profile Privacy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="rgRightCol">
          <div className="rgFormCard">
            <div className="formHeader">
              <div>
                <h2>Create {currentRole.title}</h2>
                <p className="formSubtitle">Enter your official academic details to complete registration</p>
              </div>
            </div>

            {message && (
              <div className={`rgAlert ${String(message).includes("✅") ? "ok" : "err"}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="regFormInner" autoComplete="off">
              {/* SECTION 1: PERSONAL INFORMATION */}
              <div className="formSectionHead">
                <span className="secIcon">👤</span>
                <span>1. Personal Information</span>
              </div>

              <div className="rgGrid2">
                <div className="inputGroup">
                  <label>First Name <span className="req">*</span></label>
                  <input
                    type="text"
                    name="first_name"
                    placeholder="e.g. Rahul"
                    value={formData.first_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errCls("first_name")}
                  />
                  {errMsg("first_name") && <small className="errText">{errMsg("first_name")}</small>}
                </div>

                <div className="inputGroup">
                  <label>Last Name <span className="req">*</span></label>
                  <input
                    type="text"
                    name="last_name"
                    placeholder="e.g. Sharma"
                    value={formData.last_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errCls("last_name")}
                  />
                  {errMsg("last_name") && <small className="errText">{errMsg("last_name")}</small>}
                </div>
              </div>

              <div className="rgGrid2">
                <div className="inputGroup">
                  <label>Username <span className="req">*</span></label>
                  <input
                    type="text"
                    name="user_name"
                    placeholder="e.g. rahul123"
                    value={formData.user_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errCls("user_name")}
                  />
                  {errMsg("user_name") && <small className="errText">{errMsg("user_name")}</small>}
                </div>

                <div className="inputGroup">
                  <label>Email Address <span className="req">*</span></label>
                  <input
                    type="email"
                    name="email"
                    placeholder="rahul@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errCls("email")}
                  />
                  {errMsg("email") && <small className="errText">{errMsg("email")}</small>}
                </div>
              </div>

              <div className="rgGrid2">
                <div className="inputGroup">
                  <label>Password <span className="req">*</span></label>
                  <div className="passwordField">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errCls("password")}
                    />
                    <button
                      type="button"
                      className="togglePwBtn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                  {errMsg("password") && <small className="errText">{errMsg("password")}</small>}
                </div>

                <div className="inputGroup">
                  <label>Mobile Number</label>
                  <input
                    type="text"
                    name="mobile"
                    placeholder="10-digit mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errCls("mobile")}
                    maxLength={10}
                  />
                  {errMsg("mobile") && <small className="errText">{errMsg("mobile")}</small>}
                </div>
              </div>

              <div className="inputGroup">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errCls("dob")}
                />
                {errMsg("dob") && <small className="errText">{errMsg("dob")}</small>}
              </div>

              {/* SECTION 2: ROLE SPECIFIC INFORMATION */}
              {userType === "student" && (
                <div className="roleSpecificBlock">
                  <div className="formSectionHead">
                    <span className="secIcon">🎓</span>
                    <span>2. Student Academic Details</span>
                  </div>

                  <div className="rgGrid2">
                    <div className="inputGroup">
                      <label>Course <span className="req">*</span></label>
                      <input
                        type="text"
                        name="course"
                        placeholder="e.g. BCA, BTech, MCA"
                        value={formData.course}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={errCls("course")}
                      />
                      {errMsg("course") && <small className="errText">{errMsg("course")}</small>}
                    </div>

                    <div className="inputGroup">
                      <label>Semester (1-8) <span className="req">*</span></label>
                      <select
                        name="sem"
                        value={formData.sem}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`darkSelect ${errCls("sem")}`}
                      >
                        <option value="">Select Semester</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Semester {s}
                          </option>
                        ))}
                      </select>
                      {errMsg("sem") && <small className="errText">{errMsg("sem")}</small>}
                    </div>
                  </div>

                  <div className="inputGroup">
                    <label>Enrollment Number <span className="req">*</span></label>
                    <input
                      type="text"
                      name="enrollment"
                      placeholder="e.g. 21BCA042"
                      value={formData.enrollment}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errCls("enrollment")}
                    />
                    {errMsg("enrollment") && <small className="errText">{errMsg("enrollment")}</small>}
                  </div>

                  <div className="rgGrid2">
                    <div className="inputGroup">
                      <label>Father's Name</label>
                      <input
                        type="text"
                        name="father_name"
                        placeholder="Father's full name"
                        value={formData.father_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>

                    <div className="inputGroup">
                      <label>Father's Mobile</label>
                      <input
                        type="text"
                        name="father_mobile"
                        placeholder="10-digit number"
                        value={formData.father_mobile}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={10}
                      />
                      {errMsg("father_mobile") && <small className="errText">{errMsg("father_mobile")}</small>}
                    </div>
                  </div>
                </div>
              )}

              {userType === "faculty" && (
                <div className="roleSpecificBlock">
                  <div className="formSectionHead">
                    <span className="secIcon">👨‍🏫</span>
                    <span>2. Faculty Credentials</span>
                  </div>

                  <div className="rgGrid2">
                    <div className="inputGroup">
                      <label>Department <span className="req">*</span></label>
                      <input
                        type="text"
                        name="department"
                        placeholder="e.g. Computer Science"
                        value={formData.department}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={errCls("department")}
                      />
                      {errMsg("department") && <small className="errText">{errMsg("department")}</small>}
                    </div>

                    <div className="inputGroup">
                      <label>Qualification <span className="req">*</span></label>
                      <input
                        type="text"
                        name="qualification"
                        placeholder="e.g. M.Tech, Ph.D"
                        value={formData.qualification}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={errCls("qualification")}
                      />
                      {errMsg("qualification") && <small className="errText">{errMsg("qualification")}</small>}
                    </div>
                  </div>

                  <div className="inputGroup">
                    <label>Experience (Years)</label>
                    <input
                      type="number"
                      name="experience"
                      placeholder="e.g. 5"
                      value={formData.experience}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      min={0}
                      max={60}
                    />
                    {errMsg("experience") && <small className="errText">{errMsg("experience")}</small>}
                  </div>
                </div>
              )}

              {userType === "admin" && (
                <div className="roleSpecificBlock">
                  <div className="formSectionHead">
                    <span className="secIcon">🛡️</span>
                    <span>2. Administrator Authorization</span>
                  </div>

                  <div className="inputGroup">
                    <label>Admin Security Passcode <span className="req">*</span></label>
                    <input
                      type="password"
                      name="admin_code"
                      placeholder="Enter security access passcode"
                      value={formData.admin_code}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errCls("admin_code")}
                    />
                    {errMsg("admin_code") && <small className="errText">{errMsg("admin_code")}</small>}
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <button type="submit" className="rgSubmitBtn" disabled={loading}>
                {loading ? (
                  <span className="btnSpinnerWrap">
                    <span className="spinnerIcon" />
                    <span>Processing Registration...</span>
                  </span>
                ) : (
                  <span>Create {currentRole.title} →</span>
                )}
              </button>
            </form>

            <div className="formFooterSwitch">
              <span>Already have an account?</span>
              <button
                type="button"
                className="footerLinkBtn"
                onClick={() => navigate(currentRole.loginRoute)}
              >
                Sign In to {userType.charAt(0).toUpperCase() + userType.slice(1)} Portal →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/admin/home";
import StudentLogin from "./login/Slogin";
import FacultyLogin from "./login/Flogin";
import AdminLogin from "./login/Alogin";

/* ✅ Layouts */
import AdminLayout from "./pages/admin/AdminLayout";
import StudentLayout from "./pages/student/StudentLayout";

/* ✅ Admin Pages */
import AdminMainDashboard from "./pages/admin/mainDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import FacultyDashboard from "./pages/admin/FacultyDashboard";
import CourseManage from "./pages/admin/CourseManage";
import AdminAdmission from "./pages/admin/AdminAdmission";
import NoticeDashboard from "./pages/admin/NoticeDashboard";
import Feesmanage from "./pages/admin/Feesmanage";
import ATimeTable from "./pages/admin/timeTable";
import ResultManage from "./pages/admin/resultManage";
import AdminFeedback from "./pages/admin/Adminfeedback";

/* ✅ Auth */
import StudentRegister from "./login/Register";
import ForgotPassword from "./component/ForgotPassword";
import ResetPassword from "./component/ResetPassword";

/* ✅ Student Pages */
import StudentDashboards from "./pages/student/dashboard";
import StudentProfile from "./pages/student/profile";
import StudentTimeTable from "./pages/student/TimeTable";
import StudentNotice from "./pages/student/studentNotice";
import ViewCourse from "./pages/student/viewCourse";
import StudentFeesView from "./pages/student/StudentFeesView";
import StudentViewAssignment from "./pages/student/viewAssignment";
import StudentMaterial from "./pages/student/viewMaterial";
import StudentResult from "./pages/student/StudentResult";
import ViewAttendance from "./pages/student/ViewAttendance";
import Leave from "./pages/student/leave";
import Summary from "./pages/student/StudentSummary";
import StudentFeedback from "./pages/student/StudentFeedback";

/* ✅ Faculty Routes */
import FacultyLayout from "./pages/faculty/facultyLayout";
import FacultyMainDashboard from "./pages/faculty/FacultyMainDashboard";
import FacultyPro from "./pages/faculty/MyProfile";
import Attendance from "./pages/faculty/Attendance";
import FacultyCourseView from "./pages/faculty/FacultyCourseView";
import MarksUpload from "./pages/faculty/MarksUpload";
import Schedule from "./pages/faculty/Schedule";
import FacultyNotice from "./pages/faculty/facultyNotice";
import FacultyViewTimetable from "./pages/faculty/facultyTimetable";
import DashboardStats from "./pages/faculty/DashboardStats";
import Assignments from "./pages/faculty/Assignments";
import UploadMaterial from "./pages/faculty/UploadMaterial";
import LeaveRequest from "./pages/faculty/LeaveRequest";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =======================
            Common Routes
        ======================= */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/faculty-login" element={<FacultyLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* =======================
            Admin Routes (NESTED)
        ======================= */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<AdminMainDashboard />} />
          <Route path="sdashboard" element={<AdminDashboard />} />
          <Route path="student-dashboard" element={<StudentDashboard />} />
          <Route path="faculty-dashboard" element={<FacultyDashboard />} />
          <Route path="manage-course" element={<CourseManage />} />
          <Route path="AdminAdmission" element={<AdminAdmission />} />
          <Route path="Notice-dashboard" element={<NoticeDashboard />} />
          <Route path="Feesmanage" element={<Feesmanage />} />
          <Route path="timeTable" element={<ATimeTable />} />
          <Route path="ResultManage" element={<ResultManage />} />
          <Route path="AdminFeedback" element={<AdminFeedback />} />
        </Route>

        {/* =======================
            Auth
        ======================= */}
        <Route path="/student-register" element={<StudentRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* =======================
            Student Routes (NESTED)
        ======================= */}
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<StudentDashboards />} />
          <Route path="sdashboard" element={<StudentDashboards />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="timetable" element={<StudentTimeTable />} />
          <Route path="notices" element={<StudentNotice />} />
          <Route path="ViewCourse" element={<ViewCourse />} />
          <Route path="fees" element={<StudentFeesView />} />
          <Route path="assignment" element={<StudentViewAssignment />} />
          <Route path="material" element={<StudentMaterial />} />
          <Route path="results" element={<StudentResult />} />
          <Route path="ViewAttendance" element={<ViewAttendance />} />
          <Route path="leave" element={<Leave />} />
          <Route path="Summary" element={<Summary />} />
          <Route path="feedback" element={<StudentFeedback />} />
        </Route>

        {/* =======================
            Faculty Routes (NESTED)
        ======================= */}
        <Route path="/faculty" element={<FacultyLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<FacultyMainDashboard />} />
          <Route path="..." element={<FacultyMainDashboard />} />
          <Route path="FacultyPro" element={<FacultyPro />} />
          <Route path="profile" element={<FacultyPro />} />
          <Route path="Profile" element={<FacultyPro />} />
          <Route path="Attendance" element={<Attendance />} />
          <Route path="MarksUpload" element={<MarksUpload />} />
          <Route path="Schedule" element={<Schedule />} />
          <Route path="notice" element={<FacultyNotice />} />
          <Route path="FacultyViewTimetable" element={<FacultyViewTimetable />} />
          <Route path="ViewCourses" element={<FacultyCourseView />} />
          <Route path="DashboardStats" element={<DashboardStats />} />
          <Route path="Assignments" element={<Assignments />} />
          <Route path="UploadMaterial" element={<UploadMaterial />} />
          <Route path="LeaveRequest" element={<LeaveRequest />} />
        </Route>

        {/* =======================
            Catch-All Fallback
        ======================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
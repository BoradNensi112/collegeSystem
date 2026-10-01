'use strict';

const Student = require('./routes/student.routes');
const Notice = require('./routes/notice.routes');
const Attendence = require('./routes/attendence.routes');
const Fees = require('./routes/fees.routes');
const Timetable = require('./routes/timetable.routes');
const Assignment = require('./routes/assignment.routes');
const Result = require('./routes/result.routes');
const ManageStaff = require('./routes/manageStaff.routes');
const Material = require('./routes/material.routes');
const Auth = require('./routes/auth.routes');
const Course = require('./routes/course.routes');
const summaryRoutes = require("./routes/summary.routes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const leaveRoutes = require("./routes/leaveRequest.routes");
const profileRoutes = require("./routes/profile.routes");
const facultyDashboardRoutes = require("./routes/facultyDashboard.routes");
const adminDashboardRoutes = require("./routes/adminDashboard.routes");

module.exports = (app) => {
    // Primary API Routes
    app.use('/Admin/dashboard', adminDashboardRoutes);
    app.use('/admin/dashboard', adminDashboardRoutes);
    app.use('/AdminDashboard', adminDashboardRoutes);
    app.use('/admindashboard', adminDashboardRoutes);

    app.use('/Student', Student);
    app.use('/student', Student);

    app.use('/Notice', Notice);
    app.use('/notice', Notice);

    app.use('/Attendence', Attendence);
    app.use('/attendence', Attendence);
    app.use('/Attendance', Attendence);
    app.use('/attendance', Attendence);

    app.use('/Fees', Fees);
    app.use('/fees', Fees);

    app.use('/Timetable', Timetable);
    app.use('/timetable', Timetable);

    app.use('/Assignment', Assignment);
    app.use('/assignment', Assignment);

    app.use('/Result', Result);
    app.use('/result', Result);
    app.use('/Results', Result);
    app.use('/results', Result);

    app.use('/ManageStaff', ManageStaff);
    app.use('/manageStaff', ManageStaff);
    app.use('/faculty', ManageStaff);
    app.use('/Faculty', ManageStaff);

    app.use('/Material', Material);
    app.use('/material', Material);

    app.use('/Auth', Auth);
    app.use('/auth', Auth);

    app.use('/Course', Course);
    app.use('/course', Course);

    app.use("/Summary", summaryRoutes);
    app.use("/summary", summaryRoutes);

    app.use("/Feedback", feedbackRoutes);
    app.use("/feedback", feedbackRoutes);

    app.use("/leave", leaveRoutes);
    app.use("/Leave", leaveRoutes);
    app.use("/student-leave", leaveRoutes);

    app.use("/Profile", profileRoutes);
    app.use("/profile", profileRoutes);

    app.use("/Faculty/dashboard", facultyDashboardRoutes);
    app.use("/faculty/dashboard", facultyDashboardRoutes);
};
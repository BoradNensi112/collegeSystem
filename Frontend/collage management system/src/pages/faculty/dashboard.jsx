import React, { useEffect, useState } from "react";
import "../../layout/faculty/Dashboard.css";
import {
  FaUsers,
  FaCalendarCheck,
  FaExclamationCircle,
  FaClipboardList,
} from "react-icons/fa";
import axios from "axios";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function FacultyDashboard() {
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [totalAssignments, setTotalAssignments] = useState(0); // <-- new state

  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true); // <-- new loading

  // ===== Dummy Attendance Data =====
  const attendanceData = [
    { day: "Mon", attendance: 85 },
    { day: "Tue", attendance: 90 },
    { day: "Wed", attendance: 78 },
    { day: "Thu", attendance: 88 },
    { day: "Fri", attendance: 92 },
  ];

  // ===== API Calls =====
  useEffect(() => {
    fetchStudentsCount();
    fetchSubjectsCount();
    fetchAssignmentsCount(); // <-- fetch assignments on mount
  }, []);

  // Fetch students count
  const fetchStudentsCount = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE || "http://localhost:5001"}/Student/count`);
      setTotalStudents(response.data.total || response.data.count);
      setLoadingStudents(false);
    } catch (error) {
      console.error("Error fetching students:", error.response?.data);
      setLoadingStudents(false);
    }
  };

  // Fetch subjects count
  const fetchSubjectsCount = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE || "http://localhost:5001"}/Material/count`, {
        semester: 6,
      });
      const subjectsCount = response.data.data[0]?.totalSubjects || 0;
      setTotalSubjects(subjectsCount);
      setLoadingSubjects(false);
    } catch (error) {
      console.error("Error fetching subjects:", error.response?.data || error.message);
      setTotalSubjects(0);
      setLoadingSubjects(false);
    }
  };

  const fetchAssignmentsCount = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE || "http://localhost:5001"}/Assignment/total-assignments`,
        { semester: 6 }
      );

      console.log("Assignment API response:", response.data);

      // Directly read totalAssignments from response.data
      const assignmentsCount = response.data?.totalAssignments ?? 0;

      setTotalAssignments(assignmentsCount);
      setLoadingAssignments(false);
    } catch (error) {
      console.error(
        "Error fetching assignments:",
        error.response?.data || error.message
      );
      setTotalAssignments(0);
      setLoadingAssignments(false);
    }
  };



  return (
    <div className="dashboard-wrapper">
      <h1 className="dashboard-title">Faculty Main Dashboard</h1>

      {/* ===== Stats Cards ===== */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <FaUsers className="stat-icon" />
          <h2>{loadingStudents ? "..." : totalStudents}</h2>
          <p>Total Students</p>
        </div>

        <div className="stat-card purple">
          <FaCalendarCheck className="stat-icon" />
          <h2>{loadingSubjects ? "..." : totalSubjects}</h2>
          <p>Total Subjects</p>
        </div>

        <div className="stat-card red">
          <FaExclamationCircle className="stat-icon" />
          <h2>6</h2>
          <p>Pending Leave Requests</p>
        </div>

        <div className="stat-card violet">
          <FaClipboardList className="stat-icon" />
          <h2>{loadingAssignments ? "..." : totalAssignments}</h2>
          <p>Total Assignments</p>
        </div>
      </div>

      {/* ===== Bottom Section ===== */}
      <div className="bottom-grid">
        {/* Class Overview */}
        <div className="glass-card">
          <h3>Class Overview</h3>
          <div className="class-item">9:00 AM – Database Management</div>
          <div className="class-item">11:00 AM – Web Development</div>
          <div className="class-item">1:00 PM – Operating Systems</div>
          <div className="class-item">3:00 PM – Software Engineering</div>
        </div>

        {/* Attendance Graph */}
        <div className="glass-card">
          <h3>Attendance Stats</h3>
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="day" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card full-width">
          <h3>Recent Activities</h3>
          <div className="activity-item">Result uploaded for BCA Sem 5</div>
          <div className="activity-item">New Assignment added for DBMS</div>
          <div className="activity-item">Attendance updated for SYBCA</div>
          <div className="activity-item">Leave request approved</div>
        </div>
      </div>
    </div>
  );
}

export default FacultyDashboard;

import React, { useState } from "react";
import StudentSidebar from "../../component/student/studentSidebar";
import "../../layout/student/StudentDashboard.css";

function StudentDashboard() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="dashboard">
      <StudentSidebar collapsed={collapsed} />
    </div>
  );
}

export default StudentDashboard;

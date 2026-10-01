import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../component/admin/Sidebar";
import Topbar from "../../component/common/Topbar";

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="app-main-wrapper">
        <Topbar
          portalTitle="Admin Workspace"
          subtitle="NavNext University Control Center"
          onToggleSidebar={() => setMobileOpen(true)}
        />
        <main className="app-content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
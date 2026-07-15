import Sidebar from "../components/Admin/AdminSidebar";
import { Outlet } from "react-router-dom";
import "./Layout.css";

const AdminLayout = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
import Sidebar from "../components/Client/Sidebar";
import { Outlet } from "react-router-dom";
import "./Layout.css";

const ClientLayout = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
};

export default ClientLayout;
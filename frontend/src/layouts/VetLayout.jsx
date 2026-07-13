import VetSidebar from "../components/Vet/VetSidebar";
import { Outlet } from "react-router-dom";
import "./Layout.css";

const VetLayout = () => {
  return (
    <div className="dashboard-layout">
      <VetSidebar />

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
};

export default VetLayout;
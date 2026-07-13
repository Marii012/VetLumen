import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./VetSidebar.css";

const VetSidebar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      navigate("/login");
      window.location.reload();
    } catch (error) {
      console.error("Erro ao terminar sessão:", error);

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      navigate("/login");
    }
  };

  return (
    <aside className="sidebar-container d-flex flex-column justify-content-between p-4">
      <div>

        {/* Perfil */}
        <div className="profile-section mb-5">
          <div className="profile-icon">
            <i className="bi bi-person-fill fs-1"></i>
          </div>

          {user && (
            <div className="profile-info">
              <h6>Olá, {user.first_name}</h6>
              <span>Veterinário</span>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav className="nav flex-column gap-2">

          <NavLink
            to="/vet/dashboard"
            className={({ isActive }) =>
              `custom-nav-link d-flex align-items-center ${
                isActive ? "active" : ""
              }`
            }
          >
            <i className="bi bi-grid-1x2-fill me-3"></i>
            Painel
          </NavLink>

          <NavLink
            to="/vet/appointments"
            className={({ isActive }) =>
              `custom-nav-link d-flex align-items-center ${
                isActive ? "active" : ""
              }`
            }
          >
            <i className="bi bi-calendar-event me-3"></i>
            Consultas
          </NavLink>

          <NavLink
            to="/vet/patients"
            className={({ isActive }) =>
              `custom-nav-link d-flex align-items-center ${
                isActive ? "active" : ""
              }`
            }
          >
            <i className="bi bi-heart-pulse me-3"></i>
            Pacientes
          </NavLink>

          <NavLink
            to="/vet/profile"
            className={({ isActive }) =>
              `custom-nav-link d-flex align-items-center ${
                isActive ? "active" : ""
              }`
            }
          >
            <i className="bi bi-person me-3"></i>
            Perfil
          </NavLink>

        </nav>
      </div>

      

      {/* Logout */}
      <div className="pt-3 border-top">
        
        <button
          onClick={() => navigate("/")}
          className="logout-btn d-flex align-items-center w-100 mb-2"
        >
          <i className="bi bi-house-door me-3"></i>
          Voltar á página inicial
        </button>

        <button
          onClick={handleLogout}
          className="logout-btn d-flex align-items-center w-100"
        >
          <i className="bi bi-box-arrow-right me-3"></i>
          Terminar Sessão
        </button>
      </div>
    </aside>
  );
};

export default VetSidebar;
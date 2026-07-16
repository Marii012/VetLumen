import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../../services/api";
import "./Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Erro ao terminar sessão:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      Swal.fire({
        title: "Sessão terminada!",
        text: "Até breve! Esperamos vê-lo novamente no VetLumen.",
        icon: "success",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        customClass: {
          popup: "vetlumen-swal-popup",
          title: "vetlumen-swal-title",
          htmlContainer: "vetlumen-swal-text"
        }
      });

      window.setTimeout(() => {
        navigate("/login");
      }, 1800);
    }
  };

  return (
    <>
      <button
        className={`client-sidebar-toggler hamburger ${isMenuOpen ? "active" : ""}`}
        type="button"
        aria-label="Abrir menu"
        aria-expanded={isMenuOpen}
        aria-controls="clientSidebar"
        onClick={toggleMenu}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div
        className={`client-sidebar-overlay ${isMenuOpen ? "show" : ""}`}
        onClick={closeMenu}
        aria-hidden={!isMenuOpen}
      />

      <aside
        id="clientSidebar"
        className={`sidebar-container d-flex flex-column justify-content-between p-4 ${
          isMenuOpen ? "open" : ""
        }`}
      >
      <div>
        <NavLink to="/" className="sidebar-brand" onClick={closeMenu}>
          <i className="bi bi-heart-pulse-fill sidebar-brand-icon"></i>
          <span className="sidebar-brand-text">VetLumen</span>
        </NavLink>

        {/* Perfil */}
        <div className="profile-section mb-5">
          <div className="profile-icon">
            <i className="bi bi-person-fill fs-1"></i>
          </div>
          {user && (
            <div className="profile-info">
              <h6>Olá, {user.first_name}</h6>
              <span>Cliente</span>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav className="nav flex-column gap-2">
                    <NavLink
                      to="/client/dashboard"
                      className={({ isActive }) =>
                        `custom-nav-link d-flex align-items-center ${isActive ? "active" : ""}`
                      }
                      onClick={closeMenu}
                    >
                      <i className="bi bi-grid-1x2-fill me-3"></i>
                      Painel
                    </NavLink>

                    <NavLink
                      to="/client/pets"
                      className={({ isActive }) =>
                        `custom-nav-link d-flex align-items-center ${isActive ? "active" : ""}`
                      }
                      onClick={closeMenu}
                    >
                      <i className="bi bi-heart me-3"></i>
                      Os Meus Animais
                    </NavLink>

                    <NavLink
                      to="/client/appointments"
                      className={({ isActive }) =>
                        `custom-nav-link d-flex align-items-center ${isActive ? "active" : ""}`
                      }
                      onClick={closeMenu}
                    >
                      <i className="bi bi-calendar-event me-3"></i>
                      Consultas
                    </NavLink>

                    <NavLink
                      to="/client/invoices"
                      className={({ isActive }) =>
                        `custom-nav-link d-flex align-items-center ${isActive ? "active" : ""}`
                      }
                      onClick={closeMenu}
                    >
                      <i className="bi bi-receipt me-3"></i>
                      Faturas
                    </NavLink>

                    <NavLink
                      to="/client/profile"
                      className={({ isActive }) =>
                        `custom-nav-link d-flex align-items-center ${isActive ? "active" : ""}`
                      }
                      onClick={closeMenu}
                    >
                      <i className="bi bi-person me-3"></i>
                      Perfil
                    </NavLink>
        </nav>
      </div>

      {/* Logout */}
      <div className="pt-3 border-top">
        <button
          onClick={handleLogout}
          className="logout-btn d-flex align-items-center w-100"
        >
          <i className="bi bi-box-arrow-right me-3"></i>
          Terminar Sessão
        </button>
      </div>
      </aside>
    </>
  );
};

export default Sidebar;
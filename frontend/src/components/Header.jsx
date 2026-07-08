import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Header.css";

function Header() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path) => currentPath === path;

  return (
    <header className="shadow-sm sticky-top bg-white">

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white py-3">
        <div className="container">

          <Link 
            className="navbar-brand fw-bold fs-3 text-dark me-5"
            to="/"
          >
            <i className="bi bi-heart-pulse-fill logo-color me-2"></i>VetLumen
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarMenu"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarMenu">
            <ul className="navbar-nav mx-auto gap-4">
              <li className="nav-item">
                <Link className={`nav-link ${isActive("/") ? "active-link" : "text-secondary"}`} to="/">
                  Início
                </Link>
              </li>

              <li className="nav-item">
                <Link className={`nav-link ${isActive("/about") ? "active-link" : "text-secondary"}`} to="/about">
                  Serviços
                </Link>
              </li>

              <li className="nav-item">
                <Link className={`nav-link ${isActive("/about") ? "active-link" : "text-secondary"}`} to="/about">
                  Sobre Nós
                </Link>
              </li>

              <li className="nav-item">
                <Link className={`nav-link ${isActive("/services") ? "active-link" : "text-secondary"}`} to="/services">
                  Equipa
                </Link>
              </li>

              <li className="nav-item">
                <Link className={`nav-link ${isActive("/contact") ? "active-link" : "text-secondary"}`} to="/contact">
                  Contactos
                </Link>
              </li>
            </ul>

            <div className="d-flex gap-2 ms-lg-4">
              <Link 
                className="btn btn-login btn-md rounded-pill px-4 py-2 fw-semibold" 
                to="/login"
              >
                Iniciar Sessão
              </Link>
              <Link 
                className="btn btn-register btn-md rounded-pill px-4 py-2 text-white fw-semibold shadow-sm" 
                to="/register"
              >
                Registo
              </Link>
            </div>
          </div>

        </div>
      </nav>

    </header>
  );
}

export default Header;
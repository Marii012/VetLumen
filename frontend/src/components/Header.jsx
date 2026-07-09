import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./Header.css";

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const [activeSection, setActiveSection] = useState("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);


  // Verificar se existe sessão iniciada
  useEffect(() => {

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");


    if (token && storedUser) {

      setUser(JSON.parse(storedUser));

    } else {

      setUser(null);

    }

  }, []);



  // Logout
  const handleLogout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("user");
  
    setUser(null);


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
  };



  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);



  const scrollToSection = (sectionId) => {
    if (!sectionId || sectionId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const section = document.getElementById(sectionId);

    if (section) {
      const offset = 90;
      const top = section.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };



  const handleNavClick = (event, sectionId) => {
    event.preventDefault();
    setActiveSection(sectionId);
    closeMenu();

    if (currentPath !== "/") {
      navigate("/");
      setTimeout(() => scrollToSection(sectionId), 120);
      return;
    }

    scrollToSection(sectionId);
  };



  useEffect(() => {
    setIsMenuOpen(false);

    if (currentPath !== "/") {
      setActiveSection("home");
      return;
    }

    const updateActiveSection = () => {
      const offset = 180;
      const scrollPosition = window.scrollY + offset;
      const sectionIds = ["home", "services", "about", "team", "contact"];
      let currentId = "home";

      sectionIds.forEach((sectionId) => {
        const section = document.getElementById(sectionId);

        if (section) {
          const sectionTop = section.offsetTop;

          if (scrollPosition >= sectionTop) {
            currentId = sectionId;
          }
        }
      });

      setActiveSection(currentId);
    };


    updateActiveSection();

    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);


    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };

  }, [currentPath]);



  const isSectionActive = (sectionId) => 
    currentPath === "/" && activeSection === sectionId;



  return (
    <header className="shadow-sm sticky-top bg-white">

      <nav className="navbar navbar-expand-lg navbar-light bg-white py-3">

        <div className="container">


          <Link 
            className="navbar-brand fw-bold fs-3 text-dark me-5"
            to="/"
          >
            <i className="bi bi-heart-pulse-fill logo-color me-2"></i>
            VetLumen
          </Link>



          <button
            className={`navbar-toggler hamburger ${isMenuOpen ? "active" : ""}`}
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls="navbarMenu"
            onClick={toggleMenu}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>



          <div
            className={`mobile-menu-overlay ${isMenuOpen ? "show" : ""}`}
            onClick={closeMenu}
            aria-hidden={!isMenuOpen}
          />



          <div
  className={`collapse navbar-collapse mobile-menu-panel ${isMenuOpen ? "show" : ""}`}
  id="navbarMenu"
>

  {user && (
  <div className="mobile-user-info d-lg-none">

    <i className="bi bi-person-circle"></i>

    <div>
      <h6>Olá, {user.first_name}</h6>
      <span>Cliente</span>
    </div>

  </div>
)}


            <ul className="navbar-nav mx-auto gap-4">


              <li className="nav-item">
                <Link
                  className={`nav-link ${isSectionActive("home") ? "active-link" : "text-secondary"}`}
                  to="/"
                  onClick={(event) => handleNavClick(event, "home")}
                >
                  Início
                </Link>
              </li>


              <li className="nav-item">
                <Link
                  className={`nav-link ${isSectionActive("services") ? "active-link" : "text-secondary"}`}
                  to="/"
                  onClick={(event) => handleNavClick(event, "services")}
                >
                  Serviços
                </Link>
              </li>


              <li className="nav-item">
                <Link
                  className={`nav-link ${isSectionActive("about") ? "active-link" : "text-secondary"}`}
                  to="/"
                  onClick={(event) => handleNavClick(event, "about")}
                >
                  Sobre Nós
                </Link>
              </li>


              <li className="nav-item">
                <Link
                  className={`nav-link ${isSectionActive("team") ? "active-link" : "text-secondary"}`}
                  to="/"
                  onClick={(event) => handleNavClick(event, "team")}
                >
                  Equipa
                </Link>
              </li>


              <li className="nav-item">
                <Link
                  className={`nav-link ${isSectionActive("contact") ? "active-link" : "text-secondary"}`}
                  to="/"
                  onClick={(event) => handleNavClick(event, "contact")}
                >
                  Contactos
                </Link>
              </li>


            </ul>



            <div className="ms-lg-4 header-actions">

  {user ? (

    <>

      {/* ================= DESKTOP ================= */}

      <div className="dropdown d-none d-lg-block">

        <button
          className="btn btn-header-login rounded-pill px-4 py-2 fw-semibold dropdown-toggle d-flex align-items-center"
          type="button"
          id="userDropdown"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <i className="bi bi-person-circle me-2"></i>

          Olá, {user.first_name}

          <i className="bi bi-chevron-down ms-2 dropdown-arrow"></i>
        </button>

        <ul
          className="dropdown-menu dropdown-menu-end shadow border-0 mt-2"
          aria-labelledby="userDropdown"
        >

          <li>

            <Link
              className="dropdown-item"
              to="/dashboard"
            >
              <i className="bi bi-speedometer2"></i>

              Dashboard
            </Link>

          </li>

          <li>

            <Link
              className="dropdown-item"
              to="/perfil"
            >
              <i className="bi bi-person"></i>

              Perfil
            </Link>

          </li>

          <li>
            <hr className="dropdown-divider" />
          </li>

          <li>

            <button
              className="dropdown-item text-danger"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right"></i>

              Sair
            </button>

          </li>

        </ul>

      </div>

      {/* ================= MOBILE ================= */}

      <div className="d-lg-none mobile-user-menu">

        <hr />

        <Link
          to="/dashboard"
          className="mobile-user-link"
          onClick={closeMenu}
        >
          <i className="bi bi-speedometer2"></i>

          Dashboard
        </Link>

        <Link
          to="/perfil"
          className="mobile-user-link"
          onClick={closeMenu}
        >
          <i className="bi bi-person"></i>

          Perfil
        </Link>

        <button
          className="mobile-user-link logout"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right"></i>

          Sair
        </button>

      </div>

    </>

  ) : (

    <div className="d-flex gap-2">

      <Link
        className="btn btn-header-login rounded-pill px-4 py-2 fw-semibold"
        to="/login"
      >
        Entrar
      </Link>

      <Link
        className="btn btn-register rounded-pill px-4 py-2 text-white fw-semibold shadow-sm"
        to="/register"
      >
        Registar
      </Link>

    </div>

  )}

</div>


          </div>

        </div>

      </nav>

    </header>
  );
}

export default Header;


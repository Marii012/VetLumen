import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer bg-white border-top mt-5 pt-5">

      <div className="container">

        <div className="row gy-5">

          {/* Logo */}
          <div className="col-12 col-md-6 col-lg-5 text-center text-md-start d-flex flex-column align-items-center align-items-md-start">

            <Link
              className="navbar-brand fw-bold fs-3 text-dark d-flex align-items-center justify-content-center justify-content-md-start mb-3"
              to="/"
            >
              <i className="bi bi-heart-pulse-fill logo-color me-2"></i>
              VetLumen
            </Link>

            <p className="text-secondary mb-0">
              Cuidamos do seu melhor amigo com dedicação, carinho e
              profissionalismo, proporcionando serviços de qualidade para o seu
              bem-estar.
            </p>

          </div>

          {/* Contactos */}
          <div className="col-12 col-md-6 col-lg-3 offset-lg-4 text-center text-md-start text-lg-start d-flex flex-column align-items-center align-items-md-start">
            <h5 className="footer-title mb-3">
              Contactos
            </h5>

            <p className="mb-2">
              <i className="bi bi-geo-alt-fill me-2"></i>
              Rua dos Patudos, nº 123, Lisboa
            </p>

            <p className="mb-2">
              <i className="bi bi-telephone-fill me-2"></i>
              +351 912 345 678
            </p>

            <p className="mb-4">
              <i className="bi bi-envelope-fill me-2"></i>
              info@vetlumen.com
            </p>

            <div className="social-links d-flex justify-content-center justify-content-lg-start gap-3 fs-4">
              <a href="#" className="footer-link" aria-label="Facebook">
                <i className="bi bi-facebook"></i>
              </a>

              <a href="#" className="footer-link" aria-label="Instagram">
                <i className="bi bi-instagram"></i>
              </a>
            </div>
          </div>

        </div>

        <hr className="my-4" />

        <div className="text-center text-secondary pb-3">
          © {new Date().getFullYear()} VetLumen. Todos os direitos reservados.
        </div>

      </div>

    </footer>
  );
}

export default Footer;
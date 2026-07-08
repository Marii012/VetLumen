import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import "./Register.css";

function Register() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: "ease-out-cubic",
      offset: 60,
    });
  }, []);

  return (
    <div className="register-page min-vh-100 d-flex align-items-center justify-content-center bg-white">
      <div className="container-fluid p-0 h-100">
        <div className="row g-0 min-vh-100">
          
          {/* LADO ESQUERDO: Formulário Clean */}
          <div className="col-lg-6 d-flex align-items-center justify-content-center p-4 p-md-5" data-aos="fade-right" data-aos-delay="100">
            <div className="form-wrapper w-100" style={{ maxWidth: "460px" }}>
              
              <span className="text-muted small fw-bold tracking-wide text-uppercase d-block mb-1">
                BEM-VINDO
              </span>
              <h1 className="fw-bold display-5 text-dark mb-2">
                Criar nova conta<span className="logo-dot">.</span>
              </h1>
              
              <p className="text-secondary small mb-4">
                Já tem conta? <Link to="/login" className="login-redirect fw-semibold text-decoration-none">Entrar</Link>
              </p>

              <form>
                {/* Linha com Primeiro e Último Nome (Inputs lado a lado) */}
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <div className="custom-input-box p-2 px-3">
                      <label className="d-block text-muted tiny-label mb-0">Primeiro nome</label>
                      <input type="text" className="border-0 w-100 bg-transparent form-control-clean" placeholder="Michał" required />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="custom-input-box p-2 px-3">
                      <label className="d-block text-muted tiny-label mb-0">Último nome</label>
                      <input type="text" className="border-0 w-100 bg-transparent form-control-clean" placeholder="Masiak" required />
                    </div>
                  </div>
                </div>

                {/* Input de Email completo */}
                <div className="mb-3">
                  <div className="custom-input-box p-2 px-3">
                    <label className="d-block text-muted tiny-label mb-0">Email</label>
                    <input type="email" className="border-0 w-100 bg-transparent form-control-clean" placeholder="michal.masiak@anywhere.co" required />
                  </div>
                </div>

                {/* Input de Password com a borda de destaque ativa */}
                <div className="mb-4">
                  <div className="custom-input-box p-2 px-3">
                    <label className="d-block text-muted tiny-label mb-0">Password</label>
                    <input type="password" className="border-0 w-100 bg-transparent form-control-clean" placeholder="••••••••" required />
                  </div>
                </div>

                {/* Botões de Ação Inferiores */}
                <div className="d-flex gap-3 align-items-center">
                  <Link
                    to="/"
                    className="btn btn-light-gray rounded-pill px-4 py-2 fw-medium btn-sm-custom text-decoration-none"
                  >
                    Voltar
                  </Link>
                
                  <button
                    type="submit"
                    className="btn btn-create rounded-pill px-4 py-2 fw-medium text-white btn-sm-custom shadow-sm"
                  >
                    Criar conta
                  </button>
                </div>

              </form>

            </div>
          </div>

          {/* LADO DIREITO: Imagem de Fundo com o Corte de Onda Gigante Vertical */}
          <div className="col-lg-6 d-none d-lg-block position-relative image-panel" data-aos="fade-left" data-aos-delay="150">
            {/* SVG da Curva Fluida colocado exatamente por cima da imagem */}
            <div className="vertical-wave">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
                <path d="M100,0 C40,10 60,40 20,60 C-10,75 30,90 0,100 L0,0 Z"></path>
              </svg>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Register;
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import Swal from "sweetalert2";
import "./Login.css";

import { login } from "../../services/authService";


function Login() {

  const navigate = useNavigate();


  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });


  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: "ease-out-cubic",
      offset: 60,
    });
  }, []);



  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

  };



 const handleSubmit = async (e) => {

    e.preventDefault();
  
    try {
  
      const response = await login(formData);
  
      // Guardar JWT
      localStorage.setItem("token", response.token);
  
      // Guardar dados do utilizador
      localStorage.setItem("user", JSON.stringify(response.user));
  
      // Guardar a role (opcional, mas útil)
      localStorage.setItem("role", response.user.id_role);
  
      Swal.fire({
        title: "Login efetuado!",
        text: "Bem-vindo de volta ao VetLumen.",
        icon: "success",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        customClass: {
          popup: "vetlumen-swal-popup",
          title: "vetlumen-swal-title",
          htmlContainer: "vetlumen-swal-text"
        }
      }).then(() => {
  
        switch (response.user.id_role) {
  
          case 1: 
            navigate("/client/dashboard");
            break;
  
          case 2: 
            navigate("/vet/dashboard");
            break;
  
          case 3: 
            navigate("/admin/dashboard");
            break;
  
          default:
            navigate("/");
            break;
  
        }
  
      });
  
    } catch (error) {
  
      console.error(error);
  
      Swal.fire({
        title: "Erro!",
        text:
          error.response?.data?.message ||
          "Email ou password incorretos.",
        icon: "error",
        confirmButtonText: "OK",
        customClass: {
          popup: "vetlumen-swal-popup",
          title: "vetlumen-swal-title",
          htmlContainer: "vetlumen-swal-text",
          confirmButton: "vetlumen-swal-button"
        }
      });
  
    }
  
  };



  return (
    <div className="login-page min-vh-100 d-flex align-items-center justify-content-center bg-white">
      <div className="container-fluid p-0 h-100">

        <div className="row g-0 min-vh-100">


          {/* Formulário */}
          <div className="col-lg-6 d-flex align-items-center justify-content-center p-4 p-md-5" data-aos="fade-right" data-aos-delay="100">

            <div className="form-wrapper w-100" style={{ maxWidth: "460px" }}>


              <span className="text-muted small fw-bold tracking-wide text-uppercase d-block mb-1">
                Bem vindo de volta
              </span>


              <h1 className="fw-bold display-5 text-dark mb-2">
                Inicie Sessão<span className="logo-dot">.</span>
              </h1>



              <p className="text-secondary small mb-4">
                Não tem uma conta?{" "}
                <Link 
                  to="/register" 
                  className="signup-redirect fw-semibold text-decoration-none"
                >
                  Registe-se
                </Link>
              </p>




              <form onSubmit={handleSubmit}>


                {/* EMAIL */}

                <div className="mb-3">

                  <div className="custom-input-box p-2 px-3">

                    <label className="d-block text-muted tiny-label mb-0">
                      Email
                    </label>


                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="border-0 w-100 bg-transparent form-control-clean"
                      placeholder="email@gmail.com"
                      required
                    />


                  </div>

                </div>

                {/* PASSWORD */}

                <div className="mb-4">

                  <div className="custom-input-box p-2 px-3">


                    <label className="text-muted tiny-label mb-0">
                      Password
                    </label>


                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="border-0 w-100 bg-transparent form-control-clean"
                      placeholder="••••••••"
                      required
                    />


                  </div>

                </div>





                {/* BOTÕES */}

                <div className="d-flex gap-3 align-items-center">


                  <Link
                    to="/"
                    className="btn btn-light-gray rounded-pill px-4 py-2 fw-medium btn-sm-custom text-decoration-none"
                  >
                    Voltar
                  </Link>



                  <button
                    type="submit"
                    className="btn btn-login rounded-pill px-4 py-2 fw-medium text-white btn-sm-custom shadow-sm"
                  >
                    Entrar
                  </button>


                </div>



              </form>



            </div>

          </div>





          {/* Imagem */}

          <div className="col-lg-6 d-none d-lg-block position-relative login-image-panel" data-aos="fade-left" data-aos-delay="150">


            <div className="vertical-wave">

              <svg 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none" 
                fill="#ffffff" 
                xmlns="http://www.w3.org/2000/svg"
              >

                <path d="M100,0 C40,10 60,40 20,60 C-10,75 30,90 0,100 L0,0 Z"></path>

              </svg>

            </div>


          </div>


        </div>

      </div>
    </div>
  );
}


export default Login;


import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import Swal from "sweetalert2";
import "./Register.css";

import { register } from "../../services/authService";


function Register() {

  const navigate = useNavigate();


  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    telefone: "",
    indicativo_pais: "+351"
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);



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

    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        title: "As palavras-passe não coincidem",
        text: "Confirme a sua palavra-passe antes de criar a conta.",
        icon: "warning",
        confirmButtonText: "OK",
        customClass: {
          popup: "vetlumen-swal-popup",
          title: "vetlumen-swal-title",
          htmlContainer: "vetlumen-swal-text",
          confirmButton: "vetlumen-swal-button"
        }
      });
      return;
    }

    try {

      const payload = {
        ...formData,
        telefone: `${formData.indicativo_pais || ""} ${formData.telefone || ""}`.trim()
      };

      const response = await register(payload);

      console.log(response);



      Swal.fire({
        title: "Conta criada!",
        text: "A redirecionar para o login...",
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
      
        navigate("/login");
      
      });



    } catch (error) {


      console.error(error);



      Swal.fire({
        title: "Erro!",
        text:
          error.response?.data?.message ||
          "Erro ao criar conta.",
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
    <div className="register-page min-vh-100 d-flex align-items-center justify-content-center bg-white">

      <div className="container-fluid p-0 h-100">

        <div className="row g-0 min-vh-100">



          <div 
            className="col-lg-6 d-flex align-items-center justify-content-center p-4 p-md-5"
            data-aos="fade-right"
            data-aos-delay="100"
          >


            <div className="form-wrapper w-100" style={{maxWidth:"460px"}}>


              <span className="text-muted small fw-bold tracking-wide text-uppercase d-block mb-1">
                BEM-VINDO
              </span>


              <h1 className="fw-bold display-5 text-dark mb-2">
                Criar nova conta<span className="logo-dot">.</span>
              </h1>



              <p className="text-secondary small mb-4">

                Já tem conta?{" "}

                <Link
                  to="/login"
                  className="login-redirect fw-semibold text-decoration-none"
                >
                  Entrar
                </Link>

              </p>




              <form onSubmit={handleSubmit}>


                <div className="row g-3 mb-3">


                  <div className="col-6">

                    <div className="custom-input-box p-2 px-3">


                      <label className="d-block text-muted tiny-label mb-0">
                        Primeiro nome
                      </label>



                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className="border-0 w-100 bg-transparent form-control-clean"
                        placeholder="Fernando"
                        required
                      />


                    </div>

                  </div>




                  <div className="col-6">

                    <div className="custom-input-box p-2 px-3">


                      <label className="d-block text-muted tiny-label mb-0">
                        Último nome
                      </label>


                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className="border-0 w-100 bg-transparent form-control-clean"
                        placeholder="Oliveira"
                        required
                      />


                    </div>

                  </div>


                </div>





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






                <div className="mb-3">
                  <div className="custom-input-box p-2 px-3">
                    <label className="d-block text-muted tiny-label mb-0">Telefone</label>

                    <div className="input-group">
                      <input
                        type="tel"
                        className="form-control country-code"
                        name="indicativo_pais"
                        value={formData.indicativo_pais}
                        onChange={handleChange}
                      />

                      <input
                        type="tel"
                        name="telefone"
                        className="form-control"
                        placeholder="912345678"
                        value={formData.telefone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="custom-input-box p-2 px-3 d-flex align-items-center gap-2">
                    <div className="flex-grow-1">
                      <label className="d-block text-muted tiny-label mb-0">Password</label>

                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="border-0 w-100 bg-transparent form-control-clean"
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-link p-0 text-muted"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Esconder password" : "Mostrar password"}
                    >
                      <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="custom-input-box p-2 px-3 d-flex align-items-center gap-2">
                    <div className="flex-grow-1">
                      <label className="d-block text-muted tiny-label mb-0">
                        Confirmar password
                      </label>

                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="border-0 w-100 bg-transparent form-control-clean"
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-link p-0 text-muted"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? "Esconder password" : "Mostrar password"}
                    >
                      <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                    </button>
                  </div>
                </div>

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






          <div 
            className="col-lg-6 d-none d-lg-block position-relative image-panel"
            data-aos="fade-left"
            data-aos-delay="150"
          >


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



export default Register;
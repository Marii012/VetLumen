import React, { useEffect, useState } from "react";
import AOS from "aos";
import Select from "react-select";
import "aos/dist/aos.css";
import "./Home.css";

function Home() {
    const [urgencyInfo, setUrgencyInfo] = useState({
      label: "Atendimento disponível",
      icon: "bi-heart-pulse",
      className: "urgency-normal",
    });

    const [countryCode, setCountryCode] = useState("+351");
    const [phone, setPhone] = useState("");

    const contactOptions = [
    { value: "duvidas", label: "Esclarecimento de Dúvidas" },
    { value: "consulta", label: "Consulta Geral" },
    { value: "vacinacao", label: "Vacinação" },
    { value: "desparasitacao", label: "Desparasitação" },
    { value: "exames", label: "Exames e Diagnóstico" },
    { value: "cirurgia", label: "Cirurgia" },
    { value: "acompanhamento", label: "Acompanhamento" },
  ];

    const specieOptions = [
    { value: "cao", label: "Cão" },
    { value: "gato", label: "Gato" },
    { value: "ave", label: "Ave" },
    { value: "roedor", label: "Roedor" },
    { value: "reptil", label: "Réptil" },
    { value: "peixe", label: "Peixe" },
    { value: "outro", label: "Outro" },
  ];

  const [isUrgencyHidden, setIsUrgencyHidden] = useState(false);

    useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: "ease-out-cubic",
      offset: 80,
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsUrgencyHidden(window.scrollY > 80);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateUrgency = () => {
      const hour = new Date().getHours();

      if (hour >= 20 || hour < 8) {
        setUrgencyInfo({
          label: "Estamos em horário de urgência",
          icon: "bi-hospital",
          className: "urgency-urgent",
        });
      } else if (hour >= 17) {
        setUrgencyInfo({
          label: "Últimas consultas do dia",
          icon: "bi-sun",
          className: "urgency-warning",
        });
      } else {
        setUrgencyInfo({
          label: "Atendimento disponível",
          icon: "bi-heart-pulse",
          className: "urgency-normal",
        });
      }
    };

    updateUrgency();
    const intervalId = window.setInterval(updateUrgency, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="home-page">
      <div className={`urgency-bar ${urgencyInfo.className} ${isUrgencyHidden ? "is-hidden" : ""}`} role="status" aria-live="polite">
        <div className="container d-flex justify-content-center align-items-center gap-2 py-1 small fw-semibold">
          <i className={`bi ${urgencyInfo.icon}`}></i>
          <span>{urgencyInfo.label}</span>
        </div>
      </div>
      
      {/* ================= HERO SECTION ================= */}
      <section id="home" className="hero-section position-relative pt-3" data-aos="fade-up">
        <div className="container pt-lg-2">
          <div className="row align-items-center">
            
            {/* Texto do Hero */}
            <div className="col-lg-5 text-center text-lg-start mb-5 mb-lg-0 pt-lg-4" data-aos="fade-right" data-aos-delay="100">
              <span className="text-secondary fw-semibold fs-5">Os melhores cuidados para</span>
              <h1 className="display-2 fw-bold text-dark mt-0 mb-4">
                o seu <span className="logo-color">animal</span>
              </h1>
              <p className="text-muted mb-4 lead font-light fs-6">
                Marque consultas veterinárias de forma simples, rápida e segura. A nossa equipa está preparada para cuidar da saúde e do bem-estar do seu melhor amigo!
              </p>
              <button className="btn btn-hero btn-lg px-4 py-2.5 rounded-pill text-white fw-medium shadow-sm">
                <i className="bi bi-calendar-plus me-2"></i>
                Marcar Consulta
              </button>
            </div>

            {/* Imagem do Hero */}
            <div className="col-lg-7 position-relative text-center text-lg-end" data-aos="fade-left" data-aos-delay="200">
              <img 
                src="https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=1000" 
                alt="Dono acariciando cão Jack Russell" 
                className="img-fluid hero-img"
              />
            </div>

          </div>
        </div>

        {/* Efeito de Curva/Onda no fundo (Wave) */}
        <div className="wave-container">
          <svg viewBox="0 0 1440 120" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,64L120,74.7C240,85,480,107,720,101.3C960,96,1200,64,1320,48L1440,32L1440,120L1320,120C1200,120,960,120,720,120C480,120,240,120,120,120L0,120Z"></path>
          </svg>
        </div>

        {/* Badge Flutuante "Call Us" */}
        <div className="call-us-badge shadow-sm bg-white px-3 px-sm-4 py-2 rounded-pill border position-absolute start-50 translate-middle-x">
          <span className="text-dark fw-bold">Ligue-nos: </span>
          <span className="logo-color fw-bold">+351 912 345 678</span>
        </div>
      </section>


      {/* ================= CATEGORIES SECTION ================= */}
      <section className="categories-section py-5 text-center mt-5" data-aos="fade-up" data-aos-delay="150">
        <div className="container">
          
          <h2 className="fw-bold text-dark fs-2 mb-2">Cuidados para Todos os Companheiros<span className="logo-dot">.</span></h2>
          <p className="text-muted mx-auto mb-5 font-light max-w-xl">
            Prestamos cuidados veterinários personalizados para diferentes espécies, garantindo o bem-estar de cada animal.
          </p>

          {/* Grelha de Animais */}
          <div className="row justify-content-center g-4 mt-2">
            
            {[
              { name: "Gatos", img: "https://plus.unsplash.com/premium_photo-1673967831980-1d377baaded2?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
              { name: "Cães", img: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150" },
              { name: "Aves", img: "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=150" },
              { name: "Roedores", img: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=150" },
              { name: "Peixes", img: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=150" }
            ].map((pet, index) => (
              <div key={index} className="col-6 col-sm-4 col-md-2 d-flex flex-column align-items-center" data-aos="zoom-in" data-aos-delay={100 + index * 80}>
                <div className="avatar-wrapper mb-3 shadow-sm border bg-white">
                  <img src={pet.img} alt={pet.name} className="avatar-img" />
                </div>
                <span className="fw-semibold text-secondary">{pet.name}</span>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* ================= SERVICES SECTION ================= */}
      <section id="services" className="services-section py-5" data-aos="fade-up">
      
        <div className="container">
      
          <div className="text-center mb-5">
      
            <span className="logo-color fw-semibold">
              Os nossos serviços
            </span>
      
            <h2 className="fw-bold text-dark fs-2 mt-2">
              Acompanhamento completo para o seu animal<span className="logo-dot">.</span>
            </h2>
      
            <p className="text-muted mx-auto services-subtitle">
              Na VetLumen disponibilizamos serviços veterinários personalizados,
              garantindo o melhor acompanhamento para a saúde e bem-estar do seu animal.
            </p>
      
          </div>
      
      
          <div className="row g-4">
      
            {[
              {
                icon: "bi-heart-pulse",
                title: "Consulta Geral",
                description:
                  "Avaliação completa da saúde do seu animal e acompanhamento veterinário personalizado."
              },
              {
                icon: "bi-shield-plus",
                title: "Vacinação",
                description:
                  "Planos de vacinação adequados para proteger o seu animal em todas as fases da vida."
              },
              {
                icon: "bi-bug",
                title: "Desparasitação",
                description:
                  "Prevenção e tratamento contra parasitas internos e externos."
              },
              {
                icon: "bi-clipboard2-pulse",
                title: "Exames e Diagnóstico",
                description:
                  "Exames veterinários para ajudar num diagnóstico rápido e eficaz."
              },
              {
                icon: "bi-hospital",
                title: "Cirurgia",
                description:
                  "Procedimentos cirúrgicos realizados por uma equipa veterinária especializada."
              },
              {
                icon: "bi-calendar-check",
                title: "Acompanhamento",
                description:
                  "Seguimento regular para garantir a qualidade de vida do seu melhor amigo."
              }
      
            ].map((service, index) => (
      
              <div 
                className="col-lg-4 col-md-6"
                key={index}
                data-aos="zoom-in"
                data-aos-delay={index * 100}
              >
      
                <div className="service-card">
      
                  <div className="service-icon">
                    <i className={`bi ${service.icon}`}></i>
                  </div>
      
                  <h5 className="fw-bold mt-4">
                    {service.title}
                  </h5>
      
                  <p className="text-muted">
                    {service.description}
                  </p>
      
                </div>
      
              </div>
      
            ))}
      
          </div>
      
        </div>
      
      </section>


      {/* ================= ABOUT / FEATURES SECTION ================= */}
      <section id="about" className="about-section py-5 my-4" data-aos="fade-up" data-aos-delay="100">
        <div className="container">
          <div className="row align-items-center">
            
            {/* Bloco de Texto e Vantagens */}
            <div className="col-lg-6 mb-5 mb-lg-0" data-aos="fade-right" data-aos-delay="150">
              <span className="logo-color fw-semibold fs-6">Sobre Nós</span>
              <h2 className="fw-bold text-dark fs-2 mt-1 mb-4">VetLumen<span className="logo-dot">.</span></h2>
              
              <p className="text-muted about-intro font-light">
                Na VetLumen, cuidamos dos animais com ciência e dedicação. O nosso nome representa
                a luz que guia cada decisão, cada diagnóstico e cada cuidado, com o objetivo de proporcionar 
                mais saúde, bem-estar e qualidade de vida aos nossos pacientes.
              </p>

              <p className="text-muted mb-5 font-light">
                A nossa equipa une experiência e paixão pela medicina veterinária para oferecer um acompanhamento
                personalizado e próximo. Porque cada animal é único, trabalhamos todos os dias para garantir cuidados 
                de excelência e construir uma relação de confiança com as famílias que nos escolhem.
              </p>

              <div className="row g-4 border p-4 bg-white rounded-4 shadow-xs features-box">
              
                <div className="col-4 text-center">
                  <div className="feature-icon mb-2 fs-3">
                    <i className="bi bi-heart-pulse"></i>
                  </div>
                  <span className="d-block text-secondary fw-medium small">
                    Cuidados de Excelência
                  </span>
                </div>
              
                <div className="col-4 text-center">
                  <div className="feature-icon mb-2 fs-3">
                    <i className="bi bi-person-heart"></i>
                  </div>
                  <span className="d-block text-secondary fw-medium small">
                    Acompanhamento Próximo
                  </span>
                </div>
              
                <div className="col-4 text-center">
                  <div className="feature-icon mb-2 fs-3">
                    <i className="bi bi-shield-check"></i>
                  </div>
                  <span className="d-block text-secondary fw-medium small">
                    Confiança e Segurança
                  </span>
                </div>
              
              </div>
            </div>

            {/* Imagem do gato à Direita */}
            <div className="col-lg-6 text-center" data-aos="fade-left" data-aos-delay="200">
              <img 
                src="https://images.unsplash.com/photo-1511044568932-338cba0ad803?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                alt="Gato laranja deitado" 
                className="img-fluid main-cat-img" 
              />
            </div>

          </div>
        </div>
      </section>

      
      {/* ================= TEAM SECTION ================= */}
      <section id="team" className="team-section py-5 " data-aos="fade-up">
      
        <div className="container">
      
          <div className="text-center mb-5">
      
            <span className="logo-color fw-semibold">
              A nossa equipa
            </span>
      
            <h2 className="fw-bold text-dark fs-2 mt-2">
              Profissionais dedicados ao cuidado do seu animal<span className="logo-dot">.</span>
            </h2>
      
            <p className="text-muted mx-auto team-subtitle">
              Na VetLumen contamos com uma equipa especializada e apaixonada
              por medicina veterinária, preparada para acompanhar cada animal
              com dedicação, rigor e proximidade.
            </p>
      
          </div>
      
      
          <div className="row g-4 justify-content-center">
      
            {[
              {
                image: "https://plus.unsplash.com/premium_photo-1661963693154-154c5a027494?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                name: "Dr. Miguel Ferreira",
                role: "Médico Veterinário",
                specialty: "Medicina preventiva"
              },
              {
                image: "https://images.unsplash.com/photo-1770836037816-4445dbd449fd?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3Dhttps://images.unsplash.com/photo-1770836037816-4445dbd449fd?q=80&w=300&auto=format&fit=crop",
                name: "Dr. João Costa",
                role: "Médico Veterinário",
                specialty: "Cirurgia e diagnóstico"
              },
              {
                image: "https://plus.unsplash.com/premium_photo-1661580574627-9211124e5c3f?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                name: "Marta Ferreira",
                role: "Enfermeira Veterinária",
                specialty: "Cuidados e acompanhamento"
              },
              {
                image: "https://plus.unsplash.com/premium_photo-1661963377525-7b879630b497?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                name: "Ana Rodrigues",
                role: "Assistente Veterinária",
                specialty: "Cuidados e acompanhamento"
              }
              
            ].map((member, index) => (
      
              <div
                className="col-lg-4 col-md-6"
                key={index}
                data-aos="fade-up"
                data-aos-delay={index * 150}
              >
      
                <div className="team-card">
      
                  <div className="team-image">
                    <img 
                      src={member.image}
                      alt={member.name}
                    />
                  </div>
      
      
                  <h5 className="fw-bold mt-4 mb-1">
                    {member.name}
                  </h5>
      
                  <span className="logo-color fw-medium">
                    {member.role}
                  </span>
      
                  <p className="text-muted mt-2">
                    {member.specialty}
                  </p>
      
                </div>
      
              </div>
      
            ))}
      
          </div>

          </div>
        
        </section>
        
        {/* ================= CONTACT SECTION ================= */}
        <section id="contact" className="contact-section py-5 position-relative" data-aos="fade-up">
        
          <div className="container">
        
            <div className="text-center mb-5">
        
              <span className="logo-color fw-semibold">
                Contacte-nos
              </span>
        
              <h2 className="fw-bold text-dark fs-2 mt-2">
                Estamos aqui para cuidar do seu melhor amigo<span className="logo-dot">.</span>
              </h2>
        
              <p className="text-muted mx-auto contact-subtitle">
                Marque uma consulta ou envie-nos uma mensagem.
                A nossa equipa está disponível para ajudar.
              </p>
        
            </div>
        
        
            <div className="row g-4 align-items-stretch">
        
        
              {/* Informações */}
              <div className="col-lg-5" data-aos="fade-right" data-aos-delay="100">
        
                <div className="contact-info h-100">
        
                  <h4 className="fw-bold mb-4">
                    Fale connosco
                  </h4>
        
        
                  <div className="contact-item">
                    <i className="bi bi-geo-alt-fill"></i>
                    <span>
                      Rua dos Patudos, nº 123<br/>
                      Lisboa
                    </span>
                  </div>
        
        
                  <div className="contact-item">
                    <i className="bi bi-telephone-fill"></i>
                    <span>
                      +351 912 345 678
                    </span>
                  </div>
        
        
                  <div className="contact-item">
                    <i className="bi bi-envelope-fill"></i>
                    <span>
                      info@vetlumen.com
                    </span>
                  </div>
        
        
                  <div className="contact-item">
                    <i className="bi bi-clock-fill"></i>
                    <span>
                      Segunda - Sexta<br/>
                      09:00 - 19:00
                    </span>
                  </div>
        
        
                </div>
        
              </div>
        
        
              {/* Formulário */}
              <div className="col-lg-7" data-aos="fade-left" data-aos-delay="150">
        
                <form className="contact-form">
        
        
                  <div className="row g-3">
        
                    <div className="col-md-6">
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="Nome"
                      />
                    </div>
        
        
                    <div className="col-md-6">
                      <input 
                        type="email"
                        className="form-control"
                        placeholder="Email"
                      />
                    </div>
        
        
                    <div className="col-md-6">
                      <div className="input-group">
                    
                        <input
                          type="tel"
                          className="form-control country-code"
                          value={countryCode}
                          maxLength={5}
                          onChange={(e) =>
                            setCountryCode(e.target.value.replace(/[^\d+]/g, ""))
                          }
                          placeholder="+351"
                        />
                    
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="912345678"
                          value={phone}
                          onChange={(e) =>
                            setPhone(e.target.value.replace(/\D/g, ""))
                          }
                        />
                    
                      </div>
                    </div>
        
        
                    <div className="col-md-6">
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="Nome do animal"
                      />
                    </div>

                    {/* Dropdown - Biblioteca (react-select) */}
                    <div className="col-12">
                      <Select
                        options={specieOptions}
                        placeholder="Espécie do animal"
                        maxMenuHeight={190}
                        className="contact-select"
                        classNamePrefix="contact-select"
                      />
                    </div>

                    <div className="col-md-12">
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="Raça do animal"
                      />
                    </div>

                    {/* Dropdown - Biblioteca (react-select) */}
                    <div className="col-12">
                      <Select
                        options={contactOptions}
                        placeholder="Motivo do contacto"
                        maxMenuHeight={190}
                        className="contact-select"
                        classNamePrefix="contact-select"
                      />
                    </div>
        
                    <div className="col-12">
        
                      <textarea
                        className="form-control"
                        rows="5"
                        placeholder="Mensagem"
                      ></textarea>
        
                    </div>
        
        
                    <div className="col-12">
        
                      <button className="btn btn-hero px-4 py-3 rounded-pill">
                        <i className="bi bi-send me-2"></i>
                        Enviar mensagem
                      </button>
        
                    </div>
        
        
                  </div>
        
        
                </form>
        
              </div>
        
        
            </div>
        
          </div>
        
        </section>

    </div>
    
  );
}

export default Home;
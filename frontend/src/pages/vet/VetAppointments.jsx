import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./VetAppointments.css";


const options = [
  { value: "all", label: "Todos os estados" },
  { value: "Pendente", label: "Pendentes" },
  { value: "Confirmada", label: "Confirmadas" },
  { value: "Concluída", label: "Concluídas" },
  { value: "Cancelada", label: "Canceladas" }
];

const swalCustomClass = {
  popup: "vetlumen-swal-popup",
  title: "vetlumen-swal-title",
  htmlContainer: "vetlumen-swal-text",
  confirmButton: "vetlumen-swal-button",
  cancelButton: "vetlumen-swal-button"
};


const VetAppointments = () => {
  const navigate = useNavigate();


  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(options[0]);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/api\/?$/i, "");

  const getPetImageUrl = (fotografia) => {
    if (!fotografia) return null;
    if (String(fotografia).startsWith("http")) return fotografia;
    if (String(fotografia).startsWith("/")) return `${API_BASE}${fotografia}`;
    return `${API_BASE}/uploads/${fotografia}`;
  };



  useEffect(() => {

    loadAppointments();

  }, []);



  const loadAppointments = async () => {

    try {

      setLoading(true);

      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      const vetId = storedUser?.id_user;

      if (!vetId) {
        setAppointments([]);
        return;
      }

      const [appointmentsResponse, petsResponse, usersResponse] = await Promise.all([
        api.get("/appointments"),
        api.get("/pets"),
        api.get("/users")
      ]);

      const petsMap = new Map((petsResponse.data || []).map((pet) => [Number(pet.id_pet), pet]));
      const usersMap = new Map((usersResponse.data || []).map((user) => [Number(user.id_user), user]));

      const filteredByVet = (appointmentsResponse.data || [])
        .filter((appointment) => Number(appointment.id_veterinario) === Number(vetId));

      const vetAppointments = await Promise.all(
        filteredByVet.map(async (appointment) => {
          let pet = petsMap.get(Number(appointment.id_pet)) || null;

          if (!pet && appointment.id_pet) {
            const petResult = await Promise.allSettled([api.get(`/pets/${appointment.id_pet}`)]);
            if (petResult[0].status === "fulfilled") {
              pet = petResult[0].value.data;
            }
          }

          let owner = pet?.id_user ? usersMap.get(Number(pet.id_user)) : null;

          if (!owner && pet?.id_user) {
            const ownerResult = await Promise.allSettled([api.get(`/users/${pet.id_user}`)]);
            if (ownerResult[0].status === "fulfilled") {
              owner = ownerResult[0].value.data;
            }
          }

          return {
            ...appointment,
            petName: pet?.nome || "Animal",
            petPhoto: getPetImageUrl(pet?.fotografia),
            ownerName: owner
              ? `${owner.first_name || ""} ${owner.last_name || ""}`.trim() || owner.email
              : "Dono não identificado"
          };
        })
      );

      setAppointments(vetAppointments);


    } catch (error) {

      console.error("Erro ao carregar consultas:", error);

    } finally {

      setLoading(false);

    }

  };





  const updateStatus = async (id, novoEstado) => {

    try {


      await api.put(`/appointments/${id}`, {

        estado: novoEstado

      });



      Swal.fire({

        title: "Atualizado!",
        text: `Consulta ${novoEstado.toLowerCase()}.`,
        icon: "success",
        customClass: swalCustomClass

      });



      loadAppointments();



    } catch (error) {


      Swal.fire({

        title: "Erro",
        text: "Não foi possível atualizar a consulta.",
        icon: "error",
        customClass: swalCustomClass

      });

    }

  };

  const handleFinalizeAppointment = (appointment) => {
    navigate(`/vet/appointments/${appointment.id_appointment}/finalize`);
  };





  const showDetails = (appointment) => {


    Swal.fire({

      title: "Detalhes da consulta",

      html: `

        <div class="appointment-swal-details">

        <p><strong>Animal:</strong> ${appointment.petName || "Animal"}</p>

        <p><strong>Dono:</strong> ${appointment.ownerName || "Dono não identificado"}</p>

        <p><strong>Motivo:</strong> ${appointment.motivo || "Consulta"}</p>

        <p><strong>Data:</strong> ${appointment.data || "-"}</p>

        <p><strong>Hora:</strong> ${appointment.hora ? String(appointment.hora).slice(0, 5) : "-"}</p>

        <p><strong>Estado:</strong> ${appointment.estado}</p>

        </div>

      `,

      confirmButtonText: "Fechar",
      customClass: swalCustomClass

    });


  };





  const filteredAppointments = appointments.filter((appointment) => {


    const text = `

      ${appointment.petName || ""}

      ${appointment.ownerName || ""}

      ${appointment.motivo || ""}

    `.toLowerCase();



    const matchesSearch =
      text.includes(search.toLowerCase());



    const matchesStatus =
      status.value === "all" ||
      appointment.estado === status.value;



    const appointmentDate = appointment.data ? String(appointment.data).slice(0, 10) : "";
    const matchesDate = !selectedDate || appointmentDate === selectedDate;



    return matchesSearch && matchesStatus && matchesDate;


  });

  const getBadgeClass = (statusValue) => {
    switch (statusValue) {
      case "Confirmada":
        return "badge-confirmed";
      case "Pendente":
        return "badge-pending";
      case "Concluída":
        return "badge-completed";
      case "Cancelada":
        return "badge-rejected";
      default:
        return "";
    }
  };






  return (

    <main className="appointments-container">



      <header className="appointments-header">

        <div>

          <h1>Minhas Consultas</h1>

          <p>
            Gere as consultas dos animais atribuídos a si.
          </p>

        </div>

      </header>






      <section className="appointments-stats">


        <div className="stat-card">

          <div className="stat-icon">
            <i className="bi bi-calendar-event"></i>
          </div>

          <div>

            <h3>{appointments.length}</h3>

            <p>Total</p>

          </div>

        </div>





        <div className="stat-card">

          <div className="stat-icon">
            <i className="bi bi-hourglass-split"></i>
          </div>

          <div>

            <h3>
              {
                appointments.filter(
                  a => a.estado === "Pendente"
                ).length
              }
            </h3>

            <p>Pendentes</p>

          </div>

        </div>





        <div className="stat-card">

          <div className="stat-icon">
            <i className="bi bi-check-circle"></i>
          </div>

          <div>

            <h3>
              {
                appointments.filter(
                  a => a.estado === "Confirmada"
                ).length
              }
            </h3>

            <p>Confirmadas</p>

          </div>

        </div>





        <div className="stat-card">

          <div className="stat-icon">
            <i className="bi bi-clipboard-check"></i>
          </div>

          <div>

            <h3>
              {
                appointments.filter(
                  a => a.estado === "Concluída"
                ).length
              }
            </h3>

            <p>Concluídas</p>

          </div>

        </div>


      </section>







      <div className="appointments-filters">


        <div className="search-box">

          <i className="bi bi-search"></i>


          <input

            placeholder="Pesquisar animal, dono ou motivo..."

            value={search}

            onChange={(e)=>setSearch(e.target.value)}

          />


        </div>



        <div className="date-filter-box">

          <i className="bi bi-calendar3"></i>


          <input

            type="date"

            value={selectedDate}

            onChange={(e) => setSelectedDate(e.target.value)}

            aria-label="Filtrar por data"

          />


        </div>




        <Select
          className="appointments-select"
          classNamePrefix="appointments-select"
          options={options}

          value={status}

          onChange={setStatus}

          isSearchable={false}

        />


      </div>








      <div className="appointments-list">



        {
          loading && <p>A carregar consultas...</p>
        }




        {
          !loading && filteredAppointments.map((appointment)=>(



            <div
              className="appointment-item"
              key={appointment.id_appointment}
            >



              <div className="appointment-left">



                <div className="appointment-avatar">
                  {appointment.petPhoto ? (
                    <img src={appointment.petPhoto} alt={appointment.petName || "Animal"} />
                  ) : (
                    <i className="bi bi-heart-pulse"></i>
                  )}
                </div>





                <div>


                  <h3>
                    {appointment.petName || "Animal"}
                  </h3>


                  <p>
                    <i className="bi bi-person-fill me-2"></i>
                    Dono: {appointment.ownerName || "Não informado"}
                  </p>



                  <p>
                    <i className="bi bi-clipboard2-pulse me-2"></i>
                    {appointment.motivo || "Consulta"}
                  </p>





                  <div className="appointment-info">


                    <span>
                      <i className="bi bi-calendar"></i>
                      {appointment.data}
                    </span>




                    <span>
                      <i className="bi bi-clock"></i>
                      {appointment.hora}
                    </span>



                  </div>



                </div>



              </div>








              <div className="appointment-right">


                <span className={`status-badge ${getBadgeClass(appointment.estado)}`}>

                  {appointment.estado}

                </span>






                <div className="appointment-actions">



                  <button

                    className="details-btn"

                    onClick={() => showDetails(appointment)}

                  >

                    Ver detalhes

                  </button>







                  {
                    appointment.estado === "Pendente" &&

                    <>


                      <button

                        className="confirm-btn"

                        onClick={() =>
                          updateStatus(
                            appointment.id_appointment,
                            "Confirmada"
                          )
                        }

                      >

                        Aceitar

                      </button>





                      <button

                        className="cancel-btn"

                        onClick={() =>
                          updateStatus(
                            appointment.id_appointment,
                            "Cancelada"
                          )
                        }

                      >

                        Rejeitar

                      </button>


                    </>

                  }







                  {
                    appointment.estado === "Confirmada" &&


                    <button

                      className="complete-btn"

                      onClick={() => handleFinalizeAppointment(appointment)}

                    >

                      Marcar como concluída

                    </button>

                  }





                </div>


              </div>



            </div>


          ))

        }





      </div>



    </main>

  );


};



export default VetAppointments;
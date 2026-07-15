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

const dateFilterOptions = [
  { value: "all", label: "Todas as datas" },
  { value: "today", label: "Hoje" },
  { value: "next7", label: "Próximos 7 dias" },
  { value: "upcoming", label: "Próximas" },
  { value: "past", label: "Passadas" }
];

const rowsPerPageOptions = [5, 10, 20, 50];

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
  const [dateFilter, setDateFilter] = useState(dateFilterOptions[0]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/api\/?$/i, "");

  const getPetImageUrl = (fotografia) => {
    if (!fotografia) return null;
    if (String(fotografia).startsWith("http")) return fotografia;
    if (String(fotografia).startsWith("/")) return `${API_BASE}${fotografia}`;
    return `${API_BASE}/uploads/${fotografia}`;
  };

  const getDateKey = (value) => {
    if (!value) return "";
    return String(value).slice(0, 10);
  };

  const parseDateKey = (value) => {
    const dateKey = getDateKey(value);

    if (!dateKey) return null;

    const [year, month, day] = dateKey.split("-").map(Number);

    if (!year || !month || !day) return null;

    return new Date(year, month - 1, day);
  };

  const getTodayKey = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };



  useEffect(() => {

    loadAppointments();

  }, []);

  useEffect(() => {

    setCurrentPage(1);

  }, [search, selectedDate, status, dateFilter, rowsPerPage]);



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
      customClass: swalCustomClass,
      returnFocus: false,
      didClose: () => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }

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



    const appointmentDate = getDateKey(appointment.data);
    const appointmentDateObject = parseDateKey(appointmentDate);
    const todayKey = getTodayKey();
    const todayDate = parseDateKey(todayKey);
    const nextWeekDate = todayDate ? new Date(todayDate) : null;

    if (nextWeekDate) {
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    }

    let matchesDate = true;

    if (selectedDate) {
      matchesDate = appointmentDate === selectedDate;
    } else {
      switch (dateFilter.value) {
        case "today":
          matchesDate = appointmentDate === todayKey;
          break;
        case "next7":
          matchesDate = Boolean(
            appointmentDateObject &&
            todayDate &&
            nextWeekDate &&
            appointmentDateObject >= todayDate &&
            appointmentDateObject <= nextWeekDate
          );
          break;
        case "upcoming":
          matchesDate = Boolean(appointmentDateObject && todayDate && appointmentDateObject >= todayDate);
          break;
        case "past":
          matchesDate = Boolean(appointmentDateObject && todayDate && appointmentDateObject < todayDate);
          break;
        default:
          matchesDate = true;
      }
    }



    return matchesSearch && matchesStatus && matchesDate;


  });

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * rowsPerPage;
  const paginatedAppointments = filteredAppointments.slice(pageStart, pageStart + rowsPerPage);
  const visibleStart = filteredAppointments.length === 0 ? 0 : pageStart + 1;
  const visibleEnd = Math.min(pageStart + rowsPerPage, filteredAppointments.length);

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

          <h1>Consultas</h1>

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

      <div className="appointments-secondary-filters">

        <div className="appointments-results-summary">
          {filteredAppointments.length === 0
            ? "Sem consultas para os filtros aplicados"
            : `A mostrar ${visibleStart}-${visibleEnd} de ${filteredAppointments.length} consultas`}
        </div>

        <div className="appointments-secondary-actions">

          <label className="appointments-inline-select">
            <span>Período</span>
            <Select
              className="appointments-select appointments-select--compact"
              classNamePrefix="appointments-select"
              options={dateFilterOptions}
              value={dateFilter}
              onChange={setDateFilter}
              isSearchable={false}
              isDisabled={Boolean(selectedDate)}
            />
          </label>

          <label className="appointments-inline-select appointments-inline-select--rows">
            <span>Mostrar</span>
            <select
              className="appointments-native-select"
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              aria-label="Quantidade de consultas por página"
            >
              {rowsPerPageOptions.map((value) => (
                <option key={value} value={value}>
                  {value} por página
                </option>
              ))}
            </select>
          </label>

        </div>

      </div>








     <div className="appointments-table-wrapper">

  {loading ? (

    <p className="appointments-feedback">A carregar consultas...</p>

  ) : filteredAppointments.length === 0 ? (

    <p className="appointments-feedback">Não existem consultas para os filtros selecionados.</p>

  ) : (

    <table className="appointments-table">

      <thead>

        <tr>

          <th>Animal</th>

          <th>Dono</th>

          <th>Motivo</th>

          <th>Data</th>

          <th>Hora</th>

          <th>Estado</th>

          <th>Ações</th>

        </tr>

      </thead>

      <tbody>

        {paginatedAppointments.map((appointment) => (

          <tr key={appointment.id_appointment}>

            <td data-label="Animal">

              <div className="pet-cell">

                {appointment.petPhoto ? (

                  <img
                    src={appointment.petPhoto}
                    alt={appointment.petName}
                  />

                ) : (

                  <i className="bi bi-heart-pulse"></i>

                )}

                <span>{appointment.petName}</span>

              </div>

            </td>

            <td data-label="Dono">{appointment.ownerName}</td>

            <td data-label="Motivo">{appointment.motivo}</td>

            <td data-label="Data">{appointment.data}</td>

            <td data-label="Hora">{appointment.hora?.slice(0,5)}</td>

            <td data-label="Estado">

              <span className={`status-badge ${getBadgeClass(appointment.estado)}`}>
                {appointment.estado}
              </span>

            </td>

            <td data-label="Ações">

              <div className="table-actions">

                <button
                  className="details-btn"
                  onClick={() => showDetails(appointment)}
                >
                  <i className="bi bi-eye"></i>
                </button>

                {appointment.estado === "Pendente" && (

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
                      <i className="bi bi-check-lg"></i>
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
                      <i className="bi bi-x-lg"></i>
                    </button>

                  </>

                )}

                {appointment.estado === "Confirmada" && (

                  <button
                    className="complete-btn"
                    onClick={() => handleFinalizeAppointment(appointment)}
                  >
                    <i className="bi bi-clipboard-check"></i>
                  </button>

                )}

              </div>

            </td>

          </tr>

        ))}

      </tbody>

    </table>

  )}

</div>

      {!loading && filteredAppointments.length > 0 && totalPages > 1 && (
        <div className="appointments-pagination">

          <button
            type="button"
            className="pagination-btn"
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            disabled={safeCurrentPage === 1}
          >
            Anterior
          </button>

          <span className="pagination-info">
            Página {safeCurrentPage} de {totalPages}
          </span>

          <button
            type="button"
            className="pagination-btn"
            onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
            disabled={safeCurrentPage === totalPages}
          >
            Seguinte
          </button>

        </div>
      )}



    </main>

  );


};



export default VetAppointments;
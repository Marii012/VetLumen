import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import api from "../../services/api";
import "./Appointments.css";

const options = [
  { value: "all", label: "Todos os estados" },
  { value: "Pendente", label: "Pendente" },
  { value: "Confirmada", label: "Confirmada" },
  { value: "Concluída", label: "Concluída" },
  { value: "Cancelada", label: "Cancelada" },
];

const swalCustomClass = {
  popup: "vetlumen-swal-popup",
  title: "vetlumen-swal-title",
  htmlContainer: "vetlumen-swal-text",
  confirmButton: "vetlumen-swal-button",
  cancelButton: "vetlumen-swal-button"
};

const formatDate = (value) => {
  if (!value) return "Não disponível";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("pt-PT");
};

const formatTime = (value) => {
  if (!value) return "Não disponível";
  if (typeof value === "string") {
    return value.includes(":") ? value.slice(0, 5) : value;
  }
  return value;
};

const Appointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(options[0]);
  const [selectedDate, setSelectedDate] = useState("");

  const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/api\/?$/i, "");

  const getPetImageUrl = (fotografia) => {
    if (!fotografia) return null;
    if (fotografia.startsWith('http')) return fotografia;
    if (fotografia.startsWith('/')) return `${API_BASE}${fotografia}`;
    return `${API_BASE}/uploads/${fotografia}`;
  };

  useEffect(() => {

    const loadAppointments = async () => {
      try {
        setLoading(true);
        const response = await api.get("/appointments");
        const appointmentsData = response.data || [];

        const enrichedAppointments = await Promise.all(
          appointmentsData.map(async (appointment) => {
            const [petResult, serviceResult, vetResult] = await Promise.allSettled([
              appointment.id_pet ? api.get(`/pets/${appointment.id_pet}`) : Promise.resolve({ status: "fulfilled", value: { data: null } }),
              appointment.id_service ? api.get(`/services/${appointment.id_service}`) : Promise.resolve({ status: "fulfilled", value: { data: null } }),
              appointment.id_veterinario ? api.get(`/users/${appointment.id_veterinario}`) : Promise.resolve({ status: "fulfilled", value: { data: null } })
            ]);

            const pet = petResult.status === "fulfilled" ? petResult.value.data : null;
            const service = serviceResult.status === "fulfilled" ? serviceResult.value.data : null;
            const vet = vetResult.status === "fulfilled" ? vetResult.value.data : null;

            const vetName = vet ? `${vet.first_name || ""} ${vet.last_name || ""}`.trim() : "Por atribuir";

            return {
              ...appointment,
              petName: pet?.nome || "Animal não identificado",
              petPhoto: pet?.fotografia || null,
              serviceName: service?.nome || appointment.motivo || "Serviço não disponível",
              vetName,
              price: appointment.preco_final ? `${Number(appointment.preco_final).toFixed(2)}€` : null,
              observations: appointment.observacoes || null,
              cancelReason: appointment.motivo_cancelamento || null,
              status: appointment.estado || "Pendente"
            };
          })
        );

        setAppointments(enrichedAppointments);
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Não foi possível carregar as consultas.");
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, []);

  const filteredAppointments = appointments.filter((appointment) => {
    const searchValue = search.toLowerCase();
    const matchesSearch =
      appointment.petName?.toLowerCase().includes(searchValue) ||
      appointment.serviceName?.toLowerCase().includes(searchValue) ||
      appointment.motivo?.toLowerCase().includes(searchValue);

    const matchesStatus = status.value === "all" || appointment.status === status.value;

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

  const handleViewDetails = async (appointment) => {
    await Swal.fire({
      title: "Detalhes da consulta",
      html: `
        <div class="appointment-swal-details">
          <p><strong>Animal:</strong> ${appointment.petName}</p>
          <p><strong>Serviço:</strong> ${appointment.serviceName}</p>
          <p><strong>Data:</strong> ${formatDate(appointment.data)}</p>
          <p><strong>Hora:</strong> ${formatTime(appointment.hora)}</p>
          <p><strong>Veterinário:</strong> ${appointment.vetName}</p>
          <p><strong>Estado:</strong> ${appointment.status}</p>
          <p><strong>Preço:</strong> ${appointment.price || "Não disponível"}</p>
          <p><strong>Observações:</strong> ${appointment.observations || "Sem observações"}</p>
        </div>
      `,
      confirmButtonText: "Fechar",
      customClass: swalCustomClass
    });
  };

  const handleCancelAppointment = async (appointment) => {
    const result = await Swal.fire({
      title: "Cancelar consulta",
      text: `Tem a certeza que quer cancelar a consulta de ${appointment.petName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, cancelar",
      cancelButtonText: "Não",
      customClass: swalCustomClass
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await api.put(`/appointments/${appointment.id_appointment}`, {
        data: appointment.data || null,
        hora: appointment.hora || null,
        motivo: appointment.motivo || appointment.serviceName || "Consulta",
        estado: "Cancelada",
        observacoes: appointment.observations || null,
        motivo_cancelamento: "Cancelada pelo utilizador"
      });

      Swal.fire({
        title: "Consulta cancelada",
        text: "A consulta foi atualizada com sucesso.",
        icon: "success",
        customClass: swalCustomClass
      });

      const response = await api.get("/appointments");
      const appointmentsData = response.data || [];
      const enrichedAppointments = await Promise.all(
        appointmentsData.map(async (item) => {
          const [petResult, serviceResult, vetResult] = await Promise.allSettled([
            item.id_pet ? api.get(`/pets/${item.id_pet}`) : Promise.resolve({ status: "fulfilled", value: { data: null } }),
            item.id_service ? api.get(`/services/${item.id_service}`) : Promise.resolve({ status: "fulfilled", value: { data: null } }),
            item.id_veterinario ? api.get(`/users/${item.id_veterinario}`) : Promise.resolve({ status: "fulfilled", value: { data: null } })
          ]);

          const pet = petResult.status === "fulfilled" ? petResult.value.data : null;
          const service = serviceResult.status === "fulfilled" ? serviceResult.value.data : null;
          const vet = vetResult.status === "fulfilled" ? vetResult.value.data : null;
          const vetName = vet ? `${vet.first_name || ""} ${vet.last_name || ""}`.trim() : "Por atribuir";

          return {
            ...item,
            petName: pet?.nome || "Animal não identificado",
            petPhoto: pet?.fotografia || null,
            serviceName: service?.nome || item.motivo || "Serviço não disponível",
            vetName,
            price: item.preco_final ? `${Number(item.preco_final).toFixed(2)}€` : null,
            observations: item.observacoes || null,
            cancelReason: item.motivo_cancelamento || null,
            status: item.estado || "Pendente"
          };
        })
      );

      setAppointments(enrichedAppointments);
    } catch (err) {
      Swal.fire({
        title: "Erro",
        text: "Não foi possível atualizar a consulta.",
        icon: "error",
        customClass: swalCustomClass
      });
    }
  };

  return (
    <main className="appointments-container">
      <div className="appointments-header">
        <div>
          <h1>Consultas</h1>
          <p>Consulta, acompanha e gere todas as consultas dos teus animais.</p>
        </div>

        <button className="dashboard-btn" onClick={() => navigate("/client/appointments/book")}>
          <i className="bi bi-calendar-plus"></i>
          Marcar Consulta
        </button>
      </div>

      <div className="appointments-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-calendar2-week"></i>
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
            <h3>{appointments.filter((appointment) => appointment.status === "Pendente").length}</h3>
            <p>Pendentes</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-check-circle"></i>
          </div>

          <div>
            <h3>{appointments.filter((appointment) => appointment.status === "Confirmada").length}</h3>
            <p>Confirmadas</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-clipboard2-check"></i>
          </div>

          <div>
            <h3>{appointments.filter((appointment) => appointment.status === "Concluída").length}</h3>
            <p>Concluídas</p>
          </div>
        </div>
      </div>

      <div className="appointments-filters">
        <div className="search-box">
          <i className="bi bi-search"></i>

          <input
            type="text"
            placeholder="Pesquisar consulta..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="date-filter-box">
          <i className="bi bi-calendar3"></i>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
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
        {loading && <p className="appointments-empty">A carregar consultas...</p>}

        {error && <p className="appointments-empty">{error}</p>}

        {!loading && !error && filteredAppointments.length === 0 && (
          <p className="appointments-empty">Nenhuma consulta encontrada.</p>
        )}

        {!loading && !error && filteredAppointments.map((appointment) => (
          <div className="appointment-item" key={appointment.id_appointment}>
            <div className="appointment-left">
              <div className="appointment-avatar">
                {appointment.petPhoto ? (
                  <img
                    src={getPetImageUrl(appointment.petPhoto)}
                    alt={appointment.petName}
                  />
                ) : (
                  <i className="bi bi-heart-pulse"></i>
                )}
              </div>

              <div>
                <h3>{appointment.petName}</h3>
                <p>{appointment.serviceName}</p>

                <div className="appointment-info">
                  <span>
                    <i className="bi bi-calendar-event"></i>
                    {formatDate(appointment.data)}
                  </span>

                  <span>
                    <i className="bi bi-clock"></i>
                    {formatTime(appointment.hora)}
                  </span>

                  <span>
                    <i className="bi bi-person-badge"></i>
                    {appointment.vetName}
                  </span>

                  {appointment.price && (
                    <span className="appointment-price">
                      {appointment.price}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="appointment-right">
              <span className={`status-badge ${getBadgeClass(appointment.status)}`}>
                {appointment.status}
              </span>

              <div className="appointment-actions">
                <button className="details-btn" onClick={() => handleViewDetails(appointment)}>Ver detalhes</button>

                {appointment.status === "Pendente" && (
                  <button className="cancel-btn" onClick={() => handleCancelAppointment(appointment)}>
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default Appointments;
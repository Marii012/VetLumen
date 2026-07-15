import { useCallback, useEffect, useState } from "react";
import Select from "react-select";
import Swal from "sweetalert2";
import api from "../../services/api";
import "./Invoices.css";

const options = [
  { value: "all", label: "Todos os estados" },
  { value: "Pago", label: "Pago" },
  { value: "Pendente", label: "Pendente" },
  { value: "Cancelado", label: "Cancelado" }
];

const swalCustomClass = {
  popup: "vetlumen-swal-popup",
  title: "vetlumen-swal-title",
  htmlContainer: "vetlumen-swal-text",
  confirmButton: "vetlumen-swal-button"
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

const isCompletedAppointment = (status) => {
  const normalized = String(status || "").trim().toLowerCase();
  return normalized === "concluída" || normalized === "concluida" || normalized === "completed";
};

const formatEuro = (value) => {
  if (value == null || value === "") return "0.00€";
  const num = Number(value);
  if (Number.isNaN(num)) return "0.00€";
  return `${num.toFixed(2)}€`;
};

const normalizeInvoice = (invoice, appointment, pet, service) => {
  const rawStatus = String(invoice.estado_pagamento || "").trim().toLowerCase();
  let uiStatus = "Pendente";

  if (["pago", "paid", "finalizado", "finalizada"].includes(rawStatus)) {
    uiStatus = "Pago";
  } else if (["cancelado", "cancelada", "rejeitado", "rejeitada"].includes(rawStatus)) {
    uiStatus = "Cancelado";
  }

  const total = formatEuro(invoice.total_liquido);

  const items = [];
  if (invoice.total_bruto != null) {
    items.push(`Bruto: ${Number(invoice.total_bruto).toFixed(2)}€`);
  }
  if (invoice.total_impostos != null) {
    items.push(`Impostos: ${Number(invoice.total_impostos).toFixed(2)}€`);
  }

  return {
    id_invoice: invoice.id_invoice,
    number: invoice.num_fatura || `FAT-${invoice.id_invoice}`,
    date: formatDate(invoice.data_emissao),
    total,
    status: uiStatus,
    items,
    consultationName: service?.nome || appointment?.motivo || "Consulta",
    petName: pet?.nome || "Animal não identificado",
    appointmentDate: appointment ? formatDate(appointment.data) : "Não disponível",
    appointmentTime: appointment ? formatTime(appointment.hora) : "Não disponível",
    appointmentStatus: appointment?.estado
      ? (isCompletedAppointment(appointment.estado) ? "Concluída" : appointment.estado)
      : "Não disponível"
  };
};

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(options[0]);

  const loadInvoices = useCallback(async (selectedStatus = "all") => {
    try {
      setLoading(true);

      let loggedUserId = null;
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          loggedUserId = parsedUser?.id_user ? Number(parsedUser.id_user) : null;
        } catch (parseError) {
          console.warn("Não foi possível obter o utilizador autenticado para filtrar faturas.", parseError);
        }
      }

      const [invoicesResponse, appointmentsResponse] = await Promise.all([
        api.get("/invoices", {
          params: {
            status: selectedStatus === "all" ? "all" : selectedStatus
          }
        }),
        api.get("/appointments")
      ]);

      const invoicesData = Array.isArray(invoicesResponse.data) ? invoicesResponse.data : [];
      const invoicesByUser = loggedUserId
        ? invoicesData.filter((invoice) => Number(invoice.id_user) === Number(loggedUserId))
        : invoicesData;
      const appointmentsData = Array.isArray(appointmentsResponse.data) ? appointmentsResponse.data : [];

      const appointmentsMap = new Map(
        appointmentsData.map((appointment) => [appointment.id_appointment, appointment])
      );

      const petIds = [
        ...new Set(
          invoicesByUser
            .map((invoice) => appointmentsMap.get(invoice.id_appointment)?.id_pet)
            .filter(Boolean)
        )
      ];

      const serviceIds = [
        ...new Set(
          invoicesByUser
            .map((invoice) => appointmentsMap.get(invoice.id_appointment)?.id_service)
            .filter(Boolean)
        )
      ];

      const [petsResults, servicesResults] = await Promise.all([
        Promise.allSettled(petIds.map((id) => api.get(`/pets/${id}`))),
        Promise.allSettled(serviceIds.map((id) => api.get(`/services/${id}`)))
      ]);

      const petsMap = new Map();
      petsResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          petsMap.set(petIds[index], result.value.data);
        }
      });

      const servicesMap = new Map();
      servicesResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          servicesMap.set(serviceIds[index], result.value.data);
        }
      });

      const normalizedInvoices = invoicesByUser
        .map((invoice) => {
          const appointment = appointmentsMap.get(invoice.id_appointment);
          const pet = appointment ? petsMap.get(appointment.id_pet) : null;
          const service = appointment ? servicesMap.get(appointment.id_service) : null;
          return normalizeInvoice(invoice, appointment, pet, service);
        })
        .filter(Boolean);

      setInvoices(normalizedInvoices);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Não foi possível carregar as faturas."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // This page loads data once on mount; subsequent reloads happen on status selection.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredInvoices = invoices.filter((invoice) => {
    const searchText = `${invoice.number || ""} ${invoice.status || ""} ${invoice.consultationName || ""} ${invoice.petName || ""}`.toLowerCase();
    return searchText.includes(search.toLowerCase());
  });

  const badgeClass = (status) => {
    switch (status) {
      case "Pago":
        return "paid";
      case "Pendente":
        return "pending";
      case "Cancelado":
        return "cancelled";
      default:
        return "";
    }
  };

  const handleViewDetails = (invoice) => {
    Swal.fire({
      title: invoice.number,
      html: `
        <div class="invoice-details-modal">
          <p><strong>Consulta:</strong> ${invoice.consultationName}</p>
          <p><strong>Animal:</strong> ${invoice.petName}</p>
          <p><strong>Data da consulta:</strong> ${invoice.appointmentDate}</p>
          <p><strong>Hora da consulta:</strong> ${invoice.appointmentTime}</p>
          <p><strong>Estado da consulta:</strong> ${invoice.appointmentStatus}</p>
          <p><strong>Estado:</strong> ${invoice.status}</p>
          <p><strong>Data de emissão:</strong> ${invoice.date}</p>
          <p><strong>Total:</strong> ${invoice.total}</p>
          <div class="invoice-details-items">
            ${(invoice.items || []).map((item) => `<span>${item}</span>`).join(" ")}
          </div>
        </div>
      `,
      icon: "info",
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

  return (
    <main className="invoices-container">
      <div className="invoices-header">
        <div>
          <h1>Faturas</h1>
          <p>Consulte as suas faturas e o estado das consultas associadas.</p>
        </div>

        <div className="invoices-filters">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Pesquisar por número ou estado"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select
            options={options}
            value={status}
            onChange={(option) => {
              const selectedOption = option || options[0];
              setStatus(selectedOption);
              loadInvoices(selectedOption.value);
            }}
            className="invoice-select"
            classNamePrefix="invoice-select"
            isSearchable={false}
          />
        </div>
      </div>

      <div className="invoice-list">
        {loading && <p>A carregar faturas...</p>}
        {error && <p>{error}</p>}

        {!loading && !error && filteredInvoices.map((invoice) => (
          <div className="invoice-card" key={invoice.id_invoice}>
            <div className="invoice-icon">
              <i className="bi bi-file-earmark-text"></i>
            </div>

            <div className="invoice-info">
              <h3>{invoice.number}</h3>

              <p>
                <i className="bi bi-clipboard2-pulse me-3 fs-5"></i>
                {invoice.consultationName}
              </p>

              <p>
                <i className="bi bi-heart me-3 fs-5"></i>
                {invoice.petName}
              </p>

              <p>
                <i className="bi bi-calendar-check me-3 fs-5"></i>
                {invoice.appointmentDate} • {invoice.appointmentTime}
              </p>

              <p>
                <i className="bi bi-calendar me-3 fs-5"></i>
                {invoice.date}
              </p>

              <div className="invoice-items">
                {(invoice.items || []).map((item, index) => (
                  <span key={index}>{item}</span>
                ))}
              </div>

            </div>

            <div className="invoice-right">
              <strong>{invoice.total}</strong>

              <span className={`invoice-status ${badgeClass(invoice.status)}`}>
                {invoice.status}
              </span>

              <button className="details-btn" onClick={() => handleViewDetails(invoice)}>
                Ver detalhes
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default Invoices;
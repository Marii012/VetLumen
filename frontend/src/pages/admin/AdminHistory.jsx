import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./AdminHistory.css";

const getRoleName = (idRole) => {
  switch (Number(idRole)) {
    case 1:
      return "Cliente";
    case 2:
      return "Veterinário";
    case 3:
      return "Administrador";
    default:
      return "Utilizador";
  }
};

const parseDateValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseAppointmentDateTime = (dateValue, timeValue) => {
  if (!dateValue) return null;

  const datePart = String(dateValue).slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return null;

  const timePart = String(timeValue || "00:00:00").slice(0, 8);
  const [hour = 0, minute = 0, second = 0] = timePart.split(":").map((value) => Number(value) || 0);
  const date = new Date(year, month - 1, day, hour, minute, second);

  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeInvoiceStatus = (status) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (["pago", "paid", "finalizado", "finalizada"].includes(normalized)) return "Pago";
  if (["cancelado", "cancelada", "rejeitado", "rejeitada"].includes(normalized)) return "Cancelado";
  return "Pendente";
};

const AdminHistory = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    const loadHistoryData = async () => {
      try {
        setLoading(true);
        setError("");

        const [usersResponse, petsResponse, appointmentsResponse, invoicesResponse] = await Promise.all([
          api.get("/users"),
          api.get("/pets"),
          api.get("/appointments"),
          api.get("/invoices", { params: { status: "all" } })
        ]);

        setUsers(usersResponse.data || []);
        setPets(petsResponse.data || []);
        setAppointments(appointmentsResponse.data || []);
        setInvoices(invoicesResponse.data || []);
      } catch (err) {
        setError("Não foi possível carregar o histórico de atividade.");
      } finally {
        setLoading(false);
      }
    };

    loadHistoryData();
  }, []);

  const activities = useMemo(() => {
    const usersMap = new Map(users.map((user) => [Number(user.id_user), user]));
    const petsMap = new Map(pets.map((pet) => [Number(pet.id_pet), pet]));

    const userActivities = users
      .map((user) => {
        const createdAt = parseDateValue(user.created_at);
        if (!createdAt) return null;

        const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || "Utilizador";

        return {
          id: `user-${user.id_user}`,
          type: "utilizadores",
          icon: "bi bi-person-plus",
          title: "Novo utilizador registado",
          description: `${fullName} • ${getRoleName(user.id_role)}`,
          date: createdAt
        };
      })
      .filter(Boolean);

    const appointmentActivities = appointments
      .map((appointment) => {
        const pet = petsMap.get(Number(appointment.id_pet));
        const veterinarian = usersMap.get(Number(appointment.id_veterinario));
        const fallbackDate = parseAppointmentDateTime(appointment.data, appointment.hora);
        const createdAt = parseDateValue(appointment.data_marcacao) || fallbackDate;
        if (!createdAt) return null;

        const petName = pet?.nome || "Animal não identificado";
        const vetName = veterinarian
          ? `${veterinarian.first_name || ""} ${veterinarian.last_name || ""}`.trim() || veterinarian.email
          : "Veterinário não identificado";

        return {
          id: `appointment-${appointment.id_appointment}`,
          type: "consultas",
          icon: "bi bi-calendar-plus",
          title: "Consulta registada",
          description: `${petName} • Vet: ${vetName} • ${appointment.estado || "Pendente"}`,
          date: createdAt
        };
      })
      .filter(Boolean);

    const invoiceActivities = invoices
      .map((invoice) => {
        const issuedAt = parseDateValue(invoice.data_emissao);
        if (!issuedAt) return null;

        return {
          id: `invoice-${invoice.id_invoice}`,
          type: "faturas",
          icon: "bi bi-receipt",
          title: "Fatura emitida",
          description: `${invoice.num_fatura || `FAT-${invoice.id_invoice}`} • ${Number(invoice.total_liquido || 0).toFixed(2)}€ • ${normalizeInvoiceStatus(invoice.estado_pagamento)}`,
          date: issuedAt
        };
      })
      .filter(Boolean);

    return [...userActivities, ...appointmentActivities, ...invoiceActivities].sort((a, b) => b.date - a.date);
  }, [appointments, invoices, pets, users]);

  const filteredActivities = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    return activities.filter((activity) => {
      if (typeFilter !== "all" && activity.type !== typeFilter) {
        return false;
      }

      if (dateFilter === "today") {
        return activity.date >= startOfToday;
      }

      if (dateFilter === "last7") {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        return activity.date >= sevenDaysAgo;
      }

      if (dateFilter === "lastMonth") {
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(now.getMonth() - 1);
        return activity.date >= oneMonthAgo;
      }

      if (dateFilter === "custom") {
        if (!customStartDate && !customEndDate) return true;

        const start = customStartDate ? new Date(`${customStartDate}T00:00:00`) : null;
        const end = customEndDate ? new Date(`${customEndDate}T23:59:59`) : null;

        if (start && activity.date < start) return false;
        if (end && activity.date > end) return false;
      }

      return true;
    });
  }, [activities, customEndDate, customStartDate, dateFilter, typeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, dateFilter, customStartDate, customEndDate, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedActivities = filteredActivities.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <main className="admin-history dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Histórico de Atividade</h1>
          <p>Registos recentes de utilizadores, consultas e faturação.</p>
        </div>

        <button className="pending-view-btn" onClick={() => navigate("/admin/dashboard")}>
          Voltar ao painel
        </button>
      </header>

      <section className="dashboard-card">
        <div className="card-title">
          <h3>Atividade Completa</h3>
        </div>

        <div className="history-filters">
          <div className="chart-controls-inline">
            <label>Tipo:</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">Todas</option>
              <option value="consultas">Consultas</option>
              <option value="faturas">Faturas</option>
              <option value="utilizadores">Utilizadores</option>
            </select>
          </div>

          <div className="chart-controls-inline">
            <label>Data:</label>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option value="today">Hoje</option>
              <option value="last7">Últimos 7 dias</option>
              <option value="lastMonth">Último mês</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {dateFilter === "custom" && (
            <>
              <input
                className="history-date-input"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                aria-label="Data inicial"
              />
              <input
                className="history-date-input"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                aria-label="Data final"
              />
            </>
          )}

          <div className="chart-controls-inline">
            <label>Por página:</label>
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="activity">
            <i className="bi bi-hourglass-split"></i>
            <div>
              <strong>A carregar...</strong>
              <p>A obter eventos recentes da clínica.</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="activity">
            <i className="bi bi-exclamation-circle"></i>
            <div>
              <strong>Erro</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && filteredActivities.length === 0 && (
          <div className="activity">
            <i className="bi bi-activity"></i>
            <div>
              <strong>Sem atividade recente</strong>
              <p>Ainda não existem eventos para apresentar.</p>
            </div>
          </div>
        )}

        {!loading && !error && paginatedActivities.map((activity) => (
          <div className="activity activity-timeline" key={activity.id}>
            <i className={activity.icon}></i>
            <div className="activity-body">
              <strong>{activity.title}</strong>
              <p>{activity.description}</p>
            </div>
            <span className="activity-time">{activity.date.toLocaleString("pt-PT")}</span>
          </div>
        ))}

        {!loading && !error && filteredActivities.length > 0 && (
          <div className="history-pagination">
            <button
              className="pending-view-btn"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage === 1}
            >
              Anterior
            </button>
            <span>
              Página {safePage} de {totalPages} • {filteredActivities.length} registos
            </span>
            <button
              className="pending-view-btn"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safePage === totalPages}
            >
              Seguinte
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

export default AdminHistory;

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./DashboardAdmin.css";

const DashboardAdmin = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const todayDisplay = `Hoje, ${new Date().toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long"
  })}`;

  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

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

  useEffect(() => {
    const loadDashboardData = async () => {
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
        setError("Não foi possível carregar o dashboard do administrador.");
        setUsers([]);
        setPets([]);
        setAppointments([]);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const dashboardData = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const usersMap = new Map(users.map((user) => [Number(user.id_user), user]));
    const petsMap = new Map(pets.map((pet) => [Number(pet.id_pet), pet]));

    const parsedAppointments = appointments
      .map((appointment) => {
        const pet = petsMap.get(Number(appointment.id_pet));
        const veterinarian = usersMap.get(Number(appointment.id_veterinario));
        const dateTime = parseAppointmentDateTime(appointment.data, appointment.hora);

        return {
          ...appointment,
          petName: pet?.nome || "Animal não identificado",
          vetName: veterinarian
            ? `${veterinarian.first_name || ""} ${veterinarian.last_name || ""}`.trim() || veterinarian.email
            : "Veterinário não identificado",
          dateTime,
          timeLabel: String(appointment.hora || "00:00").slice(0, 5)
        };
      })
      .sort((a, b) => {
        if (!a.dateTime && !b.dateTime) return 0;
        if (!a.dateTime) return 1;
        if (!b.dateTime) return -1;
        return a.dateTime - b.dateTime;
      });

    const todayAppointments = parsedAppointments.filter(
      (item) => item.dateTime && item.dateTime >= startOfToday && item.dateTime <= endOfToday
    );

    const pendingAppointments = parsedAppointments.filter((item) => item.estado === "Pendente");

    const upcomingAppointments = parsedAppointments
      .filter((item) => item.dateTime && item.dateTime >= now && item.estado !== "Cancelada")
      .slice(0, 5);

    const monthlyCountsRaw = new Array(12).fill(0);
    parsedAppointments.forEach((item) => {
      if (!item.dateTime) return;
      if (item.dateTime.getFullYear() !== Number(selectedYear)) return;
      monthlyCountsRaw[item.dateTime.getMonth()] += 1;
    });

    const max = Math.max(...monthlyCountsRaw, 1);
    const monthlyPercentages = monthlyCountsRaw.map((value) => Math.round((value / max) * 100));

    const totalUsers = users.length;
    const totalVeterinarians = users.filter((user) => Number(user.id_role) === 2).length;
    const totalPets = pets.length;

    const normalizedInvoices = invoices.map((invoice) => ({
      ...invoice,
      uiStatus: normalizeInvoiceStatus(invoice.estado_pagamento)
    }));

    const issuedInvoicesCount = normalizedInvoices.length;
    const pendingInvoicesCount = normalizedInvoices.filter((invoice) => invoice.uiStatus === "Pendente").length;

    const totalBilled = normalizedInvoices
      .filter((invoice) => invoice.uiStatus === "Pago")
      .reduce((sum, invoice) => sum + Number(invoice.total_liquido || 0), 0);

    const userActivities = users
      .map((user) => {
        const createdAt = parseDateValue(user.created_at);
        if (!createdAt) return null;

        const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || "Utilizador";

        return {
          id: `user-${user.id_user}`,
          icon: "bi bi-person-plus",
          title: "Novo utilizador registado",
          description: `${fullName} • ${getRoleName(user.id_role)}`,
          date: createdAt
        };
      })
      .filter(Boolean);

    const appointmentActivities = parsedAppointments
      .map((appointment) => {
        const createdAt = parseDateValue(appointment.data_marcacao) || appointment.dateTime;
        if (!createdAt) return null;

        return {
          id: `appointment-${appointment.id_appointment}`,
          icon: "bi bi-calendar-plus",
          title: "Consulta registada",
          description: `${appointment.petName} • Vet: ${appointment.vetName} • ${appointment.estado}`,
          date: createdAt
        };
      })
      .filter(Boolean);

    const invoiceActivities = normalizedInvoices
      .map((invoice) => {
        const issuedAt = parseDateValue(invoice.data_emissao);
        if (!issuedAt) return null;

        return {
          id: `invoice-${invoice.id_invoice}`,
          icon: "bi bi-receipt",
          title: "Fatura emitida",
          description: `${invoice.num_fatura || `FAT-${invoice.id_invoice}`} • ${Number(invoice.total_liquido || 0).toFixed(2)}€ • ${invoice.uiStatus}`,
          date: issuedAt
        };
      })
      .filter(Boolean);

    const recentActivities = [...userActivities, ...appointmentActivities, ...invoiceActivities]
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);

    return {
      totalUsers,
      totalVeterinarians,
      totalPets,
      totalAppointments: parsedAppointments.length,
      todayAppointments,
      pendingAppointments,
      monthlyPercentages,
      upcomingAppointments,
      issuedInvoicesCount,
      pendingInvoicesCount,
      totalBilled,
      recentActivities
    };
  }, [appointments, invoices, pets, selectedYear, users]);

  const availableYears = useMemo(() => {
    const years = new Set();

    appointments.forEach((appointment) => {
      const dateTime = parseAppointmentDateTime(appointment.data, appointment.hora);
      if (dateTime) years.add(dateTime.getFullYear());
    });

    if (years.size === 0) {
      years.add(new Date().getFullYear());
    }

    return Array.from(years).sort((a, b) => b - a);
  }, [appointments]);

  useEffect(() => {
    if (!availableYears.includes(Number(selectedYear))) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  return (
    <div className="admin-dashboard">
    <main className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Painel do Administrador</h1>
          <p>Faça a gestão da clínica, acompanhe marcações, faturação, utilizadores e serviços.</p>
        </div>

        <div className="date-box">
          <span>{todayDisplay}</span>
        </div>
      </header>

      <section className="welcome-card">
        <div className="welcome-content">
          <h2>Visão geral da clínica</h2>
          <p>
            Acompanhe o estado atual da operação, consulte as próximas marcações e aceda rapidamente
            às áreas críticas da administração.
          </p>

          <button className="dashboard-btn" onClick={() => navigate("/admin/appointments")}> 
            <i className="bi bi-calendar-event"></i>
            Gerir Marcações
          </button>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-people-fill"></i>
          </div>
          <div>
            <h3>{loading ? "..." : dashboardData.totalUsers}</h3>
            <p>Utilizadores</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-person-badge-fill"></i>
          </div>
          <div>
            <h3>{loading ? "..." : dashboardData.totalVeterinarians}</h3>
            <p>Veterinários</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-heart-pulse"></i>
          </div>
          <div>
            <h3>{loading ? "..." : dashboardData.totalPets}</h3>
            <p>Animais</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-calendar2-check"></i>
          </div>
          <div>
            <h3>{loading ? "..." : dashboardData.totalAppointments}</h3>
            <p>Consultas</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div>
            <h3>{loading ? "..." : dashboardData.pendingAppointments.length}</h3>
            <p>Consultas Pendentes</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-receipt-cutoff"></i>
          </div>
          <div>
            <h3>{loading ? "..." : dashboardData.pendingInvoicesCount}</h3>
            <p>Faturas por Tratar</p>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-card">
          <div className="card-title">
            <h3>Consultas por mês</h3>
            <div className="chart-controls-inline">
              <label>Ano:</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="chart">
            {dashboardData.monthlyPercentages.map((value, index) => (
              <div className="bar" key={index}>
                <span style={{ height: `${value}%` }}></span>
                <small>{months[index]}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-card">
          <div className="card-title">
            <h3>Faturação</h3>
          </div>

          <div className="appointment-card">
            <div className="appointment-icon">
              <i className="bi bi-cash-coin"></i>
            </div>

            <div>
              <h4>{loading ? "..." : `${dashboardData.totalBilled.toFixed(2)}€`}</h4>
              <p>Total faturado (faturas pagas)</p>
              <span>{loading ? "..." : `${dashboardData.issuedInvoicesCount} faturas emitidas`}</span>
              <small>{loading ? "..." : `${dashboardData.pendingInvoicesCount} por tratar`}</small>
              <button className="pending-view-btn" onClick={() => navigate("/admin/invoices")}>Gerir Faturas</button>
            </div>
          </div>
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-card">
          <div className="card-title">
            <h3>Próximas Marcações</h3>
          </div>

          {!loading && dashboardData.upcomingAppointments.length === 0 && (
            <div className="activity">
              <i className="bi bi-calendar-x"></i>
              <div>
                <strong>Sem marcações futuras</strong>
                <p>Não existem consultas agendadas para os próximos dias.</p>
              </div>
            </div>
          )}

          {dashboardData.upcomingAppointments.map((item) => (
            <div className="activity" key={`upcoming-${item.id_appointment}`}>
              <i className="bi bi-calendar2-event"></i>

              <div>
                <strong>{item.petName}</strong>
                <p>
                  Vet: {item.vetName}
                  <br />
                  {item.dateTime?.toLocaleDateString("pt-PT") || "Data indisponível"} às {item.timeLabel} • {item.estado}
                </p>
              </div>
            </div>
          ))}
        </section>

        <section className="dashboard-card">
          <div className="card-title">
            <h3>Ações Rápidas</h3>
          </div>

          <div className="activity">
            <i className="bi bi-people"></i>
            <div>
              <strong>Gestão de Utilizadores</strong>
              <p>Administrar contas e permissões dos utilizadores da clínica.</p>
              <button className="pending-view-btn" onClick={() => navigate("/admin/users")}>Abrir Utilizadores</button>
            </div>
          </div>

          <div className="activity">
            <i className="bi bi-person-badge"></i>
            <div>
              <strong>Gestão de Veterinários</strong>
              <p>Ver e gerir equipa clínica e dados profissionais.</p>
              <button className="pending-view-btn" onClick={() => navigate("/admin/veterinarians")}>Abrir Veterinários</button>
            </div>
          </div>

          <div className="activity">
            <i className="bi bi-clipboard2-pulse"></i>
            <div>
              <strong>Serviços e Consultas</strong>
              <p>Atualizar catálogo de serviços e acompanhar marcações.</p>
              <button className="pending-view-btn" onClick={() => navigate("/admin/services")}>Abrir Serviços</button>
              <button className="pending-view-btn" onClick={() => navigate("/admin/appointments")}>Abrir Consultas</button>
            </div>
          </div>

          <div className="activity">
            <i className="bi bi-receipt"></i>
            <div>
              <strong>Faturação</strong>
              <p>Controlar emissão e estado de pagamento das faturas.</p>
              <button className="pending-view-btn" onClick={() => navigate("/admin/invoices")}>Abrir Faturação</button>
            </div>
          </div>
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-card" style={{ gridColumn: "1 / -1" }}>
          <div className="card-title">
            <h3>Atividade Recente</h3>
          </div>

          {!loading && dashboardData.recentActivities.length === 0 && (
            <div className="activity">
              <i className="bi bi-activity"></i>
              <div>
                <strong>Sem atividade recente</strong>
                <p>Ainda não existem eventos recentes para apresentar.</p>
              </div>
            </div>
          )}

          {dashboardData.recentActivities.map((activity) => (
            <div className="activity activity-timeline" key={activity.id}>
              <i className={activity.icon}></i>
              <div className="activity-body">
                <strong>{activity.title}</strong>
                <p>{activity.description}</p>
              </div>
              <span className="activity-time">{activity.date.toLocaleString("pt-PT")}</span>
            </div>
          ))}

          <button className="pending-view-btn" onClick={() => navigate("/admin/history")}>Ver histórico completo</button>
        </section>
      </div>

      {error && (
        <div className="dashboard-card" style={{ marginTop: 20 }}>
          <p>{error}</p>
        </div>
      )}
    </main>
    </div>
  );
};

export default DashboardAdmin;

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import Swal from "sweetalert2";
import api from "../../services/api";
import "./AdminContacts.css";

const rowsPerPageOptions = [10, 20, 50];
const statusOptions = [
  { value: "all", label: "Todos os estados" },
  { value: "Pendente", label: "Pendentes" },
  { value: "Respondido", label: "Respondidos" }
];
const pageSizeOptions = rowsPerPageOptions.map((value) => ({ value, label: `${value}` }));

const formatDate = (value) => {
  if (!value) return "Sem data";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem data";

  return date.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const getStatusClass = (status) => {
  const normalized = String(status || "Pendente").trim().toLowerCase();

  if (normalized === "respondido" || normalized === "resposta enviada") return "contact-badge answered";
  if (normalized === "em progresso" || normalized === "em análise") return "contact-badge in-progress";
  return "contact-badge pending";
};

const AdminContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(statusOptions[0]);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const [currentPage, setCurrentPage] = useState(1);

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/contacts");
      setContacts(response.data || []);
    } catch (loadError) {
      console.error("Erro ao carregar contactos:", loadError);
      setError("Não foi possível carregar os contactos recebidos.");
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, pageSize]);

  const filteredContacts = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return contacts.filter((contact) => {
      const contactText = `${contact.nome_tutor || ""} ${contact.email || ""} ${contact.telefone || ""} ${contact.mensagem || ""} ${contact.estado || ""}`.toLowerCase();
      const matchesSearch = !searchValue || contactText.includes(searchValue);
      const matchesStatus = statusFilter?.value === "all" || String(contact.estado || "Pendente").toLowerCase() === statusFilter?.value?.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [contacts, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / pageSize.value));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize.value;
  const paginatedContacts = filteredContacts.slice(pageStart, pageStart + pageSize.value);

  const stats = useMemo(() => ({
    total: contacts.length,
    pendentes: contacts.filter((contact) => String(contact.estado || "Pendente").trim().toLowerCase() !== "respondido").length,
    respondidos: contacts.filter((contact) => String(contact.estado || "Pendente").trim().toLowerCase() === "respondido").length
  }), [contacts]);

  const handleUpdateStatus = async (contact) => {
    const nextStatus = String(contact.estado || "Pendente").trim().toLowerCase() === "respondido" ? "Pendente" : "Respondido";

    const result = await Swal.fire({
      title: "Alterar estado do contacto?",
      text: `Pretende definir este contacto como ${nextStatus === "Respondido" ? "respondido" : "pendente"}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sim, alterar",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: "vetlumen-swal-popup",
        title: "vetlumen-swal-title",
        htmlContainer: "vetlumen-swal-text",
        confirmButton: "vetlumen-swal-button"
      }
    });

    if (!result.isConfirmed) return;

    try {
      await api.put(`/contacts/${contact.id_contact}`, { estado: nextStatus });
      await loadContacts();

      Swal.fire({
        title: "Estado atualizado!",
        text: "O estado do contacto foi alterado com sucesso.",
        icon: "success",
        customClass: {
          popup: "vetlumen-swal-popup",
          title: "vetlumen-swal-title",
          htmlContainer: "vetlumen-swal-text",
          confirmButton: "vetlumen-swal-button"
        }
      });
    } catch (updateError) {
      console.error("Erro ao alterar estado:", updateError);
      Swal.fire({
        title: "Erro",
        text: "Não foi possível alterar o estado do contacto.",
        icon: "error",
        customClass: {
          popup: "vetlumen-swal-popup",
          title: "vetlumen-swal-title",
          htmlContainer: "vetlumen-swal-text",
          confirmButton: "vetlumen-swal-button"
        }
      });
    }
  };

  const handleDeleteContact = async (contact) => {
    const result = await Swal.fire({
      title: "Eliminar contacto?",
      text: `Tem a certeza que pretende eliminar o contacto de ${contact.nome_tutor || "este utilizador"}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: "vetlumen-swal-popup",
        title: "vetlumen-swal-title",
        htmlContainer: "vetlumen-swal-text",
        confirmButton: "vetlumen-swal-button"
      }
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/contacts/${contact.id_contact}`);
      await loadContacts();

      Swal.fire({
        title: "Contacto eliminado!",
        text: "O contacto foi removido com sucesso.",
        icon: "success",
        customClass: {
          popup: "vetlumen-swal-popup",
          title: "vetlumen-swal-title",
          htmlContainer: "vetlumen-swal-text",
          confirmButton: "vetlumen-swal-button"
        }
      });
    } catch (deleteError) {
      console.error("Erro ao eliminar contacto:", deleteError);
      Swal.fire({
        title: "Erro",
        text: "Não foi possível eliminar o contacto.",
        icon: "error",
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
    <main className="admin-contacts dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Contactos recebidos</h1>
          <p>Mensagens enviadas através do formulário de contacto da página inicial.</p>
        </div>

        <button className="dashboard-btn" onClick={() => window.location.assign("/admin/dashboard")}>
          <i className="bi bi-arrow-left me-2"></i>
          Voltar ao painel
        </button>
      </header>

      <section className="stats-grid contacts-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-envelope-paper"></i>
          </div>
          <div>
            <h3>{stats.total}</h3>
            <p>Total de contactos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div>
            <h3>{stats.pendentes}</h3>
            <p>Pendentes</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-check2-circle"></i>
          </div>
          <div>
            <h3>{stats.respondidos}</h3>
            <p>Respondidos</p>
          </div>
        </div>
      </section>

      <section className="dashboard-card">
        <div className="contacts-card">
          <div className="card-title">
            <h3>Mensagens recebidas</h3>
          </div>

          <div className="contacts-filters">
            <label className="search-box">
              <i className="bi bi-search"></i>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar por nome, email ou mensagem"
              />
            </label>

            <label className="contacts-select-field">
              <span>Estado</span>
              <Select
                className="admin-contacts-select"
                classNamePrefix="admin-contacts-select"
                options={statusOptions}
                value={statusFilter}
                onChange={(option) => setStatusFilter(option || statusOptions[0])}
                isSearchable={false}
              />
            </label>

            <label className="contacts-select-field">
              <span>Por página</span>
              <Select
                className="admin-contacts-select admin-contacts-select--compact"
                classNamePrefix="admin-contacts-select"
                options={pageSizeOptions}
                value={pageSize}
                onChange={(option) => setPageSize(option || pageSizeOptions[0])}
                isSearchable={false}
              />
            </label>
          </div>

          {loading ? (
            <div className="contacts-empty-state">
              <i className="bi bi-arrow-clockwise"></i>
              <p>A carregar contactos...</p>
            </div>
          ) : error ? (
            <div className="contacts-empty-state">
              <i className="bi bi-exclamation-circle"></i>
              <p>{error}</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="contacts-empty-state">
              <i className="bi bi-envelope-open"></i>
              <p>Não foram encontrados contactos para os filtros aplicados.</p>
            </div>
          ) : (
            <div className="contacts-list">
              {paginatedContacts.map((contact) => (
                <article className="contact-card" key={contact.id_contact}>
                  <div className="contact-card-content">
                    <div className="contact-card-header">
                      <div>
                        <h4>{contact.nome_tutor || "Contacto sem nome"}</h4>
                        <p className="contact-meta">
                          <i className="bi bi-envelope me-2"></i>
                          {contact.email || "Sem email"}
                        </p>
                        <p className="contact-meta">
                          <i className="bi bi-telephone me-2"></i>
                          {contact.telefone || "Sem telefone"}
                        </p>
                      </div>

                      <span className={getStatusClass(contact.estado)}>{contact.estado || "Pendente"}</span>
                    </div>

                    <div className="contact-details">
                      <p className="contact-detail-row">
                        <span className="contact-label">Animal:</span>
                        {contact.nome_animal || "Não indicado"}
                      </p>
                      <p className="contact-detail-row">
                        <span className="contact-label">Enviado em:</span>
                        {formatDate(contact.data_envio)}
                      </p>
                    </div>

                    <div className="contact-message-block">
                      <p className="contact-message">{contact.mensagem || "Sem mensagem registada."}</p>
                    </div>
                  </div>

                  <div className="contact-actions">
                    <div className="contact-action-buttons">
                      <button className="contact-action-btn contact-action-btn--status" onClick={() => handleUpdateStatus(contact)}>
                        <i className="bi bi-arrow-repeat me-2"></i>
                        {String(contact.estado || "Pendente").trim().toLowerCase() === "respondido" ? "Marcar pendente" : "Marcar respondido"}
                      </button>

                      <button className="contact-action-btn contact-action-btn--delete" onClick={() => handleDeleteContact(contact)}>
                        <i className="bi bi-trash me-2"></i>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && !error && filteredContacts.length > 0 ? (
            <div className="pagination-row">
              <span>
                Mostrando {Math.min(pageSize.value, filteredContacts.length)} de {filteredContacts.length} contactos
              </span>

              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                  disabled={safePage === 1}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <span className="pagination-page">{safePage} / {totalPages}</span>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
                  disabled={safePage === totalPages}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
};

export default AdminContacts;

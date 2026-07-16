import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import "./PetVaccines.css";
import api from "../../services/api";

const formatDate = (value) => {
  if (!value) return "Não disponível";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-PT");
};

const PetVaccines = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditable = location.pathname.startsWith("/vet/") || location.pathname.startsWith("/admin/");
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingVaccineId, setEditingVaccineId] = useState(null);
  const [savingVaccineId, setSavingVaccineId] = useState(null);
  const [editForm, setEditForm] = useState({
    nome_vacina: "",
    data_administracao: "",
    proxima_dose: "",
    fabricante: "",
    lote_vacina: "",
    observacoes: ""
  });

  const loadVaccines = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/vaccines/pet/${id}`);
      setVaccines(response.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Não foi possível carregar as vacinas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVaccines();
  }, [id]);

  const handleStartEdit = (vaccine) => {
    setEditingVaccineId(vaccine.id_vaccine);
    setEditForm({
      nome_vacina: vaccine.nome_vacina || "",
      data_administracao: String(vaccine.data_administracao || "").slice(0, 10),
      proxima_dose: String(vaccine.proxima_dose || "").slice(0, 10),
      fabricante: vaccine.fabricante || "",
      lote_vacina: vaccine.lote_vacina || "",
      observacoes: vaccine.observacoes || ""
    });
  };

  const handleCancelEdit = () => {
    setEditingVaccineId(null);
    setSavingVaccineId(null);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = async (vaccineId) => {
    if (!editForm.nome_vacina.trim() || !editForm.data_administracao) {
      setError("Nome e data de administração são obrigatórios.");
      return;
    }

    try {
      setSavingVaccineId(vaccineId);
      await api.put(`/vaccines/${vaccineId}`, {
        nome_vacina: editForm.nome_vacina.trim(),
        data_administracao: editForm.data_administracao,
        proxima_dose: editForm.proxima_dose,
        fabricante: editForm.fabricante.trim(),
        lote_vacina: editForm.lote_vacina.trim(),
        observacoes: editForm.observacoes.trim()
      });

      setEditingVaccineId(null);
      await loadVaccines();
    } catch (err) {
      setError(err.response?.data?.message || "Não foi possível atualizar a vacina.");
    } finally {
      setSavingVaccineId(null);
    }
  };

  const handleDeleteVaccine = async (vaccineId) => {
    const result = await Swal.fire({
      title: "Eliminar vacina?",
      text: "Tem a certeza que pretende eliminar esta vacina?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/vaccines/${vaccineId}`);
      await loadVaccines();
      Swal.fire({ title: "Eliminado!", text: "Vacina eliminada.", icon: "success" });
    } catch (err) {
      console.error(err);
      Swal.fire({ title: "Erro", text: "Não foi possível eliminar a vacina.", icon: "error" });
    }
  };

  return (
    <main className="vaccines-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left"></i>
        Voltar
      </button>

      <div className="vaccines-header">
        <div>
          <h1>Vacinas do Animal</h1>
          <p>Lista de vacinas registadas</p>
        </div>
      </div>

      {loading && <p className="pets-empty">A carregar vacinas...</p>}
      {!loading && error && <p className="pets-empty">{error}</p>}

      {!loading && !error && vaccines.length === 0 && (
        <p className="pets-empty">Nenhuma vacina encontrada.</p>
      )}

      {!loading && !error && vaccines.length > 0 && (
        <div className="vaccines-list">
          {vaccines.map((vaccine) => (
            <div className="vaccine-card" key={vaccine.id_vaccine}>
              <div className="vaccine-icon">
                <i className="bi bi-capsule"></i>
              </div>

              <div className="vaccine-info">
                {editingVaccineId === vaccine.id_vaccine ? (
                  <input
                    className="inline-edit-input inline-edit-title"
                    name="nome_vacina"
                    value={editForm.nome_vacina}
                    onChange={handleEditChange}
                  />
                ) : (
                  <h3>{vaccine.nome_vacina}</h3>
                )}

                <p>
                  Aplicada em:{" "}
                  {editingVaccineId === vaccine.id_vaccine ? (
                    <input
                      className="inline-edit-input"
                      type="date"
                      name="data_administracao"
                      value={editForm.data_administracao}
                      onChange={handleEditChange}
                    />
                  ) : (
                    <strong>{formatDate(vaccine.data_administracao)}</strong>
                  )}
                </p>
                <p>
                  Próxima dose:{" "}
                  {editingVaccineId === vaccine.id_vaccine ? (
                    <input
                      className="inline-edit-input"
                      type="date"
                      name="proxima_dose"
                      value={editForm.proxima_dose}
                      onChange={handleEditChange}
                    />
                  ) : (
                    <strong>{formatDate(vaccine.proxima_dose)}</strong>
                  )}
                </p>

                <p>
                  Fabricante:{" "}
                  {editingVaccineId === vaccine.id_vaccine ? (
                    <input
                      className="inline-edit-input"
                      name="fabricante"
                      value={editForm.fabricante}
                      onChange={handleEditChange}
                    />
                  ) : (
                    vaccine.fabricante || "Não registado"
                  )}
                </p>
                <p>
                  Lote:{" "}
                  {editingVaccineId === vaccine.id_vaccine ? (
                    <input
                      className="inline-edit-input"
                      name="lote_vacina"
                      value={editForm.lote_vacina}
                      onChange={handleEditChange}
                    />
                  ) : (
                    vaccine.lote_vacina || "Não registado"
                  )}
                </p>
                <p>
                  Observações:{" "}
                  {editingVaccineId === vaccine.id_vaccine ? (
                    <textarea
                      className="inline-edit-textarea"
                      name="observacoes"
                      value={editForm.observacoes}
                      onChange={handleEditChange}
                    />
                  ) : (
                    vaccine.observacoes || "Sem observações"
                  )}
                </p>

                {isEditable && (
                  <div className="vaccine-actions">
                    {editingVaccineId === vaccine.id_vaccine ? (
                      <>
                        <button
                          className="inline-save-btn"
                          onClick={() => handleSaveEdit(vaccine.id_vaccine)}
                          disabled={savingVaccineId === vaccine.id_vaccine}
                        >
                          {savingVaccineId === vaccine.id_vaccine ? "A guardar..." : "Guardar"}
                        </button>
                        <button className="inline-cancel-btn" onClick={handleCancelEdit}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="inline-edit-btn" onClick={() => handleStartEdit(vaccine)}>
                          Editar
                        </button>
                        <button className="inline-delete-btn" onClick={() => handleDeleteVaccine(vaccine.id_vaccine)}>
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default PetVaccines;
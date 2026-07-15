import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "./PetHistory.css";
import api from "../../services/api";

const formatDate = (value) => {
  if (!value) return "Não disponível";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-PT");
};

const PetHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isVetView = location.pathname.startsWith("/vet/");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [savingRecordId, setSavingRecordId] = useState(null);
  const [editForm, setEditForm] = useState({
    diagnostico: "",
    sintomas: "",
    tratamento_receitado: "",
    peso: "",
    temperatura: "",
    frequencia_cardiaca: "",
    recomendacoes: ""
  });

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/medical-records/pet/${id}`);
      setRecords(response.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Não foi possível carregar o histórico médico.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [id]);

  const handleStartEdit = (record) => {
    setEditingRecordId(record.id_record);
    setEditForm({
      diagnostico: record.diagnostico || "",
      sintomas: record.sintomas || "",
      tratamento_receitado: record.tratamento_receitado || "",
      peso: record.peso ?? "",
      temperatura: record.temperatura ?? "",
      frequencia_cardiaca: record.frequencia_cardiaca ?? "",
      recomendacoes: record.recomendacoes || ""
    });
  };

  const handleCancelEdit = () => {
    setEditingRecordId(null);
    setSavingRecordId(null);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = async (recordId) => {
    if (!editForm.diagnostico.trim()) {
      setError("O diagnóstico é obrigatório.");
      return;
    }

    try {
      setSavingRecordId(recordId);
      await api.put(`/medical-records/${recordId}`, {
        diagnostico: editForm.diagnostico.trim(),
        sintomas: editForm.sintomas.trim(),
        tratamento_receitado: editForm.tratamento_receitado.trim(),
        peso: editForm.peso,
        temperatura: editForm.temperatura,
        frequencia_cardiaca: editForm.frequencia_cardiaca,
        recomendacoes: editForm.recomendacoes.trim()
      });

      setEditingRecordId(null);
      await loadHistory();
    } catch (err) {
      setError(err.response?.data?.message || "Não foi possível atualizar o registo médico.");
    } finally {
      setSavingRecordId(null);
    }
  };

  return (
    <main className="history-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left"></i>
        Voltar
      </button>

      <div className="history-header">
        <div>
          <h1>Histórico Médico</h1>
          <p>Consultas e registos clínicos do animal</p>
        </div>
      </div>

      {loading && <p className="pets-empty">A carregar histórico...</p>}
      {!loading && error && <p className="pets-empty">{error}</p>}

      {!loading && !error && records.length === 0 && (
        <p className="pets-empty">Nenhum registo médico encontrado.</p>
      )}

      {!loading && !error && records.length > 0 && (
        <div className="history-list">
          {records.map((record) => (
            <div className="record-card" key={record.id_record}>
              <div className="record-date">
                <i className="bi bi-calendar3"></i>
                <span>{formatDate(record.data_registo)}</span>
              </div>

              <div className="record-info">
                {editingRecordId === record.id_record ? (
                  <input
                    className="inline-edit-input inline-edit-title"
                    name="diagnostico"
                    value={editForm.diagnostico}
                    onChange={handleEditChange}
                  />
                ) : (
                  <h3>{record.diagnostico}</h3>
                )}

                {isVetView && (
                  <div className="record-actions">
                    {editingRecordId === record.id_record ? (
                      <>
                        <button
                          className="inline-save-btn"
                          onClick={() => handleSaveEdit(record.id_record)}
                          disabled={savingRecordId === record.id_record}
                        >
                          {savingRecordId === record.id_record ? "A guardar..." : "Guardar"}
                        </button>
                        <button className="inline-cancel-btn" onClick={handleCancelEdit}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button className="inline-edit-btn" onClick={() => handleStartEdit(record)}>
                        Editar
                      </button>
                    )}
                  </div>
                )}

                <div className="record-grid">
                  <div>
                    <strong>Sintomas</strong>
                    {editingRecordId === record.id_record ? (
                      <textarea
                        className="inline-edit-textarea"
                        name="sintomas"
                        value={editForm.sintomas}
                        onChange={handleEditChange}
                      />
                    ) : (
                      <p>{record.sintomas || "Não registados"}</p>
                    )}
                  </div>

                  <div>
                    <strong>Tratamento</strong>
                    {editingRecordId === record.id_record ? (
                      <textarea
                        className="inline-edit-textarea"
                        name="tratamento_receitado"
                        value={editForm.tratamento_receitado}
                        onChange={handleEditChange}
                      />
                    ) : (
                      <p>{record.tratamento_receitado || "Não registado"}</p>
                    )}
                  </div>

                  <div>
                    <strong>Peso</strong>
                    {editingRecordId === record.id_record ? (
                      <input
                        className="inline-edit-input"
                        name="peso"
                        type="number"
                        step="0.01"
                        value={editForm.peso}
                        onChange={handleEditChange}
                      />
                    ) : (
                      <p>{record.peso ? `${record.peso}kg` : "Não registado"}</p>
                    )}
                  </div>

                  <div>
                    <strong>Temperatura</strong>
                    {editingRecordId === record.id_record ? (
                      <input
                        className="inline-edit-input"
                        name="temperatura"
                        type="number"
                        step="0.1"
                        value={editForm.temperatura}
                        onChange={handleEditChange}
                      />
                    ) : (
                      <p>{record.temperatura ? `${record.temperatura} ºC` : "Não registada"}</p>
                    )}
                  </div>

                  <div>
                    <strong>Frequência Cardíaca</strong>
                    {editingRecordId === record.id_record ? (
                      <input
                        className="inline-edit-input"
                        name="frequencia_cardiaca"
                        type="number"
                        value={editForm.frequencia_cardiaca}
                        onChange={handleEditChange}
                      />
                    ) : (
                      <p>{record.frequencia_cardiaca ? `${record.frequencia_cardiaca} bpm` : "Não registada"}</p>
                    )}
                  </div>

                  <div>
                    <strong>Recomendações</strong>
                    {editingRecordId === record.id_record ? (
                      <textarea
                        className="inline-edit-textarea"
                        name="recomendacoes"
                        value={editForm.recomendacoes}
                        onChange={handleEditChange}
                      />
                    ) : (
                      <p>{record.recomendacoes || "Sem recomendações"}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default PetHistory;
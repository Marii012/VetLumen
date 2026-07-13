import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../../services/api";
import "./VetClinicalForm.css";

const swalCustomClass = {
  popup: "vetlumen-swal-popup",
  title: "vetlumen-swal-title",
  htmlContainer: "vetlumen-swal-text",
  confirmButton: "vetlumen-swal-button",
  cancelButton: "vetlumen-swal-button"
};

const VetAddClinicalRecordPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    diagnostico: "",
    tratamento: "",
    medicacao: "",
    observacoes: "",
    vacinaAdministrada: false,
    nomeVacina: "",
    dataAplicacao: new Date().toISOString().slice(0, 10),
    proximaDose: "",
    fabricante: "",
    loteVacina: ""
  });

  useEffect(() => {
    const loadPet = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/pets/${id}`);
        setPet(response.data || null);
      } catch (err) {
        setError(err.response?.data?.message || "Não foi possível carregar o paciente.");
      } finally {
        setLoading(false);
      }
    };

    loadPet();
  }, [id]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.diagnostico.trim()) {
      setError("O diagnóstico é obrigatório.");
      return;
    }

    if (form.vacinaAdministrada && !form.nomeVacina.trim()) {
      setError("O nome da vacina é obrigatório quando a vacina é administrada.");
      return;
    }

    if (form.vacinaAdministrada && !form.dataAplicacao) {
      setError("A data de aplicação da vacina é obrigatória.");
      return;
    }

    try {
      setSaving(true);

      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      const vetId = storedUser?.id_user;

      if (!vetId) {
        setError("Não foi possível identificar o veterinário autenticado.");
        setSaving(false);
        return;
      }

      const tratamentoCompleto = [
        form.tratamento ? `Tratamento: ${form.tratamento}` : "",
        form.medicacao ? `Medicação: ${form.medicacao}` : ""
      ].filter(Boolean).join("\n");

      await api.post("/medical-records", {
        diagnostico: form.diagnostico,
        sintomas: null,
        tratamento_receitado: tratamentoCompleto || null,
        data_registo: new Date().toISOString(),
        id_pet: Number(id),
        id_veterinario: Number(vetId),
        recomendacoes: form.observacoes || null
      });

      if (form.vacinaAdministrada) {
        await api.post("/vaccines", {
          nome_vacina: form.nomeVacina,
          data_administracao: form.dataAplicacao,
          proxima_dose: form.proximaDose || null,
          observacoes: form.observacoes || null,
          id_pet: Number(id),
          id_veterinario: Number(vetId),
          fabricante: form.fabricante || null,
          lote_vacina: form.loteVacina || null
        });
      }

      await Swal.fire({
        title: "Registo guardado",
        text: "O registo clínico foi criado com sucesso.",
        icon: "success",
        customClass: swalCustomClass
      });

      navigate(`/vet/patients/${id}/history`);
    } catch (err) {
      setError(err.response?.data?.message || "Não foi possível guardar o registo clínico.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="clinical-page">
      <header className="clinical-header">
        <div>
          <h1>Acrescentar Registo Clínico</h1>
          <p>{pet ? `Paciente: ${pet.nome}` : "A carregar paciente..."}</p>
        </div>

        <button className="clinical-back-btn" type="button" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i>
          Voltar
        </button>
      </header>

      {loading ? (
        <p>A carregar dados...</p>
      ) : (
        <form className="clinical-form" onSubmit={handleSubmit}>
          {error && <p className="clinical-error">{error}</p>}

          <div className="clinical-form-item">
            <label htmlFor="diagnostico">Diagnóstico</label>
            <input id="diagnostico" name="diagnostico" className="clinical-input" value={form.diagnostico} onChange={handleChange} required />
          </div>

          <div className="clinical-form-item">
            <label htmlFor="tratamento">Tratamento</label>
            <textarea id="tratamento" name="tratamento" className="clinical-input" value={form.tratamento} onChange={handleChange} />
          </div>

          <div className="clinical-form-item">
            <label htmlFor="medicacao">Medicação</label>
            <textarea id="medicacao" name="medicacao" className="clinical-input" value={form.medicacao} onChange={handleChange} />
          </div>

          <div className="clinical-form-item">
            <label htmlFor="observacoes">Observações</label>
            <textarea id="observacoes" name="observacoes" className="clinical-input" value={form.observacoes} onChange={handleChange} />
          </div>

          <div className="clinical-full-width">
            <label className="clinical-checkbox">
              <input type="checkbox" name="vacinaAdministrada" checked={form.vacinaAdministrada} onChange={handleChange} />
              Foi administrada uma vacina
            </label>
          </div>

          {form.vacinaAdministrada && (
            <div className="clinical-vaccine-grid">
              <div className="clinical-form-item">
                <label htmlFor="nomeVacina">Nome da vacina</label>
                <input id="nomeVacina" name="nomeVacina" className="clinical-input" value={form.nomeVacina} onChange={handleChange} required={form.vacinaAdministrada} />
              </div>

              <div className="clinical-form-item">
                <label htmlFor="dataAplicacao">Data de aplicação</label>
                <input id="dataAplicacao" name="dataAplicacao" type="date" className="clinical-input" value={form.dataAplicacao} onChange={handleChange} required={form.vacinaAdministrada} />
              </div>

              <div className="clinical-form-item">
                <label htmlFor="proximaDose">Próxima dose</label>
                <input id="proximaDose" name="proximaDose" type="date" className="clinical-input" value={form.proximaDose} onChange={handleChange} />
              </div>

              <div className="clinical-form-item">
                <label htmlFor="fabricante">Fabricante</label>
                <input id="fabricante" name="fabricante" className="clinical-input" value={form.fabricante} onChange={handleChange} />
              </div>

              <div className="clinical-form-item clinical-full-width">
                <label htmlFor="loteVacina">Lote</label>
                <input id="loteVacina" name="loteVacina" className="clinical-input" value={form.loteVacina} onChange={handleChange} />
              </div>
            </div>
          )}

          <div className="clinical-actions">
            <button type="button" className="clinical-cancel-btn" onClick={() => navigate(-1)} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="clinical-save-btn" disabled={saving}>
              {saving ? "A guardar..." : "Guardar"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
};

export default VetAddClinicalRecordPage;

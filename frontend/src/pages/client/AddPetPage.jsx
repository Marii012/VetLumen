import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import api from "../../services/api";
import "./Pets.css";
import "./Profile.css";

const AddPetPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: "",
    sexo: "",
    data_nascimento: "",
    peso: "",
    cor: "",
    estado: "Ativo",
    observacoes: "",
    fotografia: "",
    porte: ""
  });
  const [speciesOptions, setSpeciesOptions] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [breedOptions, setBreedOptions] = useState([]);
  const [selectedBreed, setSelectedBreed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSpecies = async () => {
      try {
        const response = await api.get("/species");
        const options = (response.data || []).map((species) => ({
          value: species.id_species,
          label: species.nome_especie,
        }));
        setSpeciesOptions(options);
      } catch (err) {
        setError("Não foi possível carregar as espécies.");
      } finally {
        setLoading(false);
      }
    };

    loadSpecies();
  }, []);

  useEffect(() => {
    const loadBreeds = async () => {
      if (!selectedSpecies?.value) {
        setBreedOptions([]);
        setSelectedBreed(null);
        return;
      }

      try {
        const response = await api.get(`/breeds/species/${selectedSpecies.value}`);
        const options = (response.data || []).map((breed) => ({
          value: breed.id_breed,
          label: breed.nome_raca,
        }));
        setBreedOptions(options);
        setSelectedBreed(null);
      } catch (err) {
        setBreedOptions([]);
        setSelectedBreed(null);
      }
    };

    loadBreeds();
  }, [selectedSpecies]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({ ...previous, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      const userId = storedUser?.id_user;

      if (!userId) {
        setError("Não foi possível identificar o utilizador autenticado.");
        setSaving(false);
        return;
      }

      if (!formData.nome.trim() || !selectedSpecies?.value) {
        setError("Nome e espécie são obrigatórios.");
        setSaving(false);
        return;
      }

      await api.post("/pets", {
        nome: formData.nome.trim(),
        id_species: Number(selectedSpecies.value),
        id_breed: selectedBreed?.value ? Number(selectedBreed.value) : null,
        sexo: formData.sexo || null,
        data_nascimento: formData.data_nascimento || null,
        peso: formData.peso ? Number(formData.peso) : null,
        cor: formData.cor || null,
        estado: formData.estado || "Ativo",
        observacoes: formData.observacoes || null,
        fotografia: formData.fotografia || null,
        porte: formData.porte || null,
        num_chip: formData.has_microchip ? (formData.num_chip || null) : null,
        id_user: userId,
      });

      navigate("/client/pets");
    } catch (err) {
      console.error("Erro ao criar animal:", err);
      setError(err.response?.data?.message || "Não foi possível guardar o animal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="appointments-container">
      <div className="appointments-header">
        <div>
          <h1>Adicionar Animal</h1>
          <p>Preencha os dados do novo animal para o adicionar à sua conta.</p>
        </div>

        <button type="button" className="dashboard-btn" onClick={() => navigate("/client/pets")}>
          <i className="bi bi-arrow-left"></i>
          Voltar
        </button>
      </div>

      {loading ? (
        <div className="profile-card">
          <p>A carregar formulário...</p>
        </div>
      ) : (
        <form className="add-pet-form" onSubmit={handleSubmit}>
          {error && <p className="profile-error full-width">{error}</p>}

          <div className="profile-item add-pet-name-field">
            <label htmlFor="nome">Nome</label>
            <input id="nome" name="nome" value={formData.nome} onChange={handleChange} className="profile-input" required />
          </div>

          <div className="profile-item add-pet-species-field">
            <label htmlFor="species">Espécie</label>
            <Select
              inputId="species"
              className="pet-form-select"
              classNamePrefix="pet-form-select"
              options={speciesOptions}
              value={selectedSpecies}
              onChange={setSelectedSpecies}
              isSearchable={false}
              placeholder="Selecione a espécie"
            />
          </div>

          <div className="profile-item add-pet-breed-field">
            <label htmlFor="breed">Raça</label>
            <Select
              inputId="breed"
              className="pet-form-select"
              classNamePrefix="pet-form-select"
              options={breedOptions}
              value={selectedBreed}
              onChange={setSelectedBreed}
              isSearchable={false}
              placeholder="Selecione a raça"
              isDisabled={!selectedSpecies}
            />
          </div>

          <div className="profile-item add-pet-sex-field">
            <label htmlFor="sexo">Sexo</label>
          
            <Select
              inputId="sexo"
              className="pet-form-select"
              classNamePrefix="pet-form-select"
              options={[
                { value: "F", label: "Feminino" },
                { value: "M", label: "Masculino" }
              ]}
              value={
                formData.sexo
                  ? {
                      value: formData.sexo,
                      label: formData.sexo === "F" ? "Feminino" : "Masculino"
                    }
                  : null
              }
              onChange={(option) =>
                setFormData((previous) => ({
                  ...previous,
                  sexo: option?.value || ""
                }))
              }
              isSearchable={false}
              placeholder="Selecione o sexo"
            />
          </div>

          <div className="add-pet-inline-row add-pet-metrics-row">
            <div className="profile-item add-pet-birth-field">
            <label htmlFor="data_nascimento">Data de nascimento</label>
            <input id="data_nascimento" name="data_nascimento" type="date" value={formData.data_nascimento} onChange={handleChange} className="profile-input" />
            </div>

            <div className="profile-item add-pet-weight-field">
            <label htmlFor="peso">Peso (kg)</label>
            <input id="peso" name="peso" type="number" step="0.1" value={formData.peso} onChange={handleChange} className="profile-input" />
            </div>
          </div>

          <div className="add-pet-inline-row add-pet-status-row">
            <div className="profile-item add-pet-color-field">
            <label htmlFor="cor">Cor</label>
            <input id="cor" name="cor" value={formData.cor} onChange={handleChange} className="profile-input" />
            </div>

            <div className="profile-item add-pet-state-field">
            <label htmlFor="estado">Estado</label>
            <Select
              inputId="estado"
              className="pet-form-select"
              classNamePrefix="pet-form-select"
              options={[
                { value: "Ativo", label: "Ativo" },
                { value: "Inativo", label: "Inativo" }
              ]}
              value={{
                value: formData.estado,
                label: formData.estado
              }}
              onChange={(option) =>
                setFormData((previous) => ({
                  ...previous,
                  estado: option.value
                }))
              }
              isSearchable={false}
            />
            </div>
          </div>

          <div className="add-pet-inline-row add-pet-porte-row">
            <div className="profile-item add-pet-porte-field">
              <label htmlFor="porte">Porte</label>
              <Select
                inputId="porte"
                className="pet-form-select"
                classNamePrefix="pet-form-select"
                options={[
                  { value: '', label: 'Sem indicação' },
                  { value: 'Pequeno', label: 'Pequeno' },
                  { value: 'Médio', label: 'Médio' },
                  { value: 'Grande', label: 'Grande' }
                ]}
                value={formData.porte ? { value: formData.porte, label: formData.porte } : { value: '', label: 'Sem indicação' }}
                onChange={(option) => setFormData((prev) => ({ ...prev, porte: option?.value || '' }))}
                isSearchable={false}
              />
            </div>
          </div>

          <div className="add-pet-inline-row add-pet-microchip-row">
            <div className="profile-item add-pet-microchip-field">
              <label>
                <input type="checkbox" name="has_microchip" checked={!!formData.has_microchip} onChange={handleChange} />{' '}
                Tem microchip?
              </label>

              {formData.has_microchip && (
                <input
                  name="num_chip"
                  value={formData.num_chip || ''}
                  onChange={handleChange}
                  className="profile-input mt-2"
                  placeholder="Número do microchip"
                />
              )}
            </div>
          </div>

          <div className="profile-item full-width">
            <label htmlFor="observacoes">Observações de saúde</label>
            <textarea id="observacoes" name="observacoes" value={formData.observacoes} onChange={handleChange} className="profile-input" rows="4" />
          </div>

          <div className="profile-item full-width">
            <label htmlFor="fotografia">URL da fotografia</label>
            <input
              id="fotografia"
              name="fotografia"
              type="text"
              value={formData.fotografia || ""}
              onChange={handleChange}
              className="profile-input"
              placeholder="https://"
            />
          </div>

          <div className="profile-edit-actions full-width">
            <button type="button" className="password-btn" onClick={() => navigate("/client/pets")} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="edit-profile-btn" disabled={saving}>
              {saving ? "A guardar..." : "Guardar Animal"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
};

export default AddPetPage;

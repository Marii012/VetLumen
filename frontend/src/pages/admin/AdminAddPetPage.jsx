import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import api from "../../services/api";
import "./AdminPets.css";
import "./AdminAddPetPage.css";

const initialForm = {
  nome: "",
  id_user: "",
  id_species: "",
  id_breed: "",
  sexo: "",
  data_nascimento: "",
  peso: "",
  num_chip: "",
  has_microchip: false,
  fotografia: "",
  cor: "",
  porte: "",
  estado: "Ativo",
  esterilizado: false,
  alergias: "",
  observacoes: ""
};

const getFullOwnerName = (user) =>
  `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Utilizador";

const AdminAddPetPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [species, setSpecies] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [selectedBreed, setSelectedBreed] = useState(null);
  const [selectedSex, setSelectedSex] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState({ value: "Ativo", label: "Ativo" });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersResponse, speciesResponse, breedsResponse] = await Promise.all([
          api.get("/users"),
          api.get("/species"),
          api.get("/breeds")
        ]);

        setUsers(usersResponse.data || []);
        setSpecies(speciesResponse.data || []);
        setBreeds(breedsResponse.data || []);
      } catch (loadError) {
        console.error("Erro ao carregar dados do formulário:", loadError);
        setError("Não foi possível carregar os dados necessários.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const breedsForSpecies = useMemo(
    () => breeds.filter((breed) => String(breed.id_species) === String(form.id_species)),
    [breeds, form.id_species]
  );

  const ownerOptions = useMemo(
    () =>
      users.map((user) => ({
        value: String(user.id_user),
        label: getFullOwnerName(user)
      })),
    [users]
  );

  const speciesOptions = useMemo(
    () =>
      species.map((item) => ({
        value: String(item.id_species),
        label: item.nome_especie
      })),
    [species]
  );

  const breedOptions = useMemo(
    () =>
      breedsForSpecies.map((breed) => ({
        value: String(breed.id_breed),
        label: breed.nome_raca
      })),
    [breedsForSpecies]
  );

  const sexOptions = useMemo(
    () => [
      { value: "", label: "Sem indicação" },
      { value: "M", label: "Macho" },
      { value: "F", label: "Fêmea" }
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      { value: "Ativo", label: "Ativo" },
      { value: "Inativo", label: "Inativo" }
    ],
    []
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value
      };

      if (name === "id_species") {
        next.id_breed = "";
      }

      return next;
    });
  };

  const handleOwnerChange = (option) => {
    setSelectedOwner(option || null);
    setForm((prev) => ({ ...prev, id_user: option ? option.value : "" }));
  };

  const handleSpeciesChange = (option) => {
    setSelectedSpecies(option || null);
    setForm((prev) => ({ ...prev, id_species: option ? option.value : "", id_breed: "" }));
  };

  const handleBreedChange = (option) => {
    setSelectedBreed(option || null);
    setForm((prev) => ({ ...prev, id_breed: option ? option.value : "" }));
  };

  const handleSexChange = (option) => {
    setSelectedSex(option || null);
    setForm((prev) => ({ ...prev, sexo: option ? option.value : "" }));
  };

  const handleStatusChange = (option) => {
    setSelectedStatus(option || { value: "Ativo", label: "Ativo" });
    setForm((prev) => ({ ...prev, estado: option ? option.value : "Ativo" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.nome.trim() || !form.id_user || !form.id_species) {
      setError("Preencha o nome, proprietário e espécie.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.post("/pets", {
        nome: form.nome.trim(),
        sexo: form.sexo || null,
        data_nascimento: form.data_nascimento || null,
        peso: form.peso === "" ? null : Number(form.peso),
        num_chip: form.has_microchip ? form.num_chip.trim() : null,
        fotografia: form.fotografia.trim(),
        id_species: Number(form.id_species),
        id_breed: form.id_breed ? Number(form.id_breed) : null,
        id_user: Number(form.id_user),
        cor: form.cor.trim(),
        esterilizado: Boolean(form.esterilizado),
        alergias: form.alergias.trim(),
        observacoes: form.observacoes.trim(),
        porte: form.porte.trim(),
        estado: form.estado || "Ativo"
      });

      await Swal.fire({
        title: "Criado!",
        text: "Animal criado com sucesso.",
        icon: "success",
        customClass: {
          popup: "vetlumen-swal-popup",
          title: "vetlumen-swal-title",
          htmlContainer: "vetlumen-swal-text",
          confirmButton: "vetlumen-swal-button"
        }
      });

      navigate("/admin/pets");
    } catch (saveError) {
      console.error("Erro ao criar animal:", saveError);
      setError("Não foi possível criar o animal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="admin-pets dashboard-container admin-add-pet-page">
      <header className="dashboard-header">
        <div>
          <h1>Adicionar animal</h1>
          <p>Crie um novo animal no sistema sem usar modal.</p>
        </div>

        <button
          type="button"
          className="dashboard-btn pets-add-btn"
          onClick={() => navigate("/admin/pets")}
        >
          <i className="bi bi-arrow-left"></i>
          Voltar à lista
        </button>
      </header>

      {loading ? (
        <section className="dashboard-card admin-pet-form-card">
          <p className="admin-pet-form-message">A carregar formulário...</p>
        </section>
      ) : (
        <section className="dashboard-card admin-pet-form-card">
          <form className="admin-pet-form" onSubmit={handleSubmit}>
            <label className="admin-pet-field">
              <span>Nome *</span>
              <input
                name="nome"
                className="admin-pet-input"
                value={form.nome}
                onChange={handleChange}
                placeholder="Nome do animal"
              />
            </label>

            <label className="admin-pet-field">
              <span>Proprietário *</span>
              <Select
                options={ownerOptions}
                value={selectedOwner}
                onChange={handleOwnerChange}
                placeholder="Selecionar utilizador"
                isSearchable
                isClearable
                maxMenuHeight={220}
                className="admin-pet-select"
                classNamePrefix="admin-pet-select"
                noOptionsMessage={() => "Sem utilizadores"}
              />
            </label>

            <label className="admin-pet-field">
              <span>Espécie *</span>
              <Select
                options={speciesOptions}
                value={selectedSpecies}
                onChange={handleSpeciesChange}
                placeholder="Selecionar espécie"
                isSearchable
                isClearable
                maxMenuHeight={220}
                className="admin-pet-select"
                classNamePrefix="admin-pet-select"
                noOptionsMessage={() => "Sem espécies"}
              />
            </label>

            <label className="admin-pet-field">
              <span>Raça</span>
              <Select
                options={breedOptions}
                value={selectedBreed}
                onChange={handleBreedChange}
                placeholder="Sem raça"
                isSearchable
                isClearable
                isDisabled={!form.id_species}
                maxMenuHeight={220}
                className="admin-pet-select"
                classNamePrefix="admin-pet-select"
                noOptionsMessage={() => "Sem raças para esta espécie"}
              />
            </label>

            <label className="admin-pet-field">
              <span>Sexo</span>
              <Select
                options={sexOptions}
                value={selectedSex}
                onChange={handleSexChange}
                placeholder="Sem indicação"
                isSearchable={false}
                isClearable={false}
                maxMenuHeight={220}
                className="admin-pet-select"
                classNamePrefix="admin-pet-select"
              />
            </label>

            <label className="admin-pet-field">
              <span>Data de nascimento</span>
              <input
                name="data_nascimento"
                type="date"
                className="admin-pet-input"
                value={form.data_nascimento}
                onChange={handleChange}
              />
            </label>

            <label className="admin-pet-field">
              <span>Peso</span>
              <input
                name="peso"
                type="number"
                min="0"
                step="0.1"
                className="admin-pet-input"
                value={form.peso}
                onChange={handleChange}
                placeholder="0.0"
              />
            </label>

            <label className="admin-pet-field">
              <span>Microchip</span>
              <div>
                <label className="d-flex align-items-center gap-2">
                  <input type="checkbox" name="has_microchip" checked={!!form.has_microchip} onChange={handleChange} />
                  <span>Tem microchip?</span>
                </label>

                {form.has_microchip && (
                  <input
                    name="num_chip"
                    className="admin-pet-input mt-2"
                    value={form.num_chip}
                    onChange={handleChange}
                    placeholder="Número do microchip"
                  />
                )}
              </div>
            </label>

            <label className="admin-pet-field">
              <span>Fotografia (URL)</span>
              <input
                name="fotografia"
                className="admin-pet-input"
                value={form.fotografia}
                onChange={handleChange}
                placeholder="https://..."
              />
            </label>

            <label className="admin-pet-field">
              <span>Cor</span>
              <input
                name="cor"
                className="admin-pet-input"
                value={form.cor}
                onChange={handleChange}
                placeholder="Cor"
              />
            </label>

            <label className="admin-pet-field">
              <span>Porte</span>
              <Select
                options={[
                  { value: '', label: 'Sem indicação' },
                  { value: 'Pequeno', label: 'Pequeno' },
                  { value: 'Médio', label: 'Médio' },
                  { value: 'Grande', label: 'Grande' }
                ]}
                value={form.porte ? { value: form.porte, label: form.porte } : { value: '', label: 'Sem indicação' }}
                onChange={(option) => setForm((prev) => ({ ...prev, porte: option?.value || '' }))}
                className="admin-pet-select"
                classNamePrefix="admin-pet-select"
                isSearchable={false}
                isClearable={false}
              />
            </label>

            <label className="admin-pet-field">
              <span>Estado</span>
              <Select
                options={statusOptions}
                value={selectedStatus}
                onChange={handleStatusChange}
                placeholder="Selecionar estado"
                isSearchable={false}
                isClearable={false}
                maxMenuHeight={220}
                className="admin-pet-select"
                classNamePrefix="admin-pet-select"
              />
            </label>

            <label className="admin-pet-checkbox admin-pet-field--full">
              <input
                type="checkbox"
                name="esterilizado"
                checked={form.esterilizado}
                onChange={handleChange}
              />
              <span>Esterilizado</span>
            </label>

            <label className="admin-pet-field admin-pet-field--full">
              <span>Alergias</span>
              <textarea
                name="alergias"
                className="admin-pet-input admin-pet-textarea"
                rows="3"
                value={form.alergias}
                onChange={handleChange}
                placeholder="Alergias"
              ></textarea>
            </label>

            <label className="admin-pet-field admin-pet-field--full">
              <span>Observações</span>
              <textarea
                name="observacoes"
                className="admin-pet-input admin-pet-textarea"
                rows="3"
                value={form.observacoes}
                onChange={handleChange}
                placeholder="Observações"
              ></textarea>
            </label>

            {error && <p className="admin-pet-form-error">{error}</p>}

            <div className="admin-pet-form-actions">
              <button
                type="button"
                className="dashboard-btn admin-pet-cancel"
                onClick={() => navigate("/admin/pets")}
                disabled={saving}
              >
                Cancelar
              </button>

              <button type="submit" className="dashboard-btn" disabled={saving}>
                {saving ? "A guardar..." : "Criar animal"}
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
};

export default AdminAddPetPage;

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

const AdminEditPetPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [species, setSpecies] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [usersRes, speciesRes, breedsRes, petRes] = await Promise.all([
          api.get("/users"),
          api.get("/species"),
          api.get("/breeds"),
          api.get(`/pets/${id}`)
        ]);

        setUsers(usersRes.data || []);
        setSpecies(speciesRes.data || []);
        setBreeds(breedsRes.data || []);

        const pet = petRes.data;
        if (pet) {
          setForm({
            nome: pet.nome || "",
            id_user: pet.id_user ? String(pet.id_user) : "",
            id_species: pet.id_species ? String(pet.id_species) : "",
            id_breed: pet.id_breed ? String(pet.id_breed) : "",
            sexo: pet.sexo || "",
            data_nascimento: pet.data_nascimento || "",
            peso: pet.peso ?? "",
            num_chip: pet.num_chip || "",
            fotografia: pet.fotografia || "",
            cor: pet.cor || "",
            porte: pet.porte || "",
            estado: pet.estado || "Ativo",
            esterilizado: Boolean(pet.esterilizado),
            alergias: pet.alergias || "",
            observacoes: pet.observacoes || "",
            has_microchip: !!pet.num_chip
          });
        }
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar dados do animal.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const breedsForSpecies = useMemo(
    () => breeds.filter((breed) => String(breed.id_species) === String(form.id_species)),
    [breeds, form.id_species]
  );

  const ownerOptions = useMemo(
    () => users.map((user) => ({ value: String(user.id_user), label: getFullOwnerName(user) })),
    [users]
  );

  const speciesOptions = useMemo(
    () => species.map((item) => ({ value: String(item.id_species), label: item.nome_especie })),
    [species]
  );

  const breedOptions = useMemo(
    () => breedsForSpecies.map((breed) => ({ value: String(breed.id_breed), label: breed.nome_raca })),
    [breedsForSpecies]
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.id_user || !form.id_species) {
      setError("Preencha o nome, proprietário e espécie.");
      return;
    }

    try {
      setSaving(true);
      await api.put(`/pets/${id}`, {
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

      await Swal.fire({ title: "Atualizado!", text: "Animal atualizado com sucesso.", icon: "success" });
      navigate("/admin/pets");
    } catch (err) {
      console.error(err);
      setError("Não foi possível atualizar o animal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="admin-pets dashboard-container admin-add-pet-page">
      <header className="dashboard-header">
        <div>
          <h1>Editar animal</h1>
          <p>Edite os dados do animal.</p>
        </div>

        <button type="button" className="dashboard-btn pets-add-btn" onClick={() => navigate("/admin/pets") }>
          <i className="bi bi-arrow-left"></i>
          Voltar à lista
        </button>
      </header>

      {loading ? (
        <section className="dashboard-card admin-pet-form-card">
          <p className="admin-pet-form-message">A carregar dados...</p>
        </section>
      ) : (
        <section className="dashboard-card admin-pet-form-card">
          <form className="admin-pet-form" onSubmit={handleSubmit}>
            <label className="admin-pet-field">
              <span>Nome *</span>
              <input name="nome" className="admin-pet-input" value={form.nome} onChange={handleChange} />
            </label>

            <label className="admin-pet-field">
              <span>Proprietário *</span>
              <Select options={ownerOptions} value={ownerOptions.find(o=>o.value===form.id_user)||null} onChange={(opt)=>setForm(prev=>({...prev, id_user: opt?opt.value:''}))} isSearchable isClearable className="admin-pet-select" classNamePrefix="admin-pet-select" />
            </label>

            <label className="admin-pet-field">
              <span>Espécie *</span>
              <Select options={speciesOptions} value={speciesOptions.find(o=>o.value===form.id_species)||null} onChange={(opt)=>setForm(prev=>({...prev, id_species: opt?opt.value:'' , id_breed: ''}))} isSearchable isClearable className="admin-pet-select" classNamePrefix="admin-pet-select" />
            </label>

            <label className="admin-pet-field">
              <span>Raça</span>
              <Select options={breedOptions} value={breedOptions.find(o=>o.value===form.id_breed)||null} onChange={(opt)=>setForm(prev=>({...prev, id_breed: opt?opt.value:''}))} isSearchable isClearable isDisabled={!form.id_species} className="admin-pet-select" classNamePrefix="admin-pet-select" />
            </label>

            <label className="admin-pet-field">
              <span>Sexo</span>
              <Select options={[{value:'',label:'Sem indicação'},{value:'M',label:'Macho'},{value:'F',label:'Fêmea'}]} value={form.sexo?{value:form.sexo,label:form.sexo} : {value:'',label:'Sem indicação'}} onChange={(opt)=>setForm(prev=>({...prev, sexo: opt?opt.value:''}))} className="admin-pet-select" classNamePrefix="admin-pet-select" />
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
                options={[{ value: 'Ativo', label: 'Ativo' }, { value: 'Inativo', label: 'Inativo' }]}
                value={{ value: form.estado, label: form.estado }}
                onChange={(option) => setForm((prev) => ({ ...prev, estado: option.value }))}
                isSearchable={false}
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
              <button type="button" className="dashboard-btn admin-pet-cancel" onClick={() => navigate("/admin/pets")} disabled={saving}>
                Cancelar
              </button>

              <button type="submit" className="dashboard-btn" disabled={saving}>
                {saving ? "A guardar..." : "Guardar alterações"}
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
};

export default AdminEditPetPage;

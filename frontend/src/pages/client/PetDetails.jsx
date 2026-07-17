import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import "./PetDetails.css";
import api from "../../services/api";

const getSpeciesLabel = (idSpecies, speciesOptions) => {
  const species = speciesOptions.find((option) => option.value === idSpecies);
  return species ? species.label : "Espécie não definida";
};

const getBreedLabel = (pet) => {
  const breedName = pet?.nome_raca || pet?.Breed?.nome_raca || pet?.breed?.nome_raca;
  return breedName || "";
};

const formatDate = (value) => {
  if (!value) return "Não disponível";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-PT");
};

const getOwnerName = (owner) => `${owner?.first_name || ""} ${owner?.last_name || ""}`.trim() || owner?.email || "Dono não identificado";

const getAgeLabel = (birthDate) => {
  if (!birthDate) return "Idade indisponível";

  const birth = new Date(birthDate);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    years -= 1;
  }

  return years > 0 ? `${years} ano${years === 1 ? "" : "s"}` : "Menos de 1 ano";
};

const PetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditable = location.pathname.startsWith("/admin/");
  const [pet, setPet] = useState(null);
  const [owner, setOwner] = useState(null);
  const [speciesOptions, setSpeciesOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editingOwner, setEditingOwner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingOwner, setSavingOwner] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    sexo: "",
    data_nascimento: "",
    peso: "",
    num_chip: "",
    cor: "",
    porte: "",
    esterilizado: false,
    alergias: "",
    observacoes: "",
    estado: "Ativo"
  });
  const [ownerForm, setOwnerForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    telefone: ""
  });

  useEffect(() => {
    const fetchPet = async () => {
      try {
        setLoading(true);
        const [petResponse, speciesResponse] = await Promise.all([
          api.get(`/pets/${id}`),
          api.get("/species")
        ]);

        const speciesFromApi = (speciesResponse.data || []).map((species) => ({
          value: species.id_species,
          label: species.nome_especie
        }));

        setSpeciesOptions(speciesFromApi);
        const petData = petResponse.data;
        setPet(petData);
        setForm({
          nome: petData?.nome || "",
          sexo: petData?.sexo || "",
          data_nascimento: String(petData?.data_nascimento || "").slice(0, 10),
          peso: petData?.peso ?? "",
          num_chip: petData?.num_chip || "",
          cor: petData?.cor || "",
          porte: petData?.porte || "",
          esterilizado: Boolean(petData?.esterilizado),
          alergias: petData?.alergias || "",
          observacoes: petData?.observacoes || "",
          estado: petData?.estado || "Ativo"
        });

        if (petData?.id_user) {
          try {
            const ownerResponse = await api.get(`/users/${petData.id_user}`);
            const ownerData = ownerResponse.data;
            setOwner(ownerData);
            setOwnerForm({
              first_name: ownerData?.first_name || "",
              last_name: ownerData?.last_name || "",
              email: ownerData?.email || "",
              telefone: ownerData?.telefone || ""
            });
          } catch (ownerErr) {
            console.error("Erro ao carregar dono do animal:", ownerErr);
            setOwner(null);
            setOwnerForm({ first_name: "", last_name: "", email: "", telefone: "" });
          }
        } else {
          setOwner(null);
          setOwnerForm({ first_name: "", last_name: "", email: "", telefone: "" });
        }
      } catch (err) {
        setError(err.response?.data?.message || "Não foi possível carregar os detalhes do animal.");
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [id]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleOwnerChange = (event) => {
    const { name, value } = event.target;
    setOwnerForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/pets/${id}`, {
        nome: form.nome.trim(),
        sexo: form.sexo || null,
        data_nascimento: form.data_nascimento || null,
        peso: form.peso === "" ? null : Number(form.peso),
        num_chip: form.num_chip.trim(),
        cor: form.cor.trim(),
        porte: form.porte.trim(),
        esterilizado: Boolean(form.esterilizado),
        alergias: form.alergias.trim(),
        observacoes: form.observacoes.trim(),
        estado: form.estado || "Ativo"
      });

      const updatedPet = { ...pet, ...form, data_nascimento: form.data_nascimento };
      setPet(updatedPet);
      setEditing(false);
      Swal.fire({ title: "Atualizado!", text: "Os dados do animal foram atualizados.", icon: "success", customClass: { popup: "vetlumen-swal-popup", title: "vetlumen-swal-title", htmlContainer: "vetlumen-swal-text", confirmButton: "vetlumen-swal-button" } });
    } catch (err) {
      Swal.fire({ title: "Erro", text: "Não foi possível atualizar os dados do animal.", icon: "error", customClass: { popup: "vetlumen-swal-popup", title: "vetlumen-swal-title", htmlContainer: "vetlumen-swal-text", confirmButton: "vetlumen-swal-button" } });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOwner = async () => {
    if (!pet?.id_user) {
      Swal.fire({ title: "Erro", text: "Não foi possível identificar o dono deste animal.", icon: "error", customClass: { popup: "vetlumen-swal-popup", title: "vetlumen-swal-title", htmlContainer: "vetlumen-swal-text", confirmButton: "vetlumen-swal-button" } });
      return;
    }

    try {
      setSavingOwner(true);
      await api.put(`/users/${pet.id_user}`, {
        first_name: ownerForm.first_name.trim(),
        last_name: ownerForm.last_name.trim(),
        email: ownerForm.email.trim(),
        telefone: ownerForm.telefone.trim()
      });

      const updatedOwner = {
        ...(owner || {}),
        id_user: pet.id_user,
        first_name: ownerForm.first_name.trim(),
        last_name: ownerForm.last_name.trim(),
        email: ownerForm.email.trim(),
        telefone: ownerForm.telefone.trim()
      };
      setOwner(updatedOwner);
      setEditingOwner(false);
      Swal.fire({ title: "Atualizado!", text: "Os dados do dono foram atualizados.", icon: "success", customClass: { popup: "vetlumen-swal-popup", title: "vetlumen-swal-title", htmlContainer: "vetlumen-swal-text", confirmButton: "vetlumen-swal-button" } });
    } catch (err) {
      Swal.fire({ title: "Erro", text: "Não foi possível atualizar os dados do dono.", icon: "error", customClass: { popup: "vetlumen-swal-popup", title: "vetlumen-swal-title", htmlContainer: "vetlumen-swal-text", confirmButton: "vetlumen-swal-button" } });
    } finally {
      setSavingOwner(false);
    }
  };

  if (loading) {
    return <main className="pet-details-container"><p className="pets-empty">A carregar detalhes...</p></main>;
  }

  if (error) {
    return <main className="pet-details-container"><p className="pets-empty">{error}</p></main>;
  }

  if (!pet) {
    return <main className="pet-details-container"><p className="pets-empty">Nenhum animal encontrado.</p></main>;
  }

  return (
    <main className="pet-details-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left"></i>
        Voltar
      </button>

      <div className="pet-details-header">
        <img
          src={pet.fotografia || "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=800&q=80"}
          alt={pet.nome}
          className="pet-details-image"
        />

        <div>
          {editing ? (
            <input className="inline-edit-input inline-edit-title" name="nome" value={form.nome} onChange={handleChange} />
          ) : (
            <h1>{pet.nome}</h1>
          )}
          <p>{getSpeciesLabel(pet.id_species, speciesOptions)} • {getBreedLabel(pet)}</p>
          <span>{getAgeLabel(pet.data_nascimento)}</span>
        </div>
      </div>

      <div className="pet-details-content">
        <div className="details-card">
          <h2>
            <i className="bi bi-info-circle"></i>
            Informação Geral
          </h2>

          {isEditable && (
            <div className="record-actions" style={{ marginBottom: "1rem" }}>
              {editing ? (
                <>
                  <button className="inline-save-btn" onClick={handleSave} disabled={saving}>{saving ? "A guardar..." : "Guardar"}</button>
                  <button className="inline-cancel-btn" onClick={() => setEditing(false)}>Cancelar</button>
                </>
              ) : (
                <button className="inline-edit-btn" onClick={() => setEditing(true)} title="Editar animal">
                  <i className="bi bi-pencil-square"></i>
                </button>
              )}
            </div>
          )}

          <div className="details-grid">
            <div>
              <strong>Sexo</strong>
              {editing ? (
                <select className="inline-edit-input" name="sexo" value={form.sexo} onChange={handleChange}>
                  <option value="">Sem indicação</option>
                  <option value="M">Macho</option>
                  <option value="F">Fêmea</option>
                </select>
              ) : (
                <p>{pet.sexo || "Não registado"}</p>
              )}
            </div>

            <div>
              <strong>Data de nascimento</strong>
              {editing ? (
                <input className="inline-edit-input" name="data_nascimento" type="date" value={form.data_nascimento} onChange={handleChange} />
              ) : (
                <p>{formatDate(pet.data_nascimento)}</p>
              )}
            </div>

            <div>
              <strong>Peso</strong>
              {editing ? (
                <input className="inline-edit-input" name="peso" type="number" step="0.1" value={form.peso} onChange={handleChange} />
              ) : (
                <p>{pet.peso ? `${pet.peso}kg` : "Não registado"}</p>
              )}
            </div>

            <div>
              <strong>Porte</strong>
              {editing ? (
                <input className="inline-edit-input" name="porte" value={form.porte} onChange={handleChange} />
              ) : (
                <p>{pet.porte || "Não registado"}</p>
              )}
            </div>

            <div>
              <strong>Cor</strong>
              {editing ? (
                <input className="inline-edit-input" name="cor" value={form.cor} onChange={handleChange} />
              ) : (
                <p>{pet.cor || "Não registada"}</p>
              )}
            </div>

            <div>
              <strong>Microchip</strong>
              {editing ? (
                <input className="inline-edit-input" name="num_chip" value={form.num_chip} onChange={handleChange} />
              ) : (
                <p>{pet.num_chip || "Não registado"}</p>
              )}
            </div>
          </div>
        </div>

        <div className="details-card">
          <h2>
            <i className="bi bi-heart-pulse"></i>
            Saúde
          </h2>

          <div className="details-grid">
            <div>
              <strong>Esterilizado</strong>
              {editing ? (
                <label className="pet-swal-checkbox" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem" }}>
                  <input name="esterilizado" type="checkbox" checked={form.esterilizado} onChange={handleChange} />
                  <span>Sim</span>
                </label>
              ) : (
                <p>{pet.esterilizado ? "Sim" : "Não"}</p>
              )}
            </div>

            <div>
              <strong>Alergias</strong>
              {editing ? (
                <textarea className="inline-edit-textarea" name="alergias" value={form.alergias} onChange={handleChange} />
              ) : (
                <p>{pet.alergias || "Nenhuma"}</p>
              )}
            </div>

            <div>
              <strong>Observações de saúde</strong>
              {editing ? (
                <textarea className="inline-edit-textarea" name="observacoes" value={form.observacoes} onChange={handleChange} />
              ) : (
                <p>{pet.observacoes || "Sem observações"}</p>
              )}
            </div>
          </div>
        </div>

        <div className="details-card">
          <h2>
            <i className="bi bi-person-badge"></i>
            Dono
          </h2>

          {isEditable && (
            <div className="record-actions" style={{ marginBottom: "1rem" }}>
              {editingOwner ? (
                <>
                  <button className="inline-save-btn" onClick={handleSaveOwner} disabled={savingOwner}>{savingOwner ? "A guardar..." : "Guardar"}</button>
                  <button className="inline-cancel-btn" onClick={() => setEditingOwner(false)}>Cancelar</button>
                </>
              ) : (
                <button className="inline-edit-btn" onClick={() => setEditingOwner(true)} title="Editar dono">
                  <i className="bi bi-pencil-square"></i>
                </button>
              )}
            </div>
          )}

          <div className="details-grid">
            <div>
              <strong>Nome completo</strong>
              {editingOwner ? (
                <>
                  <input className="inline-edit-input" name="first_name" value={ownerForm.first_name} onChange={handleOwnerChange} placeholder="Nome" />
                  <input className="inline-edit-input" name="last_name" value={ownerForm.last_name} onChange={handleOwnerChange} placeholder="Apelido" style={{ marginTop: "0.5rem" }} />
                </>
              ) : (
                <p>{getOwnerName(owner)}</p>
              )}
            </div>

            <div>
              <strong>Email</strong>
              {editingOwner ? (
                <input className="inline-edit-input" name="email" type="email" value={ownerForm.email} onChange={handleOwnerChange} />
              ) : (
                <p>{owner?.email || "Não registado"}</p>
              )}
            </div>

            <div>
              <strong>Telefone</strong>
              {editingOwner ? (
                <input className="inline-edit-input" name="telefone" value={ownerForm.telefone} onChange={handleOwnerChange} />
              ) : (
                <p>{owner?.telefone || "Não registado"}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PetDetails;
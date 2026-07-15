import React, { useEffect, useState } from "react";
import "./VetPatients.css";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const baseSpeciesOptions = [{ value: "all", label: "Todas as espécies" }];

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

const VetPatients = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [speciesOptions, setSpeciesOptions] = useState(baseSpeciesOptions);
  const [speciesFilter, setSpeciesFilter] = useState(baseSpeciesOptions[0]);

  const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/api\/?$/i, "");

  const getPetImageUrl = (fotografia) => {
    if (!fotografia) return null;
    if (String(fotografia).startsWith("http")) return fotografia;
    if (String(fotografia).startsWith("/")) return `${API_BASE}${fotografia}`;
    return `${API_BASE}/uploads/${fotografia}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [petsResponse, speciesResponse, usersResponse] = await Promise.all([
        api.get("/pets"),
        api.get("/species"),
        api.get("/users")
      ]);

      const speciesFromApi = (speciesResponse.data || []).map((species) => ({
        value: species.id_species,
        label: species.nome_especie
      }));

      const usersMap = new Map((usersResponse.data || []).map((user) => [Number(user.id_user), user]));

      const enrichedPets = (petsResponse.data || []).map((pet) => {
        const owner = usersMap.get(Number(pet.id_user));
        const ownerName = owner
          ? `${owner.first_name || ""} ${owner.last_name || ""}`.trim() || owner.email
          : "Tutor não identificado";

        return {
          ...pet,
          ownerName
        };
      });

      setSpeciesOptions([{ value: "all", label: "Todas as espécies" }, ...speciesFromApi]);
      setSpeciesFilter({ value: "all", label: "Todas as espécies" });
      setPets(enrichedPets);
    } catch (err) {
      setError(err.response?.data?.message || "Não foi possível carregar os pacientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddClinicalRecord = (pet) => {
    navigate(`/vet/patients/${pet.id_pet}/records/new`);
  };

  const filteredPets = pets.filter((pet) => {
    const searchValue = search.toLowerCase();
    const matchesSearch =
      pet.nome?.toLowerCase().includes(searchValue) ||
      pet.ownerName?.toLowerCase().includes(searchValue);
    const matchesSpecies = speciesFilter.value === "all" || pet.id_species === speciesFilter.value;

    return matchesSearch && matchesSpecies;
  });

  return (
    <main className="pets-container">
      <div className="pets-header">
        <div>
          <h1>Pacientes</h1>
          <p>Consulte todos os animais dos clientes e aceda aos respetivos registos clínicos.</p>
        </div>
      </div>

      <div className="pets-filters">
        <div className="search-box">
          <i className="bi bi-search"></i>
          <input
            placeholder="Pesquisar por nome do animal ou dono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          classNamePrefix="pets-select"
          options={speciesOptions}
          value={speciesFilter}
          onChange={setSpeciesFilter}
          isSearchable={false}
        />
      </div>

      {loading && <p className="pets-empty">A carregar pacientes...</p>}
      {!loading && error && <p className="pets-empty">{error}</p>}

      {!loading && !error && filteredPets.length === 0 && (
        <p className="pets-empty">Não foram encontrados pacientes.</p>
      )}

      {!loading && !error && filteredPets.length > 0 && (
        <div className="pets-table-wrapper">
          <table className="pets-table">
            <thead>
              <tr>
                <th>Animal</th>
                <th>Espécie</th>
                <th>Raça</th>
                <th>Idade / Peso</th>
                <th>Dono</th>
                <th>Estado</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {filteredPets.map((pet) => (
                <tr key={pet.id_pet}>
                  <td data-label="Animal">
                    <div className="pet-table-cell">
                      <div className="pet-table-avatar">
                        {getPetImageUrl(pet.fotografia) ? (
                          <img
                            src={getPetImageUrl(pet.fotografia)}
                            className="pet-image"
                            alt={pet.nome}
                          />
                        ) : (
                          <i className="bi bi-heart-pulse"></i>
                        )}
                      </div>

                      <div className="pet-table-primary">
                        <strong>{pet.nome}</strong>
                        <span>{formatDate(pet.data_nascimento)}</span>
                      </div>
                    </div>
                  </td>

                  <td data-label="Espécie">{getSpeciesLabel(pet.id_species, speciesOptions)}</td>

                  <td data-label="Raça">{getBreedLabel(pet) || "Não definida"}</td>

                  <td data-label="Idade / Peso">
                    <div className="pet-table-stack">
                      <span>{getAgeLabel(pet.data_nascimento)}</span>
                      <span>{pet.peso ? `${pet.peso}kg` : "Peso não registado"}</span>
                    </div>
                  </td>

                  <td data-label="Dono">{pet.ownerName}</td>

                  <td data-label="Estado">
                    <span className="pet-status-badge">{pet.estado || "Ativo"}</span>
                  </td>

                  <td data-label="Ações">
                    <div className="pet-table-actions">
                      <button className="details-btn" onClick={() => navigate(`/vet/patients/${pet.id_pet}`)} title="Detalhes">
                        <i className="bi bi-eye"></i>
                      </button>

                      <button className="history-btn" onClick={() => navigate(`/vet/patients/${pet.id_pet}/history`)} title="Histórico">
                        <i className="bi bi-file-medical"></i>
                      </button>

                      <button className="vaccine-btn" onClick={() => navigate(`/vet/patients/${pet.id_pet}/vaccines`)} title="Vacinas">
                        <i className="bi bi-capsule"></i>
                      </button>

                      <button className="add-record-btn" onClick={() => handleAddClinicalRecord(pet)} title="Acrescentar registo clínico">
                        <i className="bi bi-plus-circle"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
};

export default VetPatients;
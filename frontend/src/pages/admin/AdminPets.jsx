import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Select from "react-select";
import api from "../../services/api";
import "./AdminPets.css";

const rowsPerPageOptions = [10, 20, 50];

const stateFilterOptions = [
	{ value: "all", label: "Todos os estados" },
	{ value: "Ativo", label: "Ativos" },
	{ value: "Inativo", label: "Inativos" }
];

const sexFilterOptions = [
	{ value: "all", label: "Todos os sexos" },
	{ value: "M", label: "Macho" },
	{ value: "F", label: "Fêmea" }
];

const getFullOwnerName = (user) => `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Utilizador";

const getPetName = (pet) => pet?.nome || "Animal";

const formatDate = (value) => {
	if (!value) return "-";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-PT");
};

const getSexLabel = (value) => {
	if (value === "M") return "Macho";
	if (value === "F") return "Fêmea";
	return "-";
};

const escapeHtml = (value) =>
	String(value || "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");

const getInitialFormData = (pet = null) => ({
	nome: pet?.nome || "",
	sexo: pet?.sexo || "",
	data_nascimento: pet?.data_nascimento || "",
	peso: pet?.peso ?? "",
	num_chip: pet?.num_chip || "",
	fotografia: pet?.fotografia || "",
	id_species: pet?.id_species ? String(pet.id_species) : "",
	id_breed: pet?.id_breed ? String(pet.id_breed) : "",
	id_user: pet?.id_user ? String(pet.id_user) : "",
	cor: pet?.cor || "",
	esterilizado: Boolean(pet?.esterilizado),
	alergias: pet?.alergias || "",
	observacoes: pet?.observacoes || "",
	porte: pet?.porte || "",
	estado: pet?.estado || "Ativo"
});

const AdminPets = () => {
	const navigate = useNavigate();
	const [pets, setPets] = useState([]);
	const [users, setUsers] = useState([]);
	const [species, setSpecies] = useState([]);
	const [breeds, setBreeds] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [speciesFilter, setSpeciesFilter] = useState({ value: "all", label: "Todas as espécies" });
	const [stateFilter, setStateFilter] = useState(stateFilterOptions[0]);
	const [sexFilter, setSexFilter] = useState(sexFilterOptions[0]);
	const [pageSize, setPageSize] = useState(10);
	const [currentPage, setCurrentPage] = useState(1);
	const [currentPetId, setCurrentPetId] = useState(null);

	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);
				setError("");

				const [petsResponse, usersResponse, speciesResponse, breedsResponse] = await Promise.all([
					api.get("/pets"),
					api.get("/users"),
					api.get("/species"),
					api.get("/breeds")
				]);

				setPets(petsResponse.data || []);
				setUsers(usersResponse.data || []);
				setSpecies(speciesResponse.data || []);
				setBreeds(breedsResponse.data || []);
			} catch (loadError) {
				console.error("Erro ao carregar pets:", loadError);
				setError("Não foi possível carregar a lista de animais.");
				setPets([]);
				setUsers([]);
				setSpecies([]);
				setBreeds([]);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, []);

	const petCounts = useMemo(() => ({
		total: pets.length,
		ativos: pets.filter((pet) => String(pet.estado || "").toLowerCase() === "ativo").length,
		esterilizados: pets.filter((pet) => Boolean(pet.esterilizado)).length,
		especies: new Set(pets.map((pet) => pet.id_species).filter(Boolean)).size
	}), [pets]);

	const speciesOptions = useMemo(() => [
		{ value: "all", label: "Todas as espécies" },
		...species.map((item) => ({ value: String(item.id_species), label: item.nome_especie }))
	], [species]);

	const usersById = useMemo(() => Object.fromEntries(users.map((user) => [String(user.id_user), user])), [users]);
	const speciesById = useMemo(() => Object.fromEntries(species.map((item) => [String(item.id_species), item])), [species]);
	const breedsById = useMemo(() => Object.fromEntries(breeds.map((item) => [String(item.id_breed), item])), [breeds]);

	const breedOptionsForSpecies = (speciesId) => breeds.filter((breed) => String(breed.id_species) === String(speciesId));

	const filteredPets = useMemo(() => {
		const searchValue = search.trim().toLowerCase();

		return pets.filter((pet) => {
			const owner = usersById[String(pet.id_user)];
			const speciesItem = speciesById[String(pet.id_species)];
			const breedItem = breedsById[String(pet.id_breed)];
			const ownerName = getFullOwnerName(owner).toLowerCase();
			const petName = getPetName(pet).toLowerCase();
			const speciesName = String(speciesItem?.nome_especie || "").toLowerCase();
			const breedName = String(pet.nome_raca || breedItem?.nome_raca || "").toLowerCase();
			const chip = String(pet.num_chip || "").toLowerCase();
			const state = String(pet.estado || "").toLowerCase();

			const matchesSearch =
				!searchValue ||
				petName.includes(searchValue) ||
				ownerName.includes(searchValue) ||
				speciesName.includes(searchValue) ||
				breedName.includes(searchValue) ||
				chip.includes(searchValue) ||
				state.includes(searchValue);

			const matchesSpecies = speciesFilter.value === "all" || String(pet.id_species) === String(speciesFilter.value);
			const matchesState = stateFilter.value === "all" || String(pet.estado || "") === String(stateFilter.value);
			const matchesSex = sexFilter.value === "all" || String(pet.sexo || "") === String(sexFilter.value);

			return matchesSearch && matchesSpecies && matchesState && matchesSex;
		});
	}, [breedsById, pets, search, speciesById, speciesFilter, sexFilter, stateFilter, usersById]);

	const totalPages = Math.max(1, Math.ceil(filteredPets.length / pageSize));
	const safePage = Math.min(currentPage, totalPages);
	const pageStart = (safePage - 1) * pageSize;
	const paginatedPets = filteredPets.slice(pageStart, pageStart + pageSize);
	const visibleStart = filteredPets.length === 0 ? 0 : pageStart + 1;
	const visibleEnd = Math.min(pageStart + pageSize, filteredPets.length);

	const refreshPets = async () => {
		const response = await api.get("/pets");
		setPets(response.data || []);
	};

	const handleSearchChange = (event) => {
		setCurrentPage(1);
		setSearch(event.target.value);
	};

	const handleSpeciesFilterChange = (selectedOption) => {
		setCurrentPage(1);
		setSpeciesFilter(selectedOption || speciesOptions[0]);
	};

	const handleSexFilterChange = (selectedOption) => {
		setCurrentPage(1);
		setSexFilter(selectedOption || sexFilterOptions[0]);
	};

	const handleStateFilterChange = (selectedOption) => {
		setCurrentPage(1);
		setStateFilter(selectedOption || stateFilterOptions[0]);
	};

	const handlePageSizeChange = (selectedOption) => {
		setCurrentPage(1);
		setPageSize(Number(selectedOption?.value || 10));
	};

	const updateBreedOptions = (popup, speciesId, selectedBreedId = "") => {
		const breedSelect = popup?.querySelector("#swal-breed");
		if (!breedSelect) return;

		const availableBreeds = breedOptionsForSpecies(speciesId);
		breedSelect.innerHTML = [
			'<option value="">Sem raça</option>',
			...availableBreeds.map((breed) => `<option value="${breed.id_breed}">${escapeHtml(breed.nome_raca)}</option>`)
		].join("");
		breedSelect.disabled = !speciesId;
		breedSelect.value = selectedBreedId && availableBreeds.some((breed) => String(breed.id_breed) === String(selectedBreedId)) ? String(selectedBreedId) : "";
	};

	const openPetForm = async (pet = null) => {
		const formData = getInitialFormData(pet);
		const isEditing = Boolean(pet);

		const { value } = await Swal.fire({
			title: isEditing ? "Editar animal" : "Adicionar animal",
			html: `
				<div class="pet-swal-form">
					<label class="pet-swal-field">
						<span>Nome</span>
						<input id="swal-name" class="pet-swal-input" type="text" value="${escapeHtml(formData.nome)}" placeholder="Nome do animal" />
					</label>

					<label class="pet-swal-field">
						<span>Proprietário</span>
						<select id="swal-user" class="pet-swal-input">
							<option value="">Selecionar utilizador</option>
							${users.map((user) => `<option value="${user.id_user}" ${String(user.id_user) === String(formData.id_user) ? "selected" : ""}>${escapeHtml(getFullOwnerName(user))}</option>`).join("")}
						</select>
					</label>

					<label class="pet-swal-field">
						<span>Espécie</span>
						<select id="swal-species" class="pet-swal-input">
							<option value="">Selecionar espécie</option>
							${species.map((item) => `<option value="${item.id_species}" ${String(item.id_species) === String(formData.id_species) ? "selected" : ""}>${escapeHtml(item.nome_especie)}</option>`).join("")}
						</select>
					</label>

					<label class="pet-swal-field">
						<span>Raça</span>
						<select id="swal-breed" class="pet-swal-input">
							<option value="">Sem raça</option>
						</select>
					</label>

					<label class="pet-swal-field">
						<span>Sexo</span>
						<select id="swal-sex" class="pet-swal-input">
							<option value="">Sem indicação</option>
							<option value="M" ${formData.sexo === "M" ? "selected" : ""}>Macho</option>
							<option value="F" ${formData.sexo === "F" ? "selected" : ""}>Fêmea</option>
						</select>
					</label>

					<label class="pet-swal-field">
						<span>Data de nascimento</span>
						<input id="swal-birthdate" class="pet-swal-input" type="date" value="${formData.data_nascimento}" />
					</label>

					<label class="pet-swal-field">
						<span>Peso</span>
						<input id="swal-weight" class="pet-swal-input" type="number" step="0.1" min="0" value="${formData.peso}" placeholder="0.0" />
					</label>

					<label class="pet-swal-field">
						<span>Número do chip</span>
						<input id="swal-chip" class="pet-swal-input" type="text" value="${escapeHtml(formData.num_chip)}" placeholder="Chip" />
					</label>

					<label class="pet-swal-field">
						<span>Fotografia</span>
						<input id="swal-photo" class="pet-swal-input" type="text" value="${escapeHtml(formData.fotografia)}" placeholder="URL da fotografia" />
					</label>

					<label class="pet-swal-field">
						<span>Cor</span>
						<input id="swal-color" class="pet-swal-input" type="text" value="${escapeHtml(formData.cor)}" placeholder="Cor" />
					</label>

					<label class="pet-swal-field">
						<span>Porte</span>
						<input id="swal-size" class="pet-swal-input" type="text" value="${escapeHtml(formData.porte)}" placeholder="Porte" />
					</label>

					<label class="pet-swal-field">
						<span>Estado</span>
						<select id="swal-state" class="pet-swal-input">
							<option value="Ativo" ${formData.estado === "Ativo" ? "selected" : ""}>Ativo</option>
							<option value="Inativo" ${formData.estado === "Inativo" ? "selected" : ""}>Inativo</option>
						</select>
					</label>

					<label class="pet-swal-field pet-swal-field--full pet-swal-checkbox">
						<input id="swal-sterilized" type="checkbox" ${formData.esterilizado ? "checked" : ""} />
						<span>Esterilizado</span>
					</label>

					<label class="pet-swal-field pet-swal-field--full">
						<span>Alergias</span>
						<textarea id="swal-allergies" class="pet-swal-input pet-swal-textarea" rows="3" placeholder="Alergias">${escapeHtml(formData.alergias)}</textarea>
					</label>

					<label class="pet-swal-field pet-swal-field--full">
						<span>Observações</span>
						<textarea id="swal-notes" class="pet-swal-input pet-swal-textarea" rows="3" placeholder="Observações">${escapeHtml(formData.observacoes)}</textarea>
					</label>
				</div>
			`,
			showCancelButton: true,
			confirmButtonText: isEditing ? "Guardar alterações" : "Criar animal",
			cancelButtonText: "Cancelar",
			width: "min(980px, calc(100vw - 2rem))",
			focusConfirm: false,
			customClass: {
				popup: "vetlumen-swal-popup pet-modal-popup",
				title: "vetlumen-swal-title",
				htmlContainer: "vetlumen-swal-text",
				confirmButton: "vetlumen-swal-button"
			},
			didOpen: (popup) => {
				const speciesSelect = popup.querySelector("#swal-species");
				updateBreedOptions(popup, speciesSelect?.value || "", formData.id_breed);

				speciesSelect?.addEventListener("change", (event) => {
					updateBreedOptions(popup, event.target.value, "");
				});
			},
			preConfirm: () => {
				const nome = document.getElementById("swal-name")?.value.trim();
				const id_user = document.getElementById("swal-user")?.value;
				const id_species = document.getElementById("swal-species")?.value;
				const id_breed = document.getElementById("swal-breed")?.value;
				const sexo = document.getElementById("swal-sex")?.value;
				const data_nascimento = document.getElementById("swal-birthdate")?.value || null;
				const peso = document.getElementById("swal-weight")?.value;
				const num_chip = document.getElementById("swal-chip")?.value.trim();
				const fotografia = document.getElementById("swal-photo")?.value.trim();
				const cor = document.getElementById("swal-color")?.value.trim();
				const porte = document.getElementById("swal-size")?.value.trim();
				const estado = document.getElementById("swal-state")?.value;
				const esterilizado = document.getElementById("swal-sterilized")?.checked;
				const alergias = document.getElementById("swal-allergies")?.value.trim();
				const observacoes = document.getElementById("swal-notes")?.value.trim();

				if (!nome || !id_user || !id_species) {
					Swal.showValidationMessage("Preencha o nome, proprietário e espécie.");
					return null;
				}

				return {
					nome,
					sexo,
					data_nascimento,
					peso: peso === "" ? null : Number(peso),
					num_chip,
					fotografia,
					id_species: Number(id_species),
					id_breed: id_breed ? Number(id_breed) : null,
					id_user: Number(id_user),
					cor,
					esterilizado,
					alergias,
					observacoes,
					porte,
					estado
				};
			}
		});

		if (!value) return;

		try {
			if (isEditing) {
				await api.put(`/pets/${pet.id_pet}`, value);
			} else {
				await api.post("/pets", value);
			}

			await refreshPets();

			Swal.fire({
				title: isEditing ? "Atualizado!" : "Criado!",
				text: isEditing ? "Animal atualizado com sucesso." : "Animal criado com sucesso.",
				icon: "success",
				customClass: {
					popup: "vetlumen-swal-popup",
					title: "vetlumen-swal-title",
					htmlContainer: "vetlumen-swal-text",
					confirmButton: "vetlumen-swal-button"
				}
			});
		} catch (saveError) {
			console.error("Erro ao guardar animal:", saveError);
			Swal.fire({
				title: "Erro",
				text: isEditing ? "Não foi possível atualizar o animal." : "Não foi possível criar o animal.",
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

	const handleDeletePet = async (pet) => {
		const result = await Swal.fire({
			title: "Eliminar animal?",
			text: `Tem a certeza que pretende eliminar ${getPetName(pet)}?`,
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
			setCurrentPetId(pet.id_pet);
			await api.delete(`/pets/${pet.id_pet}`);
			await refreshPets();

			Swal.fire({
				title: "Eliminado!",
				text: "Animal eliminado com sucesso.",
				icon: "success",
				customClass: {
					popup: "vetlumen-swal-popup",
					title: "vetlumen-swal-title",
					htmlContainer: "vetlumen-swal-text",
					confirmButton: "vetlumen-swal-button"
				}
			});
		} catch (deleteError) {
			console.error("Erro ao eliminar animal:", deleteError);
			Swal.fire({
				title: "Erro",
				text: "Não foi possível eliminar o animal.",
				icon: "error",
				customClass: {
					popup: "vetlumen-swal-popup",
					title: "vetlumen-swal-title",
					htmlContainer: "vetlumen-swal-text",
					confirmButton: "vetlumen-swal-button"
				}
			});
		} finally {
			setCurrentPetId(null);
		}
	};

	return (
		<main className="admin-pets dashboard-container">
			<header className="dashboard-header">
				<div>
					<h1>Animais</h1>
					<p>Consulte, crie, edite e elimine a lista de animais do sistema.</p>
				</div>

				<button className="dashboard-btn pets-add-btn" onClick={() => navigate("/admin/pets/add")}>
					<i className="bi bi-plus-lg"></i>
					Adicionar animal
				</button>
			</header>

			<section className="stats-grid pets-stats-grid">
				<div className="stat-card">
					<div className="stat-icon"><i className="bi bi-emoji-smile"></i></div>
					<div>
						<h3>{loading ? "..." : petCounts.total}</h3>
						<p>Total</p>
					</div>
				</div>

				<div className="stat-card">
					<div className="stat-icon"><i className="bi bi-search"></i></div>
					<div>
						<h3>{loading ? "..." : filteredPets.length}</h3>
						<p>Filtrados</p>
					</div>
				</div>

				<div className="stat-card">
					<div className="stat-icon"><i className="bi bi-check2-circle"></i></div>
					<div>
						<h3>{loading ? "..." : petCounts.ativos}</h3>
						<p>Ativos</p>
					</div>
				</div>

				<div className="stat-card">
					<div className="stat-icon"><i className="bi bi-diagram-3"></i></div>
					<div>
						<h3>{loading ? "..." : petCounts.especies}</h3>
						<p>Espécies</p>
					</div>
				</div>
			</section>

			<section className="dashboard-card pets-card">
				<div className="card-title pets-card-title">
					<h3>Lista de Animais</h3>
				</div>

				<div className="pets-filters">
					<div className="search-box">
						<i className="bi bi-search"></i>
						<input
							placeholder="Pesquisar por nome, tutor, espécie, raça ou chip..."
							value={search}
							onChange={handleSearchChange}
						/>
					</div>

					<label className="pets-select-field">
						<span>Espécie</span>
						<Select
							className="admin-pets-select"
							classNamePrefix="admin-pets-select"
							options={speciesOptions}
							value={speciesFilter}
							onChange={handleSpeciesFilterChange}
							isSearchable={false}
						/>
					</label>

					<label className="pets-select-field">
						<span>Sexo</span>
						<Select
							className="admin-pets-select"
							classNamePrefix="admin-pets-select"
							options={sexFilterOptions}
							value={sexFilter}
							onChange={handleSexFilterChange}
							isSearchable={false}
						/>
					</label>

					<label className="pets-select-field">
						<span>Estado</span>
						<Select
							className="admin-pets-select"
							classNamePrefix="admin-pets-select"
							options={stateFilterOptions}
							value={stateFilter}
							onChange={handleStateFilterChange}
							isSearchable={false}
						/>
					</label>

					<label className="pets-page-size">
						<span>Por página</span>
						<Select
							className="admin-pets-select"
							classNamePrefix="admin-pets-select"
							options={rowsPerPageOptions.map((option) => ({ value: option, label: `${option}` }))}
							value={rowsPerPageOptions.map((option) => ({ value: option, label: `${option}` })).find((option) => option.value === pageSize) || null}
							onChange={handlePageSizeChange}
							isSearchable={false}
						/>
					</label>
				</div>

				<div className="pets-summary">
					{filteredPets.length === 0
						? "Sem animais para os filtros selecionados."
						: `A mostrar ${visibleStart}-${visibleEnd} de ${filteredPets.length} animais.`}
				</div>

				{loading && (
					<div className="pets-empty-state">
						<i className="bi bi-hourglass-split"></i>
						<strong>A carregar animais...</strong>
					</div>
				)}

				{!loading && error && (
					<div className="pets-empty-state pets-empty-state--error">
						<i className="bi bi-exclamation-circle"></i>
						<strong>Erro</strong>
						<p>{error}</p>
					</div>
				)}

				{!loading && !error && filteredPets.length === 0 && (
					<div className="pets-empty-state">
						<i className="bi bi-emoji-frown"></i>
						<strong>Nenhum animal encontrado</strong>
						<p>Ajuste os filtros ou crie um novo animal.</p>
					</div>
				)}

				{!loading && !error && filteredPets.length > 0 && (
					<div className="pets-table-wrapper">
						<table className="pets-table">
							<thead>
								<tr>
									<th>Animal</th>
									<th>Tutor</th>
									<th>Espécie / Raça</th>
									<th>Sexo</th>
									<th>Nascimento</th>
									<th>Estado</th>
									<th>Ações</th>
								</tr>
							</thead>

							<tbody>
								{paginatedPets.map((pet) => {
									const owner = usersById[String(pet.id_user)];
									const speciesItem = speciesById[String(pet.id_species)];
									const breedItem = breedsById[String(pet.id_breed)];

									return (
										<tr key={pet.id_pet}>
											<td data-label="Animal">
												<div className="pet-cell">
													<div className="pet-avatar">
														{pet.fotografia ? <img src={pet.fotografia} alt={getPetName(pet)} /> : <i className="bi bi-heart-fill"></i>}
													</div>
													<div className="pet-primary">
														<strong>{getPetName(pet)}</strong>
														<span>{pet.cor || "Cor não indicada"}</span>
													</div>
												</div>
											</td>

											<td data-label="Tutor">
												<div className="pet-owner-cell">
													<strong>{owner ? getFullOwnerName(owner) : "-"}</strong>
													<span>{owner?.email || ""}</span>
												</div>
											</td>

											<td data-label="Espécie / Raça">
												<div className="pet-species-cell">
													<strong>{speciesItem?.nome_especie || "-"}</strong>
													<span>{pet.nome_raca || breedItem?.nome_raca || "Sem raça"}</span>
												</div>
											</td>

											<td data-label="Sexo">
												<span className={`pet-sex-badge pet-sex-badge--${String(pet.sexo || "").toLowerCase() || "none"}`}>
													{getSexLabel(pet.sexo)}
												</span>
											</td>

											<td data-label="Nascimento">{formatDate(pet.data_nascimento)}</td>

											<td data-label="Estado">
												<span className={`pet-state-badge pet-state-badge--${String(pet.estado || "").toLowerCase()}`}>
													{pet.estado || "-"}
												</span>
											</td>

											<td data-label="Ações">
												<div className="pets-actions">
													<button className="details-btn" onClick={() => navigate(`/vet/patients/${pet.id_pet}`)} title="Detalhes do animal">
														<i className="bi bi-eye"></i>
													</button>

													<button className="history-btn" onClick={() => navigate(`/vet/patients/${pet.id_pet}/history`)} title="Histórico do animal">
														<i className="bi bi-file-medical"></i>
													</button>

													<button className="vaccine-btn" onClick={() => navigate(`/vet/patients/${pet.id_pet}/vaccines`)} title="Vacinas do animal">
														<i className="bi bi-capsule"></i>
													</button>

													<button className="edit-pet-btn" onClick={() => navigate(`/admin/pets/${pet.id_pet}/edit`)} title="Editar animal">
														<i className="bi bi-pencil-square"></i>
													</button>

													<button className="delete-pet-btn" onClick={() => handleDeletePet(pet)} disabled={currentPetId === pet.id_pet} title="Eliminar animal">
														<i className={currentPetId === pet.id_pet ? "bi bi-hourglass-split" : "bi bi-trash"}></i>
													</button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}

				{!loading && !error && filteredPets.length > 0 && totalPages > 1 && (
					<div className="pets-pagination">
						<button type="button" className="pagination-btn" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safePage === 1}>
							Anterior
						</button>

						<span className="pagination-info">
							Página {safePage} de {totalPages}
						</span>

						<button type="button" className="pagination-btn" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safePage === totalPages}>
							Seguinte
						</button>
					</div>
				)}
			</section>
		</main>
	);
};

export default AdminPets;

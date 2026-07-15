import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import api from "../../services/api";
import "./AdminMarkins.css";

const rowsPerPageOptions = [10, 20, 50];

const statusOptions = [
	{ value: "all", label: "Todos os estados" },
	{ value: "Pendente", label: "Pendentes" },
	{ value: "Confirmada", label: "Confirmadas" },
	{ value: "Concluída", label: "Concluídas" },
	{ value: "Cancelada", label: "Canceladas" }
];

const dateFilterOptions = [
	{ value: "all", label: "Todas as datas" },
	{ value: "today", label: "Hoje" },
	{ value: "next7", label: "Próximos 7 dias" },
	{ value: "upcoming", label: "Próximas" },
	{ value: "past", label: "Passadas" }
];

const getPetName = (pet) => pet?.nome || "Animal";
const getOwnerName = (user) => `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Dono não identificado";
const getVetName = (user) => `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Por atribuir";

const formatDate = (value) => {
	if (!value) return "-";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-PT");
};

const formatTime = (value) => {
	if (!value) return "-";
	if (typeof value === "string") {
		return value.includes(":") ? value.slice(0, 5) : value;
	}
	return value;
};

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/api\/?$/i, "");

const getPetImageUrl = (fotografia) => {
	if (!fotografia) return null;
	if (String(fotografia).startsWith("http")) return fotografia;
	if (String(fotografia).startsWith("/")) return `${API_BASE}${fotografia}`;
	return `${API_BASE}/uploads/${fotografia}`;
};

const escapeHtml = (value) =>
	String(value || "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");

const getTodayKey = () => {
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, "0");
	const day = String(today.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const getDateKey = (value) => (value ? String(value).slice(0, 10) : "");

const parseDateKey = (value) => {
	const dateKey = getDateKey(value);
	if (!dateKey) return null;
	const [year, month, day] = dateKey.split("-").map(Number);
	if (!year || !month || !day) return null;
	return new Date(year, month - 1, day);
};

const getInitialFormData = (appointment = null) => ({
	data: appointment?.data ? String(appointment.data).slice(0, 10) : "",
	hora: appointment?.hora ? String(appointment.hora).slice(0, 5) : "",
	motivo: appointment?.motivo || "",
	estado: appointment?.estado || "Pendente",
	observacoes: appointment?.observacoes || "",
	preco_final: appointment?.preco_final ?? "",
	data_confirmacao: appointment?.data_confirmacao ? String(appointment.data_confirmacao).slice(0, 16) : "",
	duracao_real: appointment?.duracao_real ?? "",
	motivo_cancelamento: appointment?.motivo_cancelamento || "",
	id_pet: appointment?.id_pet ? String(appointment.id_pet) : "",
	id_veterinario: appointment?.id_veterinario ? String(appointment.id_veterinario) : "",
	id_service: appointment?.id_service ? String(appointment.id_service) : ""
});

const AdminAppointments = () => {
	const [appointments, setAppointments] = useState([]);
	const [pets, setPets] = useState([]);
	const [users, setUsers] = useState([]);
	const [services, setServices] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState(statusOptions[0]);
	const [dateFilter, setDateFilter] = useState(dateFilterOptions[0]);
	const [selectedDate, setSelectedDate] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [currentPage, setCurrentPage] = useState(1);
	const [currentAppointmentId, setCurrentAppointmentId] = useState(null);

	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);
				setError("");

				const [appointmentsResponse, petsResponse, usersResponse, servicesResponse] = await Promise.all([
					api.get("/appointments"),
					api.get("/pets"),
					api.get("/users"),
					api.get("/services")
				]);

				setAppointments(appointmentsResponse.data || []);
				setPets(petsResponse.data || []);
				setUsers(usersResponse.data || []);
				setServices(servicesResponse.data || []);
			} catch (loadError) {
				console.error("Erro ao carregar marcações:", loadError);
				setError("Não foi possível carregar as marcações.");
				setAppointments([]);
				setPets([]);
				setUsers([]);
				setServices([]);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, []);

	const petsById = useMemo(() => Object.fromEntries(pets.map((pet) => [String(pet.id_pet), pet])), [pets]);
	const usersById = useMemo(() => Object.fromEntries(users.map((user) => [String(user.id_user), user])), [users]);
	const servicesById = useMemo(() => Object.fromEntries(services.map((service) => [String(service.id_service), service])), [services]);

	const appointmentsData = useMemo(() => appointments.map((appointment) => {
		const pet = petsById[String(appointment.id_pet)];
		const owner = pet?.id_user ? usersById[String(pet.id_user)] : null;
		const vet = usersById[String(appointment.id_veterinario)];
		const service = servicesById[String(appointment.id_service)];

		return {
			...appointment,
			petName: getPetName(pet),
			petPhoto: getPetImageUrl(pet?.fotografia),
			ownerName: getOwnerName(owner),
			vetName: getVetName(vet),
			serviceName: service?.nome || appointment.motivo || "Consulta",
			status: appointment.estado || "Pendente"
		};
	}), [appointments, petsById, servicesById, usersById]);

	const filteredAppointments = useMemo(() => {
		const searchValue = search.trim().toLowerCase();
		const todayKey = getTodayKey();
		const todayDate = parseDateKey(todayKey);
		const nextWeekDate = todayDate ? new Date(todayDate) : null;

		if (nextWeekDate) {
			nextWeekDate.setDate(nextWeekDate.getDate() + 7);
		}

		return appointmentsData.filter((appointment) => {
			const text = `${appointment.petName || ""} ${appointment.ownerName || ""} ${appointment.vetName || ""} ${appointment.serviceName || ""} ${appointment.motivo || ""}`.toLowerCase();
			const matchesSearch = !searchValue || text.includes(searchValue);
			const matchesStatus = statusFilter.value === "all" || appointment.status === statusFilter.value;

			const appointmentDate = getDateKey(appointment.data);
			const appointmentDateObject = parseDateKey(appointmentDate);
			let matchesDate;

			if (selectedDate) {
				matchesDate = appointmentDate === selectedDate;
			} else {
				switch (dateFilter.value) {
					case "today":
						matchesDate = appointmentDate === todayKey;
						break;
					case "next7":
						matchesDate = Boolean(appointmentDateObject && todayDate && nextWeekDate && appointmentDateObject >= todayDate && appointmentDateObject <= nextWeekDate);
						break;
					case "upcoming":
						matchesDate = Boolean(appointmentDateObject && todayDate && appointmentDateObject >= todayDate);
						break;
					case "past":
						matchesDate = Boolean(appointmentDateObject && todayDate && appointmentDateObject < todayDate);
						break;
					default:
						matchesDate = true;
				}
			}

			return matchesSearch && matchesStatus && matchesDate;
		});
	}, [appointmentsData, dateFilter, search, selectedDate, statusFilter]);

	const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / pageSize));
	const safePage = Math.min(currentPage, totalPages);
	const pageStart = (safePage - 1) * pageSize;
	const paginatedAppointments = filteredAppointments.slice(pageStart, pageStart + pageSize);
	const visibleStart = filteredAppointments.length === 0 ? 0 : pageStart + 1;
	const visibleEnd = Math.min(pageStart + pageSize, filteredAppointments.length);

	const refreshAppointments = async () => {
		const response = await api.get("/appointments");
		setAppointments(response.data || []);
	};

	const openAppointmentForm = async (appointment = null) => {
		const formData = getInitialFormData(appointment);
		const isEditing = Boolean(appointment);

		const vetOptions = users.filter((user) => Number(user.id_role) === 2);

		const { value } = await Swal.fire({
			title: isEditing ? "Editar marcação" : "Criar marcação",
			html: `
				<div class="marking-swal-form">
					<label class="marking-swal-field">
						<span>Data</span>
						<input id="swal-date" class="marking-swal-input" type="date" value="${formData.data}" />
					</label>

					<label class="marking-swal-field">
						<span>Hora</span>
						<input id="swal-time" class="marking-swal-input" type="time" value="${formData.hora}" />
					</label>

					<label class="marking-swal-field marking-swal-field--full">
						<span>Motivo</span>
						<input id="swal-motive" class="marking-swal-input" type="text" value="${escapeHtml(formData.motivo)}" placeholder="Motivo da consulta" />
					</label>

					<label class="marking-swal-field">
						<span>Animal</span>
						<select id="swal-pet" class="marking-swal-input">
							<option value="">Selecionar animal</option>
							${pets.map((pet) => `<option value="${pet.id_pet}" ${String(pet.id_pet) === String(formData.id_pet) ? "selected" : ""}>${escapeHtml(`${getPetName(pet)} - ${getOwnerName(usersById[String(pet.id_user)])}`)}</option>`).join("")}
						</select>
					</label>

					<label class="marking-swal-field">
						<span>Veterinário</span>
						<select id="swal-vet" class="marking-swal-input">
							<option value="">Selecionar veterinário</option>
							${vetOptions.map((vet) => `<option value="${vet.id_user}" ${String(vet.id_user) === String(formData.id_veterinario) ? "selected" : ""}>${escapeHtml(getVetName(vet))}</option>`).join("")}
						</select>
					</label>

					<label class="marking-swal-field">
						<span>Serviço</span>
						<select id="swal-service" class="marking-swal-input">
							<option value="">Selecionar serviço</option>
							${services.map((service) => `<option value="${service.id_service}" ${String(service.id_service) === String(formData.id_service) ? "selected" : ""}>${escapeHtml(service.nome)}</option>`).join("")}
						</select>
					</label>

					<label class="marking-swal-field">
						<span>Estado</span>
						<select id="swal-status" class="marking-swal-input">
							${statusOptions.filter((option) => option.value !== "all").map((option) => `<option value="${option.value}" ${String(option.value) === String(formData.estado) ? "selected" : ""}>${option.label}</option>`).join("")}
						</select>
					</label>

					<label class="marking-swal-field">
						<span>Preço final</span>
						<input id="swal-price" class="marking-swal-input" type="number" step="0.01" min="0" value="${formData.preco_final}" placeholder="0.00" />
					</label>

					<label class="marking-swal-field">
						<span>Duração real (min)</span>
						<input id="swal-duration" class="marking-swal-input" type="number" min="0" value="${formData.duracao_real}" placeholder="Minutos" />
					</label>

					<label class="marking-swal-field marking-swal-field--full">
						<span>Observações</span>
						<textarea id="swal-notes" class="marking-swal-input marking-swal-textarea" rows="3">${escapeHtml(formData.observacoes)}</textarea>
					</label>

					<label class="marking-swal-field marking-swal-field--full">
						<span>Motivo de cancelamento</span>
						<textarea id="swal-cancel-reason" class="marking-swal-input marking-swal-textarea" rows="2">${escapeHtml(formData.motivo_cancelamento)}</textarea>
					</label>
				</div>
			`,
			showCancelButton: true,
			confirmButtonText: isEditing ? "Guardar alterações" : "Criar marcação",
			cancelButtonText: "Cancelar",
			width: "min(980px, calc(100vw - 2rem))",
			focusConfirm: false,
			customClass: {
				popup: "vetlumen-swal-popup marking-modal-popup",
				title: "vetlumen-swal-title",
				htmlContainer: "vetlumen-swal-text",
				confirmButton: "vetlumen-swal-button"
			},
			preConfirm: () => {
				const data = document.getElementById("swal-date")?.value;
				const hora = document.getElementById("swal-time")?.value;
				const motivo = document.getElementById("swal-motive")?.value.trim();
				const id_pet = document.getElementById("swal-pet")?.value;
				const id_veterinario = document.getElementById("swal-vet")?.value;
				const id_service = document.getElementById("swal-service")?.value;
				const estado = document.getElementById("swal-status")?.value;
				const preco_final = document.getElementById("swal-price")?.value;
				const duracao_real = document.getElementById("swal-duration")?.value;
				const observacoes = document.getElementById("swal-notes")?.value.trim();
				const motivo_cancelamento = document.getElementById("swal-cancel-reason")?.value.trim();

				if (!data || !hora || !motivo || !id_pet || !id_veterinario || !id_service) {
					Swal.showValidationMessage("Preencha data, hora, motivo, animal, veterinário e serviço.");
					return null;
				}

				return {
					data,
					hora,
					motivo,
					estado,
					observacoes,
					preco_final: preco_final === "" ? null : Number(preco_final),
					motivo_cancelamento,
					duracao_real: duracao_real === "" ? null : Number(duracao_real),
					id_pet: Number(id_pet),
					id_veterinario: Number(id_veterinario),
					id_service: Number(id_service)
				};
			}
		});

		if (!value) return;

		try {
			if (isEditing) {
				await api.put(`/appointments/${appointment.id_appointment}`, value);
			} else {
				await api.post("/appointments", value);
			}

			await refreshAppointments();

			Swal.fire({
				title: isEditing ? "Atualizada!" : "Criada!",
				text: isEditing ? "Marcação atualizada com sucesso." : "Marcação criada com sucesso.",
				icon: "success",
				customClass: {
					popup: "vetlumen-swal-popup",
					title: "vetlumen-swal-title",
					htmlContainer: "vetlumen-swal-text",
					confirmButton: "vetlumen-swal-button"
				}
			});
		} catch (saveError) {
			console.error("Erro ao guardar marcação:", saveError);
			Swal.fire({
				title: "Erro",
				text: isEditing ? "Não foi possível atualizar a marcação." : "Não foi possível criar a marcação.",
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

	const handleDeleteAppointment = async (appointment) => {
		const result = await Swal.fire({
			title: "Eliminar marcação?",
			text: `Tem a certeza que pretende eliminar a marcação de ${appointment.petName}?`,
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
			setCurrentAppointmentId(appointment.id_appointment);
			await api.delete(`/appointments/${appointment.id_appointment}`);
			await refreshAppointments();

			Swal.fire({
				title: "Eliminada!",
				text: "Marcação eliminada com sucesso.",
				icon: "success",
				customClass: {
					popup: "vetlumen-swal-popup",
					title: "vetlumen-swal-title",
					htmlContainer: "vetlumen-swal-text",
					confirmButton: "vetlumen-swal-button"
				}
			});
		} catch (deleteError) {
			console.error("Erro ao eliminar marcação:", deleteError);
			Swal.fire({
				title: "Erro",
				text: "Não foi possível eliminar a marcação.",
				icon: "error",
				customClass: {
					popup: "vetlumen-swal-popup",
					title: "vetlumen-swal-title",
					htmlContainer: "vetlumen-swal-text",
					confirmButton: "vetlumen-swal-button"
				}
			});
		} finally {
			setCurrentAppointmentId(null);
		}
	};

	const getStatusClass = (status) => {
		switch (status) {
			case "Confirmada":
				return "appointment-status--confirmed";
			case "Concluída":
				return "appointment-status--completed";
			case "Cancelada":
				return "appointment-status--cancelled";
			default:
				return "appointment-status--pending";
		}
	};

	return (
		<main className="admin-markings dashboard-container">
			<header className="dashboard-header">
				<div>
					<h1>Marcações</h1>
					<p>Consulte, crie, edite e elimine todas as marcações do sistema.</p>
				</div>

				<button className="dashboard-btn markings-add-btn" onClick={() => openAppointmentForm()}>
					<i className="bi bi-plus-lg"></i>
					Nova marcação
				</button>
			</header>

			<section className="stats-grid markings-stats-grid">
				<div className="stat-card">
					<div className="stat-icon"><i className="bi bi-calendar2-week"></i></div>
					<div><h3>{loading ? "..." : appointments.length}</h3><p>Total</p></div>
				</div>
				<div className="stat-card">
					<div className="stat-icon"><i className="bi bi-search"></i></div>
					<div><h3>{loading ? "..." : filteredAppointments.length}</h3><p>Filtradas</p></div>
				</div>
				<div className="stat-card">
					<div className="stat-icon"><i className="bi bi-hourglass-split"></i></div>
					<div><h3>{loading ? "..." : appointmentsData.filter((item) => item.status === "Pendente").length}</h3><p>Pendentes</p></div>
				</div>
				<div className="stat-card">
					<div className="stat-icon"><i className="bi bi-check2-circle"></i></div>
					<div><h3>{loading ? "..." : appointmentsData.filter((item) => item.status === "Confirmada").length}</h3><p>Confirmadas</p></div>
				</div>
			</section>

			<section className="dashboard-card markings-card">
				<div className="card-title markings-card-title">
					<h3>Lista de Marcações</h3>
				</div>

				<div className="markings-filters">
					<div className="search-box">
						<i className="bi bi-search"></i>
						<input
							placeholder="Pesquisar por animal, dono, veterinário ou serviço..."
							value={search}
							onChange={(event) => setSearch(event.target.value)}
						/>
					</div>

					<label className="markings-select-field">
						<span>Estado</span>
						<select value={statusFilter.value} onChange={(event) => setStatusFilter(statusOptions.find((option) => option.value === event.target.value) || statusOptions[0])}>
							{statusOptions.map((option) => (
								<option key={option.value} value={option.value}>{option.label}</option>
							))}
						</select>
					</label>

					<label className="markings-select-field">
						<span>Filtro de data</span>
						<select value={dateFilter.value} onChange={(event) => setDateFilter(dateFilterOptions.find((option) => option.value === event.target.value) || dateFilterOptions[0])}>
							{dateFilterOptions.map((option) => (
								<option key={option.value} value={option.value}>{option.label}</option>
							))}
						</select>
					</label>

					<label className="markings-select-field">
						<span>Data</span>
						<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
					</label>

					<label className="markings-page-size">
						<span>Por página</span>
						<select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
							{rowsPerPageOptions.map((option) => (
								<option key={option} value={option}>{option}</option>
							))}
						</select>
					</label>
				</div>

				<div className="markings-summary">
					{filteredAppointments.length === 0
						? "Sem marcações para os filtros selecionados."
						: `A mostrar ${visibleStart}-${visibleEnd} de ${filteredAppointments.length} marcações.`}
				</div>

				{loading && (
					<div className="markings-empty-state">
						<i className="bi bi-hourglass-split"></i>
						<strong>A carregar marcações...</strong>
					</div>
				)}

				{!loading && error && (
					<div className="markings-empty-state markings-empty-state--error">
						<i className="bi bi-exclamation-circle"></i>
						<strong>Erro</strong>
						<p>{error}</p>
					</div>
				)}

				{!loading && !error && filteredAppointments.length === 0 && (
					<div className="markings-empty-state">
						<i className="bi bi-calendar-x"></i>
						<strong>Nenhuma marcação encontrada</strong>
						<p>Ajuste os filtros ou crie uma nova marcação.</p>
					</div>
				)}

				{!loading && !error && filteredAppointments.length > 0 && (
					<div className="markings-table-wrapper">
						<table className="markings-table">
							<thead>
								<tr>
									<th>Animal</th>
									<th>Dono</th>
									<th>Veterinário</th>
									<th>Serviço</th>
									<th>Data</th>
									<th>Hora</th>
									<th>Estado</th>
									<th>Ações</th>
								</tr>
							</thead>

							<tbody>
								{paginatedAppointments.map((appointment) => (
									<tr key={appointment.id_appointment}>
										<td data-label="Animal">
											<div className="marking-cell">
												<div className="marking-avatar">
														{appointment.petPhoto ? (
															<img src={appointment.petPhoto} alt={appointment.petName} />
														) : (
															<i className="bi bi-image"></i>
														)}
													</div>
												<div className="marking-primary">
													<strong>{appointment.petName}</strong>
													<span>{appointment.motivo || "Consulta"}</span>
												</div>
											</div>
										</td>
										<td data-label="Dono">
											<div className="marking-meta">
												<strong>{appointment.ownerName}</strong>
											</div>
										</td>
										<td data-label="Veterinário">{appointment.vetName}</td>
										<td data-label="Serviço">{appointment.serviceName}</td>
										<td data-label="Data">{formatDate(appointment.data)}</td>
										<td data-label="Hora">{formatTime(appointment.hora)}</td>
										<td data-label="Estado">
											<span className={`marking-status-badge ${getStatusClass(appointment.status)}`}>{appointment.status}</span>
										</td>
										<td data-label="Ações">
											<div className="markings-actions">
												<button className="edit-marking-btn" onClick={() => openAppointmentForm(appointment)}>
													<i className="bi bi-pencil-square"></i>
												</button>

												<button className="delete-marking-btn" onClick={() => handleDeleteAppointment(appointment)} disabled={currentAppointmentId === appointment.id_appointment}>
													<i className={currentAppointmentId === appointment.id_appointment ? "bi bi-hourglass-split" : "bi bi-trash"}></i>
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{!loading && !error && filteredAppointments.length > 0 && totalPages > 1 && (
					<div className="markings-pagination">
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

export default AdminAppointments;

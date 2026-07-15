import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import api from "../../services/api";
import "./AdminServices.css";

const rowsPerPageOptions = [10, 20, 50];

const statusOptions = [
	{ value: "all", label: "Todos os estados" },
	{ value: "Ativo", label: "Ativos" },
	{ value: "Inativo", label: "Inativos" }
];

const formatEuro = (value) => {
	const number = Number(value);
	if (Number.isNaN(number)) return "0.00€";
	return `${number.toFixed(2)}€`;
};

const getDurationLabel = (minutes) => {
	const duration = Number(minutes);
	if (!duration) return "-";
	if (duration < 60) return `${duration} min`;

	const hours = Math.floor(duration / 60);
	const remainingMinutes = duration % 60;
	if (!remainingMinutes) return `${hours}h`;
	return `${hours}h ${remainingMinutes}min`;
};

const getStatusLabel = (value) => (value ? "Ativo" : "Inativo");

const escapeHtml = (value) =>
	String(value || "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");

const getInitialFormData = (service = null) => ({
	nome: service?.nome || "",
	descricao: service?.descricao || "",
	preco: service?.preco ?? "",
	duracao: service?.duracao ?? "",
	ativo: service?.ativo === undefined ? true : Boolean(service.ativo)
});

const AdminServices = () => {
	const [services, setServices] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState(statusOptions[0]);
	const [pageSize, setPageSize] = useState(rowsPerPageOptions[0]);
	const [currentPage, setCurrentPage] = useState(1);
	const [currentServiceId, setCurrentServiceId] = useState(null);

	useEffect(() => {
		const loadServices = async () => {
			try {
				setLoading(true);
				setError("");

				const response = await api.get("/services");
				setServices(response.data || []);
			} catch (loadError) {
				console.error("Erro ao carregar serviços:", loadError);
				setError("Não foi possível carregar os serviços.");
				setServices([]);
			} finally {
				setLoading(false);
			}
		};

		loadServices();
	}, []);

	const servicesData = useMemo(
		() =>
			services.map((service) => ({
				...service,
				uiStatus: getStatusLabel(Boolean(service.ativo))
			})),
		[services]
	);

	const filteredServices = useMemo(() => {
		const searchValue = search.trim().toLowerCase();

		return servicesData.filter((service) => {
			const text = `${service.nome || ""} ${service.descricao || ""} ${service.preco || ""} ${service.duracao || ""} ${service.uiStatus || ""}`.toLowerCase();
			const matchesSearch = !searchValue || text.includes(searchValue);
			const matchesStatus = statusFilter.value === "all" || service.uiStatus === statusFilter.value;
			return matchesSearch && matchesStatus;
		});
	}, [search, servicesData, statusFilter]);

	const totalPages = Math.max(1, Math.ceil(filteredServices.length / pageSize));
	const safePage = Math.min(currentPage, totalPages);
	const pageStart = (safePage - 1) * pageSize;
	const paginatedServices = filteredServices.slice(pageStart, pageStart + pageSize);
	const visibleStart = filteredServices.length === 0 ? 0 : pageStart + 1;
	const visibleEnd = Math.min(pageStart + pageSize, filteredServices.length);

	const serviceStats = useMemo(
		() => ({
			total: servicesData.length,
			ativos: servicesData.filter((service) => service.uiStatus === "Ativo").length,
			inativos: servicesData.filter((service) => service.uiStatus === "Inativo").length,
			avgPrice:
				servicesData.length === 0
					? 0
					: servicesData.reduce((sum, service) => sum + Number(service.preco || 0), 0) / servicesData.length
		}),
		[servicesData]
	);

	const refreshServices = async () => {
		const response = await api.get("/services");
		setServices(response.data || []);
	};

	const openServiceForm = async (service = null) => {
		const formData = getInitialFormData(service);
		const isEditing = Boolean(service);

		const { value } = await Swal.fire({
			title: isEditing ? "Editar serviço" : "Adicionar serviço",
			html: `
				<div class="service-swal-form">
					<label class="service-swal-field service-swal-field--full">
						<span>Nome</span>
						<input id="swal-name" class="service-swal-input" type="text" value="${escapeHtml(formData.nome)}" placeholder="Ex.: Consulta geral" />
					</label>

					<label class="service-swal-field service-swal-field--full">
						<span>Descrição</span>
						<textarea id="swal-description" class="service-swal-input service-swal-textarea" placeholder="Detalhes do serviço...">${escapeHtml(formData.descricao)}</textarea>
					</label>

					<label class="service-swal-field">
						<span>Preço (€)</span>
						<input id="swal-price" class="service-swal-input" type="number" min="0" step="0.01" value="${formData.preco}" placeholder="0.00" />
					</label>

					<label class="service-swal-field">
						<span>Duração (min)</span>
						<input id="swal-duration" class="service-swal-input" type="number" min="1" step="1" value="${formData.duracao}" placeholder="30" />
					</label>

					<label class="service-swal-field service-swal-field--full">
						<span>Estado</span>
						<select id="swal-active" class="service-swal-input">
							<option value="true" ${formData.ativo ? "selected" : ""}>Ativo</option>
							<option value="false" ${!formData.ativo ? "selected" : ""}>Inativo</option>
						</select>
					</label>
				</div>
			`,
			showCancelButton: true,
			confirmButtonText: isEditing ? "Guardar alterações" : "Criar serviço",
			cancelButtonText: "Cancelar",
			width: "min(760px, calc(100vw - 2rem))",
			focusConfirm: false,
			customClass: {
				popup: "vetlumen-swal-popup service-modal-popup",
				title: "vetlumen-swal-title",
				htmlContainer: "vetlumen-swal-text",
				confirmButton: "vetlumen-swal-button"
			},
			preConfirm: () => {
				const nome = document.getElementById("swal-name")?.value.trim();
				const descricao = document.getElementById("swal-description")?.value.trim();
				const preco = document.getElementById("swal-price")?.value;
				const duracao = document.getElementById("swal-duration")?.value;
				const ativo = document.getElementById("swal-active")?.value;

				if (!nome || preco === "" || duracao === "") {
					Swal.showValidationMessage("Preencha nome, preço e duração.");
					return null;
				}

				if (Number(preco) < 0 || Number(duracao) <= 0) {
					Swal.showValidationMessage("Preço e duração devem ter valores válidos.");
					return null;
				}

				return {
					nome,
					descricao: descricao || null,
					preco: Number(preco),
					duracao: Number(duracao),
					ativo: ativo === "true"
				};
			}
		});

		if (!value) return;

		try {
			if (isEditing) {
				await api.put(`/services/${service.id_service}`, value);
			} else {
				await api.post("/services", value);
			}

			await refreshServices();

			Swal.fire({
				title: isEditing ? "Atualizado!" : "Criado!",
				text: isEditing ? "Serviço atualizado com sucesso." : "Serviço criado com sucesso.",
				icon: "success",
				customClass: {
					popup: "vetlumen-swal-popup",
					title: "vetlumen-swal-title",
					htmlContainer: "vetlumen-swal-text",
					confirmButton: "vetlumen-swal-button"
				}
			});
		} catch (saveError) {
			console.error("Erro ao guardar serviço:", saveError);
			Swal.fire({
				title: "Erro",
				text: isEditing ? "Não foi possível atualizar o serviço." : "Não foi possível criar o serviço.",
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

	const handleDeleteService = async (service) => {
		const result = await Swal.fire({
			title: "Eliminar serviço?",
			text: `Tem a certeza que pretende eliminar "${service.nome || `Serviço #${service.id_service}`}"?`,
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
			setCurrentServiceId(service.id_service);
			await api.delete(`/services/${service.id_service}`);
			await refreshServices();

			Swal.fire({
				title: "Eliminado!",
				text: "Serviço eliminado com sucesso.",
				icon: "success",
				customClass: {
					popup: "vetlumen-swal-popup",
					title: "vetlumen-swal-title",
					htmlContainer: "vetlumen-swal-text",
					confirmButton: "vetlumen-swal-button"
				}
			});
		} catch (deleteError) {
			console.error("Erro ao eliminar serviço:", deleteError);
			Swal.fire({
				title: "Erro",
				text: "Não foi possível eliminar o serviço.",
				icon: "error",
				customClass: {
					popup: "vetlumen-swal-popup",
					title: "vetlumen-swal-title",
					htmlContainer: "vetlumen-swal-text",
					confirmButton: "vetlumen-swal-button"
				}
			});
		} finally {
			setCurrentServiceId(null);
		}
	};

	const getStatusClass = (status) => (status === "Ativo" ? "service-status--active" : "service-status--inactive");

	return (
		<main className="admin-services dashboard-container">
			<header className="dashboard-header">
				<div>
					<h1>Serviços</h1>
					<p>Crie e mantenha o catálogo de serviços disponíveis na clínica.</p>
				</div>

				<button className="dashboard-btn services-add-btn" onClick={() => openServiceForm()}>
					<i className="bi bi-plus-lg"></i>
					Novo serviço
				</button>
			</header>

			<section className="stats-grid services-stats-grid">
				<div className="stat-card">
					<div className="stat-icon"><i className="bi bi-clipboard2-pulse"></i></div>
					<div><h3>{loading ? "..." : serviceStats.total}</h3><p>Total</p></div>
				</div>
				<div className="stat-card">
					<div className="stat-icon"><i className="bi bi-check2-circle"></i></div>
					<div><h3>{loading ? "..." : serviceStats.ativos}</h3><p>Ativos</p></div>
				</div>
				<div className="stat-card">
					<div className="stat-icon"><i className="bi bi-pause-circle"></i></div>
					<div><h3>{loading ? "..." : serviceStats.inativos}</h3><p>Inativos</p></div>
				</div>
				<div className="stat-card">
					<div className="stat-icon"><i className="bi bi-currency-euro"></i></div>
					<div><h3>{loading ? "..." : formatEuro(serviceStats.avgPrice)}</h3><p>Preço médio</p></div>
				</div>
			</section>

			<section className="dashboard-card services-card">
				<div className="card-title services-card-title">
					<h3>Lista de Serviços</h3>
				</div>

				<div className="services-filters">
					<div className="search-box">
						<i className="bi bi-search"></i>
						<input
							placeholder="Pesquisar por nome, descrição ou duração..."
							value={search}
							onChange={(event) => {
								setCurrentPage(1);
								setSearch(event.target.value);
							}}
						/>
					</div>

					<label className="services-select-field">
						<span>Estado</span>
						<select
							value={statusFilter.value}
							onChange={(event) => {
								setCurrentPage(1);
								setStatusFilter(statusOptions.find((option) => option.value === event.target.value) || statusOptions[0]);
							}}
						>
							{statusOptions.map((option) => (
								<option key={option.value} value={option.value}>{option.label}</option>
							))}
						</select>
					</label>

					<label className="services-page-size">
						<span>Por página</span>
						<select
							value={pageSize}
							onChange={(event) => {
								setCurrentPage(1);
								setPageSize(Number(event.target.value));
							}}
						>
							{rowsPerPageOptions.map((option) => (
								<option key={option} value={option}>{option}</option>
							))}
						</select>
					</label>
				</div>

				<div className="services-summary">
					{filteredServices.length === 0
						? "Sem serviços para os filtros selecionados."
						: `A mostrar ${visibleStart}-${visibleEnd} de ${filteredServices.length} serviços.`}
				</div>

				{loading && (
					<div className="services-empty-state">
						<i className="bi bi-hourglass-split"></i>
						<strong>A carregar serviços...</strong>
					</div>
				)}

				{!loading && error && (
					<div className="services-empty-state services-empty-state--error">
						<i className="bi bi-exclamation-circle"></i>
						<strong>Erro</strong>
						<p>{error}</p>
					</div>
				)}

				{!loading && !error && filteredServices.length === 0 && (
					<div className="services-empty-state">
						<i className="bi bi-clipboard2-pulse"></i>
						<strong>Nenhum serviço encontrado</strong>
						<p>Ajuste os filtros ou crie um novo serviço.</p>
					</div>
				)}

				{!loading && !error && filteredServices.length > 0 && (
					<div className="services-table-wrapper">
						<table className="services-table">
							<thead>
								<tr>
									<th>Serviço</th>
									<th>Descrição</th>
									<th>Duração</th>
									<th>Preço</th>
									<th>Estado</th>
									<th>Ações</th>
								</tr>
							</thead>

							<tbody>
								{paginatedServices.map((service) => (
									<tr key={service.id_service}>
										<td data-label="Serviço">
											<div className="service-cell">
												<div className="service-avatar"><i className="bi bi-clipboard2-pulse"></i></div>
												<div className="service-primary">
													<strong>{service.nome || `Serviço #${service.id_service}`}</strong>
												</div>
											</div>
										</td>
										<td data-label="Descrição">{service.descricao || "Sem descrição"}</td>
										<td data-label="Duração">{getDurationLabel(service.duracao)}</td>
										<td data-label="Preço"><strong>{formatEuro(service.preco)}</strong></td>
										<td data-label="Estado"><span className={`service-status-badge ${getStatusClass(service.uiStatus)}`}>{service.uiStatus}</span></td>
										<td data-label="Ações">
											<div className="services-actions">
												<button className="edit-service-btn" onClick={() => openServiceForm(service)}>
													<i className="bi bi-pencil-square"></i>
												</button>
												<button className="delete-service-btn" onClick={() => handleDeleteService(service)} disabled={currentServiceId === service.id_service}>
													<i className={currentServiceId === service.id_service ? "bi bi-hourglass-split" : "bi bi-trash"}></i>
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{!loading && !error && filteredServices.length > 0 && totalPages > 1 && (
					<div className="services-pagination">
						<button type="button" className="pagination-btn" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safePage === 1}>
							Anterior
						</button>
						<span className="pagination-info">Página {safePage} de {totalPages}</span>
						<button type="button" className="pagination-btn" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safePage === totalPages}>
							Seguinte
						</button>
					</div>
				)}
			</section>
		</main>
	);
};

export default AdminServices;

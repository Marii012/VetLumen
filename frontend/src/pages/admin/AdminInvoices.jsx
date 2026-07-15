import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import api from "../../services/api";
import "./AdminInvoices.css";

const rowsPerPageOptions = [10, 20, 50];

const paymentOptions = [
	{ value: "all", label: "Todos os estados" },
	{ value: "Pago", label: "Pago" },
	{ value: "Pendente", label: "Pendente" },
	{ value: "Cancelado", label: "Cancelado" }
];

const getUserName = (user) => `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Utilizador";
const getPetName = (pet) => pet?.nome || "Animal";

const formatDate = (value) => {
	if (!value) return "-";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-PT");
};

const formatTime = (value) => {
	if (!value) return "";
	if (typeof value === "string") {
		return value.includes(":") ? value.slice(0, 5) : value;
	}
	return String(value);
};

const formatEuro = (value) => {
	const number = Number(value);
	if (Number.isNaN(number)) return "0.00€";
	return `${number.toFixed(2)}€`;
};

const normalizePaymentStatus = (status) => {
	const normalized = String(status || "").trim().toLowerCase();
	if (["pago", "paid", "finalizado", "finalizada"].includes(normalized)) return "Pago";
	if (["cancelado", "cancelada", "rejeitado", "rejeitada"].includes(normalized)) return "Cancelado";
	return "Pendente";
};

const escapeHtml = (value) =>
	String(value || "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");

const getInitialFormData = (invoice = null) => ({
	num_fatura: invoice?.num_fatura || "",
	data_emissao: invoice?.data_emissao ? String(invoice.data_emissao).slice(0, 10) : "",
	total_bruto: invoice?.total_bruto ?? "",
	total_impostos: invoice?.total_impostos ?? "",
	total_liquido: invoice?.total_liquido ?? "",
	estado_pagamento: invoice?.uiStatus || "Pendente",
	id_user: invoice?.id_user ? String(invoice.id_user) : "",
	id_appointment: invoice?.id_appointment ? String(invoice.id_appointment) : ""
});

const AdminInvoices = () => {
	const [invoices, setInvoices] = useState([]);
	const [users, setUsers] = useState([]);
	const [appointments, setAppointments] = useState([]);
	const [pets, setPets] = useState([]);
	const [services, setServices] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState(paymentOptions[0]);
	const [selectedDate, setSelectedDate] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [currentPage, setCurrentPage] = useState(1);
	const [currentInvoiceId, setCurrentInvoiceId] = useState(null);

	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);
				setError("");

				const [invoicesResponse, usersResponse, appointmentsResponse, petsResponse, servicesResponse] = await Promise.all([
					api.get("/invoices", { params: { status: "all" } }),
					api.get("/users"),
					api.get("/appointments"),
					api.get("/pets"),
					api.get("/services")
				]);

				setInvoices(invoicesResponse.data || []);
				setUsers(usersResponse.data || []);
				setAppointments(appointmentsResponse.data || []);
				setPets(petsResponse.data || []);
				setServices(servicesResponse.data || []);
			} catch (loadError) {
				console.error("Erro ao carregar faturas:", loadError);
				setError("Não foi possível carregar as faturas.");
				setInvoices([]);
				setUsers([]);
				setAppointments([]);
				setPets([]);
				setServices([]);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, []);

	const usersById = useMemo(() => Object.fromEntries(users.map((user) => [String(user.id_user), user])), [users]);
	const appointmentsById = useMemo(() => Object.fromEntries(appointments.map((item) => [String(item.id_appointment), item])), [appointments]);
	const petsById = useMemo(() => Object.fromEntries(pets.map((pet) => [String(pet.id_pet), pet])), [pets]);
	const servicesById = useMemo(() => Object.fromEntries(services.map((service) => [String(service.id_service), service])), [services]);

	const invoiceData = useMemo(() => invoices.map((invoice) => {
		const user = usersById[String(invoice.id_user)];
		const appointment = invoice.id_appointment ? appointmentsById[String(invoice.id_appointment)] : null;
		const pet = appointment?.id_pet ? petsById[String(appointment.id_pet)] : null;
		const service = appointment?.id_service ? servicesById[String(appointment.id_service)] : null;

		return {
			...invoice,
			uiStatus: normalizePaymentStatus(invoice.estado_pagamento),
			userName: getUserName(user),
			userEmail: user?.email || "",
			petName: pet?.nome || "Sem animal",
			serviceName: service?.nome || appointment?.motivo || "Sem consulta",
			appointmentDate: appointment?.data || null
		};
	}), [appointmentsById, invoices, petsById, servicesById, usersById]);

	const filteredInvoices = useMemo(() => {
		const searchValue = search.trim().toLowerCase();

		return invoiceData.filter((invoice) => {
			const text = `${invoice.num_fatura || ""} ${invoice.userName || ""} ${invoice.userEmail || ""} ${invoice.petName || ""} ${invoice.serviceName || ""} ${invoice.uiStatus || ""}`.toLowerCase();
			const matchesSearch = !searchValue || text.includes(searchValue);
			const matchesStatus = statusFilter.value === "all" || invoice.uiStatus === statusFilter.value;
			const invoiceDate = invoice.data_emissao ? String(invoice.data_emissao).slice(0, 10) : "";
			const matchesDate = !selectedDate || invoiceDate === selectedDate;

			return matchesSearch && matchesStatus && matchesDate;
		});
	}, [invoiceData, search, selectedDate, statusFilter]);

	const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
	const safePage = Math.min(currentPage, totalPages);
	const pageStart = (safePage - 1) * pageSize;
	const paginatedInvoices = filteredInvoices.slice(pageStart, pageStart + pageSize);
	const visibleStart = filteredInvoices.length === 0 ? 0 : pageStart + 1;
	const visibleEnd = Math.min(pageStart + pageSize, filteredInvoices.length);

	const refreshInvoices = async () => {
		const response = await api.get("/invoices", { params: { status: "all" } });
		setInvoices(response.data || []);
	};

	const openInvoiceForm = async (invoice = null) => {
		const formData = getInitialFormData(invoice);
		const isEditing = Boolean(invoice);
		const appointmentData = appointments.map((item) => {
			const pet = petsById[String(item.id_pet)];
			const ownerId = pet?.id_user ? String(pet.id_user) : "";
			const label = `${getPetName(pet)} - ${formatDate(item.data)} ${formatTime(item.hora)}`;

			return {
				id: String(item.id_appointment),
				ownerId,
				label,
				searchText: `${label} ${item.motivo || ""}`.toLowerCase()
			};
		});

		const userOptions = users.map((user) => ({
			value: String(user.id_user),
			label: `${getUserName(user)} (${user.email || "-"})`
		}));

		const appointmentOptionsForUser = (userId) =>
			appointmentData
				.filter((item) => String(item.ownerId) === String(userId))
				.map((item) => ({ value: String(item.id), label: item.label }));

		let modalRoot = null;

		const InvoiceSelectFields = ({ userHost, appointmentHost }) => {
			const [selectedUserId, setSelectedUserId] = useState(String(formData.id_user || ""));
			const [selectedAppointmentId, setSelectedAppointmentId] = useState(String(formData.id_appointment || ""));
			const appointmentOptions = useMemo(
				() => (selectedUserId ? appointmentOptionsForUser(selectedUserId) : []),
				[selectedUserId]
			);

			useEffect(() => {
				if (selectedAppointmentId && !appointmentOptions.some((option) => option.value === selectedAppointmentId)) {
					setSelectedAppointmentId("");
				}
			}, [appointmentOptions, selectedAppointmentId]);

			return (
				<>
					{createPortal(
						<Select
							classNamePrefix="contact-select"
							placeholder="Pesquisar utilizador..."
							isClearable
							options={userOptions}
							value={userOptions.find((option) => option.value === selectedUserId) || null}
							onChange={(option) => {
								setSelectedUserId(option?.value || "");
								setSelectedAppointmentId("");
							}}
							noOptionsMessage={() => "Sem utilizadores"}
						/>,
						userHost
					)}

					{createPortal(
						<Select
							classNamePrefix="contact-select"
							placeholder={selectedUserId ? "Pesquisar consulta..." : "Selecione primeiro um utilizador"}
							isClearable
							isDisabled={!selectedUserId}
							options={appointmentOptions}
							value={appointmentOptions.find((option) => option.value === selectedAppointmentId) || null}
							onChange={(option) => setSelectedAppointmentId(option?.value || "")}
							noOptionsMessage={() => "Sem consultas para este utilizador"}
						/>,
						appointmentHost
					)}

					<div style={{ display: "none" }}>
						<input type="hidden" id="swal-user-value" value={selectedUserId} readOnly />
						<input type="hidden" id="swal-appointment-value" value={selectedAppointmentId} readOnly />
					</div>
				</>
			);
		};

		const { value } = await Swal.fire({
			title: isEditing ? "Editar fatura" : "Criar fatura",
			html: `
				<div class="invoice-swal-form">
					<div id="swal-invoice-root" class="invoice-select-root"></div>

					<label class="invoice-swal-field">
						<span>Número da fatura</span>
						<input id="swal-number" class="invoice-swal-input" type="text" value="${escapeHtml(formData.num_fatura)}" placeholder="FT-2026-001" />
					</label>

					<label class="invoice-swal-field">
						<span>Data de emissão</span>
						<input id="swal-date" class="invoice-swal-input" type="date" value="${formData.data_emissao}" />
					</label>

					<label class="invoice-swal-field invoice-swal-field--full">
						<span>Utilizador</span>
						<div id="swal-user-select-host" class="invoice-select-host"></div>
					</label>

					<label class="invoice-swal-field invoice-swal-field--full">
						<span>Consulta (opcional)</span>
						<div id="swal-appointment-select-host" class="invoice-select-host"></div>
					</label>

					<label class="invoice-swal-field">
						<span>Total bruto</span>
						<input id="swal-gross" class="invoice-swal-input" type="number" min="0" step="0.01" value="${formData.total_bruto}" placeholder="0.00" />
					</label>

					<label class="invoice-swal-field">
						<span>Impostos</span>
						<input id="swal-tax" class="invoice-swal-input" type="number" min="0" step="0.01" value="${formData.total_impostos}" placeholder="0.00" />
					</label>

					<label class="invoice-swal-field">
						<span>Total líquido</span>
						<input id="swal-net" class="invoice-swal-input" type="number" min="0" step="0.01" value="${formData.total_liquido}" placeholder="0.00" />
					</label>

					<label class="invoice-swal-field">
						<span>Estado</span>
						<select id="swal-status" class="invoice-swal-input">
							${paymentOptions.filter((option) => option.value !== "all").map((option) => `<option value="${option.value}" ${String(option.value) === String(formData.estado_pagamento) ? "selected" : ""}>${option.label}</option>`).join("")}
						</select>
					</label>
				</div>
			`,
			showCancelButton: true,
			confirmButtonText: isEditing ? "Guardar alterações" : "Criar fatura",
			cancelButtonText: "Cancelar",
			width: "min(920px, calc(100vw - 2rem))",
			focusConfirm: false,
			customClass: {
				popup: "vetlumen-swal-popup invoice-modal-popup",
				title: "vetlumen-swal-title",
				htmlContainer: "vetlumen-swal-text",
				confirmButton: "vetlumen-swal-button"
			},
			didOpen: () => {
				const rootHost = document.getElementById("swal-invoice-root");
				const userSelectHost = document.getElementById("swal-user-select-host");
				const appointmentSelectHost = document.getElementById("swal-appointment-select-host");

				if (!rootHost || !userSelectHost || !appointmentSelectHost) {
					return;
				}

				modalRoot = createRoot(rootHost);
				modalRoot.render(<InvoiceSelectFields userHost={userSelectHost} appointmentHost={appointmentSelectHost} />);
			},
			willClose: () => {
				if (modalRoot) {
					modalRoot.unmount();
					modalRoot = null;
				}
			},
			preConfirm: () => {
				const num_fatura = document.getElementById("swal-number")?.value.trim();
				const data_emissao = document.getElementById("swal-date")?.value;
				const id_user = document.getElementById("swal-user-value")?.value || "";
				const id_appointment = document.getElementById("swal-appointment-value")?.value || "";
				const total_bruto = document.getElementById("swal-gross")?.value;
				const total_impostos = document.getElementById("swal-tax")?.value;
				const total_liquido = document.getElementById("swal-net")?.value;
				const estado_pagamento = document.getElementById("swal-status")?.value;

				if (!num_fatura || !id_user || total_bruto === "" || total_impostos === "" || total_liquido === "" || !estado_pagamento) {
					Swal.showValidationMessage("Preencha número, utilizador, totais e estado.");
					return null;
				}

				return {
					num_fatura,
					data_emissao: data_emissao || new Date().toISOString(),
					total_bruto: Number(total_bruto),
					total_impostos: Number(total_impostos),
					total_liquido: Number(total_liquido),
					estado_pagamento,
					id_user: Number(id_user),
					id_appointment: id_appointment ? Number(id_appointment) : null
				};
			}
		});

		if (!value) return;

		try {
			if (isEditing) {
				await api.put(`/invoices/${invoice.id_invoice}`, value);
			} else {
				await api.post("/invoices", value);
			}

			await refreshInvoices();

			Swal.fire({
				title: isEditing ? "Atualizada!" : "Criada!",
				text: isEditing ? "Fatura atualizada com sucesso." : "Fatura criada com sucesso.",
				icon: "success",
				customClass: {
					popup: "vetlumen-swal-popup",
					title: "vetlumen-swal-title",
					htmlContainer: "vetlumen-swal-text",
					confirmButton: "vetlumen-swal-button"
				}
			});
		} catch (saveError) {
			console.error("Erro ao guardar fatura:", saveError);
			Swal.fire({
				title: "Erro",
				text: isEditing ? "Não foi possível atualizar a fatura." : "Não foi possível criar a fatura.",
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

	const handleDeleteInvoice = async (invoice) => {
		const result = await Swal.fire({
			title: "Eliminar fatura?",
			text: `Tem a certeza que pretende eliminar ${invoice.num_fatura || `FAT-${invoice.id_invoice}`}?`,
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
			setCurrentInvoiceId(invoice.id_invoice);
			await api.delete(`/invoices/${invoice.id_invoice}`);
			await refreshInvoices();

			Swal.fire({
				title: "Eliminada!",
				text: "Fatura eliminada com sucesso.",
				icon: "success",
				customClass: {
					popup: "vetlumen-swal-popup",
					title: "vetlumen-swal-title",
					htmlContainer: "vetlumen-swal-text",
					confirmButton: "vetlumen-swal-button"
				}
			});
		} catch (deleteError) {
			console.error("Erro ao eliminar fatura:", deleteError);
			Swal.fire({
				title: "Erro",
				text: "Não foi possível eliminar a fatura.",
				icon: "error",
				customClass: {
					popup: "vetlumen-swal-popup",
					title: "vetlumen-swal-title",
					htmlContainer: "vetlumen-swal-text",
					confirmButton: "vetlumen-swal-button"
				}
			});
		} finally {
			setCurrentInvoiceId(null);
		}
	};

	const getStatusClass = (status) => {
		switch (status) {
			case "Pago":
				return "invoice-status--paid";
			case "Cancelado":
				return "invoice-status--cancelled";
			default:
				return "invoice-status--pending";
		}
	};

	return (
		<main className="admin-invoices dashboard-container">
			<header className="dashboard-header">
				<div>
					<h1>Faturas</h1>
					<p>Gira a faturação e associe cada fatura ao utilizador correspondente.</p>
				</div>

				<button className="dashboard-btn invoices-add-btn" onClick={() => openInvoiceForm()}>
					<i className="bi bi-plus-lg"></i>
					Nova fatura
				</button>
			</header>

			<section className="stats-grid invoices-stats-grid">
				<div className="stat-card">
					<div className="stat-icon"><i className="bi bi-receipt"></i></div>
					<div><h3>{loading ? "..." : invoices.length}</h3><p>Total</p></div>
				</div>
				<div className="stat-card">
					<div className="stat-icon"><i className="bi bi-search"></i></div>
					<div><h3>{loading ? "..." : filteredInvoices.length}</h3><p>Filtradas</p></div>
				</div>
				<div className="stat-card">
					<div className="stat-icon"><i className="bi bi-check2-circle"></i></div>
					<div><h3>{loading ? "..." : invoiceData.filter((item) => item.uiStatus === "Pago").length}</h3><p>Pagas</p></div>
				</div>
				<div className="stat-card">
					<div className="stat-icon"><i className="bi bi-hourglass-split"></i></div>
					<div><h3>{loading ? "..." : invoiceData.filter((item) => item.uiStatus === "Pendente").length}</h3><p>Pendentes</p></div>
				</div>
			</section>

			<section className="dashboard-card invoices-card">
				<div className="card-title invoices-card-title">
					<h3>Lista de Faturas</h3>
				</div>

				<div className="invoices-filters">
					<div className="search-box">
						<i className="bi bi-search"></i>
						<input
							placeholder="Pesquisar por número, cliente, serviço ou estado..."
							value={search}
							onChange={(event) => {
								setCurrentPage(1);
								setSearch(event.target.value);
							}}
						/>
					</div>

					<label className="invoices-select-field">
						<span>Estado</span>
						<select value={statusFilter.value} onChange={(event) => {
							setCurrentPage(1);
							setStatusFilter(paymentOptions.find((option) => option.value === event.target.value) || paymentOptions[0]);
						}}>
							{paymentOptions.map((option) => (
								<option key={option.value} value={option.value}>{option.label}</option>
							))}
						</select>
					</label>

					<label className="invoices-select-field">
						<span>Data de emissão</span>
						<input type="date" value={selectedDate} onChange={(event) => {
							setCurrentPage(1);
							setSelectedDate(event.target.value);
						}} />
					</label>

					<label className="invoices-page-size">
						<span>Por página</span>
						<select value={pageSize} onChange={(event) => {
							setCurrentPage(1);
							setPageSize(Number(event.target.value));
						}}>
							{rowsPerPageOptions.map((option) => (
								<option key={option} value={option}>{option}</option>
							))}
						</select>
					</label>
				</div>

				<div className="invoices-summary">
					{filteredInvoices.length === 0
						? "Sem faturas para os filtros selecionados."
						: `A mostrar ${visibleStart}-${visibleEnd} de ${filteredInvoices.length} faturas.`}
				</div>

				{loading && (
					<div className="invoices-empty-state">
						<i className="bi bi-hourglass-split"></i>
						<strong>A carregar faturas...</strong>
					</div>
				)}

				{!loading && error && (
					<div className="invoices-empty-state invoices-empty-state--error">
						<i className="bi bi-exclamation-circle"></i>
						<strong>Erro</strong>
						<p>{error}</p>
					</div>
				)}

				{!loading && !error && filteredInvoices.length === 0 && (
					<div className="invoices-empty-state">
						<i className="bi bi-receipt"></i>
						<strong>Nenhuma fatura encontrada</strong>
						<p>Ajuste os filtros ou crie uma nova fatura.</p>
					</div>
				)}

				{!loading && !error && filteredInvoices.length > 0 && (
					<div className="invoices-table-wrapper">
						<table className="invoices-table">
							<thead>
								<tr>
									<th>Fatura</th>
									<th>Cliente</th>
									<th>Consulta</th>
									<th>Emissão</th>
									<th>Total líquido</th>
									<th>Estado</th>
									<th>Ações</th>
								</tr>
							</thead>

							<tbody>
								{paginatedInvoices.map((invoice) => (
									<tr key={invoice.id_invoice}>
										<td data-label="Fatura">
											<div className="invoice-cell">
												<div className="invoice-avatar"><i className="bi bi-receipt-cutoff"></i></div>
												<div className="invoice-primary">
													<strong>{invoice.num_fatura || `FAT-${invoice.id_invoice}`}</strong>
													<span>{formatEuro(invoice.total_bruto)} bruto • {formatEuro(invoice.total_impostos)} impostos</span>
												</div>
											</div>
										</td>
										<td data-label="Cliente">
											<div className="invoice-meta">
												<strong>{invoice.userName}</strong>
												<span>{invoice.userEmail || "-"}</span>
											</div>
										</td>
										<td data-label="Consulta">{invoice.serviceName} • {invoice.petName}</td>
										<td data-label="Emissão">{formatDate(invoice.data_emissao)}</td>
										<td data-label="Total líquido"><strong>{formatEuro(invoice.total_liquido)}</strong></td>
										<td data-label="Estado"><span className={`invoice-status-badge ${getStatusClass(invoice.uiStatus)}`}>{invoice.uiStatus}</span></td>
										<td data-label="Ações">
											<div className="invoices-actions">
												<button className="edit-invoice-btn" onClick={() => openInvoiceForm(invoice)}>
													<i className="bi bi-pencil-square"></i>
												</button>
												<button className="delete-invoice-btn" onClick={() => handleDeleteInvoice(invoice)} disabled={currentInvoiceId === invoice.id_invoice}>
													<i className={currentInvoiceId === invoice.id_invoice ? "bi bi-hourglass-split" : "bi bi-trash"}></i>
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{!loading && !error && filteredInvoices.length > 0 && totalPages > 1 && (
					<div className="invoices-pagination">
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

export default AdminInvoices;

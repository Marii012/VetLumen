import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import Select from "react-select";
import Swal from "sweetalert2";
import api from "../../services/api";
import "./AdminUsers.css";

const dateFilterOptions = [
	{ value: "all", label: "Todos os registos" },
	{ value: "today", label: "Hoje" },
	{ value: "last7", label: "Últimos 7 dias" },
	{ value: "last30", label: "Últimos 30 dias" }
];

const rowsPerPageOptions = [10, 20, 50];
const pageSizeOptions = rowsPerPageOptions.map((option) => ({ value: option, label: `${option}` }));

const getFullName = (user) => `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Utilizador";

const formatDate = (value) => {
	if (!value) return "-";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-PT");
};

const parseDateValue = (value) => {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

const getTodayStart = () => {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
};

const escapeHtml = (value) =>
	String(value || "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");

const getInitialFormData = (user = null) => ({
	first_name: user?.first_name || "",
	last_name: user?.last_name || "",
	email: user?.email || "",
	telefone: user?.telefone || "",
	password: "",
	id_role: user?.id_role ? String(user.id_role) : "1"
});

const getRoleOptions = (rolePayload = []) =>
	(rolePayload || []).map((role) => ({
		value: Number(role.id_role),
		label: role.nome_role
	}));

const AdminUsers = () => {
	const [users, setUsers] = useState([]);
	const [roles, setRoles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState({ value: "all", label: "Todos os papéis" });
	const [dateFilter, setDateFilter] = useState(dateFilterOptions[0]);
	const [pageSize, setPageSize] = useState(10);
	const [currentPage, setCurrentPage] = useState(1);
	const [editRoles, setEditRoles] = useState({});
	const [savingUserId, setSavingUserId] = useState(null);
	const [currentUserId, setCurrentUserId] = useState(null);

	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);
				setError("");

				const [usersResponse, rolesResponse] = await Promise.all([api.get("/users"), api.get("/roles")]);

				setUsers(usersResponse.data || []);

				const roleOptions = getRoleOptions(rolesResponse.data || []);

				setRoles(roleOptions);

				const initialRoleMap = Object.fromEntries(
					(usersResponse.data || []).map((user) => [user.id_user, Number(user.id_role)])
				);
				setEditRoles(initialRoleMap);
			} catch (err) {
				setError("Não foi possível carregar os utilizadores.");
				setUsers([]);
				setRoles([]);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, []);

	useEffect(() => {
		setCurrentPage(1);
	}, [search, roleFilter, dateFilter, pageSize]);

	const roleOptions = useMemo(() => [{ value: "all", label: "Todos os papéis" }, ...roles], [roles]);

	const getRoleLabel = (idRole) => {
		const role = roles.find((item) => Number(item.value) === Number(idRole));
		return role ? role.label : `Role #${idRole || "-"}`;
	};

	const filteredUsers = useMemo(() => {
		const now = new Date();
		const todayStart = getTodayStart();
		const last7Days = new Date(now);
		last7Days.setDate(now.getDate() - 7);
		const last30Days = new Date(now);
		last30Days.setDate(now.getDate() - 30);

		const searchValue = search.trim().toLowerCase();

		return users.filter((user) => {
			const fullName = getFullName(user).toLowerCase();
			const email = String(user.email || "").toLowerCase();
			const phone = String(user.telefone || "").toLowerCase();
			const roleLabel = getRoleLabel(user.id_role).toLowerCase();
			const createdAt = parseDateValue(user.created_at);

			const matchesSearch =
				!searchValue ||
				fullName.includes(searchValue) ||
				email.includes(searchValue) ||
				phone.includes(searchValue) ||
				roleLabel.includes(searchValue);

			const matchesRole = roleFilter.value === "all" || Number(user.id_role) === Number(roleFilter.value);

			let matchesDate = true;
			if (dateFilter.value === "today") {
				matchesDate = Boolean(createdAt && createdAt >= todayStart);
			} else if (dateFilter.value === "last7") {
				matchesDate = Boolean(createdAt && createdAt >= last7Days);
			} else if (dateFilter.value === "last30") {
				matchesDate = Boolean(createdAt && createdAt >= last30Days);
			}

			return matchesSearch && matchesRole && matchesDate;
		});
	}, [dateFilter, roleFilter, roles, search, users]);

	const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
	const safePage = Math.min(currentPage, totalPages);
	const pageStart = (safePage - 1) * pageSize;
	const paginatedUsers = filteredUsers.slice(pageStart, pageStart + pageSize);
	const visibleStart = filteredUsers.length === 0 ? 0 : pageStart + 1;
	const visibleEnd = Math.min(pageStart + pageSize, filteredUsers.length);

	const handleRoleChange = (userId, roleId) => {
		setEditRoles((prev) => ({
			...prev,
			[userId]: Number(roleId)
		}));
	};

	const handleSaveRole = async (user) => {
		const selectedRoleId = editRoles[user.id_user];

		if (!selectedRoleId || Number(selectedRoleId) === Number(user.id_role)) {
			return;
		}

		try {
			setSavingUserId(user.id_user);
			await api.put(`/users/${user.id_user}`, { id_role: selectedRoleId });

			setUsers((prev) =>
				prev.map((item) =>
					item.id_user === user.id_user
						? {
								...item,
								id_role: Number(selectedRoleId)
							}
						: item
				)
			);

			Swal.fire({
				title: "Atualizado!",
				text: `O perfil de ${getFullName(user)} foi alterado com sucesso.`,
				icon: "success",
				customClass: {
					popup: "vetlumen-swal-popup",
					title: "vetlumen-swal-title",
					htmlContainer: "vetlumen-swal-text",
					confirmButton: "vetlumen-swal-button"
				}
			});
		} catch (err) {
			Swal.fire({
				title: "Erro",
				text: `Não foi possível atualizar o perfil de ${getFullName(user)}.`,
				icon: "error",
				customClass: {
					popup: "vetlumen-swal-popup",
					title: "vetlumen-swal-title",
					htmlContainer: "vetlumen-swal-text",
					confirmButton: "vetlumen-swal-button"
				}
			});
		} finally {
			setSavingUserId(null);
		}
	};

	// Redefinição de palavra-passe removida do painel de administração.

	const refreshUser = async () => {
		const response = await api.get("/users");
		setUsers(response.data || []);
		setEditRoles(Object.fromEntries((response.data || []).map((user) => [user.id_user, Number(user.id_role)])));
	};

	const loadRolesForForm = async () => {
		try {
			const response = await api.get("/roles");
			const roleOptions = getRoleOptions(Array.isArray(response?.data) ? response.data : []);
			setRoles(roleOptions);
			return roleOptions;
		} catch (err) {
			console.error("Erro ao carregar perfis:", err);
			return [];
		}
	};

	const openUserForm = async (user = null) => {
		const formData = getInitialFormData(user);
		const isEditing = Boolean(user);
		const loadedRoles = roles.length ? roles : await loadRolesForForm();
		const roleOptions = loadedRoles.length
			? loadedRoles
			: [
					{ value: 1, label: "Cliente" },
					{ value: 2, label: "Veterinário" },
					{ value: 3, label: "Administrador" }
				];

		const selectedRoleValue = roleOptions.find((role) => String(role.value) === String(formData.id_role)) || null;
		const { value } = await Swal.fire({
			title: isEditing ? "Editar utilizador" : "Adicionar utilizador",
			html: `
				<div class="user-swal-form">
					<label class="user-swal-field">
						<span>Nome</span>
						<input id="swal-first-name" class="user-swal-input" type="text" value="${escapeHtml(formData.first_name)}" placeholder="Primeiro nome" />
					</label>
					<label class="user-swal-field">
						<span>Apelido</span>
						<input id="swal-last-name" class="user-swal-input" type="text" value="${escapeHtml(formData.last_name)}" placeholder="Apelido" />
					</label>
					<label class="user-swal-field">
						<span>Email</span>
						<input id="swal-email" class="user-swal-input" type="email" value="${escapeHtml(formData.email)}" placeholder="Email" />
					</label>
					<label class="user-swal-field">
						<span>Telefone</span>
						<input id="swal-telefone" class="user-swal-input" type="text" value="${escapeHtml(formData.telefone)}" placeholder="Telefone" />
					</label>
					${isEditing ? "" : `
					<label class="user-swal-field user-swal-field--full">
						<span>Palavra-passe</span>
						<input id="swal-password" class="user-swal-input" type="password" placeholder="Palavra-passe" />
					</label>
					`}
					<label class="user-swal-field user-swal-field--full">
						<span>Perfil</span>
						<div id="swal-role-picker" class="user-swal-role-picker"></div>
						<input type="hidden" id="swal-role" value="${escapeHtml(String(formData.id_role || ""))}" />
					</label>
					${isEditing ? `
					<div class="user-swal-note">
						<i class="bi bi-info-circle"></i>
							<span>A palavra-passe não é alterada aqui.</span>
					</div>
					` : ""}
				</div>
			`,
			showCancelButton: true,
			confirmButtonText: isEditing ? "Guardar alterações" : "Criar utilizador",
			cancelButtonText: "Cancelar",
			width: "min(760px, calc(100vw - 2rem))",
			focusConfirm: false,
			customClass: {
				popup: "vetlumen-swal-popup user-modal-popup",
				title: "vetlumen-swal-title",
				htmlContainer: "vetlumen-swal-text",
				confirmButton: "vetlumen-swal-button"
			},
			didOpen: () => {
				const container = document.getElementById("swal-role-picker");
				const hiddenInput = document.getElementById("swal-role");

				if (!container) return;

				const root = createRoot(container);
				root.render(
					<Select
						options={roleOptions}
						value={selectedRoleValue}
						onChange={(option) => {
							if (hiddenInput) {
								hiddenInput.value = option?.value ?? "";
							}
						}}
						placeholder="Selecionar perfil"
						isSearchable
						className="user-swal-contact-select"
						classNamePrefix="contact-select"
						menuPortalTarget={document.body}
						styles={{ menuPortal: (base) => ({ ...base, zIndex: 999999 }) }}
					/>
				);
			},
			preConfirm: () => {
				const first_name = document.getElementById("swal-first-name")?.value.trim();
				const last_name = document.getElementById("swal-last-name")?.value.trim();
				const email = document.getElementById("swal-email")?.value.trim();
				const telefone = document.getElementById("swal-telefone")?.value.trim();
				const password = document.getElementById("swal-password")?.value.trim();
				const id_role = document.getElementById("swal-role")?.value;

				if (!first_name || !last_name || !email || (!isEditing && !password) || !id_role) {
					Swal.showValidationMessage("Preencha os campos obrigatórios.");
					return null;
				}

				return { first_name, last_name, email, telefone, password, id_role };
			}
		});

		if (!value) return;

		try {
			if (isEditing) {
				await api.put(`/users/${user.id_user}`, {
					first_name: value.first_name,
					last_name: value.last_name,
					email: value.email,
					telefone: value.telefone,
					id_role: Number(value.id_role)
				});
			} else {
				await api.post("/auth/register", {
					first_name: value.first_name,
					last_name: value.last_name,
					email: value.email,
					telefone: value.telefone,
					password: value.password,
					id_role: Number(value.id_role)
				});
			}

			await refreshUser();

			Swal.fire({
				title: isEditing ? "Atualizado!" : "Criado!",
				text: isEditing ? "Utilizador atualizado com sucesso." : "Utilizador criado com sucesso.",
				icon: "success",
				customClass: {
					popup: "vetlumen-swal-popup",
					title: "vetlumen-swal-title",
					htmlContainer: "vetlumen-swal-text",
					confirmButton: "vetlumen-swal-button"
				}
			});
		} catch (err) {
			Swal.fire({
				title: "Erro",
				text: isEditing ? "Não foi possível atualizar o utilizador." : "Não foi possível criar o utilizador.",
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

	const handleDeleteUser = async (user) => {
		const result = await Swal.fire({
			title: "Eliminar utilizador?",
			text: `Tem a certeza que pretende eliminar ${getFullName(user)}?`,
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
			setCurrentUserId(user.id_user);
			await api.delete(`/users/${user.id_user}`);
			await refreshUser();

			Swal.fire({
				title: "Eliminado!",
				text: "Utilizador eliminado com sucesso.",
				icon: "success",
				customClass: {
					popup: "vetlumen-swal-popup",
					title: "vetlumen-swal-title",
					htmlContainer: "vetlumen-swal-text",
					confirmButton: "vetlumen-swal-button"
				}
			});
		} catch (err) {
			Swal.fire({
				title: "Erro",
				text: "Não foi possível eliminar o utilizador.",
				icon: "error",
				customClass: {
					popup: "vetlumen-swal-popup",
					title: "vetlumen-swal-title",
					htmlContainer: "vetlumen-swal-text",
					confirmButton: "vetlumen-swal-button"
				}
			});
		} finally {
			setCurrentUserId(null);
		}
	};

	return (
		<main className="admin-users dashboard-container">
			<header className="dashboard-header">
				<div>
					<h1>Utilizadores</h1>
					<p>Consulte todos os utilizadores e altere o perfil de cada conta.</p>
				</div>

				<button className="dashboard-btn users-add-btn" onClick={() => openUserForm()}>
					<i className="bi bi-plus-lg"></i>
					Adicionar utilizador
				</button>
			</header>

			<section className="stats-grid users-stats-grid">
				<div className="stat-card">
					<div className="stat-icon">
						<i className="bi bi-people"></i>
					</div>
					<div>
						<h3>{loading ? "..." : users.length}</h3>
						<p>Total</p>
					</div>
				</div>

				<div className="stat-card">
					<div className="stat-icon">
						<i className="bi bi-search"></i>
					</div>
					<div>
						<h3>{loading ? "..." : filteredUsers.length}</h3>
						<p>Filtrados</p>
					</div>
				</div>

				<div className="stat-card">
					<div className="stat-icon">
						<i className="bi bi-person-badge"></i>
					</div>
					<div>
						<h3>{loading ? "..." : users.filter((user) => Number(user.id_role) === 2).length}</h3>
						<p>Veterinários</p>
					</div>
				</div>

				<div className="stat-card">
					<div className="stat-icon">
						<i className="bi bi-shield-lock"></i>
					</div>
					<div>
						<h3>{loading ? "..." : users.filter((user) => Number(user.id_role) === 3).length}</h3>
						<p>Administradores</p>
					</div>
				</div>
			</section>

			<section className="dashboard-card users-card">
				<div className="card-title users-card-title">
					<h3>Lista de Utilizadores</h3>
				</div>

				<div className="users-filters">
					<div className="search-box">
						<i className="bi bi-search"></i>
						<input
							placeholder="Pesquisar por nome, email, telefone ou perfil..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>

					<Select
						className="users-select"
						classNamePrefix="users-select"
						options={roleOptions}
						value={roleFilter}
						onChange={setRoleFilter}
						isSearchable={false}
					/>

					<Select
						className="users-select"
						classNamePrefix="users-select"
						options={dateFilterOptions}
						value={dateFilter}
						onChange={setDateFilter}
						isSearchable={false}
					/>

					<label className="users-page-size">
						<span>Por página</span>
						<Select
							className="users-select users-select--compact"
							classNamePrefix="users-select"
							options={pageSizeOptions}
							value={pageSizeOptions.find((option) => option.value === pageSize) || null}
							onChange={(selectedOption) => setPageSize(Number(selectedOption?.value || 10))}
							isSearchable={false}
						/>
					</label>
				</div>

				<div className="users-summary">
					{filteredUsers.length === 0
						? "Sem utilizadores para os filtros selecionados."
						: `A mostrar ${visibleStart}-${visibleEnd} de ${filteredUsers.length} utilizadores.`}
				</div>

				{loading && (
					<div className="users-empty-state">
						<i className="bi bi-hourglass-split"></i>
						<strong>A carregar utilizadores...</strong>
					</div>
				)}

				{!loading && error && (
					<div className="users-empty-state users-empty-state--error">
						<i className="bi bi-exclamation-circle"></i>
						<strong>Erro</strong>
						<p>{error}</p>
					</div>
				)}

				{!loading && !error && filteredUsers.length === 0 && (
					<div className="users-empty-state">
						<i className="bi bi-people"></i>
						<strong>Nenhum utilizador encontrado</strong>
						<p>Ajuste os filtros para encontrar utilizadores.</p>
					</div>
				)}

				{!loading && !error && filteredUsers.length > 0 && (
					<div className="users-table-wrapper">
						<table className="users-table">
							<thead>
								<tr>
									<th>Utilizador</th>
									<th>Email</th>
									<th>Telefone</th>
									<th>Registo</th>
									<th>Perfil</th>
									<th>Ações</th>
								</tr>
							</thead>

							<tbody>
								{paginatedUsers.map((user) => {
									const currentEditRole = editRoles[user.id_user] ?? Number(user.id_role);
									const hasChanges = Number(currentEditRole) !== Number(user.id_role);

									return (
										<tr key={user.id_user}>
											<td data-label="Utilizador">
												<div className="user-cell">
													<div className="user-avatar">
														<i className="bi bi-person-fill"></i>
													</div>

													<div className="user-primary">
														<strong>{getFullName(user)}</strong>
													</div>
												</div>
											</td>

											<td data-label="Email">{user.email || "-"}</td>

											<td data-label="Telefone">{user.telefone || "-"}</td>

											<td data-label="Registo">{formatDate(user.created_at)}</td>

											<td data-label="Role">
												<span className="user-role-badge">{getRoleLabel(user.id_role)}</span>
											</td>

											<td data-label="Ações">
												<div className="users-actions">
													<Select
														className="users-role-select"
														classNamePrefix="users-role-select"
														options={roles}
														value={roles.find((role) => Number(role.value) === Number(currentEditRole)) || null}
														onChange={(option) => handleRoleChange(user.id_user, option.value)}
														isSearchable={false}
													/>

													<button
														className="save-role-btn"
														onClick={() => handleSaveRole(user)}
														disabled={!hasChanges || savingUserId === user.id_user}
													>
														{savingUserId === user.id_user ? "A guardar..." : "Guardar"}
													</button>

													<button className="edit-user-btn" onClick={() => openUserForm(user)}>
														<i className="bi bi-pencil-square"></i>
													</button>



													<button
														className="delete-user-btn"
														onClick={() => handleDeleteUser(user)}
														disabled={currentUserId === user.id_user}
													>
														<i className={currentUserId === user.id_user ? "bi bi-hourglass-split" : "bi bi-trash"}></i>
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

				{!loading && !error && filteredUsers.length > 0 && totalPages > 1 && (
					<div className="users-pagination">
						<button
							type="button"
							className="pagination-btn"
							onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
							disabled={safePage === 1}
						>
							Anterior
						</button>

						<span className="pagination-info">
							Página {safePage} de {totalPages}
						</span>

						<button
							type="button"
							className="pagination-btn"
							onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
							disabled={safePage === totalPages}
						>
							Seguinte
						</button>
					</div>
				)}
			</section>
		</main>
	);
};

export default AdminUsers;

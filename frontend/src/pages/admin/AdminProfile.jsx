import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../../services/api";
import "./AdminProfile.css";

const formatMemberSince = (createdAt) => {
  if (!createdAt) return "Não disponível";

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Não disponível";

  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const AdminProfile = () => {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    telefone: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        const userId = storedUser?.id_user;

        if (!userId) {
          setError("Não foi possível identificar o utilizador autenticado.");
          setLoading(false);
          return;
        }

        const response = await api.get(`/users/${userId}`);
        const profileData = response.data;

        setUser(profileData);
        setFormData({
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
          email: profileData.email || "",
          telefone: profileData.telefone || "",
        });
      } catch (err) {
        console.error("Erro ao carregar o perfil:", err);
        setError("Não foi possível carregar os dados do perfil.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (event) => {
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

      const response = await api.put(`/users/${userId}`, formData);
      const updatedUser = response.data.user || response.data;

      setUser(updatedUser);
      setFormData({
        first_name: updatedUser.first_name || "",
        last_name: updatedUser.last_name || "",
        email: updatedUser.email || "",
        telefone: updatedUser.telefone || "",
      });

      const currentUser = JSON.parse(localStorage.getItem("user") || "null") || {};
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...currentUser,
          ...updatedUser,
        })
      );

      setEditing(false);
    } catch (err) {
      console.error("Erro ao atualizar o perfil:", err);
      setError(err.response?.data?.message || "Não foi possível atualizar o perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        telefone: user.telefone || "",
      });
    }

    setEditing(false);
    setError("");
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (event) => {
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

      const response = await api.put("/auth/change-password", {
        ...passwordForm,
        userId,
      });

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordForm(false);
      setError("");

      Swal.fire({
        title: "Sucesso",
        text: response.data.message || "Palavra-passe alterada com sucesso!",
        icon: "success",
        customClass: {
          popup: "vetlumen-swal-popup",
          title: "vetlumen-swal-title",
          htmlContainer: "vetlumen-swal-text",
          confirmButton: "vetlumen-swal-button"
        }
      });
    } catch (err) {
      console.error("Erro ao alterar palavra-passe:", err);
      setError(err.response?.data?.message || "Não foi possível alterar a palavra-passe.");
    } finally {
      setSaving(false);
    }
  };

  const getRoleName = (id_role) => {
      switch (id_role) {
        case 1:
          return "Cliente";
    
        case 2:
          return "Veterinário";
    
        case 3:
          return "Administrador";
    
        default:
          return "Utilizador";
      }
    };

  return (
    <main className="profile-container">
      <div className="profile-header">
        <div>
          <h1>O Meu Perfil</h1>
          <p>Consulta e atualiza os teus dados pessoais.</p>
        </div>

        {!editing && (
          <button className="edit-profile-btn" onClick={() => setEditing(true)}>
            <i className="bi bi-pencil-square"></i>
            Editar Perfil
          </button>
        )}
      </div>

      {loading ? (
        <div className="profile-card">
          <p>A carregar o perfil...</p>
        </div>
      ) : error ? (
        <div className="profile-card">
          <p className="profile-error">{error}</p>
        </div>
      ) : (
        <>
          <div className="profile-card">
            <div className="profile-avatar-section">
              <i className="bi bi-person-fill profile-avatar-icon"></i>
              <h2 className="profile-name">
                {user?.first_name} <br /> {user?.last_name}
              </h2>
              <span>
                {getRoleName(user?.id_role)}
              </span>
            </div>

            <div className="profile-details">
              {editing ? (
                <form className="profile-edit-form" onSubmit={handleSave}>
                  <div className="profile-item">
                    <label htmlFor="first_name">Nome</label>
                    <input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="Nome"
                      className="profile-input"
                    />
                  </div>

                  <div className="profile-item">
                    <label htmlFor="last_name">Apelido</label>
                    <input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Apelido"
                      className="profile-input"
                    />
                  </div>

                  <div className="profile-item">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email"
                      className="profile-input"
                    />
                  </div>

                  <div className="profile-item">
                    <label htmlFor="telefone">Telefone</label>
                    <input
                      id="telefone"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleChange}
                      placeholder="Telefone"
                      className="profile-input"
                    />
                  </div>

                  <div className="profile-edit-actions">
                    <button type="button" className="password-btn" onClick={handleCancel} disabled={saving}>
                      Cancelar
                    </button>
                    <button type="submit" className="edit-profile-btn" disabled={saving}>
                      {saving ? "A guardar..." : "Guardar Alterações"}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="profile-item">
                    <label>Nome</label>
                    <p>{user?.first_name} {user?.last_name}</p>
                  </div>

                  <div className="profile-item">
                    <label>Email</label>
                    <p>{user?.email}</p>
                  </div>

                  <div className="profile-item">
                    <label>Telefone</label>
                    <p>{user?.telefone || "Não definido"}</p>
                  </div>

                  <div className="profile-item">
                    <label>Membro desde</label>
                    <p>{formatMemberSince(user?.created_at)}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="profile-security">
            <h3>Segurança</h3>
            <button className="password-btn" onClick={() => setShowPasswordForm((prev) => !prev)}>
              <i className="bi bi-shield-lock"></i>
              {showPasswordForm ? "Fechar" : "Alterar Palavra-passe"}
            </button>

            {showPasswordForm && (
              <form className="password-form" onSubmit={handlePasswordSubmit}>
                <div className="profile-item">
                  <label htmlFor="currentPassword">Palavra-passe atual</label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="profile-input"
                  />
                </div>

                <div className="profile-item">
                  <label htmlFor="newPassword">Nova palavra-passe</label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="profile-input"
                  />
                </div>

                <div className="profile-item">
                  <label htmlFor="confirmPassword">Confirmar palavra-passe</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className="profile-input"
                  />
                </div>

                <div className="profile-edit-actions">
                  <button type="button" className="password-btn" onClick={() => setShowPasswordForm(false)} disabled={saving}>
                    Cancelar
                  </button>
                  <button type="submit" className="edit-profile-btn" disabled={saving}>
                    {saving ? "A guardar..." : "Guardar Palavra-passe"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </main>
  );
};

export default AdminProfile;
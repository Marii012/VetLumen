import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import api from "../../services/api";
import "./Appointments.css";

const BookAppointment = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [veterinarians, setVeterinarians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    id_pet: "",
    id_service: "",
    id_veterinario: "",
    data: "",
    hora: "",
    observacoes: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        const userId = storedUser?.id_user;

        const [petsResponse, servicesResponse, usersResponse, appointmentsResponse] = await Promise.all([
          userId ? api.get(`/pets/user/${userId}`) : Promise.resolve({ data: [] }),
          api.get("/services"),
          api.get("/users"),
          api.get("/appointments")
        ]);

        const vetUsers = (usersResponse.data || []).filter((user) => {
          const roleValue = user.id_role ?? user.role?.id_role ?? user.roleId;
          return Number(roleValue) === 2;
        });

        setPets(petsResponse.data || []);
        setServices(servicesResponse.data || []);
        setVeterinarians(vetUsers);
        setAppointments(appointmentsResponse.data || []);

        if (vetUsers.length > 0) {
          setFormData((prev) => ({ ...prev, id_veterinario: String(vetUsers[0].id_user) }));
        }
      } catch (err) {
        console.error("Erro ao carregar dados de marcação:", err);
        setError("Não foi possível carregar os dados da marcação.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
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

      if (!formData.id_pet || !formData.id_service) {
        setError("Selecione o animal e o serviço antes de guardar a consulta.");
        setSaving(false);
        return;
      }

      const selectedService = services.find((service) => String(service.id_service) === String(formData.id_service));
      const selectedVeterinarianId = Number(formData.id_veterinario);

      if (!selectedVeterinarianId) {
        setError("Selecione um veterinário antes de guardar a consulta.");
        setSaving(false);
        return;
      }

      await api.post("/appointments", {
        data: formData.data,
        hora: formData.hora,
        motivo: selectedService?.nome || "Consulta",
        observacoes: formData.observacoes || null,
        id_pet: Number(formData.id_pet),
        id_veterinario: selectedVeterinarianId,
        id_service: Number(formData.id_service),
      });

      navigate("/client/appointments");
    } catch (err) {
      console.error("Erro ao marcar consulta:", err);
      setError(err.response?.data?.message || "Não foi possível marcar a consulta.");
    } finally {
      setSaving(false);
    }
  };

  const petOptions = pets.map((pet) => ({ value: String(pet.id_pet), label: pet.nome }));
  const formatEuro = (value) => {
    if (value == null || value === "") return "0.00€";
    const num = Number(value);
    if (Number.isNaN(num)) return "0.00€";
    return `${num.toFixed(2)}€`;
  };

  const serviceOptions = services.map((service) => ({ value: String(service.id_service), label: `${service.nome} — ${formatEuro(service.preco)}` }));
  const veterinarianOptions = veterinarians.map((veterinarian) => ({
    value: String(veterinarian.id_user),
    label: `${veterinarian.first_name || ""} ${veterinarian.last_name || ""}`.trim() || veterinarian.email,
  }));

  const selectedPet = petOptions.find((option) => option.value === String(formData.id_pet)) || null;
  const selectedService = serviceOptions.find((option) => option.value === String(formData.id_service)) || null;
  const selectedVeterinarian = veterinarianOptions.find((option) => option.value === String(formData.id_veterinario)) || null;

  const [availableTimes, setAvailableTimes] = useState([]);

  // compute available times when date/vet/appointments change
  useEffect(() => {
    const computeTimes = () => {
      if (!formData.data) {
        setAvailableTimes([]);
        return;
      }

      // generate hourly slots from 08:00 to 20:00
      const slots = [];
      for (let h = 8; h <= 20; h++) {
        const hh = String(h).padStart(2, "0");
        slots.push(`${hh}:00`);
      }

      // filter out slots that already have appointments on selected date and veterinarian
      const filtered = slots.filter((slot) => {
        return !appointments.some((a) => {
          if (!a || !a.data) return false;
          // match by date string (YYYY-MM-DD) and hora (HH:MM)
          const sameDate = String(a.data) === String(formData.data) || (new Date(a.data)).toISOString().split("T")[0] === String(formData.data);
          if (!sameDate) return false;
          if (formData.id_veterinario) {
            return String(a.id_veterinario) === String(formData.id_veterinario) && String(a.hora || "").startsWith(slot);
          }
          return String(a.hora || "").startsWith(slot);
        });
      });

      setAvailableTimes(filtered);
    };

    computeTimes();
  }, [formData.data, formData.id_veterinario, appointments]);

  return (
    <main className="appointments-container">
      <div className="appointments-header">
        <div>
          <h1>Marcar Consulta</h1>
          <p>Preencha os detalhes para agendar uma nova consulta.</p>
        </div>

        <button className="dashboard-btn" onClick={() => navigate("/client/appointments")}>
          <i className="bi bi-arrow-left"></i>
          Voltar às consultas
        </button>
      </div>

      {loading ? (
        <div className="profile-card">
          <p>A carregar dados...</p>
        </div>
      ) : (
        <form className="appointment-booking-form" onSubmit={handleSubmit}>
          {error && <p className="profile-error">{error}</p>}

          <div className="profile-item">
            <label htmlFor="id_pet">Animal</label>
            <Select
              inputId="id_pet"
              className="pet-form-select"
              classNamePrefix="pet-form-select"
              options={petOptions}
              value={selectedPet}
              onChange={(option) => setFormData((prev) => ({ ...prev, id_pet: option?.value || "" }))}
              isSearchable={false}
              placeholder="Selecione um animal"
            />
          </div>

          <div className="profile-item">
            <label htmlFor="id_service">Serviço</label>
            <Select
              inputId="id_service"
              className="pet-form-select"
              classNamePrefix="pet-form-select"
              options={serviceOptions}
              value={selectedService}
              onChange={(option) => setFormData((prev) => ({ ...prev, id_service: option?.value || "" }))}
              isSearchable={false}
              placeholder="Selecione um serviço"
            />
            {selectedService && (
              <div className="service-price mt-2">Preço: {formatEuro((services.find(s=>String(s.id_service)===selectedService.value)||{}).preco)}</div>
            )}
          </div>

          <div className="profile-item appointment-vet-field">
            <label htmlFor="id_veterinario">Veterinário</label>
            <Select
              inputId="id_veterinario"
              className="pet-form-select"
              classNamePrefix="pet-form-select"
              options={veterinarianOptions}
              value={selectedVeterinarian}
              onChange={(option) => setFormData((prev) => ({ ...prev, id_veterinario: option?.value || "" }))}
              isSearchable={false}
              placeholder="Selecione um veterinário"
            />
          </div>

          <div className="appointment-inline-row">
            <div className="profile-item appointment-date-field">
              <label htmlFor="data">Data</label>
              <input id="data" name="data" type="date" value={formData.data} onChange={handleChange} className="profile-input" required />
            </div>

            <div className="profile-item appointment-time-field">
              <label htmlFor="hora">Hora</label>
              <select id="hora" name="hora" value={formData.hora} onChange={handleChange} className="profile-input" required>
                <option value="">Selecionar hora</option>
                {availableTimes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="profile-item full-width">
            <label htmlFor="observacoes">Observações</label>
            <textarea id="observacoes" name="observacoes" value={formData.observacoes} onChange={handleChange} className="profile-input" rows="4" placeholder="Informações adicionais" />
          </div>

          <div className="profile-edit-actions full-width">
            <button type="button" className="password-btn" onClick={() => navigate("/client/appointments")} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="edit-profile-btn" disabled={saving}>
              {saving ? "A guardar..." : "Guardar Consulta"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
};

export default BookAppointment;

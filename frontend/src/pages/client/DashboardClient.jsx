import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardClient.css";
import api from "../../services/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [healthPercent, setHealthPercent] = useState(95);
  const [chartData, setChartData] = useState(new Array(12).fill(0));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        if (!storedUser) return;

        const userId = storedUser.id_user;

        const petsResp = await api.get(`/pets/user/${userId}`);
        const petsData = petsResp.data || [];
        setPets(petsData);

        const apptResp = await api.get(`/appointments`);
        const allAppointments = apptResp.data || [];

        const petIds = petsData.map((p) => p.id_pet);
        const userAppointments = allAppointments.filter((a) => petIds.includes(a.id_pet));
        setAppointments(userAppointments);

        // Próxima consulta (mais próxima no futuro)
        const now = new Date();
        const upcoming = userAppointments
          .map((a) => ({
            ...a,
            datetime: new Date(`${a.data}T${a.hora || '00:00'}`)
          }))
          .filter((a) => a.datetime >= now)
          .sort((x, y) => x.datetime - y.datetime);

        if (upcoming.length > 0) {
          setAppointments((prev) => prev); // manter
        }

        // calcular anos disponíveis a partir das consultas
        const yearsSet = new Set();
        userAppointments.forEach((a) => {
          const d = new Date(a.data);
          yearsSet.add(d.getFullYear());
        });
        const yearsArr = Array.from(yearsSet).sort((a,b) => b - a);
        if (yearsArr.length === 0) {
          // garantir pelo menos o ano atual
          yearsArr.push(new Date().getFullYear());
        }
        setAvailableYears(yearsArr);
        if (!yearsArr.includes(selectedYear)) {
          setSelectedYear(yearsArr[0]);
        }

        // Saúde geral simples: percentagem de pets com registo médico (último ano)
        try {
          const nowYear = new Date().getFullYear();
          let petsWithRecords = 0;
          for (const p of petsData) {
            const rec = await api.get(`/medical-records/pet/${p.id_pet}`);
            if ((rec.data || []).length > 0) petsWithRecords += 1;
          }
          const health = petsData.length ? Math.round((petsWithRecords / petsData.length) * 100) : 95;
          setHealthPercent(health);
        } catch (err) {
          // non-fatal: manter valor padrão
        }

      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      }
    };

    fetchData();
  }, []);

  // Dados derivados para render
  const now = new Date();
  const todayDisplay = `Hoje, ${now.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })}`;

  const upcomingAppts = appointments
    .map((a) => ({ ...a, datetime: new Date(`${a.data}T${a.hora || '00:00'}`) }))
    .filter((a) => a.datetime >= now)
    .sort((x, y) => x.datetime - y.datetime);

  const nextAppt = upcomingAppts.length ? upcomingAppts[0] : null;

  const recentActivities = appointments
    .map((a) => ({ ...a, datetime: new Date(`${a.data}T${a.hora || '00:00'}`) }))
    .sort((x, y) => y.datetime - x.datetime)
    .slice(0, 3);

  const monthsLabels = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  const getPetById = (id) => pets.find((p) => p.id_pet === id);

  const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/api\/?$/i, "");

  const getPetImageUrl = (fotografia) => {
    if (!fotografia) return null;
    if (fotografia.startsWith('http')) return fotografia;
    if (fotografia.startsWith('/')) return `${API_BASE}${fotografia}`;
    return `${API_BASE}/uploads/${fotografia}`;
  };

  const getAge = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const diff = new Date().getFullYear() - d.getFullYear();
    return diff > 0 ? `${diff} anos` : "<1 ano";
  };

  // Recalcular barras por mês quando appointments ou selectedYear mudarem
  useEffect(() => {
    const counts = new Array(12).fill(0);
    appointments.forEach((a) => {
      try {
        const d = new Date(a.data);
        const y = d.getFullYear();
        const m = d.getMonth();
        if (y === Number(selectedYear) && m >= 0 && m < 12) counts[m] += 1;
      } catch (err) {
        // ignore
      }
    });

    const max = Math.max(...counts, 1);
    const perc = counts.map((v) => Math.round((v / max) * 100));
    setChartData(perc);
  }, [appointments, selectedYear]);

  return (
    <div className="client-dashboard">
    <main className="dashboard-container">

      {/* Cabeçalho */}
      <header className="dashboard-header">
        <div>
          <h1>A Minha Conta</h1>
          <p>
            Aqui tens um resumo da saúde e acompanhamento dos teus animais.
          </p>
        </div>

        <div className="date-box">
          <span>{todayDisplay}</span>
        </div>
      </header>


      {/* Banner principal */}
      <section className="welcome-card">

        <div className="welcome-content">

          <h2>
            Tudo em dia com os teus animais
          </h2>

          <p>
            Consulta marcações, acompanha o histórico médico e recebe
            lembretes importantes para garantir o melhor cuidado.
          </p>


          <button className="dashboard-btn" onClick={() => navigate("/client/appointments/book")}>
            <i className="bi bi-calendar-event"></i>
            Marcar Consulta
          </button>

        </div>

      </section>



      {/* Estatísticas */}
      <section className="stats-grid">

        <div className="stat-card">

          <div className="stat-icon">
            <i className="bi bi-heart-fill"></i>
          </div>

          <div>
            <h3>{pets.length || 0}</h3>
            <p>Animais</p>
          </div>

        </div>



        <div className="stat-card">

          <div className="stat-icon">
            <i className="bi bi-calendar-check"></i>
          </div>

          <div>
            <h3>{appointments.length || 0}</h3>
            <p>Consultas</p>
          </div>

        </div>



        <div className="stat-card">

          <div className="stat-icon">
            <i className="bi bi-shield-check"></i>
          </div>

          <div>
            <h3>{healthPercent}%</h3>
            <p>Saúde geral</p>
          </div>

        </div>



      </section>



      <div className="dashboard-grid">


        {/* Gráfico */}
        <section className="dashboard-card chart-card">

          <div className="card-title">
            <h3>
              Histórico de Consultas
            </h3>
            <div className="chart-controls-inline">
              <label>Ano:</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="chart">
            {chartData.map((value, idx) => (
              <div className="bar" key={idx}>
                <span style={{ height: `${value}%` }}></span>
                <small>{monthsLabels[idx] || `M${idx+1}`}</small>
              </div>
            ))}
          </div>


        </section>




        {/* Próxima consulta */}
        <section className="dashboard-card">


          <div className="card-title">
            <h3>
              Próxima Consulta
            </h3>
          </div>



          <div className="appointment-card">


            <div className="appointment-icon">
              <i className="bi bi-calendar2-week"></i>
            </div>


            <div>
              {nextAppt ? (
                <>
                  <h4>{getPetById(nextAppt.id_pet)?.nome || 'Pet'}</h4>
                  <p>{nextAppt.motivo || 'Consulta agendada'}</p>
                  <span>{new Date(nextAppt.datetime).toLocaleString()}</span>
                </>
              ) : (
                <>
                  <h4>Sem consultas</h4>
                  <p>Não há consultas agendadas.</p>
                </>
              )}
            </div>


          </div>


        </section>



      </div>




      {/* Parte inferior */}

      <div className="dashboard-grid">


        {/* Animais */}

        <section className="dashboard-card">


          <div className="card-title">
            <h3>
              Os meus animais
            </h3>
          </div>



          {pets.length === 0 && (
            <div className="pet-row">Sem animais adicionados.</div>
          )}

          {pets.map((p) => (
            <div className="pet-row" key={p.id_pet}>
              <div className="pet-avatar">
                {p.fotografia ? (
                  <img
                    src={getPetImageUrl(p.fotografia)}
                    alt={p.nome}
                    style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }}
                  />
                ) : (
                  <i className="bi bi-person-circle fs-2"></i>
                )}
              </div>
              <div>
                <strong>{p.nome}</strong>
                <p>{p.porte || ''} • {getAge(p.data_nascimento)}</p>
              </div>
              <span className="status">{p.estado || 'Ativo'}</span>
            </div>
          ))}



        </section>




        {/* Atividade */}

        <section className="dashboard-card">


          <div className="card-title">
            <h3>
              Atividade Recente
            </h3>
          </div>



          {recentActivities.length === 0 && (
            <div className="activity">Sem atividade recente.</div>
          )}

          {recentActivities.map((a) => (
            <div className="activity" key={a.id_appointment || `${a.id_pet}-${a.datetime}`}>
              <i className="bi bi-check-circle-fill"></i>
              <div>
                <strong>{a.motivo || 'Consulta'}</strong>
                <p>{getPetById(a.id_pet)?.nome || 'Pet'} • {new Date(a.datetime).toLocaleString()}</p>
              </div>
            </div>
          ))}


        </section>



      </div>


    </main>
    </div>
  );
};


export default Dashboard;
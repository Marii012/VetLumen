import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./DashboardVet.css";

const DashboardVet = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const todayDisplay = `Hoje, ${new Date().toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long"
  })}`;

  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez"
  ];

  const parseAppointmentDateTime = (dateValue, timeValue) => {
    if (!dateValue) return null;

    const datePart = String(dateValue).slice(0, 10);
    const [year, month, day] = datePart.split("-").map(Number);

    if (!year || !month || !day) return null;

    const timePart = String(timeValue || "00:00:00").slice(0, 8);
    const [hour = 0, minute = 0, second = 0] = timePart.split(":").map((value) => Number(value) || 0);
    const date = new Date(year, month - 1, day, hour, minute, second);

    return Number.isNaN(date.getTime()) ? null : date;
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        const vetId = storedUser?.id_user;

        if (!vetId) {
          setError("Não foi possível identificar o veterinário autenticado.");
          setAppointments([]);
          setLoading(false);
          return;
        }

        const [appointmentsResponse, petsResponse, usersResponse] = await Promise.all([
          api.get("/appointments"),
          api.get("/pets"),
          api.get("/users")
        ]);

        const petsMap = new Map((petsResponse.data || []).map((pet) => [Number(pet.id_pet), pet]));
        const usersMap = new Map((usersResponse.data || []).map((user) => [Number(user.id_user), user]));

        const vetAppointments = (appointmentsResponse.data || [])
          .filter((appointment) => Number(appointment.id_veterinario) === Number(vetId))
          .map((appointment) => {
            const pet = petsMap.get(Number(appointment.id_pet));
            const owner = pet?.id_user ? usersMap.get(Number(pet.id_user)) : null;
            const dateTime = parseAppointmentDateTime(appointment.data, appointment.hora);

            return {
              ...appointment,
              petName: pet?.nome || "Pet",
              ownerName: owner ? `${owner.first_name || ""} ${owner.last_name || ""}`.trim() || owner.email : "Tutor não identificado",
              dateTime,
              timeLabel: String(appointment.hora || "00:00").slice(0, 5)
            };
          })
          .sort((a, b) => {
            if (!a.dateTime && !b.dateTime) return 0;
            if (!a.dateTime) return 1;
            if (!b.dateTime) return -1;
            return a.dateTime - b.dateTime;
          });

        setAppointments(vetAppointments);
      } catch (err) {
        setError("Não foi possível carregar o dashboard do veterinário.");
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const dashboardData = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todayAppointments = appointments.filter((item) => item.dateTime && item.dateTime >= startOfToday && item.dateTime <= endOfToday);
    const pendingAppointments = appointments.filter((item) => item.estado === "Pendente");
    const completedCount = appointments.filter((item) => item.estado === "Concluída").length;

    const patientsCount = new Set(appointments.map((item) => item.id_pet).filter(Boolean)).size;

    const nextAppointment = appointments.find((item) => {
      if (!item.dateTime) return false;
      if (item.estado === "Cancelada") return false;
      return item.dateTime >= now;
    }) || null;

    const monthlyCountsRaw = new Array(12).fill(0);

    appointments.forEach((item) => {
      if (!item.dateTime) return;
      if (item.dateTime.getFullYear() !== now.getFullYear()) return;
      monthlyCountsRaw[item.dateTime.getMonth()] += 1;
    });

    const max = Math.max(...monthlyCountsRaw, 1);
    const monthlyPercentages = monthlyCountsRaw.map((value) => Math.round((value / max) * 100));

    return {
      todayAppointments,
      pendingAppointments,
      completedCount,
      patientsCount,
      nextAppointment,
      monthlyPercentages
    };
  }, [appointments]);


  return (
    <main className="dashboard-container">


      {/* Cabeçalho */}

      <header className="dashboard-header">

        <div>

          <h1>
            Painel do Veterinário
          </h1>

          <p>
            Acompanhe consultas, pacientes e atividade clínica.
          </p>

        </div>


        <div className="date-box">
          <span>
            {todayDisplay}
          </span>
        </div>


      </header>




      {/* Banner */}

      <section className="welcome-card">


        <div className="welcome-content">


          <h2>
            Bem-vindo ao seu painel clínico
          </h2>


          <p>
            Consulte a agenda do dia, acompanhe os pacientes
            e mantenha todas as consultas organizadas.
          </p>


          <button
            className="dashboard-btn"
            onClick={() => navigate("/vet/appointments")}
          >

            <i className="bi bi-calendar-event"></i>

            Ver Consultas

          </button>


        </div>


      </section>





      {/* Estatísticas */}

      <section className="stats-grid">


        <div className="stat-card">

          <div className="stat-icon">
            <i className="bi bi-calendar-event"></i>
          </div>

          <div>
            <h3>{loading ? "..." : dashboardData.todayAppointments.length}</h3>
            <p>Consultas Hoje</p>
          </div>

        </div>



        <div className="stat-card">

          <div className="stat-icon">
            <i className="bi bi-hourglass-split"></i>
          </div>

          <div>
            <h3>{loading ? "..." : dashboardData.pendingAppointments.length}</h3>
            <p>Pendentes</p>
          </div>

        </div>



        <div className="stat-card">

          <div className="stat-icon">
            <i className="bi bi-check-circle"></i>
          </div>

          <div>
            <h3>{loading ? "..." : dashboardData.completedCount}</h3>
            <p>Concluídas</p>
          </div>

        </div>



        <div className="stat-card">

          <div className="stat-icon">
            <i className="bi bi-heart-pulse"></i>
          </div>

          <div>
            <h3>{loading ? "..." : dashboardData.patientsCount}</h3>
            <p>Pacientes</p>
          </div>

        </div>



      </section>





      <div className="dashboard-grid">



        {/* Gráfico */}

        <section className="dashboard-card">


          <div className="card-title">

            <h3>
              Consultas por mês
            </h3>


          </div>


          <div className="chart">


            {dashboardData.monthlyPercentages.map((value, index) => (

              <div className="bar" key={index}>

                <span
                  style={{
                    height: `${value}%`
                  }}
                ></span>


                <small>
                  {months[index]}
                </small>


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
              {loading ? (
                <>
                  <h4>A carregar...</h4>
                  <p>A obter próxima consulta.</p>
                </>
              ) : dashboardData.nextAppointment ? (
                <>
                  <h4>{dashboardData.nextAppointment.petName}</h4>
                  <p>{dashboardData.nextAppointment.motivo || "Consulta"}</p>
                  <span>{dashboardData.nextAppointment.dateTime?.toLocaleString("pt-PT") || "Data indisponível"}</span>
                  <small>Dono: {dashboardData.nextAppointment.ownerName}</small>
                </>
              ) : (
                <>
                  <h4>Sem próximas consultas</h4>
                  <p>Não existem consultas futuras atribuídas.</p>
                </>
              )}


            </div>


          </div>


        </section>



      </div>






      <div className="dashboard-grid">



        {/* Agenda */}

        <section className="dashboard-card">


          <div className="card-title">

            <h3>
              Agenda de Hoje
            </h3>

          </div>



          {!loading && dashboardData.todayAppointments.length === 0 && (
            <div className="activity">
              <i className="bi bi-calendar-x"></i>
              <div>
                <strong>Sem consultas hoje</strong>
                <p>Não existem marcações para hoje.</p>
              </div>
            </div>
          )}

          {dashboardData.todayAppointments.map((item)=>(

            <div
              className="activity"
              key={`today-${item.id_appointment || `${item.id_pet}-${item.data}-${item.hora}`}`}
            >

              <i className="bi bi-clock"></i>


              <div>

                <strong>
                  {item.timeLabel} - {item.petName}
                </strong>


                <p>
                  {(item.motivo || "Consulta")} • {item.ownerName}
                </p>


              </div>


            </div>


          ))}



        </section>






        {/* Pendentes */}

        <section className="dashboard-card">


          <div className="card-title">

            <h3>
              Consultas Pendentes
            </h3>

          </div>



          {!loading && dashboardData.pendingAppointments.length === 0 && (
            <div className="activity">
              <i className="bi bi-check2-circle"></i>
              <div>
                <strong>Sem pendências</strong>
                <p>Não existem consultas pendentes.</p>
              </div>
            </div>
          )}

          {dashboardData.pendingAppointments.slice(0, 4).map((item)=>(


            <div
              className="activity"
              key={`pending-${item.id_appointment || `${item.id_pet}-${item.data}-${item.hora}`}`}
            >

              <i className="bi bi-exclamation-circle"></i>


              <div>

                <strong>
                  {item.petName}
                </strong>


                <p>
                  {item.motivo || "Consulta"}
                  <br/>
                  {item.ownerName}
                </p>


                <button className="details-btn" onClick={() => navigate("/vet/appointments")}>
                  Ver
                </button>


              </div>


            </div>


          ))}



        </section>



      </div>


      {error && (
        <div className="dashboard-card" style={{ marginTop: 20 }}>
          <p>{error}</p>
        </div>
      )}




    </main>
  );
};


export default DashboardVet;
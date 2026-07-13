import { Routes, Route, useLocation } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";

import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";

{/* Dashboard Cliente */}
import ClientLayout from "./layouts/ClientLayout";
import Dashboard from "./pages/client/DashboardClient";
import Pets from "./pages/client/Pets";
import Appointments from "./pages/client/Appointments";
import BookAppointment from "./pages/client/BookAppointment";
import MedicalRecord from "./pages/client/MedicalRecord";
import Invoices from "./pages/client/Invoices";
import PetVaccines from "./pages/client/PetVaccines";
import PetHistory from "./pages/client/PetHistory";
import PetDetails from "./pages/client/PetDetails";
import Profile from "./pages/client/Profile";
import AddPetPage from "./pages/client/AddPetPage";
import EditPetPage from "./pages/client/EditPetPage";

{/* Dashboard Veterinário */}
import VetLayout from "./layouts/VetLayout";
import DashboardVet from "./pages/vet/DashboardVet";
import VetAppointments from "./pages/vet/VetAppointments";
import VetPatients from "./pages/vet/VetPatients";
import VetProfile from "./pages/vet/VetProfile";
import VetAddClinicalRecordPage from "./pages/vet/VetAddClinicalRecordPage";
import VetFinalizeAppointmentPage from "./pages/vet/VetFinalizeAppointmentPage";

function App() {
  const location = useLocation();

  const hideLayout =
  location.pathname.startsWith("/client") ||
  location.pathname.startsWith("/vet") ||
  location.pathname === "/login" ||
  location.pathname === "/register";

  return (
    <>
      {!hideLayout && <Header />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard Cliente */}
        <Route element={<ClientLayout />}>
          <Route path="/client/dashboard" element={<Dashboard />} />
          <Route path="/client/pets" element={<Pets />} />
          <Route path="/client/pets/add" element={<AddPetPage />} />
          <Route path="/client/pets/:id/edit" element={<EditPetPage />} />
          <Route path="/client/appointments" element={<Appointments />} />
          <Route path="/client/appointments/book" element={<BookAppointment />} />
          <Route path="/client/medical-records" element={<MedicalRecord />} />
          <Route path="/client/invoices" element={<Invoices />} />
          <Route path="/client/pets/:id" element={<PetDetails />} />
          <Route path="/client/pets/:id/history" element={<PetHistory />} />
          <Route path="/client/pets/:id/vaccines" element={<PetVaccines />} />
          <Route path="/client/profile" element={<Profile />} />
        </Route>

        {/* Dashboard Veterinário */}
        <Route element={<VetLayout />}>
          <Route path="/vet/dashboard" element={<DashboardVet />} />
          <Route path="/vet/appointments" element={<VetAppointments />} />
          <Route path="/vet/appointments/:id/finalize" element={<VetFinalizeAppointmentPage />} />
          <Route path="/vet/patients" element={<VetPatients />} />
          <Route path="/vet/patients/:id" element={<PetDetails />} />
          <Route path="/vet/patients/:id/history" element={<PetHistory />} />
          <Route path="/vet/patients/:id/vaccines" element={<PetVaccines />} />
          <Route path="/vet/patients/:id/records/new" element={<VetAddClinicalRecordPage />} />
          <Route path="/vet/profile" element={<VetProfile />} />
        </Route>
      </Routes>

      {!hideLayout && <Footer />}
    </>
  );
}

export default App;
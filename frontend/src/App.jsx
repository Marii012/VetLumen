import { Routes, Route, useLocation } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";

import Home from "./pages/public/Home";
import Login from "./pages/public/Login"; // ajusta o caminho
import Register from "./pages/public/Register"; // ajusta o caminho

function App() {
  const location = useLocation();

  const hideLayout = ["/login", "/register"].includes(location.pathname);

  return (
    <>
      {!hideLayout && <Header />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>

      {!hideLayout && <Footer />}
    </>
  );
}

export default App;
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://vetlumen.onrender.com/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  console.log("TOKEN NO AXIOS:", token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log("HEADER AUTH:", config.headers.Authorization);

  return config;
}, (error) => Promise.reject(error));

export default api;
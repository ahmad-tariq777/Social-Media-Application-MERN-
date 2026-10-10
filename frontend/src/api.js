import axios from "axios";
import { API_URL } from "./config";

const api = axios.create({ baseURL: `${API_URL}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      window.location.assign("/login");
    }
    return Promise.reject(err);
  }
);

export const errMsg = (err, fallback = "Something went wrong") =>
  err?.response?.data?.msg || err?.response?.data?.message || fallback;

export default api;

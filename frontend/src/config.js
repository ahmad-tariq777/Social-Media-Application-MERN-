const PRODUCTION_API = "https://social-media-application-mern-eab4.vercel.app";
const isLocal =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

const raw =
  process.env.REACT_APP_API_URL ||
  (isLocal ? "http://localhost:5000" : PRODUCTION_API);

export const API_URL = raw.replace(/\/+$/, "");

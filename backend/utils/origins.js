const clean = (value) => value.trim().replace(/\/+$/, "");

const configured = () =>
  (process.env.CLIENT_URLS || "http://localhost:3000,http://localhost:5173")
    .split(",")
    .map(clean)
    .filter(Boolean);

const defaults = [
  "https://social-media-application-mern.vercel.app",
  "https://social-media-application-mern-8zhi69ewd-team-x-93c0.vercel.app",
];

const previewPattern = /^https:\/\/social-media-application-mern(-[a-z0-9]+)*-team-x-93c0\.vercel\.app$/;

export const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalized = clean(origin);
  return (
    configured().includes(normalized) ||
    defaults.includes(normalized) ||
    previewPattern.test(normalized)
  );
};

export const corsOrigin = (origin, cb) => cb(null, isAllowedOrigin(origin));

import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket } from "./socket/index.js";

try {
  await connectDB();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  const backendUrl =
    process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL;

  if (process.env.NODE_ENV === "production" && backendUrl) {
    const pingInterval = 14 * 60 * 1000;

    const pingBackend = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/health`);
        console.log(
          `[Self-Ping] HTTP ${response.status} at ${new Date().toISOString()}`
        );
      } catch (error) {
        console.error("[Self-Ping] Failed:", error.message);
      }
    };

    setInterval(pingBackend, pingInterval);
  }
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

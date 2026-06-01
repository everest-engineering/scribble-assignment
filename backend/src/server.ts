import { createApp } from "./app.js";
import { startRoomCleanup } from "./services/roomCleanup.js";

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";
const app = createApp();

if (Number.isNaN(port)) {
  throw new Error("PORT must be a valid number");
}

const server = app.listen(port, host, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});

const stopCleanup = startRoomCleanup();

function shutdown() {
  console.log("Shutting down server...");
  stopCleanup();
  server.close(() => {
    console.log("Server stopped");
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

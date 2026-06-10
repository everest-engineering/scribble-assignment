import http from "node:http";
import express from "express";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRoomsRouter } from "./rooms.js";
import { errorHandler } from "./router.js";

type Server = ReturnType<typeof http.createServer>;

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/", createRoomsRouter());
  app.use(errorHandler);
  return app;
}

function makeRequest(
  app: express.Express,
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve) => {
    const server: Server = app.listen(0, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        resolve({ status: 500, body: { message: "Failed to bind" } });
        return;
      }

      const options = {
        hostname: "localhost",
        port: address.port,
        path,
        method,
        headers: { "Content-Type": "application/json" } as Record<string, string>
      };

      const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk: string) => {
          data += chunk;
        });
        res.on("end", () => {
          server.close();
          resolve({
            status: res.statusCode ?? 500,
            body: data ? (JSON.parse(data) as Record<string, unknown>) : {}
          });
        });
      });

      req.on("error", () => {
        server.close();
        resolve({ status: 500, body: { message: "Request failed" } });
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  });
}

describe("rooms API", () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
  });

  afterEach(() => {
    app = null as unknown as express.Express;
  });

  describe("POST /", () => {
    it("creates a room and returns 201 with snapshot", async () => {
      const res = await makeRequest(app, "POST", "/", { playerName: "Alice" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("participantId");
      expect(res.body).toHaveProperty("room");
      const room = res.body.room as Record<string, unknown>;
      expect(room).toHaveProperty("code");
      expect(room.status).toBe("lobby");
    });

    it("rejects empty name with 400", async () => {
      const res = await makeRequest(app, "POST", "/", { playerName: "" });

      expect(res.status).toBe(400);
    });

    it("rejects name with invalid characters", async () => {
      const res = await makeRequest(app, "POST", "/", { playerName: "@lice!" });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /:code/start", () => {
    it("starts a game and returns playing snapshot with drawerId", async () => {
      const created = await makeRequest(app, "POST", "/", { playerName: "Alice" });
      const room = created.body.room as Record<string, string>;
      const hostId = created.body.participantId as string;

      await makeRequest(app, "POST", `/${room.code}/join`, { playerName: "Bob" });
      const res = await makeRequest(app, "POST", `/${room.code}/start`, { participantId: hostId });

      expect(res.status).toBe(200);
      const startedRoom = res.body.room as Record<string, unknown>;
      expect(startedRoom.status).toBe("playing");
      expect(startedRoom.drawerId).toBe(hostId);
    });

    it("returns 403 when non-host tries to start", async () => {
      const created = await makeRequest(app, "POST", "/", { playerName: "Alice" });
      const room = created.body.room as Record<string, string>;

      await makeRequest(app, "POST", `/${room.code}/join`, { playerName: "Bob" });
      const res = await makeRequest(app, "POST", `/${room.code}/start`, { participantId: "wrong-id" });

      expect(res.status).toBe(403);
    });

    it("returns 400 when fewer than 2 players", async () => {
      const created = await makeRequest(app, "POST", "/", { playerName: "Alice" });
      const room = created.body.room as Record<string, string>;
      const hostId = created.body.participantId as string;

      const res = await makeRequest(app, "POST", `/${room.code}/start`, { participantId: hostId });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /:code/join", () => {
    it("joins a room and returns 200 with snapshot", async () => {
      const created = await makeRequest(app, "POST", "/", { playerName: "Alice" });
      const room = created.body.room as Record<string, string>;

      const res = await makeRequest(app, "POST", `/${room.code}/join`, { playerName: "Bob" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("participantId");
      expect(res.body).toHaveProperty("room");
    });

    it("rejects join with empty name", async () => {
      const created = await makeRequest(app, "POST", "/", { playerName: "Alice" });
      const room = created.body.room as Record<string, string>;

      const res = await makeRequest(app, "POST", `/${room.code}/join`, { playerName: "" });

      expect(res.status).toBe(400);
    });
  });
});

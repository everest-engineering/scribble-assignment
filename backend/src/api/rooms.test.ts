import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { clearAllRoomsForTests } from "../services/roomStore.js";

const app = createApp();

afterEach(() => {
  clearAllRoomsForTests();
});

describe("rooms API", () => {
  it("POST /rooms creates room with host viewer", async () => {
    const response = await request(app).post("/rooms").send({ playerName: "Alice" });

    expect(response.status).toBe(201);
    expect(response.body.room.viewer.isHost).toBe(true);
    expect(response.body.room.viewer.canStart).toBe(false);
  });

  it("POST /rooms rejects empty name", async () => {
    const response = await request(app).post("/rooms").send({ playerName: "   " });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Name is required");
  });

  it("POST /rooms/:code/join returns 404 for unknown room", async () => {
    const response = await request(app)
      .post("/rooms/ZZZZ/join")
      .send({ playerName: "Bob" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Room not found");
  });

  it("POST /rooms/:code/start transitions to drawing with drawer roles", async () => {
    const created = await request(app).post("/rooms").send({ playerName: "Host" });
    const hostId = created.body.participantId as string;
    const code = created.body.room.code as string;

    const joined = await request(app).post(`/rooms/${code}/join`).send({ playerName: "Guest" });
    const guestId = joined.body.participantId as string;

    const started = await request(app)
      .post(`/rooms/${code}/start`)
      .query({ participantId: hostId });

    expect(started.status).toBe(200);
    expect(started.body.room.status).toBe("drawing");
    expect(started.body.room.drawerParticipantId).toBe(hostId);
    expect(started.body.room.viewer.role).toBe("drawer");
    expect(started.body.room.viewer.secretWord).toBeDefined();

    const guesserPoll = await request(app)
      .get(`/rooms/${code}`)
      .query({ participantId: guestId });

    expect(guesserPoll.body.room.viewer.role).toBe("guesser");
    expect(guesserPoll.body.room.viewer.secretWord).toBeUndefined();
  });
});

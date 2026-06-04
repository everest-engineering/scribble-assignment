import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

const app = createApp();

describe("rooms API integration", () => {
  it("POST /rooms rejects empty playerName with 'Player name invalid'", async () => {
    const response = await request(app)
      .post("/rooms")
      .send({ playerName: "" });
    
    expect(response.status).toBe(400);
    // This will currently fail, as the errorHandler masks the Zod message
    expect(response.body.message).toBe("Player name invalid");
  });

  it("POST /rooms/:code/join rejects whitespace playerName with 'Player name invalid'", async () => {
    // First create a room
    const createRes = await request(app).post("/rooms").send({ playerName: "Host" });
    const code = createRes.body.room.code;

    const joinRes = await request(app)
      .post(`/rooms/${code}/join`)
      .send({ playerName: "   " });
      
    expect(joinRes.status).toBe(400);
    expect(joinRes.body.message).toBe("Player name invalid");
  });

  it("automatic completion ends game when all guessers guess correctly", async () => {
    // 1. Create room
    const createRes = await request(app).post("/rooms").send({ playerName: "Host" });
    const { code } = createRes.body.room;
    const { participantId: hostId } = createRes.body;

    // 2. Join 2 guessers
    const joinRes1 = await request(app).post(`/rooms/${code}/join`).send({ playerName: "G1" });
    const g1Id = joinRes1.body.participantId;
    const joinRes2 = await request(app).post(`/rooms/${code}/join`).send({ playerName: "G2" });
    const g2Id = joinRes2.body.participantId;

    // 3. Start game
    await request(app).post(`/rooms/${code}/start`).set("x-participant-id", hostId);

    // 4. Guess correctly
    // Actually the seed data logic is more complex, I'll just check what the current word is.
    const roomRes = await request(app).get(`/rooms/${code}?participantId=${encodeURIComponent(hostId)}`);
    console.log("Room response:", JSON.stringify(roomRes.body, null, 2));
    const word = roomRes.body.room.currentWord;

    await request(app).post(`/rooms/${code}/guess`).set("x-participant-id", g1Id).send({ guess: word });
    
    // Status should be in-game
    const roomRes1 = await request(app).get(`/rooms/${code}?participantId=${hostId}`);
    expect(roomRes1.body.room.status).toBe("in-game");

    // Second guess
    await request(app).post(`/rooms/${code}/guess`).set("x-participant-id", g2Id).send({ guess: word });
    
    // Status should be ended
    const roomRes2 = await request(app).get(`/rooms/${code}?participantId=${hostId}`);
    expect(roomRes2.body.room.status).toBe("ended");
  });
});

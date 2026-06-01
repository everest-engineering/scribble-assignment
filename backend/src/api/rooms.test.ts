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

  it("PUT /rooms/:code/canvas updates strokes for drawer only", async () => {
    const created = await request(app).post("/rooms").send({ playerName: "Host" });
    const hostId = created.body.participantId as string;
    const code = created.body.room.code as string;

    const joined = await request(app).post(`/rooms/${code}/join`).send({ playerName: "Guest" });
    const guestId = joined.body.participantId as string;

    await request(app).post(`/rooms/${code}/start`).query({ participantId: hostId });

    const strokes = [{ points: [{ x: 1, y: 2 }], color: "#000", width: 2 }];
    const updated = await request(app)
      .put(`/rooms/${code}/canvas`)
      .query({ participantId: hostId })
      .send({ strokes });

    expect(updated.status).toBe(200);
    expect(updated.body.room.canvasStrokes).toEqual(strokes);

    const forbidden = await request(app)
      .put(`/rooms/${code}/canvas`)
      .query({ participantId: guestId })
      .send({ strokes });

    expect(forbidden.status).toBe(403);
  });

  it("POST /rooms/:code/guesses validates empty guess and drawer role", async () => {
    const created = await request(app).post("/rooms").send({ playerName: "Host" });
    const hostId = created.body.participantId as string;
    const code = created.body.room.code as string;

    const joined = await request(app).post(`/rooms/${code}/join`).send({ playerName: "Guest" });
    const guestId = joined.body.participantId as string;

    await request(app).post(`/rooms/${code}/start`).query({ participantId: hostId });

    const empty = await request(app)
      .post(`/rooms/${code}/guesses`)
      .query({ participantId: guestId })
      .send({ text: "   " });

    expect(empty.status).toBe(400);
    expect(empty.body.message).toBe("Guess cannot be empty");

    const drawerGuess = await request(app)
      .post(`/rooms/${code}/guesses`)
      .query({ participantId: hostId })
      .send({ text: "word" });

    expect(drawerGuess.status).toBe(403);
  });

  it("GET during drawing includes gameplay fields for guesser without secret word", async () => {
    const created = await request(app).post("/rooms").send({ playerName: "Host" });
    const hostId = created.body.participantId as string;
    const code = created.body.room.code as string;

    const joined = await request(app).post(`/rooms/${code}/join`).send({ playerName: "Guest" });
    const guestId = joined.body.participantId as string;

    await request(app).post(`/rooms/${code}/start`).query({ participantId: hostId });

    await request(app)
      .put(`/rooms/${code}/canvas`)
      .query({ participantId: hostId })
      .send({ strokes: [{ points: [{ x: 3, y: 4 }] }] });

    await request(app)
      .post(`/rooms/${code}/guesses`)
      .query({ participantId: guestId })
      .send({ text: "hello" });

    const poll = await request(app).get(`/rooms/${code}`).query({ participantId: guestId });

    expect(poll.body.room.canvasStrokes).toHaveLength(1);
    expect(poll.body.room.guesses).toHaveLength(1);
    expect(poll.body.room.participants.every((entry: { score: number }) => entry.score >= 0)).toBe(
      true
    );
    expect(poll.body.room.viewer.secretWord).toBeUndefined();
  });

  it("POST /rooms/:code/guesses ends round on correct guess", async () => {
    const created = await request(app).post("/rooms").send({ playerName: "Host" });
    const hostId = created.body.participantId as string;
    const code = created.body.room.code as string;

    const joined = await request(app).post(`/rooms/${code}/join`).send({ playerName: "Guest" });
    const guestId = joined.body.participantId as string;

    const started = await request(app)
      .post(`/rooms/${code}/start`)
      .query({ participantId: hostId });

    const secretWord = started.body.room.viewer.secretWord as string;

    const guess = await request(app)
      .post(`/rooms/${code}/guesses`)
      .query({ participantId: guestId })
      .send({ text: secretWord });

    expect(guess.status).toBe(200);
    expect(guess.body.room.status).toBe("result");
    expect(guess.body.room.revealedWord).toBe(secretWord);

    const again = await request(app)
      .post(`/rooms/${code}/guesses`)
      .query({ participantId: guestId })
      .send({ text: "nope" });

    expect(again.status).toBe(409);
    expect(again.body.message).toBe("Round has ended");
  });

  it("POST /rooms/:code/join during result returns result snapshot", async () => {
    const created = await request(app).post("/rooms").send({ playerName: "Host" });
    const hostId = created.body.participantId as string;
    const code = created.body.room.code as string;

    const joined = await request(app).post(`/rooms/${code}/join`).send({ playerName: "Guest" });
    const guestId = joined.body.participantId as string;

    const started = await request(app)
      .post(`/rooms/${code}/start`)
      .query({ participantId: hostId });

    const secretWord = started.body.room.viewer.secretWord as string;

    await request(app)
      .post(`/rooms/${code}/guesses`)
      .query({ participantId: guestId })
      .send({ text: secretWord });

    const late = await request(app).post(`/rooms/${code}/join`).send({ playerName: "Late" });

    expect(late.status).toBe(200);
    expect(late.body.room.status).toBe("result");
    expect(late.body.room.revealedWord).toBe(secretWord);
    expect(late.body.room.guesses).toHaveLength(1);
  });

  it("POST /rooms/:code/restart returns lobby for host only", async () => {
    const created = await request(app).post("/rooms").send({ playerName: "Host" });
    const hostId = created.body.participantId as string;
    const code = created.body.room.code as string;

    const joined = await request(app).post(`/rooms/${code}/join`).send({ playerName: "Guest" });
    const guestId = joined.body.participantId as string;

    const started = await request(app)
      .post(`/rooms/${code}/start`)
      .query({ participantId: hostId });

    const secretWord = started.body.room.viewer.secretWord as string;

    await request(app)
      .post(`/rooms/${code}/guesses`)
      .query({ participantId: guestId })
      .send({ text: secretWord });

    const forbidden = await request(app)
      .post(`/rooms/${code}/restart`)
      .query({ participantId: guestId });

    expect(forbidden.status).toBe(403);

    const restarted = await request(app)
      .post(`/rooms/${code}/restart`)
      .query({ participantId: hostId });

    expect(restarted.status).toBe(200);
    expect(restarted.body.room.status).toBe("lobby");
    expect(restarted.body.room.revealedWord).toBeUndefined();
    expect(restarted.body.room.guesses).toEqual([]);
    expect(
      restarted.body.room.participants.every((entry: { score: number }) => entry.score === 0)
    ).toBe(true);
  });
});

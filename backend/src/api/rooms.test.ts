import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { clearRooms } from "../services/roomStore.js";

let server: Server;
let baseUrl: string;

function jsonRequest(path: string, init?: RequestInit) {
  return fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });
}

beforeEach(() => {
  clearRooms();
  server = createApp().listen(0);
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Unable to start test server");
  }

  baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;
});

afterEach(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

describe("rooms API", () => {
  async function createStartedRoomApi() {
    const createResponse = await jsonRequest("/rooms", {
      method: "POST",
      body: JSON.stringify({ playerName: "Alice" })
    });
    const createBody = (await createResponse.json()) as { participantId: string; room: { code: string } };
    const joinResponse = await jsonRequest(`/rooms/${createBody.room.code}/join`, {
      method: "POST",
      body: JSON.stringify({ playerName: "Bob" })
    });
    const joinBody = (await joinResponse.json()) as { participantId: string };

    await jsonRequest(`/rooms/${createBody.room.code}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId: createBody.participantId })
    });

    return { createBody, joinBody };
  }

  it("rejects create requests with blank player names", async () => {
    const response = await jsonRequest("/rooms", {
      method: "POST",
      body: JSON.stringify({ playerName: " " })
    });

    expect(response.status).toBe(400);
  });

  it("creates, fetches, and starts a room with host validation", async () => {
    const createResponse = await jsonRequest("/rooms", {
      method: "POST",
      body: JSON.stringify({ playerName: "Alice" })
    });
    const createBody = (await createResponse.json()) as {
      participantId: string;
      room: { code: string; hostParticipantId: string; isHost: boolean; canStart: boolean };
    };

    expect(createResponse.status).toBe(201);
    expect(createBody.room.hostParticipantId).toBe(createBody.participantId);
    expect(createBody.room.isHost).toBe(true);
    expect(createBody.room.canStart).toBe(false);

    const joinResponse = await jsonRequest(`/rooms/${createBody.room.code.toLowerCase()}/join`, {
      method: "POST",
      body: JSON.stringify({ playerName: "Bob" })
    });
    const joinBody = (await joinResponse.json()) as { participantId: string };

    expect(joinResponse.status).toBe(200);

    const nonHostStart = await jsonRequest(`/rooms/${createBody.room.code}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId: joinBody.participantId })
    });

    expect(nonHostStart.status).toBe(403);

    const hostFetch = await jsonRequest(`/rooms/${createBody.room.code}?participantId=${createBody.participantId}`);
    const hostFetchBody = (await hostFetch.json()) as { room: { isHost: boolean; canStart: boolean } };

    expect(hostFetchBody.room.isHost).toBe(true);
    expect(hostFetchBody.room.canStart).toBe(true);

    const hostStart = await jsonRequest(`/rooms/${createBody.room.code}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId: createBody.participantId })
    });
    const hostStartBody = (await hostStart.json()) as {
      room: {
        status: string;
        canStart: boolean;
        currentRound: { drawerParticipantId: string; drawerName: string };
        viewerRole: string;
        isDrawer: boolean;
        secretWord?: string;
      };
    };

    expect(hostStart.status).toBe(200);
    expect(hostStartBody.room.status).toBe("playing");
    expect(hostStartBody.room.canStart).toBe(false);
    expect(hostStartBody.room.currentRound.drawerParticipantId).toBe(createBody.participantId);
    expect(hostStartBody.room.currentRound.drawerName).toBe("Alice");
    expect(hostStartBody.room.viewerRole).toBe("drawer");
    expect(hostStartBody.room.isDrawer).toBe(true);
    expect(hostStartBody.room.secretWord).toBeDefined();
  });

  it("rejects malformed and unknown join room codes", async () => {
    const malformed = await jsonRequest("/rooms/BAD/join", {
      method: "POST",
      body: JSON.stringify({ playerName: "Bob" })
    });
    const unknown = await jsonRequest("/rooms/ZZZZ/join", {
      method: "POST",
      body: JSON.stringify({ playerName: "Bob" })
    });

    expect(malformed.status).toBe(400);
    expect(unknown.status).toBe(404);
  });

  it("returns viewer-specific secret word visibility after start", async () => {
    const createResponse = await jsonRequest("/rooms", {
      method: "POST",
      body: JSON.stringify({ playerName: "Alice" })
    });
    const createBody = (await createResponse.json()) as { participantId: string; room: { code: string } };
    const joinResponse = await jsonRequest(`/rooms/${createBody.room.code}/join`, {
      method: "POST",
      body: JSON.stringify({ playerName: "Bob" })
    });
    const joinBody = (await joinResponse.json()) as { participantId: string };

    await jsonRequest(`/rooms/${createBody.room.code}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId: createBody.participantId })
    });

    const drawerResponse = await jsonRequest(`/rooms/${createBody.room.code}?participantId=${createBody.participantId}`);
    const guesserResponse = await jsonRequest(`/rooms/${createBody.room.code}?participantId=${joinBody.participantId}`);
    const drawerBody = (await drawerResponse.json()) as {
      room: { currentRound: { drawerParticipantId: string; drawerName: string }; viewerRole: string; isDrawer: boolean; secretWord?: string };
    };
    const guesserBody = (await guesserResponse.json()) as {
      room: { currentRound: { drawerParticipantId: string; drawerName: string }; viewerRole: string; isDrawer: boolean; secretWord?: string };
    };

    expect(drawerBody.room.currentRound).toEqual(guesserBody.room.currentRound);
    expect(drawerBody.room.viewerRole).toBe("drawer");
    expect(drawerBody.room.isDrawer).toBe(true);
    expect(drawerBody.room.secretWord).toBeDefined();
    expect(guesserBody.room.viewerRole).toBe("guesser");
    expect(guesserBody.room.isDrawer).toBe(false);
    expect("secretWord" in guesserBody.room).toBe(false);
  });

  it("does not create or join rooms for blank player names", async () => {
    const createResponse = await jsonRequest("/rooms", {
      method: "POST",
      body: JSON.stringify({ playerName: " " })
    });

    expect(createResponse.status).toBe(400);

    const validCreateResponse = await jsonRequest("/rooms", {
      method: "POST",
      body: JSON.stringify({ playerName: "Alice" })
    });
    const validCreateBody = (await validCreateResponse.json()) as { room: { code: string; participants: unknown[] } };
    const joinResponse = await jsonRequest(`/rooms/${validCreateBody.room.code}/join`, {
      method: "POST",
      body: JSON.stringify({ playerName: "\t" })
    });
    const fetchResponse = await jsonRequest(`/rooms/${validCreateBody.room.code}`);
    const fetchBody = (await fetchResponse.json()) as { room: { participants: unknown[] } };

    expect(joinResponse.status).toBe(400);
    expect(fetchBody.room.participants).toHaveLength(1);
  });

  it("handles drawer drawing and clearing through gameplay endpoints", async () => {
    const createResponse = await jsonRequest("/rooms", {
      method: "POST",
      body: JSON.stringify({ playerName: "Alice" })
    });
    const createBody = (await createResponse.json()) as { participantId: string; room: { code: string } };
    const joinResponse = await jsonRequest(`/rooms/${createBody.room.code}/join`, {
      method: "POST",
      body: JSON.stringify({ playerName: "Bob" })
    });
    const joinBody = (await joinResponse.json()) as { participantId: string };

    await jsonRequest(`/rooms/${createBody.room.code}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId: createBody.participantId })
    });

    const nonDrawerDraw = await jsonRequest(`/rooms/${createBody.room.code}/drawing`, {
      method: "POST",
      body: JSON.stringify({
        participantId: joinBody.participantId,
        stroke: {
          color: "#111827",
          size: 4,
          points: [
            { x: 0.1, y: 0.1 },
            { x: 0.2, y: 0.2 }
          ]
        }
      })
    });

    expect(nonDrawerDraw.status).toBe(403);

    const drawerDraw = await jsonRequest(`/rooms/${createBody.room.code}/drawing`, {
      method: "POST",
      body: JSON.stringify({
        participantId: createBody.participantId,
        stroke: {
          color: "#111827",
          size: 4,
          points: [
            { x: 0.1, y: 0.1 },
            { x: 0.2, y: 0.2 }
          ]
        }
      })
    });
    const drawerDrawBody = (await drawerDraw.json()) as { room: { currentRound: { canvas: { strokes: unknown[] } } } };

    expect(drawerDraw.status).toBe(200);
    expect(drawerDrawBody.room.currentRound.canvas.strokes).toHaveLength(1);

    const clearResponse = await jsonRequest(`/rooms/${createBody.room.code}/drawing/clear`, {
      method: "POST",
      body: JSON.stringify({ participantId: createBody.participantId })
    });
    const clearBody = (await clearResponse.json()) as { room: { currentRound: { canvas: { strokes: unknown[] } } } };

    expect(clearResponse.status).toBe(200);
    expect(clearBody.room.currentRound.canvas.strokes).toEqual([]);
  });

  it("validates guess submissions and returns score snapshots", async () => {
    const createResponse = await jsonRequest("/rooms", {
      method: "POST",
      body: JSON.stringify({ playerName: "Alice" })
    });
    const createBody = (await createResponse.json()) as { participantId: string; room: { code: string } };
    const joinResponse = await jsonRequest(`/rooms/${createBody.room.code}/join`, {
      method: "POST",
      body: JSON.stringify({ playerName: "Bob" })
    });
    const joinBody = (await joinResponse.json()) as { participantId: string };

    await jsonRequest(`/rooms/${createBody.room.code}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId: createBody.participantId })
    });

    const emptyGuess = await jsonRequest(`/rooms/${createBody.room.code}/guesses`, {
      method: "POST",
      body: JSON.stringify({ participantId: joinBody.participantId, guess: "   " })
    });
    const drawerGuess = await jsonRequest(`/rooms/${createBody.room.code}/guesses`, {
      method: "POST",
      body: JSON.stringify({ participantId: createBody.participantId, guess: "rocket" })
    });
    const missingParticipant = await jsonRequest(`/rooms/${createBody.room.code}/guesses`, {
      method: "POST",
      body: JSON.stringify({ participantId: "missing", guess: "rocket" })
    });

    expect(emptyGuess.status).toBe(400);
    expect(drawerGuess.status).toBe(403);
    expect(missingParticipant.status).toBe(404);

    const drawerFetch = await jsonRequest(`/rooms/${createBody.room.code}?participantId=${createBody.participantId}`);
    const drawerBody = (await drawerFetch.json()) as { room: { secretWord?: string } };
    const secretWord = drawerBody.room.secretWord;

    expect(secretWord).toBeDefined();
    if (!secretWord) {
      return;
    }

    const correctGuess = await jsonRequest(`/rooms/${createBody.room.code}/guesses`, {
      method: "POST",
      body: JSON.stringify({ participantId: joinBody.participantId, guess: ` ${secretWord.toUpperCase()} ` })
    });
    const correctGuessBody = (await correctGuess.json()) as {
      room: {
        currentRound: { guesses: Array<{ text: string; isCorrect: boolean; pointsAwarded: number }> };
        scores: Array<{ participantId: string; score: number }>;
      };
    };

    expect(correctGuess.status).toBe(200);
    expect(correctGuessBody.room.currentRound.guesses[0]).toMatchObject({
      text: secretWord.toUpperCase(),
      isCorrect: true,
      pointsAwarded: 100
    });
    expect(correctGuessBody.room.scores.find((score) => score.participantId === joinBody.participantId)?.score).toBe(100);
  });

  it("polling snapshots include gameplay state without leaking guesser secretWord", async () => {
    const createResponse = await jsonRequest("/rooms", {
      method: "POST",
      body: JSON.stringify({ playerName: "Alice" })
    });
    const createBody = (await createResponse.json()) as { participantId: string; room: { code: string } };
    const joinResponse = await jsonRequest(`/rooms/${createBody.room.code}/join`, {
      method: "POST",
      body: JSON.stringify({ playerName: "Bob" })
    });
    const joinBody = (await joinResponse.json()) as { participantId: string };

    await jsonRequest(`/rooms/${createBody.room.code}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId: createBody.participantId })
    });

    await jsonRequest(`/rooms/${createBody.room.code}/drawing`, {
      method: "POST",
      body: JSON.stringify({
        participantId: createBody.participantId,
        stroke: {
          color: "#111827",
          size: 4,
          points: [
            { x: 0.1, y: 0.1 },
            { x: 0.2, y: 0.2 }
          ]
        }
      })
    });
    await jsonRequest(`/rooms/${createBody.room.code}/guesses`, {
      method: "POST",
      body: JSON.stringify({ participantId: joinBody.participantId, guess: "wrong" })
    });

    const guesserPoll = await jsonRequest(`/rooms/${createBody.room.code}?participantId=${joinBody.participantId}`);
    const guesserBody = (await guesserPoll.json()) as {
      room: {
        currentRound: { canvas: { strokes: unknown[] }; guesses: unknown[] };
        scores: unknown[];
        secretWord?: string;
      };
    };

    expect(guesserPoll.status).toBe(200);
    expect(guesserBody.room.currentRound.canvas.strokes).toHaveLength(1);
    expect(guesserBody.room.currentRound.guesses).toHaveLength(1);
    expect(guesserBody.room.scores).toHaveLength(2);
    expect("secretWord" in guesserBody.room).toBe(false);
  });

  it("ends a round and returns result snapshots with revealed word, scores, and guess history", async () => {
    const { createBody, joinBody } = await createStartedRoomApi();
    const drawerFetch = await jsonRequest(`/rooms/${createBody.room.code}?participantId=${createBody.participantId}`);
    const drawerBody = (await drawerFetch.json()) as { room: { secretWord?: string } };
    const secretWord = drawerBody.room.secretWord;

    expect(secretWord).toBeDefined();
    if (!secretWord) {
      return;
    }

    await jsonRequest(`/rooms/${createBody.room.code}/guesses`, {
      method: "POST",
      body: JSON.stringify({ participantId: joinBody.participantId, guess: "wrong" })
    });
    await jsonRequest(`/rooms/${createBody.room.code}/guesses`, {
      method: "POST",
      body: JSON.stringify({ participantId: joinBody.participantId, guess: secretWord })
    });

    const endResponse = await jsonRequest(`/rooms/${createBody.room.code}/round/end`, {
      method: "POST",
      body: JSON.stringify({ participantId: createBody.participantId })
    });
    const endBody = (await endResponse.json()) as {
      room: {
        status: string;
        currentRound?: unknown;
        completedRound?: {
          secretWord: string;
          guesses: unknown[];
          scores: Array<{ participantId: string; score: number }>;
        };
      };
    };

    expect(endResponse.status).toBe(200);
    expect(endBody.room.status).toBe("result");
    expect(endBody.room.currentRound).toBeUndefined();
    expect(endBody.room.completedRound?.secretWord).toBe(secretWord);
    expect(endBody.room.completedRound?.guesses).toHaveLength(2);
    expect(endBody.room.completedRound?.scores.find((score) => score.participantId === joinBody.participantId)?.score).toBe(100);

    const guesserPoll = await jsonRequest(`/rooms/${createBody.room.code}?participantId=${joinBody.participantId}`);
    const guesserBody = (await guesserPoll.json()) as {
      room: { completedRound?: { secretWord: string; guesses: unknown[] } };
    };

    expect(guesserBody.room.completedRound?.secretWord).toBe(secretWord);
    expect(guesserBody.room.completedRound?.guesses).toHaveLength(2);
  });

  it("rejects gameplay mutations after result state", async () => {
    const { createBody, joinBody } = await createStartedRoomApi();

    await jsonRequest(`/rooms/${createBody.room.code}/round/end`, {
      method: "POST",
      body: JSON.stringify({ participantId: createBody.participantId })
    });

    const drawResponse = await jsonRequest(`/rooms/${createBody.room.code}/drawing`, {
      method: "POST",
      body: JSON.stringify({
        participantId: createBody.participantId,
        stroke: {
          color: "#111827",
          size: 4,
          points: [
            { x: 0.1, y: 0.1 },
            { x: 0.2, y: 0.2 }
          ]
        }
      })
    });
    const guessResponse = await jsonRequest(`/rooms/${createBody.room.code}/guesses`, {
      method: "POST",
      body: JSON.stringify({ participantId: joinBody.participantId, guess: "rocket" })
    });

    expect(drawResponse.status).toBe(400);
    expect(guessResponse.status).toBe(400);
  });

  it("restarts a result room for the host and returns a clean lobby snapshot", async () => {
    const { createBody, joinBody } = await createStartedRoomApi();

    await jsonRequest(`/rooms/${createBody.room.code}/round/end`, {
      method: "POST",
      body: JSON.stringify({ participantId: createBody.participantId })
    });

    const nonHostRestart = await jsonRequest(`/rooms/${createBody.room.code}/restart`, {
      method: "POST",
      body: JSON.stringify({ participantId: joinBody.participantId })
    });

    expect(nonHostRestart.status).toBe(403);

    const restartResponse = await jsonRequest(`/rooms/${createBody.room.code}/restart`, {
      method: "POST",
      body: JSON.stringify({ participantId: createBody.participantId })
    });
    const restartBody = (await restartResponse.json()) as {
      room: {
        code: string;
        status: string;
        participants: unknown[];
        currentRound?: unknown;
        completedRound?: unknown;
        secretWord?: string;
        scores: Array<{ score: number }>;
      };
    };

    expect(restartResponse.status).toBe(200);
    expect(restartBody.room.code).toBe(createBody.room.code);
    expect(restartBody.room.status).toBe("lobby");
    expect(restartBody.room.participants).toHaveLength(2);
    expect(restartBody.room.currentRound).toBeUndefined();
    expect(restartBody.room.completedRound).toBeUndefined();
    expect("secretWord" in restartBody.room).toBe(false);
    expect(restartBody.room.scores.every((score) => score.score === 0)).toBe(true);
  });
});

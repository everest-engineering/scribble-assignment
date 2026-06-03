import { randomUUID } from "node:crypto";
import { HttpError } from "../api/schemas.js";
import type {
  CanvasState,
  Guess,
  Participant,
  Room,
  RoomSnapshot,
} from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

function now() {
  return new Date().toISOString();
}

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 4; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

function generateUniqueCode() {
  let code = generateCode();

  while (rooms.has(code)) {
    code = generateCode();
  }

  return code;
}

function displayName(name?: string) {
  return name || "Player";
}

function createParticipant(name?: string): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    joinedAt: now(),
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    createdAt: now(),
    updatedAt: now(),
    strokes: [],
    guesses: [],
    scores: {},
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id,
  };
}

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.status !== "lobby") {
    throw new HttpError(409, "Game already in progress");
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id,
  };
}

export function getRoom(code: string) {
  const room = rooms.get(code);
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function toRoomSnapshot(
  room: Room,
  viewerParticipantId?: string,
): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
  };

  if (room.status === "playing" || room.status === "ended") {
    snapshot.currentDrawerId = room.currentDrawerId;
    snapshot.strokes = room.strokes.map((stroke) => [...stroke]);
    snapshot.guesses = room.guesses.map((guess) => ({ ...guess }));
    snapshot.scores = { ...room.scores };
  }

  if (room.status === "playing") {
    snapshot.currentWord =
      viewerParticipantId === room.currentDrawerId
        ? (room.currentWord ?? null)
        : null;
  }

  if (room.status === "ended") {
    snapshot.revealedWord = room.revealedWord;
  }

  return snapshot;
}

export function startRoom(code: string): RoomSnapshot {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  room.status = "playing";
  room.currentDrawerId = room.hostId;
  room.roundNumber = 1;
  room.currentWord =
    STARTER_WORDS[(room.roundNumber - 1) % STARTER_WORDS.length];
  room.strokes = [];
  room.guesses = [];
  room.scores = Object.fromEntries(room.participants.map((p) => [p.id, 0]));
  room.updatedAt = now();
  rooms.set(room.code, room);

  return toRoomSnapshot(cloneRoom(room));
}

export function updateCanvas(
  code: string,
  participantId: string,
  strokes: CanvasState,
): RoomSnapshot {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status !== "playing") {
    throw new HttpError(409, "Game is not in progress");
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    throw new HttpError(400, "Participant not found in room");
  }

  if (participantId !== room.currentDrawerId) {
    throw new HttpError(400, "Only the current drawer can update the canvas");
  }

  room.strokes = strokes;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return toRoomSnapshot(cloneRoom(room), participantId);
}

export function endRound(code: string, participantId: string): RoomSnapshot {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (participantId !== room.hostId) {
    throw new HttpError(403, "Only the host can end the round");
  }

  if (room.status !== "playing") {
    throw new HttpError(409, "Game is not in progress");
  }

  room.status = "ended";
  room.revealedWord = room.currentWord ?? "";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return toRoomSnapshot(cloneRoom(room));
}

export function restartRoom(code: string, participantId: string): RoomSnapshot {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (participantId !== room.hostId) {
    throw new HttpError(403, "Only the host can restart the game");
  }

  if (room.status !== "ended") {
    throw new HttpError(409, "Game has not ended");
  }

  room.status = "lobby";
  room.currentWord = undefined;
  room.currentDrawerId = undefined;
  room.roundNumber = undefined;
  room.strokes = [];
  room.guesses = [];
  room.scores = {};
  room.revealedWord = undefined;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return toRoomSnapshot(cloneRoom(room));
}

export function submitGuess(
  code: string,
  participantId: string,
  text: string,
): Guess {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status !== "playing") {
    throw new HttpError(409, "Game is not in progress");
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    throw new HttpError(400, "Participant not found in room");
  }

  if (participantId === room.currentDrawerId) {
    throw new HttpError(400, "The drawer cannot submit guesses");
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new HttpError(400, "Guess text cannot be empty");
  }

  const alreadyScored = room.guesses.some(
    (g) => g.participantId === participantId && g.correct,
  );
  const isCorrect =
    !alreadyScored &&
    trimmed.toLowerCase() === (room.currentWord ?? "").toLowerCase();

  const guess: Guess = {
    id: randomUUID(),
    participantId,
    text: trimmed,
    correct: isCorrect,
    submittedAt: now(),
  };

  room.guesses.push(guess);

  if (isCorrect) {
    room.scores[participantId] = (room.scores[participantId] ?? 0) + 100;
    room.status = "ended";
    room.revealedWord = room.currentWord ?? "";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ...guess };
}

import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot, Stroke } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { HttpError } from "../api/schemas.js";

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
    joinedAt: now()
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
    hostId: participant.id,
    status: "lobby",
    drawerId: null,
    secretWord: null,
    scores: {},
    canvasStrokes: [],
    guesses: [],
    participants: [participant],
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
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

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId != null && viewerParticipantId === room.drawerId;
  const viewer = viewerParticipantId
    ? room.participants.find((p) => p.id === viewerParticipantId)
    : null;
  const myRole = viewer ? (isDrawer ? "drawer" as const : "guesser" as const) : null;

  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    drawerId: room.drawerId,
    myRole,
    secretWord: (isDrawer || room.status === "finished") ? room.secretWord : null,
    scores: { ...room.scores },
    canvasStrokes: structuredClone(room.canvasStrokes),
    guesses: structuredClone(room.guesses),
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.hostId !== participantId) {
    throw new HttpError(403, "Only the host can start the game");
  }

  if (room.participants.length < 2) {
    throw new HttpError(400, "At least 2 players are required to start");
  }

  if (room.status !== "lobby") {
    throw new HttpError(400, "Game has already started");
  }

  const wordIndex = room.participants.length % STARTER_WORDS.length;
  room.drawerId = room.hostId;
  room.secretWord = STARTER_WORDS[wordIndex];
  room.scores = Object.fromEntries(room.participants.map((p) => [p.id, 0]));
  room.canvasStrokes = [];
  room.guesses = [];
  room.status = "playing";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function addStroke(code: string, participantId: string, stroke: Stroke) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status !== "playing") {
    throw new HttpError(400, "Game is not in progress");
  }

  if (room.drawerId !== participantId) {
    throw new HttpError(403, "Only the drawer can draw");
  }

  room.canvasStrokes.push(stroke);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function clearDrawing(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status !== "playing") {
    throw new HttpError(400, "Game is not in progress");
  }

  if (room.drawerId !== participantId) {
    throw new HttpError(403, "Only the drawer can clear the drawing");
  }

  room.canvasStrokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function addGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status !== "playing") {
    throw new HttpError(400, "Game is not in progress");
  }

  if (room.drawerId === participantId) {
    throw new HttpError(403, "The drawer cannot guess");
  }

  const trimmed = text.trim();

  if (!trimmed) {
    throw new HttpError(400, "Guess cannot be empty");
  }

  const guesser = room.participants.find((p) => p.id === participantId);
  const correct = trimmed.toLowerCase() === (room.secretWord ?? "").toLowerCase();
  const guess: Guess = {
    participantId,
    playerName: guesser?.name ?? "Unknown",
    text: trimmed,
    correct,
    timestamp: now()
  };

  room.guesses.push(guess);

  if (correct) {
    room.scores[participantId] = (room.scores[participantId] ?? 0) + 100;
    room.status = "finished";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.hostId !== participantId) {
    throw new HttpError(403, "Only the host can restart the game");
  }

  if (room.status !== "finished") {
    throw new HttpError(400, "Game is not finished");
  }

  room.drawerId = null;
  room.secretWord = null;
  room.scores = {};
  room.canvasStrokes = [];
  room.guesses = [];
  room.status = "lobby";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

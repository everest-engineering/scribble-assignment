import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { HttpError } from "../api/schemas.js";

const rooms = new Map<string, Room>();
const SECRET_WORDS = ["APPLE", "BANANA", "CHERRY"] as const;

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

function normalizeName(name?: string) {
  const normalized = String(name ?? "").trim().replace(/\s+/g, " ");

  if (normalized.length === 0) {
    throw new HttpError(400, "playerName is required");
  }

  return normalized;
}

function createParticipant(name: string, isHost = false): Participant {
  return {
    id: randomUUID(),
    name,
    isHost,
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

function chooseSecretWord(code: string) {
  const index = code.charCodeAt(0) % SECRET_WORDS.length;
  return SECRET_WORDS[index];
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const name = normalizeName(playerName);
  const participant = createParticipant(name, true);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    gameStarted: false,
    currentDrawer: null,
    secretWord: null,
    guesses: [],
    scores: { [participant.id]: 0 },
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

  const candidateName = normalizeName(playerName);
  const normalizedCandidate = candidateName.toLowerCase();
  const duplicate = room.participants.some((participant) =>
    participant.name.toLowerCase() === normalizedCandidate
  );

  if (duplicate) {
    throw new HttpError(400, "Duplicate player name");
  }

  const participant = createParticipant(candidateName, false);
  room.participants.push(participant);
  if (!room.scores) room.scores = {};
  room.scores[participant.id] = 0;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function startRoomGame(code: string, viewerParticipantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === viewerParticipantId);

  if (!viewer) {
    throw new HttpError(404, "Participant not found");
  }

  if (!viewer.isHost) {
    throw new HttpError(403, "Only the host can start the game");
  }

  if (room.participants.length < 2) {
    throw new HttpError(400, "At least two players are required to start the game");
  }

  room.gameStarted = true;
  room.currentDrawer = viewer.id;
  room.secretWord = chooseSecretWord(room.code);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
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
  const isDrawer = viewerParticipantId != null && room.currentDrawer === viewerParticipantId;

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    gameStarted: room.gameStarted,
    currentDrawer: room.currentDrawer,
    secretWord: room.gameStarted && isDrawer ? room.secretWord : undefined,
    guesses: room.guesses ? room.guesses.map((g) => ({ ...g })) : [],
    scores: room.scores ? { ...room.scores } : {}
  };
}

export function submitGuess(code: string, viewerParticipantId: string, text: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((p) => p.id === viewerParticipantId);

  if (!viewer) {
    throw new HttpError(404, "Participant not found");
  }

  const normalized = String(text ?? "").trim().replace(/\s+/g, " ");

  if (normalized.length === 0) {
    throw new HttpError(400, "Guess text is required");
  }

  const correct = !!(room.secretWord && normalized.toLowerCase() === room.secretWord.toLowerCase());

  const guess = {
    participantId: viewer.id,
    text: normalized,
    timestamp: now(),
    correct
  };

  if (!room.guesses) room.guesses = [];
  room.guesses.push(guess);

  if (!room.scores) room.scores = {};
  if (!(viewer.id in room.scores)) room.scores[viewer.id] = 0;
  if (correct) {
    room.scores[viewer.id] += 100;
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function restartRoom(code: string, viewerParticipantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((p) => p.id === viewerParticipantId);

  if (!viewer) {
    throw new HttpError(404, "Participant not found");
  }

  if (!viewer.isHost) {
    throw new HttpError(403, "Only the host can restart the room");
  }

  // Preserve participants, clear round-specific state
  room.gameStarted = false;
  room.currentDrawer = null;
  room.secretWord = null;
  room.guesses = [];

  // Reset scores to 0 for all current participants
  room.scores = {};
  for (const p of room.participants) {
    room.scores[p.id] = 0;
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

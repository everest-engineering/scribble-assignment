import { randomUUID } from "node:crypto";
import type { DrawingStroke, Participant, Room, RoomSnapshot } from "../models/game.js";
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
  const trimmedName = (playerName || "").trim();
  if (!trimmedName) {
    throw new HttpError(400, "Player name cannot be empty");
  }
  const participant = createParticipant(trimmedName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    createdAt: now(),
    updatedAt: now(),
    guesses: [],
    scores: {
      [participant.id]: 0
    },
    drawing: [],
    correctGuessers: []
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName?: string) {
  const trimmedName = (playerName || "").trim();
  if (!trimmedName) {
    throw new HttpError(400, "Player name cannot be empty");
  }
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const participant = createParticipant(trimmedName);
  room.participants.push(participant);
  room.scores[participant.id] = 0;
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

export function getDeterministicWord(code: string): string {
  const sum = code.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return STARTER_WORDS[sum % STARTER_WORDS.length];
}

export function startGame(code: string, hostParticipantId: string) {
  const room = rooms.get(code);
  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status !== "lobby") {
    throw new HttpError(400, "Game has already started");
  }

  if (room.hostId !== hostParticipantId) {
    throw new HttpError(403, "Only the host can start the game");
  }

  if (room.participants.length < 2) {
    throw new HttpError(400, "Need at least 2 players to start");
  }

  room.status = "active";
  room.drawerId = room.participants[0].id;
  room.secretWord = getDeterministicWord(code);
  room.guesses = [];
  room.drawing = [];
  room.correctGuessers = [];
  for (const participant of room.participants) {
    room.scores[participant.id] = 0;
  }
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

function getRoomOrThrow(code: string) {
  const room = rooms.get(code);
  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  return room;
}

function ensureParticipantInRoom(room: Room, participantId: string) {
  const participant = room.participants.find((entry) => entry.id === participantId);
  if (!participant) {
    throw new HttpError(404, "Participant not found in room");
  }

  return participant;
}

function ensureActiveRoom(room: Room) {
  if (room.status !== "active") {
    throw new HttpError(400, "Game is not active");
  }
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = getRoomOrThrow(code);
  ensureActiveRoom(room);
  ensureParticipantInRoom(room, participantId);

  if (participantId === room.drawerId) {
    throw new HttpError(403, "Drawer cannot submit guesses");
  }

  const normalizedText = text.trim();
  if (!normalizedText) {
    throw new HttpError(400, "Guess cannot be empty");
  }

  const participant = room.participants.find((entry) => entry.id === participantId)!;
  const normalizedSecretWord = (room.secretWord ?? "").trim().toLowerCase();
  const isCorrect = normalizedSecretWord.length > 0 && normalizedText.toLowerCase() === normalizedSecretWord;

  if (isCorrect && !room.correctGuessers.includes(participantId)) {
    room.correctGuessers.push(participantId);
    room.scores[participantId] = (room.scores[participantId] ?? 0) + 100;
  }

  room.guesses.push({
    participantId,
    participantName: participant.name,
    text: normalizedText,
    correct: isCorrect,
    timestamp: now()
  });

  const allNonDrawersGuessedAtLeastOnce = room.participants
    .filter((participant) => participant.id !== room.drawerId)
    .every((participant) => room.guesses.some((guess) => guess.participantId === participant.id));

  if (allNonDrawersGuessedAtLeastOnce) {
    room.status = "results";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);
  return cloneRoom(room);
}

export function restartGame(code: string, hostParticipantId: string) {
  const room = getRoomOrThrow(code);
  ensureParticipantInRoom(room, hostParticipantId);

  if (room.hostId !== hostParticipantId) {
    throw new HttpError(403, "Only the host can restart the game");
  }

  if (room.status !== "results") {
    throw new HttpError(400, "Game can only be restarted from results");
  }

  room.status = "lobby";
  room.drawerId = undefined;
  room.secretWord = undefined;
  room.guesses = [];
  room.drawing = [];
  room.correctGuessers = [];
  for (const participant of room.participants) {
    room.scores[participant.id] = 0;
  }

  room.updatedAt = now();
  rooms.set(room.code, room);
  return cloneRoom(room);
}

export function updateDrawing(code: string, participantId: string, strokes: DrawingStroke[]) {
  const room = getRoomOrThrow(code);
  ensureActiveRoom(room);
  ensureParticipantInRoom(room, participantId);

  if (participantId !== room.drawerId) {
    throw new HttpError(403, "Only the drawer can update drawing");
  }

  room.drawing = structuredClone(strokes);
  room.updatedAt = now();
  rooms.set(room.code, room);
  return cloneRoom(room);
}

export function clearDrawing(code: string, participantId: string) {
  const room = getRoomOrThrow(code);
  ensureActiveRoom(room);
  ensureParticipantInRoom(room, participantId);

  if (participantId !== room.drawerId) {
    throw new HttpError(403, "Only the drawer can clear drawing");
  }

  room.drawing = [];
  room.updatedAt = now();
  rooms.set(room.code, room);
  return cloneRoom(room);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    guesses: room.guesses.map((guess) => ({ ...guess })),
    scores: { ...room.scores },
    drawing: room.drawing.map((stroke) => ({
      points: stroke.points.map((point) => ({ ...point }))
    })),
    correctGuessers: [...room.correctGuessers]
  };

  if (room.drawerId) {
    snapshot.drawerId = room.drawerId;
  }

  if (room.secretWord && (room.status === "results" || (room.drawerId && viewerParticipantId === room.drawerId))) {
    snapshot.secretWord = room.secretWord;
  }

  return snapshot;
}

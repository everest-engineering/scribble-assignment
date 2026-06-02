import { randomUUID } from "node:crypto";
import { HttpError } from "../api/schemas.js";
import type { Guess, Room, RoomSnapshot, Stroke } from "../models/game.js";
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

function createParticipant(name: string) {
  return {
    id: randomUUID(),
    name,
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

function hashCode(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function selectWord(code: string) {
  return STARTER_WORDS[hashCode(code) % STARTER_WORDS.length];
}

export function listWords() {
  return [...STARTER_WORDS];
}

function getRoomOrThrow(code: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Unable to load room");
  }

  return room;
}

function assertHost(room: Room, participantId: string) {
  if (room.hostId !== participantId) {
    throw new HttpError(403, "Only the host can perform this action");
  }
}

function assertDrawer(room: Room, participantId: string) {
  if (room.drawerId !== participantId) {
    throw new HttpError(403, "Only the drawer can perform this action");
  }
}

function assertPlaying(room: Room) {
  if (room.status !== "playing") {
    throw new HttpError(409, "Game is not in progress");
  }
}

function assertLobby(room: Room) {
  if (room.status !== "lobby") {
    throw new HttpError(409, "Game already started");
  }
}

function assertResult(room: Room) {
  if (room.status !== "result") {
    throw new HttpError(409, "Round has not ended yet");
  }
}

function initScores(participants: Room["participants"]) {
  return Object.fromEntries(participants.map((participant) => [participant.id, 0]));
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    strokes: [],
    guesses: [],
    scores: {},
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.status !== "lobby") {
    throw new HttpError(409, "Game already started");
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

export function startGame(code: string, participantId: string) {
  const room = getRoomOrThrow(code);
  assertHost(room, participantId);
  assertLobby(room);

  if (room.participants.length < 2) {
    throw new HttpError(409, "Need at least 2 players");
  }

  room.status = "playing";
  room.drawerId = room.hostId;
  room.secretWord = selectWord(code);
  room.strokes = [];
  room.guesses = [];
  room.scores = initScores(room.participants);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function addStroke(code: string, participantId: string, stroke: Stroke) {
  const room = getRoomOrThrow(code);
  assertPlaying(room);
  assertDrawer(room, participantId);

  room.strokes.push(stroke);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function clearCanvas(code: string, participantId: string) {
  const room = getRoomOrThrow(code);
  assertPlaying(room);
  assertDrawer(room, participantId);

  room.strokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function submitGuess(code: string, participantId: string, guessText: string) {
  const room = getRoomOrThrow(code);
  assertPlaying(room);

  if (room.drawerId === participantId) {
    throw new HttpError(403, "The drawer cannot submit guesses");
  }

  const participant = room.participants.find((entry) => entry.id === participantId);

  if (!participant) {
    throw new HttpError(404, "Participant not found");
  }

  const trimmedGuess = guessText.trim();

  if (!trimmedGuess) {
    throw new HttpError(400, "Guess cannot be empty");
  }

  const correct = trimmedGuess.toLowerCase() === room.secretWord?.toLowerCase();
  const guess: Guess = {
    participantId,
    name: participant.name,
    text: trimmedGuess,
    correct,
    createdAt: now()
  };

  room.guesses.push(guess);

  if (correct) {
    room.scores[participantId] = (room.scores[participantId] ?? 0) + 100;
    room.status = "result";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function restartGame(code: string, participantId: string) {
  const room = getRoomOrThrow(code);
  assertHost(room, participantId);
  assertResult(room);

  room.status = "lobby";
  room.drawerId = undefined;
  room.secretWord = undefined;
  room.strokes = [];
  room.guesses = [];
  room.scores = {};
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
    drawerId: room.drawerId,
    strokes: room.strokes.map((stroke) => ({ ...stroke, points: [...stroke.points] })),
    guesses: room.guesses.map((guess) => ({ ...guess })),
    scores: { ...room.scores },
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  if (room.status === "playing" && viewerParticipantId && room.drawerId === viewerParticipantId) {
    snapshot.secretWord = room.secretWord;
  }

  if (room.status === "result") {
    snapshot.revealedWord = room.secretWord;
  }

  return snapshot;
}

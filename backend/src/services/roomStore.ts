import { randomUUID } from "node:crypto";
import type {
  DrawingStroke,
  Guess,
  Participant,
  Room,
  RoomSnapshot
} from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

export class RoomStoreError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

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

export function normalizePlayerName(name?: string) {
  const trimmed = name?.trim() ?? "";

  if (!trimmed) {
    throw new RoomStoreError(400, "Player name is required");
  }

  return trimmed;
}

export function normalizeRoomCode(code: string) {
  const trimmed = code.trim().toUpperCase();

  if (!/^[A-Z0-9]{4}$/.test(trimmed)) {
    throw new RoomStoreError(400, "Room code must be 4 letters or numbers");
  }

  return trimmed;
}

function createParticipant(name: string): Participant {
  return {
    id: randomUUID(),
    name,
    role: null,
    score: 0,
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function pickWordForRoom(code: string) {
  const index =
    [...code].reduce((sum, character) => sum + character.charCodeAt(0), 0) %
    STARTER_WORDS.length;

  return STARTER_WORDS[index];
}

function findParticipant(room: Room, participantId: string) {
  return room.participants.find((participant) => participant.id === participantId) ?? null;
}

export function createRoom(playerName?: string) {
  const name = normalizePlayerName(playerName);
  const participant = createParticipant(name);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    drawerId: null,
    secretWord: null,
    participants: [participant],
    guesses: [],
    strokes: [],
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
  const roomCode = normalizeRoomCode(code);
  const name = normalizePlayerName(playerName);
  const room = rooms.get(roomCode);

  if (!room) {
    return null;
  }

  const participant = createParticipant(name);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function getRoom(code: string) {
  const roomCode = normalizeRoomCode(code);
  const room = rooms.get(roomCode);
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function startGame(code: string, participantId: string) {
  const room = getRoom(code);

  if (!room) {
    throw new RoomStoreError(404, "Unable to load room");
  }

  if (room.hostId !== participantId) {
    throw new RoomStoreError(403, "Only the host can start the game");
  }

  if (room.status !== "lobby") {
    throw new RoomStoreError(400, "Game has already started");
  }

  if (room.participants.length < 2) {
    throw new RoomStoreError(400, "At least two players are required to start");
  }

  const secretWord = pickWordForRoom(room.code);
  room.status = "playing";
  room.secretWord = secretWord;
  room.drawerId = room.hostId;
  room.guesses = [];
  room.strokes = [];
  room.participants = room.participants.map((participant) => ({
    ...participant,
    score: 0,
    role: participant.id === room.drawerId ? "drawer" : "guesser"
  }));

  return saveRoom(room);
}

export function submitGuess(code: string, participantId: string, rawText: string) {
  const room = getRoom(code);

  if (!room) {
    throw new RoomStoreError(404, "Unable to load room");
  }

  if (room.status !== "playing") {
    throw new RoomStoreError(400, "Guesses are only allowed during an active round");
  }

  const participant = findParticipant(room, participantId);

  if (!participant) {
    throw new RoomStoreError(404, "Participant not found in this room");
  }

  if (participant.id === room.drawerId) {
    throw new RoomStoreError(403, "The drawer cannot submit guesses");
  }

  const text = rawText.trim();

  if (!text) {
    throw new RoomStoreError(400, "Guess cannot be empty");
  }

  const correct =
    room.secretWord !== null && text.toLowerCase() === room.secretWord.toLowerCase();

  const guess: Guess = {
    id: randomUUID(),
    participantId: participant.id,
    playerName: participant.name,
    text,
    correct,
    createdAt: now()
  };

  room.guesses.push(guess);

  if (correct) {
    room.participants = room.participants.map((entry) =>
      entry.id === participant.id ? { ...entry, score: entry.score + 100 } : entry
    );
    room.status = "result";
  }

  return saveRoom(room);
}

export function updateDrawing(
  code: string,
  participantId: string,
  strokes: DrawingStroke[]
) {
  const room = getRoom(code);

  if (!room) {
    throw new RoomStoreError(404, "Unable to load room");
  }

  if (room.status !== "playing") {
    throw new RoomStoreError(400, "Drawing is only allowed during an active round");
  }

  if (room.drawerId !== participantId) {
    throw new RoomStoreError(403, "Only the drawer can update the canvas");
  }

  room.strokes = strokes;
  return saveRoom(room);
}

export function clearDrawing(code: string, participantId: string) {
  return updateDrawing(code, participantId, []);
}

export function restartGame(code: string, participantId: string) {
  const room = getRoom(code);

  if (!room) {
    throw new RoomStoreError(404, "Unable to load room");
  }

  if (room.hostId !== participantId) {
    throw new RoomStoreError(403, "Only the host can restart the game");
  }

  if (room.status !== "result") {
    throw new RoomStoreError(400, "The game can only be restarted after a round ends");
  }

  room.status = "lobby";
  room.drawerId = null;
  room.secretWord = null;
  room.guesses = [];
  room.strokes = [];
  room.participants = room.participants.map((participant) => ({
    ...participant,
    role: null,
    score: 0
  }));

  return saveRoom(room);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const viewerId = viewerParticipantId ?? "";
  const isHost = viewerId.length > 0 && room.hostId === viewerId;
  const isDrawer = viewerId.length > 0 && room.drawerId === viewerId;
  const canStart =
    room.status === "lobby" && isHost && room.participants.length >= 2;

  const secretWord =
    room.status === "playing" && isDrawer && room.secretWord ? room.secretWord : null;

  const correctWord = room.status === "result" && room.secretWord ? room.secretWord : null;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    drawerId: room.drawerId,
    participants: room.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      role: participant.role,
      score: participant.score,
      joinedAt: participant.joinedAt,
      isHost: participant.id === room.hostId,
      isDrawer: participant.id === room.drawerId
    })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    secretWord,
    correctWord,
    guesses: room.guesses.map((guess) => ({ ...guess })),
    strokes: room.strokes.map((stroke) => ({
      ...stroke,
      points: stroke.points.map((point) => ({ ...point }))
    })),
    isHost,
    isDrawer,
    canStart
  };
}

/** @internal test helper */
export function resetRoomsForTests() {
  rooms.clear();
}

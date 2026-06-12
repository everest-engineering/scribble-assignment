import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot, Stroke, GuessEntry } from "../models/game.js";
import { STARTER_WORDS } from "../seed/starterData.js";

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

function validateName(name?: string): string {
  const trimmed = name?.trim() ?? "";
  if (trimmed.length === 0) {
    throw new Error("Player name is required");
  }
  return trimmed;
}

function createParticipant(name?: string): Participant {
  return {
    id: randomUUID(),
    name: validateName(name),
    joinedAt: now(),
    score: 0
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
    participants: [participant],
    hostParticipantId: participant.id,
    drawerId: null,
    currentWord: null,
    scores: new Map(),
    guessHistory: [],
    canvasStrokes: [],
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

  if (room.status === "playing" || room.status === "results") {
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

export class GameError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "FORBIDDEN" | "CONFLICT"
  ) {
    super(message);
  }
}

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new GameError("Unable to load room", "NOT_FOUND");
  }

  if (room.hostParticipantId !== participantId) {
    throw new GameError("Only the host can start the game", "FORBIDDEN");
  }

  if (room.status !== "lobby") {
    throw new GameError("Game already started", "CONFLICT");
  }

  if (room.participants.length < 2) {
    throw new GameError("At least 2 players are required", "CONFLICT");
  }

  room.status = "playing";
  room.drawerId = room.hostParticipantId;
  room.currentWord = STARTER_WORDS[0];
  room.scores = new Map(room.participants.map((p) => [p.id, 0]));
  room.guessHistory = [];
  room.canvasStrokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function removeParticipant(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const index = room.participants.findIndex((p) => p.id === participantId);

  if (index === -1) {
    return null;
  }

  room.participants.splice(index, 1);

  if (room.participants.length === 0) {
    rooms.delete(code);
    return null;
  }

  if (room.hostParticipantId === participantId) {
    const nextHost = room.participants[0];
    room.hostParticipantId = nextHost.id;

    if (room.status === "playing") {
      room.status = "lobby";
      room.drawerId = null;
      room.currentWord = null;
      room.scores = new Map();
      room.guessHistory = [];
      room.canvasStrokes = [];
    }
  } else if (room.status === "playing" && room.drawerId === participantId) {
    room.status = "lobby";
    room.drawerId = null;
    room.currentWord = null;
    room.scores = new Map();
    room.guessHistory = [];
    room.canvasStrokes = [];
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

export function cleanupIdleRooms() {
  const cutoff = new Date(Date.now() - IDLE_TIMEOUT_MS).toISOString();

  for (const [code, room] of rooms.entries()) {
    if ((room.status === "lobby" || room.status === "results") && room.updatedAt < cutoff) {
      rooms.delete(code);
    }
  }
}

export function addStroke(code: string, participantId: string, stroke: Stroke) {
  const room = rooms.get(code);

  if (!room) {
    throw new GameError("Unable to load room", "NOT_FOUND");
  }

  if (room.status !== "playing") {
    throw new GameError("Room is not in an active playing state", "CONFLICT");
  }

  if (room.drawerId !== participantId) {
    throw new GameError("Only the drawer can update the canvas", "FORBIDDEN");
  }

  room.canvasStrokes.push(stroke);
  if (room.canvasStrokes.length > 500) {
    room.canvasStrokes.splice(0, room.canvasStrokes.length - 500);
  }
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function clearCanvas(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new GameError("Unable to load room", "NOT_FOUND");
  }

  if (room.status !== "playing") {
    throw new GameError("Room is not in an active playing state", "CONFLICT");
  }

  if (room.drawerId !== participantId) {
    throw new GameError("Only the drawer can clear the canvas", "FORBIDDEN");
  }

  room.canvasStrokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export interface SubmitGuessResult {
  guess: GuessEntry;
  scoreAwarded: number;
  room: Room;
}

export function endRound(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new GameError("Unable to load room", "NOT_FOUND");
  }

  if (room.hostParticipantId !== participantId) {
    throw new GameError("Only the host can end the round", "FORBIDDEN");
  }

  if (room.status !== "playing") {
    throw new GameError("Room is not in an active playing state", "CONFLICT");
  }

  room.status = "results";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function submitGuess(code: string, participantId: string, guessText: string): SubmitGuessResult {
  const room = rooms.get(code);

  if (!room) {
    throw new GameError("Unable to load room", "NOT_FOUND");
  }

  if (room.status !== "playing" || !room.currentWord) {
    throw new GameError("Room is not in an active playing state", "CONFLICT");
  }

  if (room.drawerId === participantId) {
    throw new GameError("Drawer cannot submit guesses", "FORBIDDEN");
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    throw new GameError("Participant not found", "NOT_FOUND");
  }

  const trimmed = guessText.trim();
  if (trimmed.length === 0) {
    throw new GameError("Guess cannot be empty", "CONFLICT");
  }

  const isCorrect = trimmed.toLowerCase() === room.currentWord.toLowerCase();
  let scoreAwarded = 0;

  if (isCorrect) {
    const currentScore = room.scores.get(participantId) ?? 0;
    if (currentScore === 0) {
      scoreAwarded = 100;
      room.scores.set(participantId, 100);
    }
  }

  const guess: GuessEntry = {
    participantId,
    guess: trimmed,
    isCorrect,
    submittedAt: now()
  };

  room.guessHistory.push(guess);
  room.updatedAt = now();

  if (isCorrect) {
    room.status = "results";
  }

  rooms.set(room.code, room);

  return { guess, scoreAwarded, room: cloneRoom(room) };
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new GameError("Unable to load room", "NOT_FOUND");
  }

  if (room.hostParticipantId !== participantId) {
    throw new GameError("Only the host can restart the game", "FORBIDDEN");
  }

  if (room.status !== "results") {
    throw new GameError("Room is not in results state", "CONFLICT");
  }

  room.status = "lobby";
  room.drawerId = null;
  room.currentWord = null;
  room.scores = new Map();
  room.guessHistory = [];
  room.canvasStrokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function clearRooms() {
  rooms.clear();
}

// Start periodic cleanup
setInterval(cleanupIdleRooms, 60_000);

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId !== undefined && room.drawerId === viewerParticipantId;
  const revealWord = isDrawer || room.status === "results";

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({
      ...participant,
      score: room.scores.get(participant.id) ?? 0
    })),
    hostId: room.hostParticipantId,
    drawerId: room.drawerId,
    currentWord: revealWord ? room.currentWord : null,
    availableWords: listWords(),
    scores: Object.fromEntries(room.scores),
    guessHistory: room.guessHistory,
    canvasStrokes: room.canvasStrokes
  };
}

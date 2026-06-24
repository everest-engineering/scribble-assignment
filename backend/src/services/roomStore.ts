import { randomUUID } from "node:crypto";
import type { DrawingStroke, Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

export class RoomStoreError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

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

export function validatePlayerName(name?: string): string {
  const trimmed = name?.trim() ?? "";

  if (!trimmed) {
    throw new RoomStoreError(400, "Player name is required");
  }

  return trimmed;
}

export function selectWord(roomCode: string): string {
  const hash = roomCode.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return STARTER_WORDS[hash % STARTER_WORDS.length] ?? STARTER_WORDS[0];
}

function createParticipant(name: string): Participant {
  return {
    id: randomUUID(),
    name,
    joinedAt: now()
  };
}

function createEmptyRoomFields() {
  return {
    drawerId: null,
    secretWord: null,
    scores: {} as Record<string, number>,
    guesses: [] as Guess[],
    drawingStrokes: [] as Room["drawingStrokes"]
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const name = validatePlayerName(playerName);
  const participant = createParticipant(name);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    ...createEmptyRoomFields(),
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

  const name = validatePlayerName(playerName);
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
  const room = rooms.get(code);
  return room ? cloneRoom(room) : null;
}

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new RoomStoreError(404, "Room not found");
  }

  if (room.hostId !== participantId) {
    throw new RoomStoreError(403, "Only the host can start the game");
  }

  if (room.status !== "lobby") {
    throw new RoomStoreError(409, "Game has already started");
  }

  if (room.participants.length < 2) {
    throw new RoomStoreError(400, "At least 2 players are required to start");
  }

  room.status = "playing";
  room.drawerId = room.hostId;
  room.secretWord = selectWord(room.code);
  room.scores = Object.fromEntries(room.participants.map((p) => [p.id, 0]));
  room.guesses = [];
  room.drawingStrokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

function requirePlayingRoom(code: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new RoomStoreError(404, "Room not found");
  }

  if (room.status !== "playing") {
    throw new RoomStoreError(409, "Round is not active");
  }

  return room;
}

function requireDrawer(room: Room, participantId: string) {
  if (room.drawerId !== participantId) {
    throw new RoomStoreError(403, "Only the drawer can perform this action");
  }
}

function requireGuesser(room: Room, participantId: string) {
  if (room.drawerId === participantId) {
    throw new RoomStoreError(403, "The drawer cannot submit guesses");
  }
}

export function addStroke(code: string, participantId: string, stroke: DrawingStroke) {
  const room = requirePlayingRoom(code);
  requireDrawer(room, participantId);

  room.drawingStrokes.push({
    ...stroke,
    points: stroke.points.map((point) => ({ ...point }))
  });
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function clearDrawing(code: string, participantId: string) {
  const room = requirePlayingRoom(code);
  requireDrawer(room, participantId);

  room.drawingStrokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = requirePlayingRoom(code);
  requireGuesser(room, participantId);

  const trimmed = text.trim();

  if (!trimmed) {
    throw new RoomStoreError(400, "Guess is required");
  }

  const participant = room.participants.find((p) => p.id === participantId);

  if (!participant) {
    throw new RoomStoreError(404, "Participant not found");
  }

  const isCorrect =
    room.secretWord != null && trimmed.toLowerCase() === room.secretWord.toLowerCase();

  const guess: Guess = {
    id: randomUUID(),
    participantId,
    participantName: participant.name,
    text: trimmed,
    isCorrect,
    createdAt: now()
  };

  room.guesses.push(guess);

  if (isCorrect) {
    room.scores[participantId] = (room.scores[participantId] ?? 0) + 100;
    room.status = "result";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new RoomStoreError(404, "Room not found");
  }

  if (room.hostId !== participantId) {
    throw new RoomStoreError(403, "Only the host can restart the game");
  }

  if (room.status !== "result") {
    throw new RoomStoreError(409, "Game can only be restarted from result state");
  }

  room.status = "lobby";
  room.drawerId = null;
  room.secretWord = null;
  room.scores = {};
  room.guesses = [];
  room.drawingStrokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId != null && viewerParticipantId === room.drawerId;
  const revealWord = room.status === "result";

  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    drawerId: room.drawerId,
    participants: room.participants.map((participant) => ({
      ...participant,
      role: participant.id === room.drawerId ? "drawer" : "guesser",
      score: room.scores[participant.id] ?? 0
    })),
    guesses: room.guesses.map((guess) => ({ ...guess })),
    drawingStrokes: room.drawingStrokes.map((stroke) => ({
      ...stroke,
      points: stroke.points.map((point) => ({ ...point }))
    })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  if (room.secretWord && (isDrawer || revealWord)) {
    snapshot.secretWord = room.secretWord;
  }

  return snapshot;
}

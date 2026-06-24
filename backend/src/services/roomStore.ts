import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
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

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId != null && viewerParticipantId === room.drawerId;

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

  if (isDrawer && room.secretWord) {
    snapshot.secretWord = room.secretWord;
  }

  return snapshot;
}

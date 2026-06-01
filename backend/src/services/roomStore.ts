import { randomUUID } from "node:crypto";
import type {
  CanvasStroke,
  Participant,
  ParticipantRole,
  Room,
  RoomSnapshot,
  RoomViewer
} from "../models/game.js";
import {
  CORRECT_GUESS_POINTS,
  MAX_PARTICIPANTS,
  PRESENCE_TIMEOUT_MS
} from "./roomConstants.js";
import { compareGuessToSecret, isGuessEmpty, trimGuess } from "./guessLogic.js";
import { RoomServiceError } from "./roomErrors.js";
import { selectRoundWord } from "./wordSelection.js";

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

export function normalizePlayerName(name: string) {
  return name.trim();
}

export function validatePlayerName(name: string) {
  const trimmed = normalizePlayerName(name);

  if (!trimmed) {
    throw new RoomServiceError("INVALID_NAME", "Name is required");
  }

  return trimmed;
}

export function normalizeRoomCode(code: string) {
  return code.trim().toUpperCase();
}

export function validateRoomCode(code: string) {
  const normalized = normalizeRoomCode(code);

  if (!normalized) {
    throw new RoomServiceError("ROOM_CODE_REQUIRED", "Room code is required");
  }

  return normalized;
}

function createParticipant(name: string): Participant {
  const timestamp = now();

  return {
    id: randomUUID(),
    name,
    joinedAt: timestamp,
    lastSeenAt: timestamp
  };
}

function cloneRoom(room: Room): Room {
  return structuredClone(room);
}

function touchParticipant(participant: Participant) {
  participant.lastSeenAt = now();
}

function getRoomOrThrow(code: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new RoomServiceError("ROOM_NOT_FOUND", "Room not found");
  }

  return room;
}

export function pruneStaleParticipants(room: Room) {
  const cutoff = Date.now() - PRESENCE_TIMEOUT_MS;
  room.participants = room.participants.filter(
    (participant) => new Date(participant.lastSeenAt).getTime() >= cutoff
  );

  if (room.participants.length === 0) {
    rooms.delete(room.code);
    return null;
  }

  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return room;
}

export function createRoom(playerName: string) {
  const name = validatePlayerName(playerName);
  const participant = createParticipant(name);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostParticipantId: participant.id,
    participants: [participant],
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, cloneRoom(room));

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName: string) {
  const normalizedCode = validateRoomCode(code);
  const name = validatePlayerName(playerName);
  const room = rooms.get(normalizedCode);

  if (!room) {
    throw new RoomServiceError("ROOM_NOT_FOUND", "Room not found");
  }

  if (room.status === "drawing") {
    throw new RoomServiceError("GAME_STARTED", "Game already started");
  }

  if (room.status !== "lobby") {
    throw new RoomServiceError("GAME_STARTED", "Game already started");
  }

  if (room.participants.length >= MAX_PARTICIPANTS) {
    throw new RoomServiceError("ROOM_FULL", "Room is full");
  }

  const participant = createParticipant(name);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function getRoom(code: string) {
  const normalizedCode = normalizeRoomCode(code);
  const room = rooms.get(normalizedCode);

  if (!room) {
    return null;
  }

  const pruned = pruneStaleParticipants(room);
  return pruned ? cloneRoom(pruned) : null;
}

export function getRoomForParticipant(code: string, participantId: string) {
  const normalizedCode = normalizeRoomCode(code);
  let room = rooms.get(normalizedCode);

  if (!room) {
    throw new RoomServiceError("ROOM_NOT_FOUND", "Room not found");
  }

  const pruned = pruneStaleParticipants(room);

  if (!pruned) {
    throw new RoomServiceError("ROOM_NOT_FOUND", "Room not found");
  }

  room = pruned;
  const participant = room.participants.find((entry) => entry.id === participantId);

  if (!participant) {
    throw new RoomServiceError("PARTICIPANT_NOT_FOUND", "Participant not found");
  }

  touchParticipant(participant);
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return cloneRoom(room);
}

export function trimParticipantNames(room: Room) {
  for (const participant of room.participants) {
    const trimmed = normalizePlayerName(participant.name);

    if (!trimmed) {
      throw new RoomServiceError("INVALID_NAME", "Name is required");
    }

    participant.name = trimmed;
  }
}

export function assignRoundOneRoles(room: Room) {
  const hostStillPresent = room.participants.some(
    (participant) => participant.id === room.hostParticipantId
  );

  const drawerParticipantId = hostStillPresent
    ? room.hostParticipantId
    : [...room.participants].sort(
        (left, right) =>
          new Date(left.joinedAt).getTime() - new Date(right.joinedAt).getTime()
      )[0].id;

  room.drawerParticipantId = drawerParticipantId;

  for (const participant of room.participants) {
    const role: ParticipantRole =
      participant.id === drawerParticipantId ? "drawer" : "guesser";
    participant.role = role;
  }
}

export function startGame(code: string, participantId: string) {
  const room = getRoomOrThrow(normalizeRoomCode(code));

  if (room.status !== "lobby") {
    throw new RoomServiceError("NOT_LOBBY", "Game already started");
  }

  if (room.hostParticipantId !== participantId) {
    throw new RoomServiceError("NOT_HOST", "Only the host can start the game");
  }

  if (room.participants.length < 2) {
    throw new RoomServiceError("NOT_ENOUGH_PLAYERS", "At least two players are required");
  }

  trimParticipantNames(room);
  assignRoundOneRoles(room);

  room.roundNumber = 1;
  room.secretWord = selectRoundWord(room.code, room.roundNumber);
  room.status = "drawing";
  room.canvasStrokes = [];
  room.guesses = [];

  for (const participant of room.participants) {
    participant.score = 0;
  }

  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return cloneRoom(room);
}

function assertDrawingRoom(room: Room) {
  if (room.status !== "drawing") {
    throw new RoomServiceError("NOT_DRAWING", "Game is not in progress");
  }
}

export function updateCanvas(
  code: string,
  participantId: string,
  strokes: CanvasStroke[]
) {
  const room = getRoomOrThrow(normalizeRoomCode(code));
  assertDrawingRoom(room);

  if (room.drawerParticipantId !== participantId) {
    throw new RoomServiceError("NOT_DRAWER", "Only the drawer can update the canvas");
  }

  room.canvasStrokes = strokes;
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return cloneRoom(room);
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = getRoomOrThrow(normalizeRoomCode(code));
  assertDrawingRoom(room);

  if (room.drawerParticipantId === participantId) {
    throw new RoomServiceError("DRAWER_CANNOT_GUESS", "The drawer cannot submit guesses");
  }

  if (isGuessEmpty(text)) {
    throw new RoomServiceError("EMPTY_GUESS", "Guess cannot be empty");
  }

  const participant = room.participants.find((entry) => entry.id === participantId);

  if (!participant) {
    throw new RoomServiceError("PARTICIPANT_NOT_FOUND", "Participant not found");
  }

  const trimmedGuess = trimGuess(text);
  const secretWord = room.secretWord ?? "";
  const isCorrect = compareGuessToSecret(trimmedGuess, secretWord);

  if (isCorrect) {
    participant.score = (participant.score ?? 0) + CORRECT_GUESS_POINTS;
  }

  const guesses = room.guesses ?? [];
  guesses.push({
    id: randomUUID(),
    participantId: participant.id,
    participantName: participant.name,
    text: trimmedGuess,
    isCorrect,
    createdAt: now()
  });
  room.guesses = guesses;
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return cloneRoom(room);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const participants = room.participants.map((participant) => ({
    id: participant.id,
    name: participant.name,
    joinedAt: participant.joinedAt,
    isHost: participant.id === room.hostParticipantId,
    role: participant.role,
    score: participant.score ?? 0
  }));

  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostParticipantId: room.hostParticipantId,
    roundNumber: room.roundNumber,
    drawerParticipantId: room.drawerParticipantId,
    participants,
    canvasStrokes: room.canvasStrokes ?? [],
    guesses: room.guesses ?? []
  };

  if (!viewerParticipantId) {
    return snapshot;
  }

  const viewerParticipant = room.participants.find(
    (participant) => participant.id === viewerParticipantId
  );
  const viewerRole = viewerParticipant?.role;

  const viewer: RoomViewer = {
    participantId: viewerParticipantId,
    isHost: viewerParticipantId === room.hostParticipantId,
    canStart:
      viewerParticipantId === room.hostParticipantId &&
      room.status === "lobby" &&
      room.participants.length >= 2,
    role: viewerRole
  };

  if (viewerRole === "drawer" && room.secretWord) {
    viewer.secretWord = room.secretWord;
  }

  return {
    ...snapshot,
    viewer
  };
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

/** @internal Test helper */
export function clearAllRoomsForTests() {
  rooms.clear();
}

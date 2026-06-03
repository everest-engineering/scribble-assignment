import { randomUUID } from "node:crypto";
import type { DrawingState, Participant, Room, RoomSnapshot, Stroke } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

export class RoomStoreError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "RoomStoreError";
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

function displayName(name: string) {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new RoomStoreError(400, "Player name is required");
  }

  return trimmed;
}

function createParticipant(name: string): Participant {
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

export function resetRoomsForTest() {
  rooms.clear();
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostParticipantId: participant.id,
    participants: [participant],
    round: null,
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
  const room = rooms.get(code.trim().toUpperCase());

  if (!room) {
    return null;
  }

  if (room.status !== "lobby") {
    throw new RoomStoreError(400, "Unable to join after the game has started");
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
  const room = rooms.get(code.trim().toUpperCase());
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code.trim().toUpperCase());

  if (!room) {
    throw new RoomStoreError(404, "Unable to load room");
  }
  ensureHost(room, participantId);
  if (room.status !== "lobby") {
    throw new RoomStoreError(400, "Game has already started");
  }
  if (room.participants.length < 2) {
    throw new RoomStoreError(400, "At least 2 players are required to start");
  }

  const drawerParticipantId = room.hostParticipantId || room.participants[0].id;
  room.status = "active";
  room.round = {
    drawerParticipantId,
    secretWord: selectSecretWord(),
    drawing: emptyDrawing(),
    guesses: [],
    scores: Object.fromEntries(room.participants.map((participant) => [participant.id, 0])),
    startedAt: now(),
    endedAt: null
  };
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId
  };
}

export function updateDrawing(code: string, participantId: string, strokes: Stroke[]) {
  const room = requireActiveRoom(code);
  ensureDrawer(room, participantId);
  room.round.drawing = { strokes: structuredClone(strokes) };
  room.updatedAt = now();
  rooms.set(room.code, room);
  return cloneRoom(room);
}

export function clearDrawing(code: string, participantId: string) {
  const room = requireActiveRoom(code);
  ensureDrawer(room, participantId);
  room.round.drawing = emptyDrawing();
  room.updatedAt = now();
  rooms.set(room.code, room);
  return cloneRoom(room);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const viewer = viewerParticipantId ? findParticipant(room, viewerParticipantId) : null;
  const round = room.round;
  const viewerRole = round && viewer ? (round.drawerParticipantId === viewer.id ? "drawer" : "guesser") : null;
  const scores = round?.scores ?? {};
  const showSecretWord = Boolean(round?.secretWord && (room.status === "result" || viewerRole === "drawer"));

  return {
    code: room.code,
    status: room.status,
    hostParticipantId: room.hostParticipantId,
    viewerParticipantId: viewerParticipantId,
    viewerRole,
    drawerParticipantId: round?.drawerParticipantId ?? null,
    participants: room.participants.map((participant) => ({
      ...participant,
      isHost: participant.id === room.hostParticipantId,
      role: round ? (participant.id === round.drawerParticipantId ? "drawer" : "guesser") : null,
      score: scores[participant.id] ?? 0
    })),
    drawing: round?.drawing ?? emptyDrawing(),
    guesses: round?.guesses ?? [],
    scores,
    ...(showSecretWord ? { secretWord: round?.secretWord } : {}),
    canStart: room.status === "lobby" && Boolean(viewer?.id === room.hostParticipantId) && room.participants.length >= 2,
    canRestart: room.status === "result" && Boolean(viewer?.id === room.hostParticipantId),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}

function findParticipant(room: Room, participantId: string): Participant | null {
  return room.participants.find((participant) => participant.id === participantId) ?? null;
}

function ensureHost(room: Room, participantId: string) {
  if (!findParticipant(room, participantId)) {
    throw new RoomStoreError(404, "Participant not found");
  }
  if (room.hostParticipantId !== participantId) {
    throw new RoomStoreError(403, "Only the host can perform this action");
  }
}

function ensureDrawer(room: Room & { round: NonNullable<Room["round"]> }, participantId: string) {
  if (!findParticipant(room, participantId)) {
    throw new RoomStoreError(404, "Participant not found");
  }
  if (room.round.drawerParticipantId !== participantId) {
    throw new RoomStoreError(403, "Only the drawer can perform this action");
  }
}

function requireActiveRoom(code: string): Room & { round: NonNullable<Room["round"]> } {
  const room = rooms.get(code.trim().toUpperCase());

  if (!room) {
    throw new RoomStoreError(404, "Unable to load room");
  }
  if (room.status !== "active" || !room.round) {
    throw new RoomStoreError(400, "Game is not active");
  }

  return room as Room & { round: NonNullable<Room["round"]> };
}

function selectSecretWord() {
  return STARTER_WORDS[0] ?? "rocket";
}

function emptyDrawing(): DrawingState {
  return { strokes: [] };
}

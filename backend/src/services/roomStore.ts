import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
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

function normalizeCode(code: string) {
  return code.toUpperCase();
}

export function listWords() {
  return [...STARTER_WORDS];
}

/** Clears in-memory rooms (for tests only). */
export function resetRoomsForTests() {
  rooms.clear();
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
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

export type JoinRoomResult =
  | { room: Room; participantId: string }
  | { error: "not_found" }
  | { error: "not_lobby" };

export function joinRoom(code: string, playerName?: string): JoinRoomResult {
  const room = rooms.get(normalizeCode(code));

  if (!room) {
    return { error: "not_found" };
  }

  if (room.status !== "lobby") {
    return { error: "not_lobby" };
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

export type StartGameResult =
  | { room: Room; participantId: string }
  | { error: "not_found" }
  | { error: "not_host" }
  | { error: "not_enough_players" }
  | { error: "not_lobby" };

export function startGame(code: string, participantId: string): StartGameResult {
  const room = rooms.get(normalizeCode(code));

  if (!room) {
    return { error: "not_found" };
  }

  if (room.status !== "lobby") {
    return { error: "not_lobby" };
  }

  const participant = room.participants.find((entry) => entry.id === participantId);

  if (!participant || room.hostId !== participantId) {
    return { error: "not_host" };
  }

  if (room.participants.length < 2) {
    return { error: "not_enough_players" };
  }

  room.status = "playing";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId
  };
}

export function getRoom(code: string) {
  const room = rooms.get(normalizeCode(code));
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isHost = viewerParticipantId === room.hostId;
  const canStart = isHost && room.status === "lobby" && room.participants.length >= 2;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    isHost,
    canStart,
    participants: room.participants.map((participant) => ({
      ...participant,
      isHost: participant.id === room.hostId
    })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}

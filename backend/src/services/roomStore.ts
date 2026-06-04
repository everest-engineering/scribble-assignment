import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();
const usedCodes = new Set<string>();

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

  while (rooms.has(code) || usedCodes.has(code)) {
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

function findParticipantIndex(room: Room, participantId: string) {
  return room.participants.findIndex((participant) => participant.id === participantId);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function resetRoomStore() {
  rooms.clear();
  usedCodes.clear();
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostParticipantId: participant.id,
    participants: [participant],
    createdAt: now(),
    updatedAt: now()
  };

  usedCodes.add(room.code);
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code);

  if (!room || room.status !== "lobby") {
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

export type StartRoomFailureReason = "not_found" | "forbidden" | "too_few_players";

export type LeaveRoomFailureReason = "not_found" | "not_member";

export function startRoom(code: string, participantId: string):
  | { room: Room }
  | { error: StartRoomFailureReason } {
  const room = rooms.get(code);

  if (!room) {
    return { error: "not_found" };
  }

  if (room.hostParticipantId !== participantId || findParticipantIndex(room, participantId) === -1) {
    return { error: "forbidden" };
  }

  if (room.participants.length < 2) {
    return { error: "too_few_players" };
  }

  room.status = "game";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function leaveRoom(code: string, participantId: string):
  | { room: Room | null; deleted: boolean }
  | { error: LeaveRoomFailureReason } {
  const room = rooms.get(code);

  if (!room) {
    return { error: "not_found" };
  }

  const participantIndex = findParticipantIndex(room, participantId);

  if (participantIndex === -1) {
    return { error: "not_member" };
  }

  const isHost = room.hostParticipantId === participantId;
  room.participants.splice(participantIndex, 1);

  if (room.status === "lobby" && isHost) {
    rooms.delete(code);
    return { room: null, deleted: true };
  }

  if (room.participants.length === 0) {
    rooms.delete(code);
    return { room: null, deleted: true };
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room), deleted: false };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  void viewerParticipantId;

  return {
    code: room.code,
    status: room.status,
    hostParticipantId: room.hostParticipantId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}

import { randomUUID } from "node:crypto";
import type { Participant, ParticipantView, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

function now() {
  return new Date().toISOString();
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
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

function createParticipant(name: string): Participant {
  return {
    id: randomUUID(),
    name: name.trim(),
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    hostParticipantId: participant.id,
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
  const room = rooms.get(normalizeCode(code));

  if (!room) {
    return null;
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function getRoom(code: string) {
  const room = rooms.get(normalizeCode(code));
  return room ? cloneRoom(room) : null;
}

export type StartRoomOutcome =
  | { ok: true; room: Room }
  | { ok: false; reason: "not_found" | "not_host" | "not_enough_players" };

export function startRoom(code: string, requesterId: string): StartRoomOutcome {
  const room = rooms.get(normalizeCode(code));

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  if (room.hostParticipantId !== requesterId) {
    return { ok: false, reason: "not_host" };
  }

  if (room.participants.length < 2) {
    return { ok: false, reason: "not_enough_players" };
  }

  room.updatedAt = now();
  return { ok: true, room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const viewerIsHost =
    Boolean(viewerParticipantId) && viewerParticipantId === room.hostParticipantId;

  const participants: ParticipantView[] = room.participants.map((participant) => ({
    ...participant,
    isHost: participant.id === room.hostParticipantId
  }));

  return {
    code: room.code,
    status: room.status,
    participants,
    hostParticipantId: room.hostParticipantId,
    viewerIsHost,
    canStart: viewerIsHost && room.participants.length >= 2,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}

export function __resetRoomsForTests() {
  rooms.clear();
}

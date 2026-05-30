import { randomUUID } from "node:crypto";
import type { Participant, ParticipantRole, Room, RoomSnapshot } from "../models/game.js";
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

export type NormalizedNameResult =
  | { ok: true; name: string }
  | { ok: false; reason: "empty_name" };

export function normalizePlayerName(name?: string): NormalizedNameResult {
  const trimmed = (name ?? "").trim();

  if (!trimmed) {
    return { ok: false, reason: "empty_name" };
  }

  return { ok: true, name: trimmed };
}

function createParticipant(name: string): Participant {
  return {
    id: randomUUID(),
    name,
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

function participantRole(
  room: Room,
  participantId: string
): ParticipantRole | null {
  if (room.status !== "playing" || !room.drawerParticipantId) {
    return null;
  }

  return participantId === room.drawerParticipantId ? "drawer" : "guesser";
}

export function listWords() {
  return [...STARTER_WORDS];
}

export type CreateRoomResult =
  | { ok: true; room: Room; participantId: string }
  | { ok: false; reason: "empty_name" };

export type JoinRoomResult =
  | { ok: true; room: Room; participantId: string }
  | { ok: false; reason: "not_found" | "game_started" | "empty_name" };

export type StartRoomResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not_found" | "not_host" | "not_enough_players" | "game_started" };

export function createRoom(playerName?: string): CreateRoomResult {
  const normalized = normalizePlayerName(playerName);

  if (!normalized.ok) {
    return { ok: false, reason: "empty_name" };
  }

  const participant = createParticipant(normalized.name);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostParticipantId: participant.id,
    drawerParticipantId: null,
    secretWord: null,
    participants: [participant],
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    ok: true,
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName?: string): JoinRoomResult {
  const normalized = normalizePlayerName(playerName);

  if (!normalized.ok) {
    return { ok: false, reason: "empty_name" };
  }

  const room = rooms.get(code);

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  if (room.status !== "lobby") {
    return { ok: false, reason: "game_started" };
  }

  const participant = createParticipant(normalized.name);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    ok: true,
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function startRoom(code: string, participantId: string): StartRoomResult {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  if (room.status !== "lobby") {
    return { ok: false, reason: "game_started" };
  }

  if (room.hostParticipantId !== participantId) {
    return { ok: false, reason: "not_host" };
  }

  if (room.participants.length < 2) {
    return { ok: false, reason: "not_enough_players" };
  }

  room.status = "playing";
  room.drawerParticipantId = room.hostParticipantId;
  room.secretWord = STARTER_WORDS[0];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
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

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const drawerParticipantId = room.status === "playing" ? room.drawerParticipantId : null;

  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostParticipantId: room.hostParticipantId,
    drawerParticipantId,
    participants: room.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      joinedAt: participant.joinedAt,
      isHost: participant.id === room.hostParticipantId,
      role: participantRole(room, participant.id)
    })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  if (
    room.status === "playing" &&
    viewerParticipantId &&
    room.drawerParticipantId === viewerParticipantId &&
    room.secretWord
  ) {
    snapshot.secretWord = room.secretWord;
  }

  return snapshot;
}

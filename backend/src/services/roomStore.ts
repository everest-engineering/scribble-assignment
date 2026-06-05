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
    hostId: participant.id,
    drawerId: null,
    secretWord: null,
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

export function joinRoom(code: string, playerName: string) {
  const room = rooms.get(normalizeCode(code));

  if (!room) {
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
  const room = rooms.get(normalizeCode(code));
  return room ? cloneRoom(room) : null;
}

// Deterministic word selection: a stable function of the room code so the same
// room always yields the same word (reproducible and unit-testable).
export function selectWord(code: string) {
  const words = STARTER_WORDS;
  const index =
    [...normalizeCode(code)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % words.length;
  return words[index];
}

export type StartRoundResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not_found" | "not_host" | "too_few_players" };

export function startRound(code: string, participantId: string): StartRoundResult {
  const room = rooms.get(normalizeCode(code));

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  if (participantId !== room.hostId) {
    return { ok: false, reason: "not_host" };
  }

  if (room.participants.length < 2) {
    return { ok: false, reason: "too_few_players" };
  }

  room.status = "playing";
  room.drawerId = room.hostId;
  room.secretWord = selectWord(room.code);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isHost = viewerParticipantId != null && viewerParticipantId === room.hostId;
  const isDrawer = viewerParticipantId != null && viewerParticipantId === room.drawerId;

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    hostId: room.hostId,
    isHost,
    canStart: isHost && room.participants.length >= 2,
    drawerId: room.drawerId,
    isDrawer,
    // The secret word is stripped server-side for everyone but the drawer.
    secretWord: isDrawer ? room.secretWord : null
  };
}

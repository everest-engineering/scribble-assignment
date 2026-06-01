import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
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

function displayName(name?: string) {
  return name || "Player";
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

function selectWord(code: string, participants: Participant[]): string {
  const sortedIds = [...participants].map((p) => p.id).sort().join(",");
  const hash = Math.abs(hashCode(code + sortedIds));
  const words = [...STARTER_WORDS];
  return words[hash % words.length];
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName ?? "Player");
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    drawerId: null,
    secretWord: null,
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

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const trimmed = (playerName ?? "").trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.length > 20) {
    return null;
  }

  const isDuplicate = room.participants.some((p) => p.name === trimmed);

  if (isDuplicate) {
    return null;
  }

  const participant = createParticipant(trimmed);
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

export function leaveRoom(code: string, participantId: string):
  | { ok: true; room: Room | null }
  | { ok: false; error: string; status: number } {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: "Room not found", status: 404 };
  }

  const index = room.participants.findIndex((p) => p.id === participantId);

  if (index === -1) {
    return { ok: false, error: "Participant not found", status: 404 };
  }

  room.participants.splice(index, 1);

  if (room.participants.length === 0) {
    rooms.delete(code);
    return { ok: true, room: null };
  }

  const sorted = [...room.participants].sort(
    (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  );

  if (room.hostId === participantId) {
    room.hostId = sorted[0].id;
  }

  const drawerChanged = room.drawerId === participantId;

  if (drawerChanged) {
    room.drawerId = sorted[0].id;
  }

  if (drawerChanged && room.status === "playing") {
    room.secretWord = selectWord(room.code, room.participants);
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId !== undefined && viewerParticipantId === room.drawerId;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    drawerId: room.drawerId,
    secretWord: isDrawer && room.secretWord ? room.secretWord : undefined,
    yourRole: isDrawer ? "drawer" : "guesser",
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}

export function startGame(code: string, participantId: string):
  | { ok: true; room: Room }
  | { ok: false; error: string; status: number } {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: "Room not found", status: 404 };
  }

  if (room.hostId !== participantId) {
    return { ok: false, error: "Only the host can start the game", status: 403 };
  }

  if (room.participants.length < 2) {
    return { ok: false, error: "At least 2 players are required to start", status: 400 };
  }

  const sorted = [...room.participants].sort(
    (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  );
  room.drawerId = sorted[0].id;
  room.secretWord = selectWord(room.code, room.participants);
  room.status = "playing";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

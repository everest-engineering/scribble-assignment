import { randomUUID } from "node:crypto";
import type { ParticipantRole, Participant, Room, RoomSnapshot, RoundState } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { selectWord } from "./wordSelection.js";

const rooms = new Map<string, Room>();

const MIN_PLAYERS_TO_START = 2;

export type StartRoomResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not-found" | "forbidden" | "too-few-players" };

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
    name,
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
    hostId: participant.id,
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
  const room = rooms.get(code);

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
  const room = rooms.get(code);
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function startRoom(code: string, participantId: string): StartRoomResult {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, reason: "not-found" };
  }

  if (room.hostId !== participantId) {
    return { ok: false, reason: "forbidden" };
  }

  if (room.status === "started") {
    return { ok: true, room: cloneRoom(room) };
  }

  if (room.participants.length < MIN_PLAYERS_TO_START) {
    return { ok: false, reason: "too-few-players" };
  }

  room.status = "started";
  room.round = initializeRound(room);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

function initializeRound(room: Room): RoundState {
  const roles = room.participants.reduce<Record<string, ParticipantRole>>((acc, participant) => {
    acc[participant.id] = participant.id === room.hostId ? "drawer" : "guesser";
    return acc;
  }, {});

  return {
    drawerId: room.hostId,
    secretWord: selectWord(room.code, STARTER_WORDS),
    roles
  };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    drawerId: room.round?.drawerId ?? null,
    participants: room.participants.map((participant) => ({
      ...participant,
      isHost: participant.id === room.hostId,
      role: room.round?.roles[participant.id] ?? null
    })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  if (room.round && viewerParticipantId === room.round.drawerId) {
    snapshot.secretWord = room.round.secretWord;
  }

  return snapshot;
}

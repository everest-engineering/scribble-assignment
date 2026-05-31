import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { selectSecretWord } from "./wordSelection.js";

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

function emptyScores(participants: Participant[]): Record<string, number> {
  return Object.fromEntries(participants.map((participant) => [participant.id, 0]));
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
    drawerId: null,
    secretWord: null,
    scores: {},
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
  | { status: "joined"; room: Room; participantId: string }
  | { status: "not_found" }
  | { status: "in_progress" };

export function joinRoom(code: string, playerName: string): JoinRoomResult {
  const room = rooms.get(code);

  if (!room) {
    return { status: "not_found" };
  }

  if (room.status !== "lobby") {
    return { status: "in_progress" };
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    status: "joined",
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

export type StartGameResult =
  | { status: "started"; room: Room }
  | { status: "not_found" }
  | { status: "not_host" }
  | { status: "not_enough_players" }
  | { status: "already_started" };

export function startGame(code: string, participantId: string): StartGameResult {
  const room = rooms.get(code);

  if (!room) {
    return { status: "not_found" };
  }

  if (room.status !== "lobby") {
    return { status: "already_started" };
  }

  if (room.hostId !== participantId) {
    return { status: "not_host" };
  }

  if (room.participants.length < 2) {
    return { status: "not_enough_players" };
  }

  room.status = "playing";
  room.drawerId = room.hostId;
  room.secretWord = selectSecretWord(room.code);
  room.scores = emptyScores(room.participants);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    status: "started",
    room: cloneRoom(room)
  };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    drawerId: room.drawerId,
    participants: room.participants.map((participant) => ({ ...participant })),
    scores: room.status === "playing" ? { ...room.scores } : {},
    roles: [...STARTER_ROLES]
  };

  if (room.status === "lobby") {
    snapshot.availableWords = listWords();
    return snapshot;
  }

  if (viewerParticipantId && viewerParticipantId === room.drawerId && room.secretWord) {
    snapshot.secretWord = room.secretWord;
  }

  return snapshot;
}

import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
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
    joinedAt: now(),
    score: 0
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    drawerId: null,
    currentWord: null,
    guesses: [],
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

function selectWord(code: string): string {
  const index = Array.from(code).reduce((sum, char) => sum + char.charCodeAt(0), 0) % STARTER_WORDS.length;
  return STARTER_WORDS[index];
}

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) return null;
  if (room.hostId !== participantId) return "not-host" as const;
  if (room.participants.length < 2) return "not-enough-players" as const;

  room.status = "playing";
  room.drawerId = room.hostId;
  room.currentWord = selectWord(room.code);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return toRoomSnapshot(cloneRoom(room), participantId);
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);

  if (!room) return "room-not-found" as const;
  if (room.status !== "playing") return "not-playing" as const;

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) return "participant-not-found" as const;
  if (participantId === room.drawerId) return "is-drawer" as const;

  const trimmed = text.trim().toLowerCase();
  const isCorrect = trimmed === room.currentWord!.trim().toLowerCase();

  if (isCorrect && participant.score < 100) {
    participant.score = 100;
  }

  const guess: Guess = {
    participantId,
    participantName: participant.name,
    text: text.trim(),
    isCorrect,
    submittedAt: now()
  };

  room.guesses.push(guess);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return toRoomSnapshot(cloneRoom(room), participantId);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    drawerId: room.drawerId,
    currentWord: viewerParticipantId === room.drawerId ? room.currentWord : null,
    guesses: room.guesses.map((g) => ({ ...g })),
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}

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
    joinedAt: now()
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
    secretWord: null,
    participants: [participant],
    scores: {},
    guesses: [],
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
  const room = rooms.get(code.toUpperCase());

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

export function startGame(code: string, participantId: string): RoomSnapshot | null {
  const room = rooms.get(code.toUpperCase());
  if (!room) return null;
  if (room.hostId !== participantId) return null;
  if (room.participants.length < 2) return null;
  room.status = "active";
  room.drawerId = room.hostId;
  room.secretWord = listWords()[0];
  room.scores = Object.fromEntries(room.participants.map((p) => [p.id, 0]));
  room.guesses = [];
  room.updatedAt = now();
  rooms.set(room.code, room);
  return toRoomSnapshot(room, participantId);
}

export function submitGuess(
  code: string,
  participantId: string,
  text: string
): { guess: Guess; scoreAwarded: number; snapshot: RoomSnapshot } | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const room = rooms.get(code.toUpperCase());
  if (!room || room.status !== "active" || !room.secretWord) return null;

  const isCorrect = trimmed.toLowerCase() === room.secretWord.toLowerCase();
  const scoreAwarded = isCorrect ? 100 : 0;

  const guess: Guess = {
    participantId,
    text: trimmed,
    isCorrect,
    submittedAt: now()
  };

  room.guesses.push(guess);

  if (!(participantId in room.scores)) {
    room.scores[participantId] = 0;
  }
  room.scores[participantId] += scoreAwarded;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { guess, scoreAwarded, snapshot: toRoomSnapshot(room, participantId) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId !== undefined && viewerParticipantId === room.drawerId;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    drawerId: room.drawerId,
    secretWord: isDrawer ? room.secretWord : null,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    scores: { ...room.scores },
    guesses: room.guesses.map((g) => ({ ...g }))
  };
}

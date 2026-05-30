import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot, Score } from "../models/game.js";
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
    participants: [participant],
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

export function startRoom(
  code: string,
  requestingParticipantId: string
): { error: "not_found" | "forbidden" | "not_enough_players" } | { room: RoomSnapshot } {
  const room = rooms.get(code);

  if (!room) {
    return { error: "not_found" };
  }

  if (room.hostId !== requestingParticipantId) {
    return { error: "forbidden" };
  }

  if (room.participants.length < 2) {
    return { error: "not_enough_players" };
  }

  room.status = "active";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: toRoomSnapshot(cloneRoom(room)) };
}

export function submitGuess(
  code: string,
  guesserId: string,
  rawText: string
): { error: "not_found" | "not_active" } | { guess: Guess } {
  const room = rooms.get(code);

  if (!room) {
    return { error: "not_found" };
  }

  if (room.status !== "active") {
    return { error: "not_active" };
  }

  const text = rawText.trim();
  const secretWord = STARTER_WORDS[0];
  const isCorrect = text.toLowerCase() === secretWord.toLowerCase();

  const guess: Guess = {
    id: randomUUID(),
    guesserId,
    text,
    isCorrect,
    submittedAt: now()
  };

  room.guesses.push(guess);
  saveRoom(room);

  return { guess };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  void viewerParticipantId;

  const guesses = (room.guesses ?? []).map((g) => ({ ...g }));
  const scores: Score[] = room.participants.map((p) => ({
    participantId: p.id,
    score: guesses.filter((g) => g.guesserId === p.id && g.isCorrect).length * 100
  }));

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    guesses,
    scores
  };
}

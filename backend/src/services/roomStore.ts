import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { selectWord } from "./wordSelection.js";

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
    score: 0,
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

export type StartGameError = "not_found" | "forbidden" | "not_lobby" | "too_few_players";

export type StartGameResult =
  | { ok: true; room: Room; participantId: string }
  | { ok: false; error: StartGameError };

export function startGame(code: string, participantId: string): StartGameResult {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: "not_found" };
  }

  if (room.hostId !== participantId) {
    return { ok: false, error: "forbidden" };
  }

  if (room.status !== "lobby") {
    return { ok: false, error: "not_lobby" };
  }

  if (room.participants.length < 2) {
    return { ok: false, error: "too_few_players" };
  }

  room.status = "playing";
  room.drawerId = room.hostId;
  room.secretWord = selectWord(room.code, STARTER_WORDS);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room), participantId };
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

const CORRECT_GUESS_POINTS = 100;

function normalizeGuess(value: string) {
  return value.trim().toLowerCase();
}

export type SubmitGuessError = "not_found" | "not_playing" | "not_participant" | "drawer_cannot_guess";

export type SubmitGuessResult =
  | { ok: true; room: Room; guess: Guess }
  | { ok: false; error: SubmitGuessError };

export function submitGuess(code: string, participantId: string, text: string): SubmitGuessResult {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: "not_found" };
  }

  if (room.status !== "playing") {
    return { ok: false, error: "not_playing" };
  }

  const participant = room.participants.find((candidate) => candidate.id === participantId);

  if (!participant) {
    return { ok: false, error: "not_participant" };
  }

  if (participantId === room.drawerId) {
    return { ok: false, error: "drawer_cannot_guess" };
  }

  const correct = normalizeGuess(text) === normalizeGuess(room.secretWord ?? "");

  const guess: Guess = {
    id: randomUUID(),
    participantId,
    playerName: participant.name,
    text: text.trim(),
    correct,
    createdAt: now()
  };

  room.guesses.push(guess);

  if (correct) {
    participant.score += CORRECT_GUESS_POINTS;
    // A correct guess ends the round; the result is then shared with everyone.
    room.status = "ended";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room), guess: { ...guess } };
}

export type RestartGameError = "not_found" | "forbidden";

export type RestartGameResult =
  | { ok: true; room: Room; participantId: string }
  | { ok: false; error: RestartGameError };

export function restartGame(code: string, participantId: string): RestartGameResult {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: "not_found" };
  }

  if (room.hostId !== participantId) {
    return { ok: false, error: "forbidden" };
  }

  room.status = "lobby";
  room.drawerId = null;
  room.secretWord = null;
  room.guesses = [];
  room.participants.forEach((participant) => {
    participant.score = 0;
  });
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room), participantId };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId != null && viewerParticipantId === room.drawerId;
  // The word is revealed to the drawer during play, and to everyone once ended.
  const revealWord = isDrawer || room.status === "ended";

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    drawerId: room.drawerId,
    word: revealWord ? room.secretWord : null,
    participants: room.participants.map((participant) => ({ ...participant })),
    guesses: room.guesses.map((guess) => ({ ...guess })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}

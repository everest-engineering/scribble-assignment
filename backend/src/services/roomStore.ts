import { randomUUID } from "node:crypto";
import type { Guess, GuessSnapshot, Participant, Room, RoomSnapshot } from "../models/game.js";
import { ROUND_DURATION_SECONDS, STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const MAX_PLAYERS = 4;

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
  return (name ?? "").trim() || "Player";
}

function createParticipant(name?: string): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    joinedAt: now()
  };
}

function cloneRoom(room: Room): Room {
  return {
    ...structuredClone({ ...room, correctGuessers: undefined }),
    correctGuessers: new Set(room.correctGuessers)
  };
}

export function listWords() {
  return [...STARTER_WORDS];
}

// T012: checkRoundExpiry — lazily transitions status to "finished" when timer has expired
export function checkRoundExpiry(room: Room): void {
  if (room.status !== "in-progress" || !room.roundStartedAt) {
    return;
  }
  const startMs = new Date(room.roundStartedAt).getTime();
  const nowMs = Date.now();
  if (nowMs >= startMs + ROUND_DURATION_SECONDS * 1000) {
    room.status = "finished";
  }
}

type CreateRoomResult =
  | { ok: true; room: Room; participantId: string }
  | { ok: false; reason: "invalid_name" };

export function createRoom(playerName?: string): CreateRoomResult {
  if ((playerName ?? "").trim().length === 0) {
    return { ok: false, reason: "invalid_name" };
  }

  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    createdAt: now(),
    updatedAt: now(),
    drawerId: null,
    currentWord: null,
    canvasDataUrl: null,
    guesses: [],
    scores: {},
    correctGuessers: new Set(),
    roundStartedAt: null
  };

  rooms.set(room.code, room);

  return {
    ok: true,
    room: cloneRoom(room),
    participantId: participant.id
  };
}

type JoinRoomResult =
  | { ok: true; room: Room; participantId: string }
  | { ok: false; reason: "not_found" | "full" | "invalid_name" };

export function joinRoom(code: string, playerName?: string): JoinRoomResult | null {
  if ((playerName ?? "").trim().length === 0) {
    return { ok: false, reason: "invalid_name" };
  }

  const room = rooms.get(code);

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  if (room.participants.length >= MAX_PLAYERS) {
    return { ok: false, reason: "full" };
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    ok: true,
    room: cloneRoom(room),
    participantId: participant.id
  };
}

type StartRoomResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not_found" | "not_host" | "already_started" | "too_few_players" };

// T011: startRoom initializes all gameplay fields
export function startRoom(code: string, participantId: string): StartRoomResult {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  if (room.hostId !== participantId) {
    return { ok: false, reason: "not_host" };
  }

  if (room.status === "in-progress") {
    return { ok: false, reason: "already_started" };
  }

  if (room.participants.length < 2) {
    return { ok: false, reason: "too_few_players" };
  }

  const scores: Record<string, number> = {};
  for (const p of room.participants) {
    scores[p.id] = 0;
  }

  room.status = "in-progress";
  room.drawerId = participantId;
  room.currentWord = STARTER_WORDS[0];
  room.canvasDataUrl = null;
  room.guesses = [];
  room.scores = scores;
  room.correctGuessers = new Set();
  room.roundStartedAt = now();
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
  const toSave: Room = {
    ...room,
    correctGuessers: new Set(room.correctGuessers)
  };
  rooms.set(room.code, toSave);
  return getRoom(room.code);
}

// T013: toRoomSnapshot includes all new gameplay fields
export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const currentWord =
    room.drawerId && viewerParticipantId === room.drawerId ? room.currentWord : null;

  const participantMap = new Map(room.participants.map((p) => [p.id, p.name]));

  const guesses: GuessSnapshot[] = room.guesses.map((g) => ({
    id: g.id,
    participantId: g.participantId,
    participantName: participantMap.get(g.participantId) ?? "Unknown",
    text: g.text,
    correct: g.correct,
    submittedAt: g.submittedAt
  }));

  const roundEndsAt =
    room.status === "in-progress" && room.roundStartedAt
      ? new Date(new Date(room.roundStartedAt).getTime() + ROUND_DURATION_SECONDS * 1000).toISOString()
      : null;

  const hasGuessedCorrectly = room.correctGuessers.has(viewerParticipantId ?? "");

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    drawerId: room.drawerId,
    currentWord,
    canvasDataUrl: room.canvasDataUrl,
    guesses,
    scores: { ...room.scores },
    roundEndsAt,
    hasGuessedCorrectly
  };
}

type UpdateCanvasResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_active" | "not_drawer" };

// T017: updateCanvas — stores drawer's canvas data URL
export function updateCanvas(
  code: string,
  participantId: string,
  canvasDataUrl: string
): UpdateCanvasResult {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  checkRoundExpiry(room);

  if (room.status !== "in-progress") {
    return { ok: false, reason: "not_active" };
  }

  if (room.drawerId !== participantId) {
    return { ok: false, reason: "not_drawer" };
  }

  room.canvasDataUrl = canvasDataUrl;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true };
}

type ClearCanvasResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_active" | "not_drawer" };

// T018: clearCanvas — resets canvas to null
export function clearCanvas(code: string, participantId: string): ClearCanvasResult {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  checkRoundExpiry(room);

  if (room.status !== "in-progress") {
    return { ok: false, reason: "not_active" };
  }

  if (room.drawerId !== participantId) {
    return { ok: false, reason: "not_drawer" };
  }

  room.canvasDataUrl = null;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true };
}

type SubmitGuessResult =
  | { ok: true; guess: Guess }
  | { ok: false; reason: "not_found" | "not_active" | "is_drawer" | "empty_guess" | "already_correct" };

// T034: submitGuess — validates, scores, and records a guess
export function submitGuess(
  code: string,
  participantId: string,
  text: string
): SubmitGuessResult {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  checkRoundExpiry(room);

  if (room.status !== "in-progress") {
    return { ok: false, reason: "not_active" };
  }

  if (room.drawerId === participantId) {
    return { ok: false, reason: "is_drawer" };
  }

  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { ok: false, reason: "empty_guess" };
  }

  if (room.correctGuessers.has(participantId)) {
    return { ok: false, reason: "already_correct" };
  }

  const correct = trimmed.toLowerCase() === (room.currentWord ?? "").toLowerCase();

  if (correct) {
    room.scores[participantId] = (room.scores[participantId] ?? 0) + 100;
    room.correctGuessers.add(participantId);
  }

  const guess: Guess = {
    id: randomUUID(),
    participantId,
    text: trimmed,
    correct,
    submittedAt: now()
  };

  room.guesses.push(guess);
  room.updatedAt = now();

  // Check all-correct round-end condition: all non-drawer participants guessed correctly
  const guesserCount = room.participants.filter((p) => p.id !== room.drawerId).length;
  if (room.correctGuessers.size >= guesserCount) {
    room.status = "finished";
  }

  rooms.set(room.code, room);

  return { ok: true, guess: { ...guess } };
}

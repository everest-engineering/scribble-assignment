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
    guesses: [],
    scores: { [participant.id]: 0 },
    drawing: null,
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
  room.scores[participant.id] = 0;
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
  room.guesses = [];
  room.scores = Object.fromEntries(room.participants.map((p) => [p.id, 0]));
  room.drawing = null;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

function normalizeText(text: string) {
  return text.trim().toLowerCase();
}

export type SubmitGuessResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not_found" | "not_playing" | "not_guesser" | "invalid" };

export function submitGuess(
  code: string,
  participantId: string,
  text: string
): SubmitGuessResult {
  const room = rooms.get(normalizeCode(code));

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  if (room.status !== "playing") {
    return { ok: false, reason: "not_playing" };
  }

  const participant = room.participants.find((p) => p.id === participantId);

  if (!participant || participantId === room.drawerId) {
    return { ok: false, reason: "not_guesser" };
  }

  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { ok: false, reason: "invalid" };
  }

  const correct =
    room.secretWord != null && normalizeText(trimmed) === normalizeText(room.secretWord);

  room.guesses.push({
    id: randomUUID(),
    participantId,
    participantName: participant.name,
    correct,
    text: trimmed,
    createdAt: now()
  });

  // Award 100 for a first correct guess only; capped once per round.
  if (correct && (room.scores[participantId] ?? 0) < 100) {
    room.scores[participantId] = 100;
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export type UpdateDrawingResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not_found" | "not_playing" | "not_drawer" };

export function updateDrawing(
  code: string,
  participantId: string,
  drawing: string | null
): UpdateDrawingResult {
  const room = rooms.get(normalizeCode(code));

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  if (room.status !== "playing") {
    return { ok: false, reason: "not_playing" };
  }

  if (participantId !== room.drawerId) {
    return { ok: false, reason: "not_drawer" };
  }

  room.drawing = drawing;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
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
    secretWord: isDrawer ? room.secretWord : null,
    // A correct guess equals the word, so its text is withheld from everyone
    // except the drawer and the guess's own author.
    guesses: room.guesses.map((guess) => ({
      id: guess.id,
      participantId: guess.participantId,
      participantName: guess.participantName,
      correct: guess.correct,
      text:
        guess.correct && !isDrawer && viewerParticipantId !== guess.participantId
          ? null
          : guess.text,
      createdAt: guess.createdAt
    })),
    scores: room.participants.map((participant) => ({
      participantId: participant.id,
      name: participant.name,
      score: room.scores[participant.id] ?? 0
    })),
    // The current drawing is visible to all viewers (drawer and guessers).
    drawing: room.drawing
  };
}

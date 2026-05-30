import { randomUUID } from "node:crypto";
import type { DrawingStroke, Guess, Participant, ParticipantRole, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { evaluateGuess } from "./guessScoring.js";
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

function normalizeCode(code: string) {
  return code.toUpperCase();
}

function participantRole(room: Room, participantId: string): ParticipantRole | undefined {
  if (room.status !== "playing" || !room.drawerId) {
    return undefined;
  }

  return participantId === room.drawerId ? "drawer" : "guesser";
}

function initRoundState(room: Room) {
  room.scores = Object.fromEntries(room.participants.map((participant) => [participant.id, 0]));
  room.strokes = [];
  room.guesses = [];
}

function getPlayingRoom(code: string):
  | { ok: true; room: Room }
  | { ok: false; error: "not_found" | "not_playing" } {
  const room = rooms.get(normalizeCode(code));

  if (!room) {
    return { ok: false, error: "not_found" };
  }

  if (room.status !== "playing") {
    return { ok: false, error: "not_playing" };
  }

  return { ok: true, room };
}

export function listWords() {
  return [...STARTER_WORDS];
}

/** Clears in-memory rooms (for tests only). */
export function resetRoomsForTests() {
  rooms.clear();
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
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
  | { room: Room; participantId: string }
  | { error: "not_found" }
  | { error: "not_lobby" };

export function joinRoom(code: string, playerName: string): JoinRoomResult {
  const room = rooms.get(normalizeCode(code));

  if (!room) {
    return { error: "not_found" };
  }

  if (room.status !== "lobby") {
    return { error: "not_lobby" };
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

export type StartGameResult =
  | { room: Room; participantId: string }
  | { error: "not_found" }
  | { error: "not_host" }
  | { error: "not_enough_players" }
  | { error: "not_lobby" };

export function startGame(code: string, participantId: string): StartGameResult {
  const room = rooms.get(normalizeCode(code));

  if (!room) {
    return { error: "not_found" };
  }

  if (room.status !== "lobby") {
    return { error: "not_lobby" };
  }

  const participant = room.participants.find((entry) => entry.id === participantId);

  if (!participant || room.hostId !== participantId) {
    return { error: "not_host" };
  }

  if (room.participants.length < 2) {
    return { error: "not_enough_players" };
  }

  room.status = "playing";
  room.drawerId = room.hostId;
  room.secretWord = selectWord(room.code);
  initRoundState(room);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId
  };
}

export type StrokeMutationResult =
  | { room: Room; participantId: string }
  | { error: "not_found" }
  | { error: "not_playing" }
  | { error: "not_drawer" };

export function addStroke(code: string, participantId: string, stroke: DrawingStroke): StrokeMutationResult {
  const lookup = getPlayingRoom(code);

  if (!lookup.ok) {
    return { error: lookup.error };
  }

  const { room } = lookup;

  if (room.drawerId !== participantId) {
    return { error: "not_drawer" };
  }

  room.strokes = [...(room.strokes ?? []), { ...stroke, id: stroke.id || randomUUID() }];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId
  };
}

export function clearCanvas(code: string, participantId: string): StrokeMutationResult {
  const lookup = getPlayingRoom(code);

  if (!lookup.ok) {
    return { error: lookup.error };
  }

  const { room } = lookup;

  if (room.drawerId !== participantId) {
    return { error: "not_drawer" };
  }

  room.strokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId
  };
}

export type SubmitGuessResult =
  | { room: Room; participantId: string }
  | { error: "not_found" }
  | { error: "not_playing" }
  | { error: "is_drawer" }
  | { error: "not_participant" };

export function submitGuess(code: string, participantId: string, guessText: string): SubmitGuessResult {
  const lookup = getPlayingRoom(code);

  if (!lookup.ok) {
    return { error: lookup.error };
  }

  const { room } = lookup;

  if (room.drawerId === participantId) {
    return { error: "is_drawer" };
  }

  const participant = room.participants.find((entry) => entry.id === participantId);

  if (!participant) {
    return { error: "not_participant" };
  }

  const { isCorrect, points } = evaluateGuess(guessText, room.secretWord ?? "");
  const scores = { ...(room.scores ?? {}) };
  scores[participantId] = (scores[participantId] ?? 0) + points;

  const guess: Guess = {
    id: randomUUID(),
    participantId,
    participantName: participant.name,
    text: guessText,
    isCorrect,
    submittedAt: now()
  };

  room.scores = scores;
  room.guesses = [...(room.guesses ?? []), guess];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId
  };
}

export function getRoom(code: string) {
  const room = rooms.get(normalizeCode(code));
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isHost = viewerParticipantId === room.hostId;
  const canStart = isHost && room.status === "lobby" && room.participants.length >= 2;
  const isPlaying = room.status === "playing" && room.drawerId !== undefined;
  const viewerRole = viewerParticipantId ? participantRole(room, viewerParticipantId) ?? null : null;

  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    isHost,
    canStart,
    participants: room.participants.map((participant) => ({
      ...participant,
      isHost: participant.id === room.hostId,
      role: participantRole(room, participant.id),
      ...(isPlaying ? { score: room.scores?.[participant.id] ?? 0 } : {})
    })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  if (isPlaying) {
    snapshot.drawerId = room.drawerId;
    snapshot.viewerRole = viewerRole;
    snapshot.strokes = room.strokes ?? [];
    snapshot.guesses = (room.guesses ?? []).map((guess) => ({ ...guess }));

    if (viewerParticipantId && viewerParticipantId === room.drawerId) {
      snapshot.secretWord = room.secretWord ?? null;
    } else {
      snapshot.secretWord = null;
    }
  }

  return snapshot;
}

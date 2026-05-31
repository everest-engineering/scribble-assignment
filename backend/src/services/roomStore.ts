import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot, GuessEntry } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { HttpError } from "../api/schemas.js";

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
  const trimmedName = name?.trim();
  return trimmedName || "Player";
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
  const timestamp = now();
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostParticipantId: participant.id,
    participants: [participant],
    createdAt: timestamp,
    updatedAt: timestamp,
    guessHistory: []
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

export type StartGameResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "room-not-found" | "participant-not-host" | "not-enough-players" | "room-already-started" };

export function startGame(code: string, participantId: string): StartGameResult {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, reason: "room-not-found" };
  }

  if (room.status !== "lobby") {
    return { ok: false, reason: "room-already-started" };
  }

  if (room.hostParticipantId !== participantId) {
    return { ok: false, reason: "participant-not-host" };
  }

  if (room.participants.length < 2) {
    return { ok: false, reason: "not-enough-players" };
  }

  room.status = "in-game";
  room.roundState = {
    drawerId: room.hostParticipantId,
    secretWord: STARTER_WORDS[0]
  };
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    ok: true,
    room: cloneRoom(room)
  };
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function clearRoomsForTest() {
  rooms.clear();
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostParticipantId: room.hostParticipantId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    guessHistory: room.guessHistory ? room.guessHistory.map((entry) => ({ ...entry })) : [],
    correctGuesserId: room.correctGuesserId ?? null
  };

  if (room.roundState) {
    snapshot.roundState = {
      drawerId: room.roundState.drawerId
    };

    if (viewerParticipantId === room.roundState.drawerId || room.status === "result") {
      snapshot.roundState.secretWord = room.roundState.secretWord;
    }
  }

  return snapshot;
}

export function submitGuess(code: string, participantId: string, guessText: string): Room {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room could not be found or joined.", "ROOM_NOT_FOUND");
  }

  if (room.status === "lobby") {
    throw new HttpError(400, "Guesses can only be submitted when the game is in progress", "GAME_NOT_STARTED");
  }

  if (room.status === "result") {
    throw new HttpError(400, "Guesses can only be submitted during active gameplay", "GAME_ALREADY_ENDED");
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    throw new HttpError(400, "Participant not found in room.", "INVALID_REQUEST");
  }

  if (room.roundState && participantId === room.roundState.drawerId) {
    throw new HttpError(400, "The drawer is not permitted to submit guesses", "DRAWER_CANNOT_GUESS");
  }

  const normalizedGuess = guessText.trim();
  const secretWord = room.roundState?.secretWord ?? "";
  const isCorrect = normalizedGuess.toLowerCase() === secretWord.toLowerCase();

  if (isCorrect) {
    const alreadyGuessedCorrectly = room.guessHistory.some(
      (entry) => entry.participantId === participantId && entry.isCorrect
    );
    if (!alreadyGuessedCorrectly) {
      participant.score += 100;
    }

    if (room.status === "in-game") {
      room.status = "result";
      room.correctGuesserId = participantId;
    }
  }

  const guessEntry: GuessEntry = {
    id: randomUUID(),
    participantId,
    playerName: participant.name,
    guessText: normalizedGuess,
    isCorrect,
    createdAt: now()
  };

  room.guessHistory.push(guessEntry);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export type RestartGameResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "room-not-found" | "participant-not-host" | "not-in-result-state" };

export function restartRoom(code: string, participantId: string): RestartGameResult {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, reason: "room-not-found" };
  }

  if (room.status !== "result") {
    return { ok: false, reason: "not-in-result-state" };
  }

  if (room.hostParticipantId !== participantId) {
    return { ok: false, reason: "participant-not-host" };
  }

  // Atomic hard reset
  room.status = "lobby";
  for (const p of room.participants) {
    p.score = 0;
  }
  room.guessHistory = [];
  room.correctGuesserId = null;
  room.roundState = undefined;
  room.updatedAt = now();

  rooms.set(room.code, room);

  return {
    ok: true,
    room: cloneRoom(room)
  };
}

import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot, Round } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

const RATE_LIMIT_CREATE_MAX = 5;
const RATE_LIMIT_JOIN_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

interface RateLimitEntry {
  createAttempts: { timestamp: number }[];
  joinAttempts: { timestamp: number }[];
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function pruneRateLimitEntry(entry: RateLimitEntry, now: number) {
  entry.createAttempts = entry.createAttempts.filter((a) => now - a.timestamp < RATE_LIMIT_WINDOW_MS);
  entry.joinAttempts = entry.joinAttempts.filter((a) => now - a.timestamp < RATE_LIMIT_WINDOW_MS);
}

export function checkCreateRateLimit(key: string): boolean {
  const now = Date.now();
  let entry = rateLimitMap.get(key);
  if (!entry) {
    entry = { createAttempts: [], joinAttempts: [] };
    rateLimitMap.set(key, entry);
  }
  pruneRateLimitEntry(entry, now);
  return entry.createAttempts.length < RATE_LIMIT_CREATE_MAX;
}

export function recordCreateAttempt(key: string) {
  const now = Date.now();
  let entry = rateLimitMap.get(key);
  if (!entry) {
    entry = { createAttempts: [], joinAttempts: [] };
    rateLimitMap.set(key, entry);
  }
  entry.createAttempts.push({ timestamp: now });
}

export function checkJoinRateLimit(key: string): boolean {
  const now = Date.now();
  let entry = rateLimitMap.get(key);
  if (!entry) {
    entry = { createAttempts: [], joinAttempts: [] };
    rateLimitMap.set(key, entry);
  }
  pruneRateLimitEntry(entry, now);
  return entry.joinAttempts.length < RATE_LIMIT_JOIN_MAX;
}

export function recordJoinAttempt(key: string) {
  const now = Date.now();
  let entry = rateLimitMap.get(key);
  if (!entry) {
    entry = { createAttempts: [], joinAttempts: [] };
    rateLimitMap.set(key, entry);
  }
  entry.joinAttempts.push({ timestamp: now });
}

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

function createParticipant(name?: string, isHost = false): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    joinedAt: now(),
    isHost
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName, true);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    currentRound: null,
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

  let resolvedName = displayName(playerName);
  const existingNames = room.participants.map((p) => p.name);
  if (existingNames.includes(resolvedName)) {
    let suffix = 2;
    while (existingNames.includes(`${resolvedName} (${suffix})`)) {
      suffix++;
    }
    resolvedName = `${resolvedName} (${suffix})`;
  }

  const participant = createParticipant(resolvedName);
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

export function getRoomStatus(code: string) {
  const room = rooms.get(code);
  return room ? room.status : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

function namesAreValid(participants: Participant[]): string[] {
  const invalidIds: string[] = [];

  for (const participant of participants) {
    const trimmed = participant.name.trim();
    if (trimmed.length === 0) {
      invalidIds.push(participant.id);
    }
  }

  return invalidIds;
}

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" } as const;
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    return { error: "Participant not found in room" } as const;
  }

  if (!participant.isHost) {
    return { error: "Only the host can start the game" } as const;
  }

  if (room.participants.length < 2) {
    return { error: "At least 2 players are required to start the game" } as const;
  }

  const invalidParticipantIds = namesAreValid(room.participants);

  if (invalidParticipantIds.length > 0) {
    room.status = "awaiting_rename";
    room.updatedAt = now();
    rooms.set(room.code, room);

    return {
      awaitingRename: true as const,
      invalidParticipantIds,
      room: cloneRoom(room)
    };
  }

  const host = room.participants.find((p) => p.isHost)!;
  const round: Round = {
    roundNumber: 1,
    drawerId: host.id,
    word: STARTER_WORDS[0],
    strokes: [],
    guesses: [],
    scores: Object.fromEntries(room.participants.map((p) => [p.id, 0]))
  };

  room.currentRound = round;
  room.status = "playing";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function renameParticipant(roomCode: string, participantId: string, newName: string) {
  const room = rooms.get(roomCode);

  if (!room) {
    return { error: "Room not found" } as const;
  }

  if (room.status !== "awaiting_rename") {
    return { error: "Room is not in awaiting_rename state" } as const;
  }

  const trimmed = newName.trim();
  if (trimmed.length === 0) {
    return { error: "Name cannot be empty or whitespace-only" } as const;
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    return { error: "Participant not found" } as const;
  }

  participant.name = trimmed;
  room.updatedAt = now();

  const remainingInvalid = namesAreValid(room.participants);

  if (remainingInvalid.length === 0) {
    const host = room.participants.find((p) => p.isHost)!;
    const round: Round = {
      roundNumber: 1,
      drawerId: host.id,
      word: STARTER_WORDS[0],
      strokes: [],
      guesses: [],
      scores: Object.fromEntries(room.participants.map((p) => [p.id, 0]))
    };

    room.currentRound = round;
    room.status = "playing";
    rooms.set(room.code, room);

    return { room: cloneRoom(room), autoStarted: true as const };
  }

  rooms.set(room.code, room);
  return {
    awaitingRename: true as const,
    invalidParticipantIds: remainingInvalid,
    room: cloneRoom(room)
  };
}

export function disbandRoom(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" } as const;
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    return { error: "Participant not found" } as const;
  }

  if (!participant.isHost) {
    return { error: "Only the host can disband the room" } as const;
  }

  rooms.delete(code);
  return { disbanded: true as const };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: [],
    roles: [...STARTER_ROLES],
    roundNumber: room.currentRound?.roundNumber ?? null,
    drawerId: room.currentRound?.drawerId ?? null,
    strokes: room.currentRound?.strokes ?? [],
    guesses: room.currentRound?.guesses ?? [],
    scores: room.currentRound?.scores ?? {}
  };

  if (room.currentRound && viewerParticipantId === room.currentRound.drawerId) {
    snapshot.currentWord = room.currentRound.word;
  }

  if (room.status === "awaiting_rename") {
    snapshot.invalidParticipantIds = namesAreValid(room.participants);
  }

  return snapshot;
}

export function updateCanvas(code: string, participantId: string, strokes: import("../models/game.js").Stroke[]) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" } as const;
  }

  if (!room.currentRound) {
    return { error: "No active round" } as const;
  }

  if (room.currentRound.drawerId !== participantId) {
    return { error: "Only the drawer can update the canvas" } as const;
  }

  room.currentRound.strokes.push(...strokes);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

interface ProcessGuessResult {
  guess: import("../models/game.js").Guess;
  scoreAwarded: boolean;
  rejected: boolean;
  reason?: string;
}

function processGuess(
  text: string,
  secretWord: string,
  guesserId: string,
  guesserName: string,
  currentScores: Record<string, number>
): ProcessGuessResult {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { guess: null as unknown as import("../models/game.js").Guess, scoreAwarded: false, rejected: true, reason: "Guess cannot be empty" };
  }

  const isCorrect = trimmed.toLowerCase() === secretWord.toLowerCase();
  const alreadyScored = currentScores[guesserId] !== undefined && currentScores[guesserId] > 0;

  const guess: import("../models/game.js").Guess = {
    participantId: guesserId,
    guesserName,
    text: trimmed,
    isCorrect,
    timestamp: now()
  };

  const scoreAwarded = isCorrect && !alreadyScored;

  return { guess, scoreAwarded, rejected: false };
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" } as const;
  }

  if (!room.currentRound) {
    return { error: "No active round" } as const;
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    return { error: "Participant not found" } as const;
  }

  if (room.currentRound.drawerId === participantId) {
    return { error: "Drawer cannot submit guesses" } as const;
  }

  const result = processGuess(text, room.currentRound.word, participantId, participant.name, room.currentRound.scores);

  if (result.rejected) {
    return { rejected: true as const, reason: result.reason };
  }

  room.currentRound.guesses.push(result.guess);

  if (result.scoreAwarded) {
    room.currentRound.scores[participantId] = (room.currentRound.scores[participantId] ?? 0) + 100;
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room), guess: result.guess, scoreAwarded: result.scoreAwarded };
}

export function clearCanvas(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" } as const;
  }

  if (!room.currentRound) {
    return { error: "No active round" } as const;
  }

  if (room.currentRound.drawerId !== participantId) {
    return { error: "Only the drawer can clear the canvas" } as const;
  }

  room.currentRound.strokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

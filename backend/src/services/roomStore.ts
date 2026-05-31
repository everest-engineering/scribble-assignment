import { randomUUID } from "node:crypto";
import type { GuessEntry, Participant, Point, Room, RoomSnapshot } from "../models/game.js";
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

  if (room.status === "in-progress") {
    return { error: "in-progress" as const };
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

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) return { error: "not-found" as const };
  if (room.hostId !== participantId) return { error: "not-host" as const };
  if (room.participants.length < 2) return { error: "not-enough-players" as const };

  const currentRound = {
    roundNumber: 1,
    drawerId: room.hostId,
    wordIndex: 0,
    guesses: [],
    scores: Object.fromEntries(room.participants.map((p) => [p.id, 0])),
    strokes: [] as Point[][],
  };

  room.status = "in-progress";
  room.currentRound = currentRound;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function submitGuess(code: string, participantId: string, rawText: string) {
  const room = rooms.get(code);
  if (!room) return { error: "not-found" as const };
  if (room.status !== "in-progress" || !room.currentRound) return { error: "not-in-progress" as const };

  const trimmed = rawText.trim();
  if (!trimmed) return { error: "empty-guess" as const };

  const round = room.currentRound;
  if (participantId === round.drawerId) return { error: "drawer-cannot-guess" as const };

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) return { error: "unknown-participant" as const };

  const secretWord = STARTER_WORDS[round.wordIndex];
  const isCorrect = trimmed.toLowerCase() === secretWord.toLowerCase();

  if (isCorrect) {
    round.scores[participantId] = (round.scores[participantId] ?? 0) + 100;
  }

  const entry: GuessEntry = {
    guesserName: participant.name,
    guessText: trimmed,
    isCorrect,
    submittedAt: now(),
  };
  round.guesses.push(entry);

  if (isCorrect) {
    room.status = "finished";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { guess: entry, newScore: round.scores[participantId] ?? 0 };
}

export function saveStroke(code: string, path: Point[]) {
  const room = rooms.get(code);
  if (!room) return { error: "not-found" as const };
  if (room.status !== "in-progress" || !room.currentRound) return { error: "not-in-progress" as const };
  room.currentRound.strokes.push(path);
  room.updatedAt = now();
  rooms.set(room.code, room);
  return { ok: true };
}

export function clearCanvas(code: string) {
  const room = rooms.get(code);
  if (!room) return { error: "not-found" as const };
  if (room.status !== "in-progress" || !room.currentRound) return { error: "not-in-progress" as const };
  room.currentRound.strokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);
  return { ok: true };
}

export function getCanvasStrokes(code: string) {
  const room = rooms.get(code);
  if (!room) return { error: "not-found" as const };
  if (room.status !== "in-progress" || !room.currentRound) return { error: "not-in-progress" as const };
  return { strokes: room.currentRound.strokes };
}

export function getGuesses(code: string) {
  const room = rooms.get(code);
  if (!room) return { error: "not-found" as const };
  if (room.status !== "in-progress" || !room.currentRound) return { error: "not-in-progress" as const };
  return { guesses: room.currentRound.guesses, scores: room.currentRound.scores };
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

export function endRound(code: string, participantId: string) {
  const room = rooms.get(code);
  if (!room) return { error: "not-found" as const };
  if (room.status !== "in-progress") return { error: "not-in-progress" as const };
  if (room.hostId !== participantId) return { error: "not-host" as const };

  room.status = "finished";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code);
  if (!room) return { error: "not-found" as const };
  if (room.hostId !== participantId) return { error: "not-host" as const };
  if (room.status === "lobby") return { room: cloneRoom(room) };

  room.currentRound = undefined;
  room.status = "lobby";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  if (room.status === "finished" && room.currentRound) {
    const round = room.currentRound;
    snapshot.currentDrawerId = round.drawerId;
    snapshot.secretWord = STARTER_WORDS[round.wordIndex];
    const result = {
      revealedWord: STARTER_WORDS[round.wordIndex],
      scores: { ...round.scores },
      guesses: round.guesses.map((g) => ({ ...g })),
    };
    snapshot.result = result;
  } else if (room.currentRound) {
    snapshot.currentDrawerId = room.currentRound.drawerId;
    if (viewerParticipantId === room.currentRound.drawerId) {
      snapshot.secretWord = STARTER_WORDS[room.currentRound.wordIndex];
    }
  }

  return snapshot;
}

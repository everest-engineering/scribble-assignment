import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot, Stroke } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { HttpError } from "../api/schemas.js";

const words = [...STARTER_WORDS];

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

function createParticipant(name: string, isHost = false): Participant {
  return {
    id: randomUUID(),
    name,
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

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName, true);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    currentRound: 0,
    currentDrawerId: "",
    secretWord: null,
    scores: {},
    guesses: [],
    canvasStrokes: [],
    correctGuessersInRound: [],
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName: string) {
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

export function selectWord(round: number): string {
  return words[(round - 1) % words.length];
}

export function startGame(code: string, requesterId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false as const, error: new HttpError(404, "Room not found") };
  }

  if (room.status !== "lobby") {
    return { ok: false as const, error: new HttpError(400, "Game has already started") };
  }

  if (room.hostId !== requesterId) {
    return { ok: false as const, error: new HttpError(403, "Only the host can start the game") };
  }

  if (room.participants.length < 2) {
    return { ok: false as const, error: new HttpError(400, "Need at least 2 players to start") };
  }

  const secretWord = selectWord(1);
  room.status = "drawing";
  room.currentRound = 1;
  room.currentDrawerId = room.hostId;
  room.secretWord = secretWord;
  room.canvasStrokes = [];
  room.guesses = [];
  room.correctGuessersInRound = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true as const, room: cloneRoom(room) };
}

export function submitGuess(
  code: string,
  participantId: string,
  guessText: string
): { ok: true; room: Room; message?: string } | { ok: false; error: HttpError } {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: new HttpError(404, "Room not found") };
  }

  if (room.status !== "drawing") {
    return { ok: false, error: new HttpError(400, "Game is not in progress") };
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    return { ok: false, error: new HttpError(404, "Participant not found") };
  }

  if (participant.id === room.currentDrawerId) {
    return { ok: false, error: new HttpError(400, "The drawer cannot submit guesses") };
  }

  if (room.correctGuessersInRound.includes(participantId)) {
    return { ok: false, error: new HttpError(400, "You already guessed correctly!") };
  }

  if (!guessText || !guessText.trim()) {
    return { ok: false, error: new HttpError(400, "Guess cannot be empty") };
  }

  const trimmed = guessText.trim();
  const isCorrect = trimmed.toLowerCase() === (room.secretWord ?? "").toLowerCase();

  const isFirstCorrect = isCorrect && room.correctGuessersInRound.length === 0;

  const pointsAwarded = isFirstCorrect ? 100 : 0;

  const guess: Guess = {
    participantId,
    participantName: participant.name,
    text: trimmed,
    isCorrect,
    pointsAwarded,
    timestamp: now()
  };

  room.guesses.push(guess);

  if (isCorrect) {
    room.correctGuessersInRound.push(participantId);

    if (isFirstCorrect) {
      const currentScore = room.scores[participantId] ?? 0;
      room.scores[participantId] = currentScore + 100;
    }
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  const message = isCorrect && !isFirstCorrect
    ? "Already guessed! 0 points added."
    : undefined;

  return { ok: true, room: cloneRoom(room), message };
}

export function addCanvasStroke(
  code: string,
  participantId: string,
  stroke: Stroke
): { ok: true; room: Room } | { ok: false; error: HttpError } {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: new HttpError(404, "Room not found") };
  }

  if (room.status === "result") {
    return { ok: false, error: new HttpError(400, "Game has ended") };
  }

  if (participantId !== room.currentDrawerId) {
    return { ok: false, error: new HttpError(403, "Only the drawer can draw") };
  }

  room.canvasStrokes.push(stroke);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function clearCanvas(
  code: string,
  participantId: string
): { ok: true; room: Room } | { ok: false; error: HttpError } {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: new HttpError(404, "Room not found") };
  }

  if (room.status === "result") {
    return { ok: false, error: new HttpError(400, "Game has ended") };
  }

  if (participantId !== room.currentDrawerId) {
    return { ok: false, error: new HttpError(403, "Only the drawer can clear the canvas") };
  }

  room.canvasStrokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function nextWord(
  code: string,
  participantId: string
): { ok: true; room: Room } | { ok: false; error: HttpError } {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: new HttpError(404, "Room not found") };
  }

  if (room.status === "result") {
    return { ok: false, error: new HttpError(400, "Game has ended") };
  }

  if (participantId !== room.currentDrawerId) {
    return { ok: false, error: new HttpError(403, "Only the drawer can skip to the next word") };
  }

  room.currentRound += 1;
  room.secretWord = selectWord(room.currentRound);
  room.canvasStrokes = [];
  room.guesses = [];
  room.correctGuessersInRound = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function endGame(
  code: string,
  requesterId: string
): { ok: true; room: Room } | { ok: false; error: HttpError } {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: new HttpError(404, "Room not found") };
  }

  if (room.status !== "drawing") {
    return { ok: false, error: new HttpError(400, "Game is not in progress") };
  }

  if (requesterId !== room.currentDrawerId) {
    return { ok: false, error: new HttpError(403, "Only the drawer can end the game") };
  }

  room.status = "result";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function restartGame(
  code: string,
  requesterId: string
): { ok: true; room: Room } | { ok: false; error: HttpError } {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: new HttpError(404, "Room not found") };
  }

  if (room.status !== "result") {
    return { ok: false, error: new HttpError(400, "Game is not in result state") };
  }

  if (requesterId !== room.hostId) {
    return { ok: false, error: new HttpError(403, "Only the host can restart the game") };
  }

  room.status = "lobby";
  room.currentRound = 0;
  room.currentDrawerId = "";
  room.secretWord = null;
  room.scores = {};
  room.guesses = [];
  room.canvasStrokes = [];
  room.correctGuessersInRound = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    currentRound: room.currentRound,
    currentDrawerId: room.currentDrawerId,
    secretWord: room.status === "result" || viewerParticipantId === room.currentDrawerId ? room.secretWord : null,
    scores: { ...room.scores },
    guesses: room.guesses.map((g) => ({ ...g })),
    canvasStrokes: room.canvasStrokes.map((s) => ({ ...s, points: [...s.points] }))
  };
}

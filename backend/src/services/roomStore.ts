import { randomUUID } from "node:crypto";
import type { Guess, Participant, ParticipantRole, Room, RoomSnapshot, RoomStatus, Stroke } from "../models/game.js";
import { STARTER_WORDS } from "../seed/starterData.js";

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
    currentDrawerId: null,
    roundNumber: 0,
    scores: {},
    guesses: [],
    correctGuessers: [],
    canvasStrokes: [],
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

function disambiguateName(name: string, existingNames: string[]) {
  if (!existingNames.includes(name)) {
    return name;
  }

  let suffix = 2;
  while (existingNames.includes(`${name} (${suffix})`)) {
    suffix++;
  }

  return `${name} (${suffix})`;
}

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const participant = createParticipant(playerName);
  participant.name = disambiguateName(
    participant.name,
    room.participants.map((p) => p.name)
  );
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

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false as const, error: 404 };
  }

  if (room.hostId !== participantId) {
    return { ok: false as const, error: 403 };
  }

  if (room.participants.length < 2) {
    return { ok: false as const, error: 400 };
  }

  room.currentDrawerId = room.hostId;
  room.roundNumber = 1;
  room.status = "playing";
  room.scores = {};
  room.guesses = [];
  room.correctGuessers = [];
  room.canvasStrokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true as const, room: cloneRoom(room) };
}

export function endRound(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false as const, error: 404 };
  }

  if (room.status === "result") {
    return { ok: true as const, room: cloneRoom(room) };
  }

  if (room.status !== "playing") {
    return { ok: false as const, error: 400 };
  }

  if (room.currentDrawerId !== participantId) {
    return { ok: false as const, error: 403 };
  }

  room.status = "result";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true as const, room: cloneRoom(room) };
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false as const, error: 404 };
  }

  if (room.hostId !== participantId) {
    return { ok: false as const, error: 403 };
  }

  if (room.status !== "result") {
    return { ok: false as const, error: 400 };
  }

  room.status = "lobby";
  room.currentDrawerId = null;
  room.roundNumber = 0;
  room.guesses = [];
  room.correctGuessers = [];
  room.canvasStrokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true as const, room: cloneRoom(room) };
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

interface SubmitGuessResult {
  result: "correct" | "incorrect" | "error";
  guess: Guess;
  scores: Record<string, number>;
  guesses: Guess[];
  roomStatus: RoomStatus;
  error?: string;
}

export function submitGuess(code: string, participantId: string, text: string): SubmitGuessResult | null {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.status !== "playing") {
    return { result: "error", error: "Round is not active", guess: {} as Guess, scores: {}, guesses: [], roomStatus: room.status };
  }

  if (room.currentDrawerId === participantId) {
    return { result: "error", error: "Drawer cannot submit guesses", guess: {} as Guess, scores: {}, guesses: [], roomStatus: room.status };
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    return null;
  }

  const secretWord = getSecretWord(room);
  if (!secretWord) {
    return { result: "error", error: "No secret word set for this round", guess: {} as Guess, scores: {}, guesses: [], roomStatus: room.status };
  }

  const trimmedText = text.trim();
  const isCorrect = trimmedText.toLowerCase() === secretWord.toLowerCase();
  const alreadyCorrect = room.correctGuessers.includes(participantId);

  const guess: Guess = {
    participantId,
    participantName: participant.name,
    text: trimmedText,
    isCorrect,
    timestamp: now()
  };

  room.guesses.push(guess);

  let result: "correct" | "incorrect" = "incorrect";
  if (isCorrect && !alreadyCorrect) {
    room.scores[participantId] = (room.scores[participantId] ?? 0) + 100;
    room.correctGuessers.push(participantId);
    result = "correct";
  }

  const nonDrawerParticipants = room.participants.filter((p) => p.id !== room.currentDrawerId);
  const allCorrect = nonDrawerParticipants.length > 0 && nonDrawerParticipants.every((p) => room.correctGuessers.includes(p.id));
  if (allCorrect) {
    room.status = "result";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    result,
    guess,
    scores: { ...room.scores },
    guesses: [...room.guesses],
    roomStatus: room.status
  };
}

export function getCanvasState(code: string): Stroke[] | null {
  const room = rooms.get(code);
  if (!room) return null;
  return room.canvasStrokes;
}

export function saveCanvasState(code: string, participantId: string, strokes: Stroke[]): boolean {
  const room = rooms.get(code);
  if (!room) return false;
  if (room.currentDrawerId !== participantId) return false;

  room.canvasStrokes = strokes;
  room.updatedAt = now();
  rooms.set(room.code, room);
  return true;
}

export function clearCanvasState(code: string, participantId: string): boolean {
  const room = rooms.get(code);
  if (!room) return false;
  if (room.currentDrawerId !== participantId) return false;

  room.canvasStrokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);
  return true;
}

export function getGuesses(code: string): Guess[] | null {
  const room = rooms.get(code);
  if (!room) return null;
  return [...room.guesses];
}

function computeRoles(room: Room): ParticipantRole[] {
  if (!room.currentDrawerId) {
    return [];
  }
  return room.participants.map((p) => (p.id === room.currentDrawerId ? "drawer" : "guesser"));
}

function getSecretWord(room: Room): string | null {
  if ((room.status !== "playing" && room.status !== "result") || room.roundNumber < 1) {
    return null;
  }
  return STARTER_WORDS[room.roundNumber - 1] ?? null;
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const secretWord = getSecretWord(room);
  const isViewerDrawer =
    room.status === "playing" &&
    room.currentDrawerId !== null &&
    viewerParticipantId === room.currentDrawerId;
  const showSecretWord = isViewerDrawer || room.status === "result";

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: computeRoles(room),
    currentDrawerId: room.currentDrawerId,
    roundNumber: room.roundNumber,
    secretWord: showSecretWord ? secretWord : null,
    scores: { ...room.scores },
    guesses: [...room.guesses]
  };
}

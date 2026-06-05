import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot, Stroke } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

// Monotonic counter used for deterministic word selection (no Math.random()).
let roomCreationCount = 0;

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
  roomCreationCount += 1;
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    wordIndex: (roomCreationCount - 1) % STARTER_WORDS.length,
    participants: [participant],
    strokes: [],
    guesses: [],
    scores: { [participant.id]: 0 },
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
  room.scores[participant.id] = 0;
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

export type StartGameError = "not-found" | "not-host" | "not-enough-players";

export function startGame(
  code: string,
  requesterId: string
): { room: Room } | { error: StartGameError } {
  const room = rooms.get(code);

  if (!room) {
    return { error: "not-found" };
  }

  if (room.hostId !== requesterId) {
    return { error: "not-host" };
  }

  // Re-starting an already-playing room is a no-op: keep the drawer and word.
  if (room.status === "playing") {
    return { room: cloneRoom(room) };
  }

  if (room.participants.length < 2) {
    return { error: "not-enough-players" };
  }

  room.status = "playing";
  room.drawerId = room.hostId;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

const CORRECT_GUESS_SCORE = 100;

export type DrawError = "not-found" | "not-drawer";
export type GuessError =
  | "not-found"
  | "is-drawer"
  | "unknown-participant"
  | "empty"
  | "finished";

export function addStroke(
  code: string,
  requesterId: string,
  stroke: Stroke
): { room: Room } | { error: DrawError } {
  const room = rooms.get(code);

  if (!room) {
    return { error: "not-found" };
  }

  if (room.drawerId !== requesterId) {
    return { error: "not-drawer" };
  }

  room.strokes.push(stroke.map((point) => ({ ...point })));
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function clearCanvas(
  code: string,
  requesterId: string
): { room: Room } | { error: DrawError } {
  const room = rooms.get(code);

  if (!room) {
    return { error: "not-found" };
  }

  if (room.drawerId !== requesterId) {
    return { error: "not-drawer" };
  }

  room.strokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function submitGuess(
  code: string,
  requesterId: string,
  rawText: string
): { room: Room; correct: boolean } | { error: GuessError } {
  const room = rooms.get(code);

  if (!room) {
    return { error: "not-found" };
  }

  if (room.status === "finished") {
    return { error: "finished" };
  }

  if (room.drawerId === requesterId) {
    return { error: "is-drawer" };
  }

  const participant = room.participants.find((person) => person.id === requesterId);

  if (!participant) {
    return { error: "unknown-participant" };
  }

  const text = rawText.trim();

  if (!text) {
    return { error: "empty" };
  }

  const secretWord = STARTER_WORDS[room.wordIndex];
  const correct = text.toLowerCase() === secretWord.toLowerCase();

  if (correct) {
    // A correct guess is worth a fixed 100 points, awarded once for the round,
    // and ends the single round.
    room.scores[requesterId] = CORRECT_GUESS_SCORE;
    room.status = "finished";
  }

  room.guesses.push({
    participantId: requesterId,
    name: participant.name,
    text,
    correct,
    at: now()
  });
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room), correct };
}

export type RestartError = "not-found" | "not-host";

export function restartGame(
  code: string,
  requesterId: string
): { room: Room } | { error: RestartError } {
  const room = rooms.get(code);

  if (!room) {
    return { error: "not-found" };
  }

  if (room.hostId !== requesterId) {
    return { error: "not-host" };
  }

  // Reset all round state but keep the participants. Advance the deterministic
  // word so a replay is not identical (still index-based, no randomness).
  room.status = "lobby";
  room.drawerId = undefined;
  room.strokes = [];
  room.guesses = [];
  room.wordIndex = (room.wordIndex + 1) % STARTER_WORDS.length;
  for (const participant of room.participants) {
    room.scores[participant.id] = 0;
  }
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = room.status === "playing" && viewerParticipantId === room.drawerId;
  // The word is revealed to the drawer while playing, and to everyone once the
  // round is finished (the secret is now public). It is omitted otherwise.
  const revealWord = isDrawer || room.status === "finished";

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    drawerId: room.drawerId,
    word: revealWord ? STARTER_WORDS[room.wordIndex] : undefined,
    participants: room.participants.map((participant) => ({ ...participant })),
    strokes: room.strokes.map((stroke) => stroke.map((point) => ({ ...point }))),
    guesses: room.guesses.map((guess) => ({ ...guess })),
    scores: { ...room.scores },
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}

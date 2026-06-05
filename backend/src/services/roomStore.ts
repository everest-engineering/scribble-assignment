import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
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
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    round: null,
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

export function submitGuess(code: string, participantId: string, text: string): RoomActionResult {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, status: 404, message: "Unable to load room" };
  }

  if (room.status !== "active" || !room.round) {
    return { ok: false, status: 400, message: "There is no active round" };
  }

  const player = room.participants.find((participant) => participant.id === participantId);

  if (!player) {
    return { ok: false, status: 403, message: "You are not in this room" };
  }

  const trimmed = text.trim();

  if (!trimmed) {
    return { ok: false, status: 400, message: "Guess cannot be empty" };
  }

  const correct = trimmed.toLowerCase() === room.round.word.toLowerCase();
  const guess: Guess = {
    id: randomUUID(),
    participantId,
    playerName: player.name,
    text: trimmed,
    correct,
    createdAt: now()
  };

  room.round.guesses.push(guess);

  if (correct) {
    player.score += 100;
    room.round.status = "result";
    room.status = "result";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function restartGame(code: string, participantId: string): RoomActionResult {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, status: 404, message: "Unable to load room" };
  }

  if (room.hostId !== participantId) {
    return { ok: false, status: 403, message: "Only the host can restart the game" };
  }

  room.status = "lobby";
  room.round = null;
  room.participants.forEach((participant) => {
    participant.score = 0;
  });
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export type RoomActionResult =
  | { ok: true; room: Room }
  | { ok: false; status: number; message: string };

export function startRound(code: string, participantId: string): RoomActionResult {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, status: 404, message: "Unable to load room" };
  }

  if (room.hostId !== participantId) {
    return { ok: false, status: 403, message: "Only the host can start the game" };
  }

  if (room.participants.length < 2) {
    return { ok: false, status: 400, message: "At least 2 players are needed to start" };
  }

  // Deterministic word selection from the seeded list (no randomness).
  const word = STARTER_WORDS[0];

  room.status = "active";
  room.round = {
    drawerId: room.hostId,
    word,
    guesses: [],
    status: "active"
  };
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const round = room.round;
  const isDrawer = Boolean(round) && viewerParticipantId === round?.drawerId;
  // The word is private to the drawer while the round is active, and revealed to everyone
  // once the round ends (result state).
  const revealWord = isDrawer || room.status === "result";

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    drawerId: round?.drawerId ?? null,
    word: revealWord ? (round?.word ?? null) : null,
    hasWord: Boolean(round?.word),
    guesses: round ? round.guesses.map((guess) => ({ ...guess })) : [],
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}

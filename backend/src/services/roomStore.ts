import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
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

function createParticipant(name: string): Participant {
  return {
    id: randomUUID(),
    name: name.trim(),
    joinedAt: now(),
    score: 0
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

function updateRoomStatus(room: Room, status: Room["status"]) {
  room.status = status;
  room.updatedAt = now();
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    hostId: participant.id,
    drawerId: "",
    secretWord: "",
    guesses: [],
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
  const trimmedCode = code.trim();
  const room = rooms.get(trimmedCode);

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

export function startGame(code: string, requesterId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false as const, status: 404 as const, message: "Room not found" };
  }

  if (room.hostId !== requesterId) {
    return { ok: false as const, status: 403 as const, message: "Only the host can start the game" };
  }

  if (room.participants.length < 2) {
    return { ok: false as const, status: 400 as const, message: "At least 2 players are required to start" };
  }

  room.drawerId = room.hostId;
  room.secretWord = STARTER_WORDS[0];
  room.guesses = [];
  room.participants.forEach((p) => { p.score = 0; });
  updateRoomStatus(room, "playing");

  return {
    ok: true as const,
    room: cloneRoom(room)
  };
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false as const, status: 404 as const, message: "Room not found" };
  }

  if (room.status !== "playing") {
    return { ok: false as const, status: 400 as const, message: "Game is not in progress" };
  }

  const guesser = room.participants.find((p) => p.id === participantId);

  if (!guesser) {
    return { ok: false as const, status: 404 as const, message: "Participant not found" };
  }

  if (guesser.id === room.drawerId) {
    return { ok: false as const, status: 403 as const, message: "Only guessers can submit guesses" };
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { ok: false as const, status: 400 as const, message: "Guess cannot be empty" };
  }

  const isCorrect = trimmed.toLowerCase() === room.secretWord.toLowerCase();

  const guess: Guess = {
    id: randomUUID(),
    participantId: guesser.id,
    text: trimmed,
    isCorrect,
    timestamp: now()
  };

  if (isCorrect) {
    guesser.score += 100;
  }

  room.guesses.push(guess);
  room.updatedAt = now();

  return {
    ok: true as const,
    room: cloneRoom(room)
  };
}

export function endRound(code: string, requesterId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false as const, status: 404 as const, message: "Room not found" };
  }

  if (room.status !== "playing") {
    return { ok: false as const, status: 400 as const, message: "Round is not in progress" };
  }

  if (room.hostId !== requesterId) {
    return { ok: false as const, status: 403 as const, message: "Only the host can end the round" };
  }

  updateRoomStatus(room, "result");

  return {
    ok: true as const,
    room: cloneRoom(room)
  };
}

export function restartGame(code: string, requesterId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false as const, status: 404 as const, message: "Room not found" };
  }

  if (room.status !== "result") {
    return { ok: false as const, status: 400 as const, message: "Game is not in result state" };
  }

  if (room.hostId !== requesterId) {
    return { ok: false as const, status: 403 as const, message: "Only the host can restart the game" };
  }

  room.secretWord = "";
  room.guesses = [];
  room.drawerId = "";
  room.participants.forEach((p) => { p.score = 0; });
  updateRoomStatus(room, "lobby");

  return {
    ok: true as const,
    room: cloneRoom(room)
  };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = room.drawerId !== "" && viewerParticipantId === room.drawerId;
  const showSecret = isDrawer || room.status === "result";

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    hostId: room.hostId,
    drawerId: room.drawerId,
    guesses: room.guesses.map((guess) => ({ ...guess })),
    ...(showSecret ? { secretWord: room.secretWord } : {})
  };
}

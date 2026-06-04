import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot, Guess } from "../models/game.js";
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

function cloneRoom(room: Room): Room {
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
    hostId: participant.id,
    participants: [participant],
    drawerId: null,
    secretWord: null,
    canvasData: "[]",
    guesses: [],
    scores: {
      [participant.id]: 0
    },
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
  room.scores[participant.id] = 0;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

function getDeterministicWord(code: string): string {
  let sum = 0;
  for (let i = 0; i < code.length; i++) {
    sum += code.charCodeAt(i);
  }
  return STARTER_WORDS[sum % STARTER_WORDS.length];
}

export function startGame(code: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.participants.length < 2) {
    throw new Error("Cannot start game with fewer than 2 players");
  }

  room.status = "playing";
  room.drawerId = room.hostId;
  room.secretWord = getDeterministicWord(room.code);
  room.canvasData = "[]";
  room.guesses = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function submitDraw(code: string, canvasData: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  room.canvasData = canvasData;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.status !== "playing") {
    throw new Error("Cannot submit guess when game is not playing");
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    throw new Error("Participant not found in room");
  }

  const cleanText = text.trim();
  if (cleanText.length === 0) {
    throw new Error("Guess text cannot be empty");
  }

  const isCorrect = cleanText.toLowerCase() === (room.secretWord || "").toLowerCase();

  const guess: Guess = {
    participantId,
    participantName: participant.name,
    text: cleanText,
    isCorrect,
    timestamp: now()
  };

  room.guesses.push(guess);

  if (isCorrect) {
    room.status = "result";
    room.scores[participantId] = (room.scores[participantId] || 0) + 100;
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function restartRoom(code: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  room.status = "lobby";
  room.drawerId = null;
  room.secretWord = null;
  room.canvasData = "[]";
  room.guesses = [];
  room.scores = {};
  room.participants.forEach((p) => {
    room.scores[p.id] = 0;
  });
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
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

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const viewerRole = (room.status !== "lobby" && viewerParticipantId)
    ? (viewerParticipantId === room.drawerId ? "drawer" : "guesser")
    : null;

  const secretWord = (room.status === "playing" && viewerRole !== "drawer")
    ? null
    : room.secretWord;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    drawerId: room.drawerId,
    secretWord,
    canvasData: room.canvasData,
    guesses: room.guesses.map((guess) => ({ ...guess })),
    scores: { ...room.scores },
    viewerRole
  };
}

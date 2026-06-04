import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

function selectWord(code: string): string {
  let hash = 0;
  for (let index = 0; index < code.length; index += 1) {
    hash += code.charCodeAt(index);
  }
  return STARTER_WORDS[hash % STARTER_WORDS.length];
}

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

function createParticipant(name: string, isHost: boolean, isDrawer = false): Participant {
  return {
    id: randomUUID(),
    name,
    joinedAt: now(),
    isHost,
    isDrawer,
    score: 0
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
    participants: [participant],
    createdAt: now(),
    updatedAt: now(),
    word: null,
    drawingData: null,
    guesses: []
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

  const participant = createParticipant(playerName, false);
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

  if (!room) {
    return null;
  }

  const participant = room.participants.find((p) => p.id === participantId);

  if (!participant || !participant.isHost) {
    return null;
  }

  if (room.participants.length < 2) {
    return null;
  }

  const word = selectWord(room.code);
  room.participants[0].isDrawer = true;
  room.word = word;
  room.drawingData = null;
  room.guesses = [];
  room.participants.forEach((p) => { p.score = 0; p.isDrawer = false; });
  room.participants[0].isDrawer = true;
  room.status = "playing";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function saveDrawing(code: string, participantId: string, drawingData: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const participant = room.participants.find((p) => p.id === participantId);

  if (!participant || !participant.isDrawer) {
    return null;
  }

  room.drawingData = drawingData;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);

  if (!room || room.status !== "playing") {
    return null;
  }

  const participant = room.participants.find((p) => p.id === participantId);

  if (!participant || participant.isDrawer) {
    return null;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const correct = room.word !== null && trimmed.toLowerCase() === room.word.toLowerCase();
  const guess: Guess = {
    participantId,
    participantName: participant.name,
    text: trimmed,
    correct,
    timestamp: now()
  };

  room.guesses.push(guess);

  if (correct) {
    participant.score += 100;
    room.status = "finished";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room || room.status !== "finished") {
    return null;
  }

  const participant = room.participants.find((p) => p.id === participantId);

  if (!participant || !participant.isHost) {
    return null;
  }

  room.status = "lobby";
  room.word = null;
  room.drawingData = null;
  room.guesses = [];
  room.participants.forEach((p) => {
    p.score = 0;
    p.isDrawer = false;
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
  const viewer = room.participants.find((p) => p.id === viewerParticipantId);
  const isViewerDrawer = viewer?.isDrawer ?? false;

  const showWord = isViewerDrawer || room.status === "finished";

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    canStart: room.status === "lobby" && room.participants.length >= 2,
    word: showWord ? room.word : null,
    drawingData: room.drawingData,
    guesses: [...room.guesses]
  };
}

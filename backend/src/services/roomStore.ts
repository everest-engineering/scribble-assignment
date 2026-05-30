import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
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

function createParticipant(name?: string, isHost = false): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    joinedAt: now(),
    isHost, 
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
  const participant = createParticipant(playerName, true);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    createdAt: now(),
    updatedAt: now(),
    guesses: [],
    canvasLines: [],
    round: 1,
    wordIndex: 0,
    drawerIndex: 0,
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

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function startGame(code: string, participantId?: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.hostId !== participantId) {
    throw new Error("Only the host can start the game");
  }

  if (room.participants.length < 2) {
    throw new Error("At least 2 players are required");
  }

  const drawer = room.participants[0];

  room.status = "playing";
  room.currentDrawerId = drawer.id;

  room.currentWord = STARTER_WORDS[0];

  room.participants = room.participants.map((participant) => ({
    ...participant,
    role: participant.id === drawer.id ? "drawer" : "guesser"
  }));

  room.updatedAt = now();

  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function submitGuess(
  code: string,
  participantId: string,
  message: string
) {
  const room = rooms.get(code);

  if (!room || room.status !== "playing") {
    return null;
  }

  const participant = room.participants.find(
    (player) => player.id === participantId
  );

  if (!participant) {
    return null;
  }

  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    throw new Error("Guess cannot be empty");
  }

  const isCorrect =
    trimmedMessage.toLowerCase() ===
    room.currentWord?.toLowerCase();

  const guess = {
    id: randomUUID(),
    participantId,
    playerName: participant.name,
    message: trimmedMessage,
    isCorrect,
    createdAt: now()
  };

  room.guesses.push(guess);

  if (isCorrect) {
    participant.score += 100;
  }

  room.updatedAt = now();

  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function saveCanvas(
  code: string,
  participantId: string,
  lines: string[]
) {
  const room = rooms.get(code);

  if (!room || room.status !== "playing") {
    return null;
  }

  if (room.currentDrawerId !== participantId) {
    throw new Error("Only drawer can draw");
  }

  room.canvasLines = lines;

  room.updatedAt = now();

  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function restartGame(code: string, participantId?: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.hostId !== participantId) {
    throw new Error("Only the host can restart the game");
  }

  // Reset round state
  room.status = "lobby";
  room.round += 1;
  room.guesses = [];
  room.canvasLines = [];
  room.currentDrawerId = undefined;
  room.currentWord = undefined;

  // Reset participant state (preserve list but clear roles/scores)
  room.participants = room.participants.map((p) => ({
    ...p,
    role: undefined,
    score: 0
  }));

  room.updatedAt = now();

  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  void viewerParticipantId;

  return {
    code: room.code,
    status: room.status,
    round: room.round,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    currentDrawerId: room.currentDrawerId,
    currentWord:
      viewerParticipantId === room.currentDrawerId
        ? room.currentWord
        : undefined,  
    guesses: room.guesses,
    canvasLines: room.canvasLines,
  };
}

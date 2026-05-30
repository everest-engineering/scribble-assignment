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

function createParticipant(name: string): Participant {
  return {
    id: randomUUID(),
    name,
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    hostId: participant.id,
    drawerId: null,
    secretWord: null,
    guesses: [],
    scores: {},
    status: "lobby",
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

export function startRoom(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (participantId !== room.hostId) {
    throw new Error("Only the host can start the game");
  }

  if (room.participants.length < 2) {
    throw new Error("Need at least 2 players to start");
  }

  return saveRoom({
    ...room,
    status: "game",
    drawerId: room.hostId,
    secretWord: STARTER_WORDS[0],
    guesses: [],
    scores: Object.fromEntries(room.participants.map((p) => [p.id, 0]))
  });
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.status !== "game") {
    throw new Error("Game is not active");
  }

  if (participantId === room.drawerId) {
    throw new Error("Drawer cannot submit guesses");
  }

  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error("Guess cannot be empty");
  }

  const participant = room.participants.find((p) => p.id === participantId);

  if (!participant) {
    throw new Error("Participant not found");
  }

  const isCorrect = trimmed.toLowerCase() === (room.secretWord ?? "").toLowerCase();
  const guess: Guess = {
    id: randomUUID(),
    participantId,
    participantName: participant.name,
    text: trimmed,
    isCorrect,
    submittedAt: now()
  };

  const pointsEarned = isCorrect ? 100 : 0;
  const currentScore = room.scores[participantId] ?? 0;

  return saveRoom({
    ...room,
    guesses: [...room.guesses, guess],
    scores: { ...room.scores, [participantId]: currentScore + pointsEarned },
    ...(isCorrect ? { status: "result" as const } : {})
  });
}

export function restartRoom(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) return null;

  if (participantId !== room.hostId) {
    throw new Error("Only the host can restart");
  }

  return saveRoom({
    ...room,
    status: "lobby",
    drawerId: null,
    secretWord: null,
    guesses: [],
    scores: {}
  });
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer =
    viewerParticipantId !== undefined && viewerParticipantId === room.drawerId;
  const revealWord = (isDrawer || room.status === "result") && room.secretWord != null;

  return {
    code: room.code,
    hostId: room.hostId,
    drawerId: room.drawerId,
    ...(revealWord ? { secretWord: room.secretWord! } : {}),
    guesses: room.guesses.map((g) => ({ ...g })),
    scores: { ...room.scores },
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}

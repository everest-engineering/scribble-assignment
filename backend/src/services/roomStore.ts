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
    participants: [participant],
    hostId: participant.id,
    drawerParticipantId: null,
    currentWord: null,
    guesses: [],
    scores: {},
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

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { code: "NOT_FOUND" } as const;
  }

  if (participantId !== room.hostId) {
    return { code: "FORBIDDEN" } as const;
  }

  if (room.status === "playing") {
    return { code: "CONFLICT" } as const;
  }

  if (room.participants.length < 2) {
    return { code: "BAD_REQUEST" } as const;
  }

  room.status = "playing";
  room.drawerParticipantId = room.participants[0].id;
  room.currentWord = STARTER_WORDS[0];
  room.scores = Object.fromEntries(room.participants.map((p) => [p.id, 0]));
  saveRoom(room);

  return { code: "OK", room: cloneRoom(room) } as const;
}

export function submitGuess(code: string, participantId: string, guessText: string) {
  const room = rooms.get(code);

  if (!room) {
    return { code: "NOT_FOUND" } as const;
  }

  if (room.status !== "playing") {
    return { code: "BAD_REQUEST", message: "Game is not active" } as const;
  }

  if (participantId === room.drawerParticipantId) {
    return { code: "FORBIDDEN", message: "Drawer cannot guess" } as const;
  }

  const trimmed = guessText.trim();
  if (trimmed.length === 0) {
    return { code: "BAD_REQUEST", message: "Guess cannot be empty" } as const;
  }

  const alreadyCorrect = room.guesses.some((g) => g.participantId === participantId && g.correct);
  if (alreadyCorrect) {
    return { code: "BAD_REQUEST", message: "You have already guessed correctly" } as const;
  }

  const correct = trimmed.toLowerCase() === (room.currentWord ?? "").toLowerCase();
  const score = correct ? 100 : 0;
  const participantName = room.participants.find((p) => p.id === participantId)?.name ?? "Unknown";

  const guessRecord: Guess = { participantId, participantName, guess: trimmed, score, correct };
  room.guesses.push(guessRecord);
  room.scores[participantId] = (room.scores[participantId] ?? 0) + score;
  saveRoom(room);

  return { code: "OK", room: cloneRoom(room) } as const;
}

export function endGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { code: "NOT_FOUND" } as const;
  }

  if (participantId !== room.hostId) {
    return { code: "FORBIDDEN" } as const;
  }

  if (room.status !== "playing") {
    return { code: "CONFLICT" } as const;
  }

  room.status = "results";
  saveRoom(room);

  return { code: "OK", room: cloneRoom(room) } as const;
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { code: "NOT_FOUND" } as const;
  }

  if (participantId !== room.hostId) {
    return { code: "FORBIDDEN" } as const;
  }

  if (room.status !== "results") {
    return { code: "CONFLICT" } as const;
  }

  room.status = "lobby";
  room.drawerParticipantId = null;
  room.currentWord = null;
  room.guesses = [];
  room.scores = {};
  saveRoom(room);

  return { code: "OK", room: cloneRoom(room) } as const;
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer =
    room.drawerParticipantId !== null && viewerParticipantId === room.drawerParticipantId;
  const showWord = isDrawer || room.status === "results";

  const viewerRole: import("../models/game.js").ParticipantRole | null = viewerParticipantId
    ? isDrawer
      ? "drawer"
      : "guesser"
    : null;

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    hostId: room.hostId,
    drawerParticipantId: room.drawerParticipantId,
    currentWord: showWord ? room.currentWord : null,
    viewerRole,
    guesses: room.guesses.map((g) => ({ ...g })),
    scores: { ...room.scores }
  };
}

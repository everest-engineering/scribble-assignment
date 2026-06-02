import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot, Round } from "../models/game.js";
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
    score: 0,
    role: undefined
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
    guesses: [],
    strokes: [],
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

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  if (room.round) {
    // Include the secretWord for the drawer, and also reveal it
    // to all viewers once the round has finished (results phase).
    if (room.round.status === "finished") {
      snapshot.round = { ...room.round };
    } else if (viewerParticipantId && room.round.drawerId === viewerParticipantId) {
      snapshot.round = { ...room.round };
    } else {
      const { secretWord, ...rest } = room.round as any;
      snapshot.round = { ...rest };
    }

    snapshot.guesses = room.guesses.map((g) => ({ ...g }));
    snapshot.strokes = room.strokes.map((s) => ({ ...s }));
  }

  return snapshot;
}

export function startRound(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.status !== "lobby") {
    throw new Error("Room must be in lobby to start");
  }

  if (room.hostId !== participantId) {
    const err: any = new Error("Only the host can start the game");
    err.statusCode = 403;
    throw err;
  }

  if (room.participants.length < 2) {
    const err: any = new Error("At least two players are required to start");
    err.statusCode = 400;
    throw err;
  }

  // Deterministic drawer selection based on room code
  const sum = room.code.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const drawerIndex = sum % room.participants.length;
  const drawer = room.participants[drawerIndex];

  const wordIndex = sum % STARTER_WORDS.length;
  const secretWord = STARTER_WORDS[wordIndex];

  const round: Round = {
    drawerId: drawer.id,
    secretWord,
    startedAt: now(),
    endedAt: null,
    status: "active"
  };

  room.round = round;
  room.guesses = [];
  room.strokes = [];
  room.status = "active";
  room.participants = room.participants.map((p) => ({ ...p, role: p.id === drawer.id ? "drawer" : "guesser" }));

  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function submitGuess(code: string, participantId: string, guessText: string) {
  const room = rooms.get(code);

  if (!room) return null;

  if (room.status !== "active" || !room.round) {
    const err: any = new Error("Round is not active");
    err.statusCode = 400;
    throw err;
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    const err: any = new Error("Participant not found");
    err.statusCode = 404;
    throw err;
  }

  if (participant.role === "drawer") {
    const err: any = new Error("Drawer cannot submit guesses");
    err.statusCode = 403;
    throw err;
  }

  const text = guessText.trim();
  if (text.length === 0) {
    const err: any = new Error("Guess cannot be empty");
    err.statusCode = 400;
    throw err;
  }

  const normalized = text.toLowerCase();
  const correct = normalized === room.round.secretWord.toLowerCase();

  const guess = {
    id: randomUUID(),
    participantId: participant.id,
    text,
    normalizedText: normalized,
    correct,
    createdAt: now()
  };

  room.guesses.push(guess);

  if (correct) {
    participant.score = (participant.score || 0) + 100;
    room.round.endedAt = now();
    room.round.status = "finished";
    room.status = "results";
  }

  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function addStroke(code: string, participantId: string, points: { x: number; y: number }[], color?: string) {
  const room = rooms.get(code);
  if (!room) return null;

  const stroke = {
    id: randomUUID(),
    participantId,
    points: points.map((p) => ({ x: p.x, y: p.y })),
    color,
    createdAt: now()
  };

  room.strokes.push(stroke);
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function restartRound(code: string, participantId: string) {
  const room = rooms.get(code);
  if (!room) return null;

  if (room.status !== "results") {
    const err: any = new Error("Room must be in results to restart");
    err.statusCode = 400;
    throw err;
  }

  if (room.hostId !== participantId) {
    const err: any = new Error("Only the host can restart the room");
    err.statusCode = 403;
    throw err;
  }

  room.round = null;
  room.guesses = [];
  room.strokes = [];
  room.status = "lobby";
  room.participants = room.participants.map((p) => ({ ...p, role: undefined }));

  rooms.set(room.code, room);

  return cloneRoom(room);
}

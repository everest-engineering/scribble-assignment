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

function displayName(name: string) {
  return name.trim();
}

function createParticipant(name: string): Participant {
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

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    drawerId: null,
    secretWord: null,
    round: 0,
    drawingData: "",
    guesses: [],
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

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" } as const;
  }

  if (room.hostId !== participantId) {
    return { error: "Only the host can start the game" } as const;
  }

  if (room.participants.length < 2) {
    return { error: "Need at least 2 players to start" } as const;
  }

  for (const p of room.participants) {
    if (!p.name || p.name.trim().length === 0) {
      return { error: "All players must have a valid name" } as const;
    }
  }

  room.drawerId = room.hostId;
  room.secretWord = STARTER_WORDS[room.participants.length % STARTER_WORDS.length];
  room.round = 1;
  room.status = "playing";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function saveDrawing(code: string, participantId: string, drawingData: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" } as const;
  }

  if (room.drawerId !== participantId) {
    return { error: "Only the drawer can draw" } as const;
  }

  if (room.status !== "playing") {
    return { error: "Game is not in progress" } as const;
  }

  room.drawingData = drawingData;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function clearDrawing(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" } as const;
  }

  if (room.drawerId !== participantId) {
    return { error: "Only the drawer can clear the canvas" } as const;
  }

  room.drawingData = "";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" } as const;
  }

  if (room.status !== "playing") {
    return { error: "Game is not in progress" } as const;
  }

  if (room.drawerId === participantId) {
    return { error: "The drawer cannot submit guesses" } as const;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return { error: "Guess cannot be empty" } as const;
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    return { error: "Participant not found" } as const;
  }

  const correct = trimmed.toLowerCase() === (room.secretWord ?? "").toLowerCase();

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

  return { room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId !== undefined && viewerParticipantId === room.drawerId;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    drawerId: room.drawerId,
    secretWord: isDrawer ? room.secretWord : null,
    round: room.round,
    drawingData: room.drawingData,
    guesses: [...room.guesses],
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}

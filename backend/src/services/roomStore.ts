import { randomUUID } from "node:crypto";
import type { GameRound, Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
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

function sanitizeName(name: string): string {
  return name.trim();
}

function createParticipant(name: string): Participant {
  return {
    id: randomUUID(),
    name: sanitizeName(name),
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
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    currentRound: null,
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
    return { ok: false, error: "Room not found" } as const;
  }

  if (room.hostId !== participantId) {
    return { ok: false, error: "Only the host can start the game" } as const;
  }

  if (room.participants.length < 2) {
    return { ok: false, error: "At least 2 players are required" } as const;
  }

  const word = STARTER_WORDS[0];

  const round: GameRound = {
    word,
    drawerId: room.hostId,
    status: "drawing",
    guesses: [],
    drawingData: null
  };

  room.status = "drawing";
  room.currentRound = round;
  room.scores = {};
  room.updatedAt = now();

  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) } as const;
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: "Room not found" } as const;
  }

  if (!room.currentRound || room.currentRound.status !== "drawing") {
    return { ok: false, error: "No active round" } as const;
  }

  if (room.currentRound.drawerId === participantId) {
    return { ok: false, error: "Drawer cannot guess" } as const;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: "Guess cannot be empty" } as const;
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    return { ok: false, error: "Participant not in room" } as const;
  }

  const alreadyGuessed = room.currentRound.guesses.some((g) => g.participantId === participantId);
  if (alreadyGuessed) {
    return { ok: false, error: "Already guessed" } as const;
  }

  const isCorrect = trimmed.toLowerCase() === room.currentRound.word.toLowerCase();
  const guess: Guess = {
    participantId,
    participantName: participant.name,
    text: trimmed,
    isCorrect,
    timestamp: now()
  };

  room.currentRound.guesses.push(guess);

  if (isCorrect) {
    room.scores[participantId] = (room.scores[participantId] ?? 0) + 100;
  }

  const allGuessedCorrectly = room.participants
    .filter((p) => p.id !== room.currentRound!.drawerId)
    .every((p) => room.currentRound!.guesses.some((g) => g.participantId === p.id && g.isCorrect));

  if (allGuessedCorrectly) {
    room.currentRound.status = "results";
    room.status = "results";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, isCorrect, guess, room: cloneRoom(room) } as const;
}

export function updateDrawing(code: string, participantId: string, data: string) {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: "Room not found" } as const;
  }

  if (!room.currentRound) {
    return { ok: false, error: "No active round" } as const;
  }

  if (room.currentRound.drawerId !== participantId) {
    return { ok: false, error: "Only the drawer can update the drawing" } as const;
  }

  room.currentRound.drawingData = data;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true } as const;
}

export function clearDrawing(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: "Room not found" } as const;
  }

  if (!room.currentRound) {
    return { ok: false, error: "No active round" } as const;
  }

  if (room.currentRound.drawerId !== participantId) {
    return { ok: false, error: "Only the drawer can clear the drawing" } as const;
  }

  room.currentRound.drawingData = null;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true } as const;
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: "Room not found" } as const;
  }

  if (room.hostId !== participantId) {
    return { ok: false, error: "Only the host can restart" } as const;
  }

  room.status = "lobby";
  room.currentRound = null;
  room.scores = {};
  room.updatedAt = now();

  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) } as const;
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = room.currentRound?.drawerId === viewerParticipantId;
  const showWord = isDrawer || room.status === "results";

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    hostId: room.hostId,
    drawerId: room.currentRound?.drawerId ?? null,
    currentWord: showWord && room.currentRound ? room.currentRound.word : null,
    scores: { ...room.scores },
    guesses: room.currentRound?.guesses ?? [],
    drawingData: room.currentRound?.drawingData ?? null,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}

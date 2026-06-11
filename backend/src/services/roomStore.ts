import { randomUUID } from "node:crypto";
import type { CanvasState, Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

export const MAX_PARTICIPANTS = 8;

const rooms = new Map<string, Room>();
const canvasStore = new Map<string, CanvasState>();

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
    status: "lobby",
    participants: [participant],
    hostId: participant.id,
    scores: {},
    guessLog: [],
    roundEnded: false,
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
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return null;
  }

  if (room.status !== "lobby") {
    return null;
  }

  if (room.participants.length >= MAX_PARTICIPANTS) {
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
  const room = rooms.get(code.toUpperCase());
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function startRoom(code: string, participantId: string) {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return null;
  }

  if (room.status !== "lobby") {
    return null;
  }

  if (room.hostId !== participantId) {
    return null;
  }

  if (room.participants.length < 2) {
    return null;
  }

  room.status = "playing";

  const hostDrawerIndex = room.participants.findIndex((p) => p.id === room.hostId);
  room.participants.forEach((p, index) => {
    p.role = index === hostDrawerIndex ? "drawer" : "guesser";
  });

  const wordIndex = room.code.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) % STARTER_WORDS.length;
  room.secretWord = STARTER_WORDS[wordIndex];
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return getRoom(room.code);
}

export function leaveRoom(code: string, participantId: string) {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return false;
  }

  const index = room.participants.findIndex((p) => p.id === participantId);

  if (index === -1) {
    return false;
  }

  room.participants.splice(index, 1);

  if (room.participants.length === 0) {
    rooms.delete(room.code);
    return true;
  }

  if (room.hostId === participantId) {
    room.hostId = room.participants.reduce((earliest, p) =>
      p.joinedAt < earliest.joinedAt ? p : earliest
    ).id;
  }

  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return true;
}

export function appendStroke(roomCode: string, participantId: string, stroke: { color: string; points: { x: number; y: number }[] }) {
  const code = roomCode.toUpperCase();
  const room = rooms.get(code);
  if (!room) return null;
  if (room.status !== "playing") return null;

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant || participant.role !== "drawer") return null;

  let canvas = canvasStore.get(code);
  if (!canvas) {
    canvas = { strokes: [] };
    canvasStore.set(code, canvas);
  }

  canvas.strokes.push(stroke);
  return { strokeCount: canvas.strokes.length };
}

export function clearCanvas(roomCode: string, participantId: string) {
  const code = roomCode.toUpperCase();
  const room = rooms.get(code);
  if (!room) return null;
  if (room.status !== "playing") return null;

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant || participant.role !== "drawer") return null;

  canvasStore.delete(code);
  return { cleared: true };
}

export function submitGuess(roomCode: string, participantId: string, text: string) {
  const code = roomCode.toUpperCase();
  const room = rooms.get(code);
  if (!room) return null;
  if (room.status !== "playing") return null;

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) return null;
  if (participant.role !== "guesser") return { correct: false, points: 0, alreadyGuessed: false, rejected: true };

  const trimmedText = text.trim();
  if (!trimmedText) return { correct: false, points: 0, alreadyGuessed: false, rejected: true };

  const alreadyCorrect = room.guessLog.some(
    (g) => g.participantId === participantId && g.correct
  );
  if (alreadyCorrect) {
    return { correct: true, points: 0, alreadyGuessed: true };
  }

  const duplicateIncorrect = room.guessLog.some(
    (g) => g.participantId === participantId && !g.correct && g.text.toLowerCase() === trimmedText.toLowerCase()
  );
  if (duplicateIncorrect) {
    return { correct: false, points: 0, alreadyGuessed: false, duplicate: true };
  }

  const isCorrect = trimmedText.toLowerCase() === (room.secretWord ?? "").toLowerCase();
  const guess: Guess = {
    participantId,
    text: trimmedText,
    correct: isCorrect,
    timestamp: now()
  };

  room.guessLog.push(guess);

  if (isCorrect) {
    room.scores[participantId] = (room.scores[participantId] ?? 0) + 100;
  }

  const guesserCount = room.participants.filter((p) => p.role === "guesser").length;
  const correctGuessers = new Set(
    room.guessLog.filter((g) => g.correct).map((g) => g.participantId)
  );

  if (isCorrect && correctGuessers.size >= guesserCount) {
    endRound(code);
  }

  room.updatedAt = now();
  rooms.set(code, cloneRoom(room));

  return { correct: isCorrect, points: isCorrect ? 100 : 0, alreadyGuessed: false };
}

export function endRound(roomCode: string, requesterId?: string) {
  const code = roomCode.toUpperCase();
  const room = rooms.get(code);
  if (!room || room.status !== "playing") return null;

  if (requesterId && room.hostId !== requesterId) return null;

  const guesserCount = room.participants.filter((p) => p.role === "guesser").length;
  const correctGuesserIds = new Set(
    room.guessLog.filter((g) => g.correct).map((g) => g.participantId)
  );

  const drawer = room.participants.find((p) => p.role === "drawer");
  if (drawer) {
    const drawerPoints = (guesserCount - correctGuesserIds.size) * 100;
    room.scores[drawer.id] = (room.scores[drawer.id] ?? 0) + drawerPoints;
  }

  room.roundEnded = true;
  room.status = "finished";
  canvasStore.delete(code);
  room.updatedAt = now();
  rooms.set(code, cloneRoom(room));

  return getRoom(code);
}

export function getCanvasState(roomCode: string) {
  const code = roomCode.toUpperCase();
  const canvas = canvasStore.get(code);
  return canvas?.strokes ?? [];
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const participants = room.participants.map((p) => {
    const { ...rest } = p;
    return rest;
  });

  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    participants,
    hostId: room.hostId,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  if (room.status === "playing" && viewerParticipantId) {
    const viewer = room.participants.find((p) => p.id === viewerParticipantId);
    if (viewer?.role === "drawer") {
      snapshot.secretWord = room.secretWord;
    }
  }

  if (room.status === "playing" || room.status === "finished") {
    snapshot.guessLog = room.guessLog;
    snapshot.scores = { ...room.scores };

    if (room.roundEnded) {
      snapshot.secretWord = room.secretWord;
      snapshot.roundEnded = true;
    }
  }

  return snapshot;
}

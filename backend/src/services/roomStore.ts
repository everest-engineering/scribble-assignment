import { randomUUID } from "node:crypto";
import type { CanvasState, FinalStanding, Guess, Participant, Room, RoomSnapshot, RoundResult } from "../models/game.js";
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
    roundCounter: 0,
    maxRounds: 0,
    currentDrawerIndex: 0,
    wordIndex: 0,
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
  room.roundCounter = 1;
  room.maxRounds = room.participants.length;
  room.roundEnded = false;

  const hostDrawerIndex = room.participants.findIndex((p) => p.id === room.hostId);
  room.currentDrawerIndex = hostDrawerIndex;
  room.participants.forEach((p, index) => {
    p.role = index === hostDrawerIndex ? "drawer" : "guesser";
  });

  room.wordIndex = room.code.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) % STARTER_WORDS.length;
  room.secretWord = STARTER_WORDS[room.wordIndex];
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return getRoom(room.code);
}

export function leaveRoom(code: string, participantId: string) {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return null;
  }

  const index = room.participants.findIndex((p) => p.id === participantId);

  if (index === -1) {
    return null;
  }

  if (room.status === "playing") {
    const participant = room.participants[index];
    if (participant.role === "drawer") {
      return false;
    }
  }

  room.participants.splice(index, 1);

  if (room.participants.length === 0) {
    rooms.delete(room.code);
    return { hostTransferred: false, newHostId: null };
  }

  let hostTransferred = false;
  if (room.hostId === participantId) {
    room.hostId = room.participants.reduce((earliest, p) =>
      p.joinedAt < earliest.joinedAt ? p : earliest
    ).id;
    hostTransferred = true;
  }

  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return { hostTransferred, newHostId: room.hostId };
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

function computeRoundResult(room: Room): RoundResult {
  const guesserCount = room.participants.filter((p) => p.role === "guesser").length;
  const correctGuesserIds = new Set(
    room.guessLog.filter((g) => g.correct).map((g) => g.participantId)
  );

  const correctGuessers = Array.from(correctGuesserIds);
  const allCorrect = guesserCount > 0 && correctGuesserIds.size >= guesserCount;

  const roundScores: Record<string, number> = {};
  for (const p of room.participants) {
    roundScores[p.id] = correctGuesserIds.has(p.id) ? 100 : 0;
  }

  const drawer = room.participants.find((p) => p.role === "drawer");
  if (drawer) {
    const drawerPoints = (guesserCount - correctGuesserIds.size) * 100;
    roundScores[drawer.id] = drawerPoints;
  }

  return {
    secretWord: room.secretWord ?? "",
    scores: { ...room.scores },
    roundScores,
    correctGuessers,
    allCorrect,
    endedEarly: allCorrect ? false : true,
    roundNumber: room.roundCounter
  };
}

function computeFinalStandings(room: Room): FinalStanding[] {
  const sorted = room.participants
    .map((p) => ({
      participantId: p.id,
      name: p.name,
      score: room.scores[p.id] ?? 0,
      joinedAt: p.joinedAt
    }))
    .sort((a, b) => b.score - a.score || a.joinedAt.localeCompare(b.joinedAt));

  return sorted.map((entry, index) => ({
    participantId: entry.participantId,
    name: entry.name,
    score: entry.score,
    rank: index + 1
  }));
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
  room.roundResult = computeRoundResult(room);
  canvasStore.delete(code);

  if (room.roundCounter >= room.maxRounds) {
    room.status = "game_over";
    room.finalStandings = computeFinalStandings(room);
  } else {
    room.status = "round_end";
  }

  room.updatedAt = now();
  rooms.set(code, cloneRoom(room));

  return getRoom(code);
}

export function returnToLobby(code: string, participantId: string) {
  const room = rooms.get(code.toUpperCase());
  if (!room) return null;

  if (room.hostId !== participantId) return null;
  if (room.status !== "round_end") return null;
  if (room.roundCounter >= room.maxRounds) return null;

  room.status = "lobby";
  room.participants.forEach((p) => {
    p.role = undefined;
  });
  room.secretWord = undefined;
  room.guessLog = [];
  room.roundEnded = false;
  room.roundResult = undefined;
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return getRoom(room.code);
}

export function startNewRound(code: string, participantId: string) {
  const room = rooms.get(code.toUpperCase());
  if (!room) return null;

  if (room.hostId !== participantId) return null;
  if (room.status !== "lobby") return null;
  if (room.roundCounter >= room.maxRounds) return null;
  if (room.participants.length < 2) return null;

  room.roundCounter += 1;
  room.roundEnded = false;
  room.roundResult = undefined;
  room.guessLog = [];

  const nextDrawerIndex = (room.currentDrawerIndex + 1) % room.participants.length;
  room.currentDrawerIndex = nextDrawerIndex;
  room.participants.forEach((p, index) => {
    p.role = index === nextDrawerIndex ? "drawer" : "guesser";
  });

  const nextWordIndex = (room.wordIndex + 1) % STARTER_WORDS.length;
  room.wordIndex = nextWordIndex;
  room.secretWord = STARTER_WORDS[nextWordIndex];

  room.status = "playing";
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return getRoom(room.code);
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
    roles: [...STARTER_ROLES],
    roundCounter: room.roundCounter,
    maxRounds: room.maxRounds
  };

  if (room.status === "playing" && viewerParticipantId) {
    const viewer = room.participants.find((p) => p.id === viewerParticipantId);
    if (viewer?.role === "drawer") {
      snapshot.secretWord = room.secretWord;
    }
  }

  if (room.status === "playing" || room.status === "round_end" || room.status === "game_over") {
    snapshot.guessLog = room.guessLog;
    snapshot.scores = { ...room.scores };

    if (room.roundEnded) {
      snapshot.secretWord = room.secretWord;
      snapshot.roundEnded = true;
    }
  }

  if (room.status === "round_end" && room.roundResult) {
    snapshot.roundResult = room.roundResult;
  }

  if (room.status === "game_over" && room.finalStandings) {
    snapshot.finalStandings = room.finalStandings;
    snapshot.roundResult = room.roundResult;
    snapshot.secretWord = room.secretWord;
  }

  return snapshot;
}

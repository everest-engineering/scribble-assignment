import { randomUUID } from "node:crypto";
import type { DrawingStroke, GuessEntry, Participant, ParticipantScore, Room, RoomSnapshot } from "../models/game.js";
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
    hostId: participant.id,
    participants: [participant],
    createdAt: now(),
    updatedAt: now(),
    strokes: [],
    guessHistory: [],
    scores: {}
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

function clearExpiredRoundResult(room: Room) {
  if (room.lastRoundResult && room.lastRoundResultSetAt) {
    if (Date.now() - room.lastRoundResultSetAt > 6000) {
      room.lastRoundResult = undefined;
      room.lastRoundResultSetAt = undefined;
    }
  }
}

export function getRoom(code: string) {
  const room = rooms.get(code);
  if (!room) return null;
  clearExpiredRoundResult(room);
  return cloneRoom(room);
}

export function startGame(code: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  room.status = "playing";
  room.currentRound = 1;
  room.drawerId = room.hostId;
  room.secretWord = STARTER_WORDS[room.currentRound - 1];
  room.strokes = [];
  room.guessHistory = [];
  room.scores = Object.fromEntries(
    room.participants.map((p) => [p.id, { roundScore: 0, cumulativeScore: 0 } satisfies ParticipantScore])
  );
  return saveRoom(room);
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function addStrokes(code: string, participantId: string, strokes: DrawingStroke[]) {
  const room = rooms.get(code);
  if (!room) return null;
  if (room.drawerId !== participantId) return null;

  room.strokes.push(...strokes);
  return saveRoom(room);
}

export function clearStrokes(code: string, participantId: string) {
  const room = rooms.get(code);
  if (!room) return null;
  if (room.drawerId !== participantId) return null;

  room.strokes = [];
  return saveRoom(room);
}

export function advanceRound(code: string) {
  const room = rooms.get(code);
  if (!room || !room.currentRound) return null;

  const drawerName = room.participants.find((p) => p.id === room.drawerId)?.name ?? "Unknown";

  room.lastRoundResult = {
    roundNumber: room.currentRound,
    secretWord: room.secretWord ?? "???",
    drawerId: room.drawerId ?? "",
    drawerName,
    guessHistory: [...room.guessHistory],
    scores: { ...room.scores }
  };
  room.lastRoundResultSetAt = Date.now();

  room.currentRound += 1;
  room.drawerId = room.participants[(room.currentRound - 1) % room.participants.length].id;
  room.secretWord = STARTER_WORDS[(room.currentRound - 1) % STARTER_WORDS.length];
  room.strokes = [];
  room.guessHistory = [];
  for (const p of room.participants) {
    const score = room.scores[p.id];
    if (score) {
      score.roundScore = 0;
    }
  }

  return saveRoom(room);
}

export function submitGuess(code: string, participantId: string, guess: string) {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };
  if (room.status !== "playing") return { error: "Game is not in progress" };
  if (room.drawerId === participantId) return { error: "Drawer cannot guess" };

  const trimmedGuess = guess.trim();
  if (!trimmedGuess) return { error: "Guess cannot be empty" };

  const alreadyCorrect = room.guessHistory.some(
    (g) => g.participantId === participantId && g.correct
  );
  if (alreadyCorrect) return { error: "Round already ended" };

  const isCorrect = trimmedGuess.toLowerCase() === room.secretWord!.toLowerCase();
  const participant = room.participants.find((p) => p.id === participantId);
  const score = room.scores[participantId];

  const guessEntry: GuessEntry = {
    participantId,
    participantName: participant?.name ?? "Unknown",
    guess: trimmedGuess,
    correct: isCorrect,
    timestamp: now(),
    roundScoreAfter: isCorrect ? 100 : score?.roundScore ?? 0,
    cumulativeScoreAfter: isCorrect ? (score?.cumulativeScore ?? 0) + 100 : (score?.cumulativeScore ?? 0)
  };

  room.guessHistory.push(guessEntry);

  if (isCorrect && score) {
    score.roundScore += 100;
    score.cumulativeScore += 100;
    advanceRound(code);
    return { guessEntry, correct: true, message: "Correct!" };
  }

  saveRoom(room);
  return { guessEntry, correct: false, message: "Wrong guess" };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    strokes: [],
    guessHistory: [],
    scores: {}
  };

  if (room.status === "playing") {
    snapshot.currentRound = room.currentRound;
    snapshot.drawerId = room.drawerId;
    snapshot.strokes = room.strokes;
    snapshot.guessHistory = room.guessHistory;
    snapshot.scores = room.scores;
    snapshot.lastRoundResult = room.lastRoundResult;

    if (viewerParticipantId === room.drawerId) {
      snapshot.secretWord = room.secretWord;
    }
  }

  return snapshot;
}

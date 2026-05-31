import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot, Round } from "../models/game.js";
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
    score: 0
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

function selectWord(roundNumber: number): string {
  const words = listWords();
  return words[(roundNumber - 1) % words.length];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    currentRound: 0,
    rounds: [],
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
  const normalizedCode = code.toUpperCase();
  const room = rooms.get(normalizedCode);

  if (!room) {
    return null;
  }

  if (room.status !== "lobby") {
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

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return null;
  }

  if (room.hostId !== participantId) {
    throw new Error("Only the host can start the game");
  }

  if (room.participants.length < 2) {
    throw new Error("At least 2 players required to start");
  }

  const round: Round = {
    number: 1,
    drawerId: room.hostId,
    secretWord: selectWord(1),
    status: "drawing",
    guesses: [],
    drawing: [],
    hasCorrectGuess: false
  };

  room.status = "playing";
  room.currentRound = 1;
  room.rounds = [round];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room)
  };
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return null;
  }

  if (room.status !== "playing" || room.rounds.length === 0) {
    return null;
  }

  const round = room.rounds[room.rounds.length - 1];

  if (round.status !== "drawing") {
    return null;
  }

  if (round.drawerId === participantId) {
    throw new Error("The drawer cannot submit guesses");
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Guess text is required");
  }

  const isCorrect = trimmed.toLowerCase() === round.secretWord.toLowerCase();
  let scoreAwarded = 0;

  if (isCorrect && !round.hasCorrectGuess) {
    const participant = room.participants.find((p) => p.id === participantId);
    if (participant) {
      participant.score += 100;
      scoreAwarded = 100;
    }
    round.hasCorrectGuess = true;
    round.status = "revealed";
    room.status = "round_end";
  }

  const guess: Guess = {
    participantId,
    text: trimmed,
    isCorrect,
    timestamp: now()
  };

  round.guesses.push(guess);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { guess, scoreAwarded };
}

export function saveDrawing(code: string, participantId: string, drawing: number[][][]) {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return null;
  }

  if (room.rounds.length === 0) {
    return null;
  }

  const round = room.rounds[room.rounds.length - 1];

  if (round.drawerId !== participantId) {
    throw new Error("Only the drawer can update the drawing");
  }

  round.drawing = drawing;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true };
}

export function nextRound(code: string, participantId: string) {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return null;
  }

  if (room.hostId !== participantId) {
    throw new Error("Only the host can advance to the next round");
  }

  if (room.status !== "round_end") {
    return null;
  }

  const roundsCompleted = room.rounds.length;
  if (roundsCompleted >= room.participants.length) {
    room.status = "game_over";
    room.updatedAt = now();
    rooms.set(room.code, room);
    return { room: cloneRoom(room), gameOver: true };
  }

  const nextRoundNumber = roundsCompleted + 1;
  const drawerIndex = roundsCompleted % room.participants.length;
  const drawerId = room.participants[drawerIndex].id;

  const round: Round = {
    number: nextRoundNumber,
    drawerId,
    secretWord: selectWord(nextRoundNumber),
    status: "drawing",
    guesses: [],
    drawing: [],
    hasCorrectGuess: false
  };

  room.status = "playing";
  room.currentRound = nextRoundNumber;
  room.rounds.push(round);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room), gameOver: false };
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return null;
  }

  if (room.hostId !== participantId) {
    throw new Error("Only the host can restart the game");
  }

  if (room.status !== "game_over") {
    return null;
  }

  for (const participant of room.participants) {
    participant.score = 0;
  }

  room.rounds = [];
  room.currentRound = 0;
  room.status = "lobby";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const currentRound = room.currentRound > 0 && room.rounds.length > 0
    ? room.rounds[room.rounds.length - 1]
    : null;

  const isViewer = (id?: string) => viewerParticipantId ? viewerParticipantId === id : false;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((p) => ({ ...p })),
    currentRound: room.currentRound,
    drawerId: currentRound ? currentRound.drawerId : "",
    secretWord: currentRound && (isViewer(currentRound.drawerId) || room.status === "round_end" || room.status === "game_over") ? currentRound.secretWord : null,
    guesses: currentRound ? currentRound.guesses.map((g) => ({ ...g })) : [],
    drawing: currentRound ? currentRound.drawing.map((stroke) => stroke.map((point) => [...point] as [number, number])) : [],
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    isHost: isViewer(room.hostId)
  };
}

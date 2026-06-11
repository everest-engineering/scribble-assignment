import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
import type { Round } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { selectWord } from "./wordService.js";

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
  const room = rooms.get(code);

  if (!room || room.status !== "lobby") {
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

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.hostId !== participantId) {
    return null;
  }

  if (room.participants.length < 2) {
    return null;
  }

  const round: Round = {
    roundNumber: 1,
    drawerId: room.hostId,
    secretWord: selectWord(room.code, 1),
    strokes: [],
    guesses: []
  };

  room.status = "playing";
  room.rounds.push(round);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room)
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

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);

  if (!room || room.status !== "playing") {
    return { error: "Room not found or not playing" };
  }

  const currentRound = room.rounds[room.rounds.length - 1];

  if (!currentRound) {
    return { error: "No active round" };
  }

  if (currentRound.drawerId === participantId) {
    return { error: "Only guessers can submit guesses" };
  }

  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { error: "Guess cannot be empty" };
  }

  const alreadyCorrect = currentRound.guesses.some(
    (g) => g.participantId === participantId && g.result === "correct"
  );

  if (alreadyCorrect) {
    return { result: "already_correct" as const, message: "Already guessed correctly" };
  }

  const isCorrect = trimmed.toLowerCase() === currentRound.secretWord.toLowerCase();

  const guess: Guess = {
    participantId,
    text: trimmed,
    result: isCorrect ? "correct" : "incorrect",
    timestamp: now()
  };

  currentRound.guesses.push(guess);
  room.updatedAt = now();
  rooms.set(room.code, room);

  if (isCorrect) {
    return { result: "correct" as const, message: "Correct! You scored 100 points." };
  }

  return { result: "incorrect" as const, message: "Incorrect guess. Try again!" };
}

export function isRoundComplete(room: Room): boolean {
  const currentRound = room.rounds[room.rounds.length - 1];
  if (!currentRound || room.status !== "playing") return false;

  const guessers = room.participants.filter((p) => p.id !== currentRound.drawerId);
  if (guessers.length === 0) return false;

  return guessers.every((guesser) =>
    currentRound.guesses.some((g) => g.participantId === guesser.id && g.result === "correct")
  );
}

export function revealRound(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) return null;
  if (room.hostId !== participantId) return null;
  if (room.status !== "playing") return null;

  room.status = "result";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function addStroke(code: string, participantId: string, points: { x: number; y: number }[]) {
  const room = rooms.get(code);

  if (!room || room.status !== "playing") {
    return { ok: false as const, status: 404, message: "Room not found or not playing" };
  }

  const currentRound = room.rounds[room.rounds.length - 1];

  if (!currentRound) {
    return { ok: false as const, status: 400, message: "No active round" };
  }

  if (currentRound.drawerId !== participantId) {
    return { ok: false as const, status: 403, message: "Only the drawer can submit strokes" };
  }

  currentRound.strokes.push({ points });
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true as const };
}

export function clearCanvas(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room || room.status !== "playing") {
    return { ok: false as const, status: 404, message: "Room not found or not playing" };
  }

  const currentRound = room.rounds[room.rounds.length - 1];

  if (!currentRound) {
    return { ok: false as const, status: 400, message: "No active round" };
  }

  if (currentRound.drawerId !== participantId) {
    return { ok: false as const, status: 403, message: "Only the drawer can clear the canvas" };
  }

  currentRound.strokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true as const };
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) return null;
  if (room.hostId !== participantId) return null;
  if (room.status !== "result") return null;

  room.status = "lobby";
  room.rounds = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const currentRound = room.rounds.length > 0 ? room.rounds[room.rounds.length - 1] : null;
  const isDrawer = currentRound !== null && viewerParticipantId === currentRound.drawerId;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    roundNumber: currentRound?.roundNumber ?? null,
    drawerId: currentRound?.drawerId ?? null,
    yourRole: currentRound !== null ? (isDrawer ? "drawer" : "guesser") : null,
    wordForDrawer: isDrawer ? currentRound!.secretWord : undefined,
    wordLength: currentRound?.secretWord.length ?? null,
    correctWord: room.status === "result" && currentRound ? currentRound.secretWord : undefined,
    strokes: currentRound ? [...currentRound.strokes.map((stroke) => ({ points: [...stroke.points] }))] : [],
    guesses: currentRound ? [...currentRound.guesses.map((guess) => ({ ...guess }))] : [],
    scores: currentRound
      ? currentRound.guesses
          .filter((g) => g.result === "correct")
          .reduce<Record<string, number>>((acc, g) => {
            acc[g.participantId] = (acc[g.participantId] ?? 0) + 100;
            return acc;
          }, {})
      : {},
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}

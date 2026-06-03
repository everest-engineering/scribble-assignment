import { randomUUID } from "node:crypto";
import type { Guess, Point, Room, RoomSnapshot, Stroke } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

export const MAX_PARTICIPANTS = 8;
export const MAX_STROKES = 500;
export const MAX_GUESSES = 200;
export const MAX_POINTS_PER_STROKE = 250;

export class PlayerNameValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlayerNameValidationError";
  }
}

export class RoomCapacityError extends Error {
  constructor() {
    super("Room is full");
    this.name = "RoomCapacityError";
  }
}

export class StartNotHostError extends Error {
  constructor() {
    super("Only the host can start the game");
    this.name = "StartNotHostError";
  }
}

export class StartInvalidStateError extends Error {
  constructor() {
    super("Game has already started");
    this.name = "StartInvalidStateError";
  }
}

export class StartInsufficientPlayersError extends Error {
  constructor() {
    super("Need at least 2 players to start");
    this.name = "StartInsufficientPlayersError";
  }
}

export class DrawNotDrawerError extends Error {
  constructor() {
    super("Only the drawer can draw");
    this.name = "DrawNotDrawerError";
  }
}

export class DrawerCannotGuessError extends Error {
  constructor() {
    super("Drawer cannot guess");
    this.name = "DrawerCannotGuessError";
  }
}

export class RoundNotActiveError extends Error {
  constructor() {
    super("Round is not active");
    this.name = "RoundNotActiveError";
  }
}

export class GuessValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuessValidationError";
  }
}

export class StrokeLimitError extends Error {
  constructor() {
    super("Stroke limit reached");
    this.name = "StrokeLimitError";
  }
}

export class GuessLimitError extends Error {
  constructor() {
    super("Guess limit reached");
    this.name = "GuessLimitError";
  }
}

export class StrokePointsLimitError extends Error {
  constructor() {
    super("Stroke has too many points");
    this.name = "StrokePointsLimitError";
  }
}

export class RestartNotHostError extends Error {
  constructor() {
    super("Only the host can restart the game");
    this.name = "RestartNotHostError";
  }
}

export class RestartInvalidStateError extends Error {
  constructor() {
    super("Game is not in result state");
    this.name = "RestartInvalidStateError";
  }
}

export function sumCharCodes(code: string) {
  let sum = 0;

  for (const character of code) {
    sum += character.charCodeAt(0);
  }

  return sum;
}

export function pickWord(code: string, roundIndex: number) {
  const index = (sumCharCodes(code) + roundIndex) % STARTER_WORDS.length;
  return STARTER_WORDS[index];
}

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

export function normalizePlayerName(name?: string) {
  const trimmed = (name ?? "").trim();

  if (!trimmed) {
    throw new PlayerNameValidationError("Player name is required");
  }

  if (trimmed.length > 24) {
    throw new PlayerNameValidationError("Player name must be 24 characters or fewer");
  }

  return trimmed;
}

function createParticipant(name: string) {
  return {
    id: randomUUID(),
    name,
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

function initializeScores(room: Room) {
  const scores: Record<string, number> = {};

  for (const participant of room.participants) {
    scores[participant.id] = 0;
  }

  return scores;
}

function getParticipantName(room: Room, participantId: string) {
  return room.participants.find((participant) => participant.id === participantId)?.name ?? "Unknown";
}

function requirePlayingRound(room: Room) {
  if (room.status !== "playing" || !room.currentRound) {
    throw new RoundNotActiveError();
  }

  return room.currentRound;
}

function requireDrawer(room: Room, participantId: string) {
  const round = requirePlayingRound(room);

  if (participantId !== round.drawerParticipantId) {
    throw new DrawNotDrawerError();
  }
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const name = normalizePlayerName(playerName);
  const participant = createParticipant(name);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostParticipantId: participant.id,
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

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.participants.length >= MAX_PARTICIPANTS) {
    throw new RoomCapacityError();
  }

  const name = normalizePlayerName(playerName);
  const participant = createParticipant(name);
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

export function startRound(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (participantId !== room.hostParticipantId) {
    throw new StartNotHostError();
  }

  if (room.status !== "lobby") {
    throw new StartInvalidStateError();
  }

  if (room.participants.length < 2) {
    throw new StartInsufficientPlayersError();
  }

  const drawerParticipantId = room.participants[0].id;
  const secretWord = pickWord(room.code, 0);

  room.status = "playing";
  room.currentRound = {
    roundIndex: 0,
    drawerParticipantId,
    secretWord,
    strokes: [],
    guesses: [],
    scores: initializeScores(room)
  };
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return getRoom(room.code);
}

export interface StrokeInput {
  points: Point[];
  color?: string;
  width?: number;
}

export function appendStroke(code: string, participantId: string, input: StrokeInput) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  requireDrawer(room, participantId);
  const round = room.currentRound!;

  if (round.strokes.length >= MAX_STROKES) {
    throw new StrokeLimitError();
  }

  if (input.points.length < 2 || input.points.length > MAX_POINTS_PER_STROKE) {
    throw new StrokePointsLimitError();
  }

  const stroke: Stroke = {
    id: randomUUID(),
    points: input.points.map((point) => ({ x: point.x, y: point.y })),
    color: input.color ?? "#000000",
    width: input.width ?? 2
  };

  round.strokes.push(stroke);
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return getRoom(room.code);
}

export function clearStrokes(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  requireDrawer(room, participantId);
  room.currentRound!.strokes = [];
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return getRoom(room.code);
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const round = requirePlayingRound(room);

  if (participantId === round.drawerParticipantId) {
    throw new DrawerCannotGuessError();
  }

  const trimmed = text.trim();

  if (!trimmed) {
    throw new GuessValidationError("Guess is required");
  }

  if (round.guesses.length >= MAX_GUESSES) {
    throw new GuessLimitError();
  }

  const isCorrect = trimmed.toLowerCase() === round.secretWord.toLowerCase();
  const guess: Guess = {
    id: randomUUID(),
    participantId,
    text: trimmed,
    isCorrect,
    createdAt: now()
  };

  round.guesses.push(guess);

  if (isCorrect) {
    round.scores[participantId] = (round.scores[participantId] ?? 0) + 100;
    round.winnerParticipantId = participantId;
    room.status = "result";
  }

  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return getRoom(room.code);
}

export function restartRoom(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (participantId !== room.hostParticipantId) {
    throw new RestartNotHostError();
  }

  if (room.status !== "result") {
    throw new RestartInvalidStateError();
  }

  room.status = "lobby";
  room.currentRound = undefined;
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return getRoom(room.code);
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
    hostParticipantId: room.hostParticipantId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  if (room.currentRound) {
    const isDrawer = viewerParticipantId === room.currentRound.drawerParticipantId;
    const revealSecretWord = room.status === "result" || isDrawer;

    snapshot.currentRound = {
      roundIndex: room.currentRound.roundIndex,
      drawerParticipantId: room.currentRound.drawerParticipantId,
      secretWord: revealSecretWord ? room.currentRound.secretWord : null,
      strokes: room.currentRound.strokes.map((stroke) => ({
        ...stroke,
        points: stroke.points.map((point) => ({ ...point }))
      })),
      guesses: room.currentRound.guesses.map((guess) => ({
        id: guess.id,
        participantId: guess.participantId,
        participantName: getParticipantName(room, guess.participantId),
        text: guess.text,
        isCorrect: guess.isCorrect,
        createdAt: guess.createdAt
      })),
      scores: room.participants.map((participant) => ({
        participantId: participant.id,
        name: participant.name,
        score: room.currentRound!.scores[participant.id] ?? 0
      })),
      winnerParticipantId: room.currentRound.winnerParticipantId ?? null
    };

    if (viewerParticipantId) {
      snapshot.viewer = {
        participantId: viewerParticipantId,
        isDrawer
      };
    }
  }

  return snapshot;
}

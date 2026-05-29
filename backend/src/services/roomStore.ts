import { randomUUID } from "node:crypto";
import type { CanvasState, CompletedRound, DrawingStroke, Guess, Participant, Room, RoomSnapshot, ScoreEntry } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();
const ROOM_CODE_PATTERN = /^[A-Z0-9]{4}$/;
const MAX_STROKES = 200;
const MAX_POINTS_PER_STROKE = 500;
const DEFAULT_STROKE_COLOR = "#111827";
const DEFAULT_STROKE_SIZE = 4;

export type DrawingStrokeInput = Omit<DrawingStroke, "id">;

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

export function normalizeRoomCode(code: string) {
  return code.trim().toUpperCase();
}

function isValidRoomCode(code: string) {
  return ROOM_CODE_PATTERN.test(code);
}

function displayName(name: string) {
  return name.trim();
}

function createParticipant(name: string): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

function createBlankCanvas(timestamp = now()) {
  return {
    strokes: [],
    updatedAt: timestamp
  };
}

function createInitialScores(participants: Participant[]) {
  return Object.fromEntries(participants.map((participant) => [participant.id, 0]));
}

function createScoreEntries(room: Room): ScoreEntry[] {
  return room.participants.map((participant) => ({
    participantId: participant.id,
    participantName: participant.name,
    score: room.scores[participant.id] ?? 0
  }));
}

function cloneCanvas(canvas: CanvasState): CanvasState {
  return {
    strokes: canvas.strokes.map((stroke) => ({
      ...stroke,
      points: stroke.points.map((point) => ({ ...point }))
    })),
    updatedAt: canvas.updatedAt
  };
}

function cloneGuesses(guesses: Guess[]): Guess[] {
  return guesses.map((guess) => ({ ...guess }));
}

function cloneCompletedRound(completedRound: CompletedRound): CompletedRound {
  return {
    ...completedRound,
    canvas: cloneCanvas(completedRound.canvas),
    guesses: cloneGuesses(completedRound.guesses),
    scores: completedRound.scores.map((score) => ({ ...score }))
  };
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function selectSecretWord(roomCode: string, words = listWords()) {
  if (words.length === 0) {
    return null;
  }

  const checksum = normalizeRoomCode(roomCode)
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return words[checksum % words.length];
}

export function clearRooms() {
  rooms.clear();
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const createdAt = now();
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    hostParticipantId: participant.id,
    scores: {},
    createdAt,
    updatedAt: createdAt
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName: string) {
  const normalizedCode = normalizeRoomCode(code);

  if (!isValidRoomCode(normalizedCode)) {
    return null;
  }

  const room = rooms.get(normalizedCode);

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

export function getRoom(code: string) {
  const normalizedCode = normalizeRoomCode(code);

  if (!isValidRoomCode(normalizedCode)) {
    return null;
  }

  const room = rooms.get(normalizedCode);
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export type StartRoomResult =
  | { ok: true; room: Room }
  | { ok: false; statusCode: 400 | 403 | 404; message: string };

function selectDrawer(room: Room) {
  const host = room.participants.find((participant) => participant.id === room.hostParticipantId);

  if (host) {
    return host;
  }

  return [...room.participants].sort((left, right) => left.joinedAt.localeCompare(right.joinedAt))[0] ?? null;
}

export function startRoom(code: string, participantId: string): StartRoomResult {
  const normalizedCode = normalizeRoomCode(code);

  if (!isValidRoomCode(normalizedCode)) {
    return { ok: false, statusCode: 400, message: "Invalid room code" };
  }

  const room = rooms.get(normalizedCode);

  if (!room) {
    return { ok: false, statusCode: 404, message: "Unable to load room" };
  }

  if (room.status !== "lobby") {
    return { ok: false, statusCode: 400, message: "Room is already playing" };
  }

  const participant = room.participants.find((candidate) => candidate.id === participantId);

  if (!participant) {
    return { ok: false, statusCode: 404, message: "Participant not found in room" };
  }

  if (room.participants.length < 2) {
    return { ok: false, statusCode: 400, message: "At least 2 players are required to start" };
  }

  const drawer = selectDrawer(room);

  if (!drawer) {
    return { ok: false, statusCode: 400, message: "Unable to assign drawer" };
  }

  if (drawer.id !== participant.id) {
    return { ok: false, statusCode: 403, message: "Only the host can start the game" };
  }

  const secretWord = selectSecretWord(room.code);

  if (!secretWord) {
    return { ok: false, statusCode: 400, message: "No words are available to start" };
  }

  const startedAt = now();
  room.status = "playing";
  delete room.completedRound;
  room.currentRound = {
    roundNumber: 1,
    drawerParticipantId: drawer.id,
    secretWord,
    startedAt,
    canvas: createBlankCanvas(startedAt),
    guesses: [],
    correctGuessParticipantIds: []
  };
  room.scores = createInitialScores(room.participants);
  room.updatedAt = startedAt;
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export type GameplayMutationResult =
  | { ok: true; room: Room }
  | { ok: false; statusCode: 400 | 403 | 404; message: string };

type PlayingRoomResult =
  | { ok: true; room: Room; participant: Participant }
  | { ok: false; statusCode: 400 | 403 | 404; message: string };

function getPlayingRoom(code: string, participantId: string): PlayingRoomResult {
  const normalizedCode = normalizeRoomCode(code);

  if (!isValidRoomCode(normalizedCode)) {
    return { ok: false, statusCode: 400, message: "Invalid room code" };
  }

  const room = rooms.get(normalizedCode);

  if (!room) {
    return { ok: false, statusCode: 404, message: "Unable to load room" };
  }

  if (room.status !== "playing" || !room.currentRound) {
    return { ok: false, statusCode: 400, message: "Round is not active" };
  }

  const participant = room.participants.find((candidate) => candidate.id === participantId);

  if (!participant) {
    return { ok: false, statusCode: 404, message: "Participant not found in room" };
  }

  return { ok: true, room, participant };
}

function validateStroke(stroke: DrawingStrokeInput) {
  if (stroke.points.length < 2 || stroke.points.length > MAX_POINTS_PER_STROKE) {
    return false;
  }

  return stroke.points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1);
}

export function appendDrawingStroke(code: string, participantId: string, stroke: DrawingStrokeInput): GameplayMutationResult {
  const result = getPlayingRoom(code, participantId);

  if (!result.ok) {
    return result;
  }

  const { room } = result;

  if (!room.currentRound || room.currentRound.drawerParticipantId !== participantId) {
    return { ok: false, statusCode: 403, message: "Only the drawer can update the canvas" };
  }

  if (!validateStroke(stroke)) {
    return { ok: false, statusCode: 400, message: "Invalid drawing stroke" };
  }

  if (room.currentRound.canvas.strokes.length >= MAX_STROKES) {
    return { ok: false, statusCode: 400, message: "Canvas has reached the drawing limit" };
  }

  const updatedAt = now();
  room.currentRound.canvas.strokes.push({
    id: randomUUID(),
    color: stroke.color || DEFAULT_STROKE_COLOR,
    size: stroke.size || DEFAULT_STROKE_SIZE,
    points: stroke.points.map((point) => ({ ...point }))
  });
  room.currentRound.canvas.updatedAt = updatedAt;
  room.updatedAt = updatedAt;
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function clearDrawing(code: string, participantId: string): GameplayMutationResult {
  const result = getPlayingRoom(code, participantId);

  if (!result.ok) {
    return result;
  }

  const { room } = result;

  if (!room.currentRound || room.currentRound.drawerParticipantId !== participantId) {
    return { ok: false, statusCode: 403, message: "Only the drawer can clear the canvas" };
  }

  const updatedAt = now();
  room.currentRound.canvas = createBlankCanvas(updatedAt);
  room.updatedAt = updatedAt;
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function submitGuess(code: string, participantId: string, guess: string): GameplayMutationResult {
  const result = getPlayingRoom(code, participantId);

  if (!result.ok) {
    return result;
  }

  const { room, participant } = result;

  if (!room.currentRound) {
    return { ok: false, statusCode: 400, message: "Round is not active" };
  }

  if (room.currentRound.drawerParticipantId === participantId) {
    return { ok: false, statusCode: 403, message: "Drawer cannot submit guesses" };
  }

  const text = guess.trim();

  if (!text) {
    return { ok: false, statusCode: 400, message: "Guess is required" };
  }

  const normalizedGuess = text.toLocaleLowerCase();
  const normalizedSecret = room.currentRound.secretWord.trim().toLocaleLowerCase();
  const isCorrect = normalizedGuess === normalizedSecret;
  const alreadyAwarded = room.currentRound.correctGuessParticipantIds.includes(participantId);
  const pointsAwarded = isCorrect && !alreadyAwarded ? 100 : 0;
  const createdAt = now();

  if (pointsAwarded > 0) {
    room.scores[participantId] = (room.scores[participantId] ?? 0) + pointsAwarded;
    room.currentRound.correctGuessParticipantIds.push(participantId);
  }

  room.currentRound.guesses.push({
    id: randomUUID(),
    participantId,
    participantName: participant.name,
    text,
    isCorrect,
    pointsAwarded,
    createdAt
  });
  room.updatedAt = createdAt;
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function endRound(code: string, participantId: string): GameplayMutationResult {
  const result = getPlayingRoom(code, participantId);

  if (!result.ok) {
    return result;
  }

  const { room } = result;

  if (!room.currentRound) {
    return { ok: false, statusCode: 400, message: "Round is not active" };
  }

  const drawer = room.participants.find((participant) => participant.id === room.currentRound?.drawerParticipantId);

  if (!drawer) {
    return { ok: false, statusCode: 400, message: "Unable to resolve drawer" };
  }

  const endedAt = now();
  room.completedRound = {
    roundNumber: room.currentRound.roundNumber,
    drawerParticipantId: drawer.id,
    drawerName: drawer.name,
    secretWord: room.currentRound.secretWord,
    startedAt: room.currentRound.startedAt,
    endedAt,
    canvas: cloneCanvas(room.currentRound.canvas),
    guesses: cloneGuesses(room.currentRound.guesses),
    scores: createScoreEntries(room)
  };
  delete room.currentRound;
  room.status = "result";
  room.updatedAt = endedAt;
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function restartRoom(code: string, participantId: string): GameplayMutationResult {
  const normalizedCode = normalizeRoomCode(code);

  if (!isValidRoomCode(normalizedCode)) {
    return { ok: false, statusCode: 400, message: "Invalid room code" };
  }

  const room = rooms.get(normalizedCode);

  if (!room) {
    return { ok: false, statusCode: 404, message: "Unable to load room" };
  }

  const participant = room.participants.find((candidate) => candidate.id === participantId);

  if (!participant) {
    return { ok: false, statusCode: 404, message: "Participant not found in room" };
  }

  if (participant.id !== room.hostParticipantId) {
    return { ok: false, statusCode: 403, message: "Only the host can restart the game" };
  }

  if (room.status !== "result") {
    return { ok: false, statusCode: 400, message: "Room is not showing results" };
  }

  const restartedAt = now();
  room.status = "lobby";
  delete room.currentRound;
  delete room.completedRound;
  room.scores = {};
  room.updatedAt = restartedAt;
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isHost = Boolean(viewerParticipantId && viewerParticipantId === room.hostParticipantId);
  const drawer = room.currentRound
    ? room.participants.find((participant) => participant.id === room.currentRound?.drawerParticipantId)
    : null;
  const isDrawer = Boolean(viewerParticipantId && drawer && viewerParticipantId === drawer.id);
  const currentRound =
    room.currentRound && drawer
      ? {
          roundNumber: room.currentRound.roundNumber,
          drawerParticipantId: drawer.id,
          drawerName: drawer.name,
          canvas: cloneCanvas(room.currentRound.canvas),
          guesses: cloneGuesses(room.currentRound.guesses)
        }
      : undefined;
  const completedRound = room.completedRound ? cloneCompletedRound(room.completedRound) : undefined;
  const viewerRole = room.currentRound ? (isDrawer ? "drawer" : "guesser") : undefined;

  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    hostParticipantId: room.hostParticipantId,
    viewerParticipantId,
    isHost,
    canStart: room.status === "lobby" && isHost && room.participants.length >= 2,
    currentRound,
    completedRound,
    viewerRole,
    isDrawer,
    scores: createScoreEntries(room),
    availableWords: room.status === "lobby" ? listWords() : [],
    roles: [...STARTER_ROLES]
  };

  if (room.currentRound && isDrawer) {
    snapshot.secretWord = room.currentRound.secretWord;
  }

  return snapshot;
}

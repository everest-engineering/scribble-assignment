import { randomUUID } from "node:crypto";
import type {
  Guess,
  Participant,
  ParticipantRole,
  Room,
  RoomSnapshot,
  Stroke,
  StrokeInput
} from "../models/game.js";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

const DEFAULT_STROKE_COLOR = "#111827";
const DEFAULT_STROKE_WIDTH = 3;

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

export type NormalizedNameResult =
  | { ok: true; name: string }
  | { ok: false; reason: "empty_name" };

export function normalizePlayerName(name?: string): NormalizedNameResult {
  const trimmed = (name ?? "").trim();

  if (!trimmed) {
    return { ok: false, reason: "empty_name" };
  }

  return { ok: true, name: trimmed };
}

export type NormalizedGuessResult =
  | { ok: true; text: string }
  | { ok: false; reason: "empty_guess" };

export function normalizeGuessText(guessText?: string): NormalizedGuessResult {
  const trimmed = (guessText ?? "").trim();

  if (!trimmed) {
    return { ok: false, reason: "empty_guess" };
  }

  return { ok: true, text: trimmed };
}

function createParticipant(name: string): Participant {
  return {
    id: randomUUID(),
    name,
    joinedAt: now(),
    score: 0
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

function participantRole(
  room: Room,
  participantId: string
): ParticipantRole | null {
  if (
    (room.status !== "playing" && room.status !== "result") ||
    !room.drawerParticipantId
  ) {
    return null;
  }

  return participantId === room.drawerParticipantId ? "drawer" : "guesser";
}

function isValidStrokeInput(stroke: StrokeInput): boolean {
  if (!stroke.points || stroke.points.length < 2) {
    return false;
  }

  return stroke.points.every(
    (point) =>
      Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      point.x >= 0 &&
      point.x <= CANVAS_WIDTH &&
      point.y >= 0 &&
      point.y <= CANVAS_HEIGHT
  );
}

function initializeGameplayState(room: Room) {
  room.strokes = [];
  room.guesses = [];
  room.scoredParticipantIds = [];
  room.participants.forEach((participant) => {
    participant.score = 0;
  });
}

export function listWords() {
  return [...STARTER_WORDS];
}

export type CreateRoomResult =
  | { ok: true; room: Room; participantId: string }
  | { ok: false; reason: "empty_name" };

export type JoinRoomResult =
  | { ok: true; room: Room; participantId: string }
  | { ok: false; reason: "not_found" | "game_started" | "empty_name" };

export type StartRoomResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not_found" | "not_host" | "not_enough_players" | "game_started" };

export type AddStrokeResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not_found" | "not_playing" | "not_drawer" | "invalid_stroke" };

export type ClearCanvasResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not_found" | "not_playing" | "not_drawer" };

export type SubmitGuessResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not_found" | "not_playing" | "empty_guess" | "is_drawer" | "not_participant" };

export type EndRoomResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not_found" | "not_host" | "not_playing" };

export type RestartRoomResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not_found" | "not_host" | "not_result" };

export function createRoom(playerName?: string): CreateRoomResult {
  const normalized = normalizePlayerName(playerName);

  if (!normalized.ok) {
    return { ok: false, reason: "empty_name" };
  }

  const participant = createParticipant(normalized.name);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostParticipantId: participant.id,
    drawerParticipantId: null,
    secretWord: null,
    strokes: [],
    guesses: [],
    scoredParticipantIds: [],
    participants: [participant],
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    ok: true,
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName?: string): JoinRoomResult {
  const normalized = normalizePlayerName(playerName);

  if (!normalized.ok) {
    return { ok: false, reason: "empty_name" };
  }

  const room = rooms.get(code);

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  if (room.status !== "lobby") {
    return { ok: false, reason: "game_started" };
  }

  const participant = createParticipant(normalized.name);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    ok: true,
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function startRoom(code: string, participantId: string): StartRoomResult {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  if (room.status !== "lobby") {
    return { ok: false, reason: "game_started" };
  }

  if (room.hostParticipantId !== participantId) {
    return { ok: false, reason: "not_host" };
  }

  if (room.participants.length < 2) {
    return { ok: false, reason: "not_enough_players" };
  }

  room.status = "playing";
  room.drawerParticipantId = room.hostParticipantId;
  room.secretWord = STARTER_WORDS[0];
  initializeGameplayState(room);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function addStroke(
  code: string,
  participantId: string,
  strokeInput: StrokeInput
): AddStrokeResult {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  if (room.status !== "playing") {
    return { ok: false, reason: "not_playing" };
  }

  if (room.drawerParticipantId !== participantId) {
    return { ok: false, reason: "not_drawer" };
  }

  if (!isValidStrokeInput(strokeInput)) {
    return { ok: false, reason: "invalid_stroke" };
  }

  const stroke: Stroke = {
    id: randomUUID(),
    points: strokeInput.points,
    color: strokeInput.color ?? DEFAULT_STROKE_COLOR,
    width: strokeInput.width ?? DEFAULT_STROKE_WIDTH
  };

  room.strokes.push(stroke);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function clearCanvas(code: string, participantId: string): ClearCanvasResult {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  if (room.status !== "playing") {
    return { ok: false, reason: "not_playing" };
  }

  if (room.drawerParticipantId !== participantId) {
    return { ok: false, reason: "not_drawer" };
  }

  room.strokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function submitGuess(
  code: string,
  participantId: string,
  guessText?: string
): SubmitGuessResult {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  if (room.status !== "playing") {
    return { ok: false, reason: "not_playing" };
  }

  if (room.drawerParticipantId === participantId) {
    return { ok: false, reason: "is_drawer" };
  }

  const participant = room.participants.find((entry) => entry.id === participantId);

  if (!participant) {
    return { ok: false, reason: "not_participant" };
  }

  const normalized = normalizeGuessText(guessText);

  if (!normalized.ok) {
    return { ok: false, reason: "empty_guess" };
  }

  const secretWord = room.secretWord ?? "";
  const isCorrect = normalized.text.toLowerCase() === secretWord.toLowerCase();

  const guess: Guess = {
    id: randomUUID(),
    participantId: participant.id,
    participantName: participant.name,
    text: normalized.text,
    isCorrect,
    submittedAt: now()
  };

  room.guesses.push(guess);

  if (isCorrect && !room.scoredParticipantIds.includes(participantId)) {
    participant.score += 100;
    room.scoredParticipantIds.push(participantId);
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function endRoom(code: string, participantId: string): EndRoomResult {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  if (room.status !== "playing") {
    return { ok: false, reason: "not_playing" };
  }

  if (room.hostParticipantId !== participantId) {
    return { ok: false, reason: "not_host" };
  }

  room.status = "result";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

function clearRoundState(room: Room) {
  room.drawerParticipantId = null;
  room.secretWord = null;
  room.strokes = [];
  room.guesses = [];
  room.scoredParticipantIds = [];
  room.participants.forEach((participant) => {
    participant.score = 0;
  });
}

export function restartRoom(code: string, participantId: string): RestartRoomResult {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  if (room.status !== "result") {
    return { ok: false, reason: "not_result" };
  }

  if (room.hostParticipantId !== participantId) {
    return { ok: false, reason: "not_host" };
  }

  clearRoundState(room);
  room.status = "lobby";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
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
  const drawerParticipantId =
    room.status === "playing" || room.status === "result" ? room.drawerParticipantId : null;

  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostParticipantId: room.hostParticipantId,
    drawerParticipantId,
    participants: room.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      joinedAt: participant.joinedAt,
      isHost: participant.id === room.hostParticipantId,
      role: participantRole(room, participant.id),
      score: participant.score
    })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  if (room.status === "playing") {
    snapshot.strokes = [...room.strokes];
    snapshot.guesses = [...room.guesses];
  }

  if (room.status === "result") {
    snapshot.guesses = [...room.guesses];

    if (room.secretWord) {
      snapshot.secretWord = room.secretWord;
    }
  }

  if (
    room.status === "playing" &&
    viewerParticipantId &&
    room.drawerParticipantId === viewerParticipantId &&
    room.secretWord
  ) {
    snapshot.secretWord = room.secretWord;
  }

  return snapshot;
}

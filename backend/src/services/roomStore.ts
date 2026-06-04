import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import type { DrawingPoint, ParticipantRole, Stroke } from "../models/game.js";
import { STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();
const usedCodes = new Set<string>();
const DRAWING_COLOR = "#111827";
const DRAWING_LINE_WIDTH = 4;

export type GameActionFailureReason =
  | "not_found"
  | "not_member"
  | "forbidden"
  | "not_in_game"
  | "empty_guess"
  | "already_solved";

export type RestartRoomFailureReason = "not_found" | "forbidden" | "not_in_result";

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

  while (rooms.has(code) || usedCodes.has(code)) {
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
    score: 0,
    hasGuessedCorrectly: false
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

function findParticipantIndex(room: Room, participantId: string) {
  return room.participants.findIndex((participant) => participant.id === participantId);
}

export function getStarterWordForRoomCode(code: string) {
  let hash = 0;

  for (const character of code) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return STARTER_WORDS[hash % STARTER_WORDS.length];
}

function assignRoles(room: Room) {
  const participants = room.participants.map((participant) => ({
    ...participant,
    role: (participant.id === room.currentDrawerId ? "drawer" : "guesser") as ParticipantRole
  }));

  room.participants = participants;
}

function resetParticipantsForNextRound(room: Room) {
  room.participants = room.participants.map(({ role: _role, ...participant }) => ({
    ...participant,
    score: 0,
    hasGuessedCorrectly: false
  }));
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function resetRoomStore() {
  rooms.clear();
  usedCodes.clear();
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostParticipantId: participant.id,
    currentDrawerId: null,
    participants: [participant],
    drawing: [],
    guessHistory: [],
    createdAt: now(),
    updatedAt: now()
  };

  usedCodes.add(room.code);
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName: string) {
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

export function getRoom(code: string) {
  const room = rooms.get(code);
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export type StartRoomFailureReason = "not_found" | "forbidden" | "too_few_players";

export type LeaveRoomFailureReason = "not_found" | "not_member";

export function startRoom(code: string, participantId: string):
  | { room: Room }
  | { error: StartRoomFailureReason } {
  const room = rooms.get(code);

  if (!room) {
    return { error: "not_found" };
  }

  if (room.status !== "lobby") {
    return { error: "forbidden" };
  }

  if (room.hostParticipantId !== participantId || findParticipantIndex(room, participantId) === -1) {
    return { error: "forbidden" };
  }

  if (room.participants.length < 2) {
    return { error: "too_few_players" };
  }

  room.currentDrawerId = room.hostParticipantId;
  room.currentWord = getStarterWordForRoomCode(room.code);
  room.drawing = [];
  room.guessHistory = [];
  room.participants = room.participants.map((participant) => ({
    ...participant,
    score: 0,
    hasGuessedCorrectly: false
  }));
  assignRoles(room);
  room.status = "game";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

function findParticipant(room: Room, participantId: string) {
  const participantIndex = findParticipantIndex(room, participantId);

  if (participantIndex === -1) {
    return null;
  }

  return {
    participant: room.participants[participantIndex],
    participantIndex
  };
}

function isGameRoom(room: Room) {
  return room.status === "game" && Boolean(room.currentWord);
}

function appendDrawingStroke(room: Room, stroke: Stroke) {
  room.drawing.push({
    points: stroke.points.map((point) => ({ ...point })),
    color: stroke.color,
    lineWidth: stroke.lineWidth
  });
}

export function submitDrawingStroke(code: string, participantId: string, points: DrawingPoint[]):
  | { room: Room }
  | { error: GameActionFailureReason } {
  const room = rooms.get(code);

  if (!room) {
    return { error: "not_found" };
  }

  if (!isGameRoom(room)) {
    return { error: "not_in_game" };
  }

  const participantResult = findParticipant(room, participantId);

  if (!participantResult) {
    return { error: "not_member" };
  }

  if (participantResult.participant.id !== room.currentDrawerId) {
    return { error: "forbidden" };
  }

  appendDrawingStroke(room, {
    points,
    color: DRAWING_COLOR,
    lineWidth: DRAWING_LINE_WIDTH
  });
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function clearCanvas(code: string, participantId: string):
  | { room: Room }
  | { error: GameActionFailureReason } {
  const room = rooms.get(code);

  if (!room) {
    return { error: "not_found" };
  }

  if (!isGameRoom(room)) {
    return { error: "not_in_game" };
  }

  const participantResult = findParticipant(room, participantId);

  if (!participantResult) {
    return { error: "not_member" };
  }

  if (participantResult.participant.id !== room.currentDrawerId) {
    return { error: "forbidden" };
  }

  room.drawing = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function submitGuess(code: string, participantId: string, guessText: string):
  | { room: Room }
  | { error: GameActionFailureReason } {
  const room = rooms.get(code);

  if (!room) {
    return { error: "not_found" };
  }

  if (!isGameRoom(room)) {
    return { error: "not_in_game" };
  }

  const participantResult = findParticipant(room, participantId);

  if (!participantResult) {
    return { error: "not_member" };
  }

  const participant = participantResult.participant;

  if (participant.id === room.currentDrawerId) {
    return { error: "forbidden" };
  }

  const guess = displayName(guessText);

  if (!guess) {
    return { error: "empty_guess" };
  }

  if (participant.hasGuessedCorrectly) {
    return { error: "already_solved" };
  }

  const currentWord = room.currentWord?.trim().toLowerCase();

  if (!currentWord) {
    return { error: "not_in_game" };
  }

  const isCorrect = guess.toLowerCase() === currentWord;

  room.guessHistory.push({
    participantId: participant.id,
    participantName: participant.name,
    guess,
    isCorrect
  });

  if (isCorrect) {
    participant.score += 100;
    participant.hasGuessedCorrectly = true;
    room.status = "result";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function restartRoom(code: string, participantId: string):
  | { room: Room }
  | { error: RestartRoomFailureReason } {
  const room = rooms.get(code);

  if (!room) {
    return { error: "not_found" };
  }

  if (room.status !== "result") {
    return { error: "not_in_result" };
  }

  const participantResult = findParticipant(room, participantId);

  if (!participantResult || room.hostParticipantId !== participantId) {
    return { error: "forbidden" };
  }

  room.status = "lobby";
  room.currentDrawerId = null;
  room.currentWord = undefined;
  room.drawing = [];
  room.guessHistory = [];
  resetParticipantsForNextRound(room);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function leaveRoom(code: string, participantId: string):
  | { room: Room | null; deleted: boolean }
  | { error: LeaveRoomFailureReason } {
  const room = rooms.get(code);

  if (!room) {
    return { error: "not_found" };
  }

  const participantIndex = findParticipantIndex(room, participantId);

  if (participantIndex === -1) {
    return { error: "not_member" };
  }

  const isHost = room.hostParticipantId === participantId;
  const isDrawer = room.currentDrawerId === participantId;

  if (room.status === "game" && (isHost || isDrawer)) {
    rooms.delete(code);
    return { room: null, deleted: true };
  }

  room.participants.splice(participantIndex, 1);

  if (room.status === "lobby" && isHost) {
    rooms.delete(code);
    return { room: null, deleted: true };
  }

  if (room.participants.length === 0) {
    rooms.delete(code);
    return { room: null, deleted: true };
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room), deleted: false };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostParticipantId: room.hostParticipantId,
    currentDrawerId: room.currentDrawerId,
    participants: room.participants.map((participant) => ({ ...participant })),
    drawing: room.drawing.map((stroke) => ({
      points: stroke.points.map((point) => ({ ...point })),
      color: stroke.color,
      lineWidth: stroke.lineWidth
    })),
    guessHistory: room.guessHistory.map((entry) => ({ ...entry })),
    availableWords: listWords()
  };

  if (
    room.currentWord &&
    (room.status === "result" || (viewerParticipantId && viewerParticipantId === room.currentDrawerId))
  ) {
    snapshot.currentWord = room.currentWord;
  }

  return snapshot;
}

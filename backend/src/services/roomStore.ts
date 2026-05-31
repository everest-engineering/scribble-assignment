import { randomUUID } from "node:crypto";
import type { Guess, Point, Room, RoomSnapshot, Stroke } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { evaluateGuess } from "./guessService.js";
import { selectSecretWord } from "./wordSelection.js";

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

function createParticipant(name: string) {
  return {
    id: randomUUID(),
    name: name.trim(),
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

function emptyScores(participants: Room["participants"]): Record<string, number> {
  return Object.fromEntries(participants.map((participant) => [participant.id, 0]));
}

function findParticipant(room: Room, participantId: string) {
  return room.participants.find((participant) => participant.id === participantId) ?? null;
}

function assertPlaying(room: Room) {
  if (room.status !== "playing") {
    return { ok: false as const, reason: "not_playing" as const };
  }

  return { ok: true as const };
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
    drawerId: null,
    secretWord: null,
    scores: {},
    strokes: [],
    guesses: [],
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

export type JoinRoomResult =
  | { status: "joined"; room: Room; participantId: string }
  | { status: "not_found" }
  | { status: "in_progress" };

export function joinRoom(code: string, playerName: string): JoinRoomResult {
  const room = rooms.get(code);

  if (!room) {
    return { status: "not_found" };
  }

  if (room.status !== "lobby") {
    return { status: "in_progress" };
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    status: "joined",
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function getRoom(code: string) {
  const room = rooms.get(code);
  return room ? cloneRoom(room) : null;
}

export type StartGameResult =
  | { status: "started"; room: Room }
  | { status: "not_found" }
  | { status: "not_host" }
  | { status: "not_enough_players" }
  | { status: "already_started" };

export function startGame(code: string, participantId: string): StartGameResult {
  const room = rooms.get(code);

  if (!room) {
    return { status: "not_found" };
  }

  if (room.status !== "lobby") {
    return { status: "already_started" };
  }

  if (room.hostId !== participantId) {
    return { status: "not_host" };
  }

  if (room.participants.length < 2) {
    return { status: "not_enough_players" };
  }

  room.status = "playing";
  room.drawerId = room.hostId;
  room.secretWord = selectSecretWord(room.code);
  room.scores = emptyScores(room.participants);
  room.strokes = [];
  room.guesses = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    status: "started",
    room: cloneRoom(room)
  };
}

export type AppendStrokeResult =
  | { status: "appended"; room: Room }
  | { status: "not_found" }
  | { status: "not_playing" }
  | { status: "not_drawer" };

export function appendStroke(
  code: string,
  participantId: string,
  strokeInput: Omit<Stroke, "id"> & { id?: string }
): AppendStrokeResult {
  const room = rooms.get(code);

  if (!room) {
    return { status: "not_found" };
  }

  const playing = assertPlaying(room);
  if (!playing.ok) {
    return { status: "not_playing" };
  }

  if (room.drawerId !== participantId) {
    return { status: "not_drawer" };
  }

  if (strokeInput.points.length === 0) {
    return { status: "appended", room: cloneRoom(room) };
  }

  const stroke: Stroke = {
    id: strokeInput.id ?? randomUUID(),
    color: strokeInput.color,
    width: strokeInput.width,
    points: strokeInput.points.map((point: Point) => ({ ...point }))
  };

  room.strokes.push(stroke);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    status: "appended",
    room: cloneRoom(room)
  };
}

export type ClearStrokesResult =
  | { status: "cleared"; room: Room }
  | { status: "not_found" }
  | { status: "not_playing" }
  | { status: "not_drawer" };

export function clearStrokes(code: string, participantId: string): ClearStrokesResult {
  const room = rooms.get(code);

  if (!room) {
    return { status: "not_found" };
  }

  const playing = assertPlaying(room);
  if (!playing.ok) {
    return { status: "not_playing" };
  }

  if (room.drawerId !== participantId) {
    return { status: "not_drawer" };
  }

  room.strokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    status: "cleared",
    room: cloneRoom(room)
  };
}

export type SubmitGuessResult =
  | { status: "submitted"; room: Room }
  | { status: "not_found" }
  | { status: "not_playing" }
  | { status: "not_participant" }
  | { status: "is_drawer" }
  | { status: "invalid_guess"; message: string };

export function submitGuess(code: string, participantId: string, guess: string): SubmitGuessResult {
  const room = rooms.get(code);

  if (!room) {
    return { status: "not_found" };
  }

  const playing = assertPlaying(room);
  if (!playing.ok) {
    return { status: "not_playing" };
  }

  const participant = findParticipant(room, participantId);
  if (!participant) {
    return { status: "not_participant" };
  }

  if (room.drawerId === participantId) {
    return { status: "is_drawer" };
  }

  if (!room.secretWord) {
    return { status: "not_playing" };
  }

  try {
    const evaluation = evaluateGuess(guess, room.secretWord);
    const guessRecord: Guess = {
      id: randomUUID(),
      participantId: participant.id,
      participantName: participant.name,
      text: evaluation.text,
      correct: evaluation.correct,
      submittedAt: now()
    };

    room.guesses.push(guessRecord);

    if (evaluation.correct) {
      room.scores[participantId] = (room.scores[participantId] ?? 0) + 100;
      room.status = "result";
    }

    room.updatedAt = now();
    rooms.set(room.code, room);

    return {
      status: "submitted",
      room: cloneRoom(room)
    };
  } catch (error) {
    if (error instanceof Error && error.name === "GuessValidationError") {
      return { status: "invalid_guess", message: error.message };
    }

    throw error;
  }
}

function includesRoundFields(status: Room["status"]) {
  return status === "playing" || status === "result";
}

export type RestartRoomResult =
  | { status: "restarted"; room: Room }
  | { status: "not_found" }
  | { status: "not_host" }
  | { status: "not_result" };

export function restartRoom(code: string, participantId: string): RestartRoomResult {
  const room = rooms.get(code);

  if (!room) {
    return { status: "not_found" };
  }

  if (room.status !== "result") {
    return { status: "not_result" };
  }

  if (room.hostId !== participantId) {
    return { status: "not_host" };
  }

  room.status = "lobby";
  room.drawerId = null;
  room.secretWord = null;
  room.scores = {};
  room.strokes = [];
  room.guesses = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    status: "restarted",
    room: cloneRoom(room)
  };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  void viewerParticipantId;

  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    drawerId: room.drawerId,
    participants: room.participants.map((participant) => ({ ...participant })),
    scores: includesRoundFields(room.status) ? { ...room.scores } : {},
    strokes: includesRoundFields(room.status)
      ? room.strokes.map((stroke) => structuredClone(stroke))
      : [],
    guesses: includesRoundFields(room.status) ? room.guesses.map((guess) => ({ ...guess })) : [],
    roles: [...STARTER_ROLES]
  };

  if (room.status === "lobby") {
    snapshot.availableWords = listWords();
    return snapshot;
  }

  if (room.status === "result" && room.secretWord) {
    snapshot.secretWord = room.secretWord;
    return snapshot;
  }

  if (room.status === "playing" && viewerParticipantId === room.drawerId && room.secretWord) {
    snapshot.secretWord = room.secretWord;
  }

  return snapshot;
}

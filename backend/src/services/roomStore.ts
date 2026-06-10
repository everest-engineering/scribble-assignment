import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot, HostAwareRoomSnapshot, Stroke, Guess } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { HttpError } from "../api/schemas.js";

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
    participants: [participant],
    hostParticipantId: participant.id,
    canvasState: { strokes: [] },
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
  if (!room) return null;

  // Ensure hostParticipantId refers to an existing participant
  const hostId = room.hostParticipantId;
  const hostExists = room.participants.some((p) => p.id === hostId);

  if (!hostExists && room.participants.length > 0) {
    room.hostParticipantId = room.participants[0].id;
    rooms.set(room.code, cloneRoom(room));
  }

  return cloneRoom(room);
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code)!;
}

export function startRoom(code: string, callerParticipantId: string) {
  const room = rooms.get(code);
  if (!room) {
    throw new HttpError(404, "Room not found", {
      error: "room_not_found",
      message: "Room not found",
    });
  }

  if (room.hostParticipantId !== callerParticipantId) {
    throw new HttpError(403, "Only the host may start the game", {
      error: "not_host",
      message: "Only the host may start the game",
    });
  }

  if (room.participants.length < 2) {
    throw new HttpError(400, "At least 2 players required to start", {
      error: "not_enough_players",
      message: "At least 2 players required to start",
    });
  }

  if (room.status !== "lobby") {
    throw new HttpError(400, "Game has already started", {
      error: "already_started",
      message: "Game has already started",
    });
  }

  const roundNumber = 1;
  const wordIndex = (room.participants.length + roundNumber) % STARTER_WORDS.length;
  const secretWord = STARTER_WORDS[wordIndex];

  const scores: Record<string, number> = {};
  for (const p of room.participants) {
    scores[p.id] = 0;
  }

  room.status = "playing";
  room.currentRound = {
    roundNumber,
    drawerParticipantId: room.hostParticipantId,
    secretWord,
    scores,
    guesses: [],
    isComplete: false,
  };
  room.canvasState = { strokes: [] };
  room.updatedAt = now();

  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code)!;
}

export function updateCanvas(code: string, participantId: string, strokes: Stroke[]) {
  const room = rooms.get(code);
  if (!room) {
    throw new HttpError(404, "Room not found", {
      error: "room_not_found",
      message: "Room not found",
    });
  }

  if (room.status !== "playing") {
    throw new HttpError(400, "Room is not in playing state", {
      error: "not_playing",
      message: "Room is not in playing state",
    });
  }

  if (room.currentRound?.drawerParticipantId !== participantId) {
    throw new HttpError(403, "Only the drawer may update the canvas", {
      error: "not_drawer",
      message: "Only the drawer may update the canvas",
    });
  }

  room.canvasState = { strokes };
  room.updatedAt = now();

  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code)!;
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);
  if (!room) {
    throw new HttpError(404, "Room not found", {
      error: "room_not_found",
      message: "Room not found",
    });
  }

  if (room.status !== "playing") {
    throw new HttpError(400, "Room is not in playing state", {
      error: "not_playing",
      message: "Room is not in playing state",
    });
  }

  const round = room.currentRound;
  if (!round) {
    throw new HttpError(400, "No active round", {
      error: "no_round",
      message: "No active round",
    });
  }

  if (round.drawerParticipantId === participantId) {
    throw new HttpError(403, "Drawers cannot guess", {
      error: "drawers_cannot_guess",
      message: "Drawers cannot guess",
    });
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new HttpError(400, "Guess cannot be empty", {
      error: "guess_empty",
      message: "Guess cannot be empty",
    });
  }

  // Check if this guesser already guessed correctly
  const alreadyCorrect = round.guesses.some(
    (g) => g.participantId === participantId && g.isCorrect
  );
  if (alreadyCorrect) {
    throw new HttpError(400, "You already guessed correctly", {
      error: "already_guessed_correctly",
      message: "You already guessed correctly",
    });
  }

  const isCorrect = trimmed.toLowerCase() === round.secretWord!.toLowerCase();
  const guess: Guess = {
    participantId,
    text: trimmed,
    isCorrect,
    timestamp: now(),
  };

  round.guesses.push(guess);

  if (isCorrect) {
    round.scores[participantId] = (round.scores[participantId] || 0) + 100;
  }

  // Check if all guessers have guessed correctly
  const guesserIds = room.participants
    .filter((p) => p.id !== round.drawerParticipantId)
    .map((p) => p.id);

  const allCorrect = guesserIds.every((gId) =>
    round.guesses.some((g) => g.participantId === gId && g.isCorrect)
  );

  if (allCorrect) {
    round.isComplete = true;
    room.status = "result";
  }

  room.updatedAt = now();

  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code)!;
}

export function restartRoom(code: string, callerParticipantId: string) {
  const room = rooms.get(code);
  if (!room) {
    throw new HttpError(404, "Room not found", {
      error: "room_not_found",
      message: "Room not found",
    });
  }

  if (room.hostParticipantId !== callerParticipantId) {
    throw new HttpError(403, "Only the host may restart the game", {
      error: "not_host",
      message: "Only the host may restart the game",
    });
  }

  if (room.status !== "result" && room.status !== "playing") {
    throw new HttpError(400, "Room is not in a state that can be restarted", {
      error: "cannot_restart",
      message: "Room is not in a state that can be restarted",
    });
  }

  room.status = "lobby";
  delete room.currentRound;
  room.canvasState = { strokes: [] };
  room.updatedAt = now();

  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code)!;
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): HostAwareRoomSnapshot {
  const hostParticipantId = room.hostParticipantId;
  const snapshot: HostAwareRoomSnapshot = {
    code: room.code,
    status: room.status,
    participants: room.participants.map((p) => ({ ...p })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    hostParticipantId,
    viewerIsHost: viewerParticipantId !== undefined && hostParticipantId === viewerParticipantId,
    currentRound: room.currentRound ? structuredClone(room.currentRound) : undefined,
    canvasState: { strokes: [...room.canvasState.strokes] },
  };

  // Hide secret word from non-drawers during playing state
  if (
    snapshot.status === "playing" &&
    snapshot.currentRound &&
    viewerParticipantId !== snapshot.currentRound.drawerParticipantId
  ) {
    snapshot.currentRound.secretWord = null;
  }

  return snapshot;
}

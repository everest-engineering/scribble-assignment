import { randomUUID } from "node:crypto";
import type {
  GuessEntry,
  LobbyParticipantRole,
  Participant,
  ParticipantRole,
  Room,
  RoomSnapshot,
  ScoreEntry
} from "../models/game.js";
import { STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const REDACTED_CORRECT_GUESS_TEXT = "[correct guess]";

export type JoinRoomResult =
  | {
      ok: true;
      room: Room;
      participantId: string;
    }
  | {
      ok: false;
      reason: "not_found" | "already_started";
    };

export type StartRoomResult =
  | {
      ok: true;
      room: Room;
    }
  | {
      ok: false;
      reason: "not_found" | "already_started" | "not_host" | "not_enough_players";
    };

export type SubmitGuessResult =
  | {
      ok: true;
      room: Room;
    }
  | {
      ok: false;
      reason: "not_found" | "not_allowed" | "not_playing" | "invalid_guess";
    };

export type RestartRoomResult =
  | {
      ok: true;
      room: Room;
    }
  | {
      ok: false;
      reason: "not_found" | "not_host" | "not_result";
    };

function now() {
  return new Date().toISOString();
}

function generateCode() {
  let code = "";

  for (let index = 0; index < 4; index += 1) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
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

function normalizePlayerName(name: string) {
  return name.trim();
}

export function normalizeGuessText(guessText: string) {
  return guessText.trim();
}

function createParticipant(name: string, role: LobbyParticipantRole): Participant {
  return {
    id: randomUUID(),
    name: normalizePlayerName(name),
    joinedAt: now(),
    role
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function getDrawerId(room: Room) {
  return room.hostId;
}

export function getGuesserIds(room: Room) {
  return room.participants
    .filter((participant) => participant.id !== room.hostId)
    .map((participant) => participant.id);
}

export function getSecretWord(words: readonly string[] = STARTER_WORDS) {
  return words[0];
}

export function getViewerRole(room: Room, viewerParticipantId?: string): ParticipantRole {
  if (viewerParticipantId && room.drawerId === viewerParticipantId) {
    return "drawer";
  }

  return "guesser";
}

export function createStartedRoundState(room: Room) {
  return {
    drawerId: getDrawerId(room),
    guesserIds: getGuesserIds(room),
    secretWord: getSecretWord(),
    guessHistory: [] as GuessEntry[],
    scores: createInitialScores(room),
    winnerId: undefined,
    endedAt: undefined
  };
}

export function createInitialScores(room: Room) {
  return Object.fromEntries(room.participants.map((participant) => [participant.id, 0]));
}

export function canParticipantGuess(room: Room, participantId: string) {
  return room.guesserIds.includes(participantId);
}

export function isCorrectGuess(secretWord: string, guessText: string) {
  return normalizeGuessText(secretWord).toLowerCase() === normalizeGuessText(guessText).toLowerCase();
}

function createGuessEntry(participantId: string, guessText: string, isCorrect: boolean): GuessEntry {
  return {
    id: randomUUID(),
    participantId,
    text: normalizeGuessText(guessText),
    submittedAt: now(),
    isCorrect
  };
}

function getScoreEntries(room: Room): ScoreEntry[] {
  return room.participants.map((participant) => ({
    participantId: participant.id,
    score: room.scores[participant.id] ?? 0
  }));
}

function getVisibleGuessHistory(room: Room, viewerRole: ParticipantRole) {
  if (room.status === "result" || viewerRole === "drawer") {
    return room.guessHistory.map((guessEntry) => ({ ...guessEntry }));
  }

  return room.guessHistory.map((guessEntry) => ({
    ...guessEntry,
    text: guessEntry.isCorrect ? REDACTED_CORRECT_GUESS_TEXT : guessEntry.text
  }));
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName, "host");
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    guesserIds: [],
    guessHistory: [],
    scores: {},
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function createRestartedLobbyState(room: Room) {
  return {
    ...room,
    status: "lobby" as const,
    drawerId: undefined,
    guesserIds: [],
    secretWord: undefined,
    guessHistory: [] as GuessEntry[],
    scores: {},
    winnerId: undefined,
    endedAt: undefined
  };
}

export function joinRoom(code: string, playerName: string): JoinRoomResult {
  const room = rooms.get(code);

  if (!room) {
    return {
      ok: false,
      reason: "not_found"
    };
  }

  if (room.status !== "lobby") {
    return {
      ok: false,
      reason: "already_started"
    };
  }

  const participant = createParticipant(playerName, "player");
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    ok: true,
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

export function startRoom(code: string, participantId: string): StartRoomResult {
  const room = rooms.get(code);

  if (!room) {
    return {
      ok: false,
      reason: "not_found"
    };
  }

  if (room.status !== "lobby") {
    return {
      ok: false,
      reason: "already_started"
    };
  }

  if (room.hostId !== participantId) {
    return {
      ok: false,
      reason: "not_host"
    };
  }

  if (room.participants.length < 2) {
    return {
      ok: false,
      reason: "not_enough_players"
    };
  }

  const startedRoundState = createStartedRoundState(room);

  room.status = "playing";
  room.drawerId = startedRoundState.drawerId;
  room.guesserIds = startedRoundState.guesserIds;
  room.secretWord = startedRoundState.secretWord;
  room.guessHistory = startedRoundState.guessHistory;
  room.scores = startedRoundState.scores;
  room.winnerId = startedRoundState.winnerId;
  room.endedAt = startedRoundState.endedAt;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    ok: true,
    room: cloneRoom(room)
  };
}

export function submitGuess(code: string, participantId: string, guessText: string): SubmitGuessResult {
  const room = rooms.get(code);

  if (!room) {
    return {
      ok: false,
      reason: "not_found"
    };
  }

  if (room.status !== "playing") {
    return {
      ok: false,
      reason: "not_playing"
    };
  }

  if (!canParticipantGuess(room, participantId)) {
    return {
      ok: false,
      reason: "not_allowed"
    };
  }

  const normalizedGuess = normalizeGuessText(guessText);

  if (!normalizedGuess) {
    return {
      ok: false,
      reason: "invalid_guess"
    };
  }

  const secretWord = room.secretWord ?? "";
  const correct = Boolean(secretWord) && isCorrectGuess(secretWord, normalizedGuess);
  const guessEntry = createGuessEntry(participantId, normalizedGuess, correct);

  room.guessHistory.push(guessEntry);

  if (correct && !room.winnerId) {
    room.status = "result";
    room.winnerId = participantId;
    room.endedAt = now();
    room.scores[participantId] = 100;
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    ok: true,
    room: cloneRoom(room)
  };
}

export function restartRoom(code: string, participantId: string): RestartRoomResult {
  const room = rooms.get(code);

  if (!room) {
    return {
      ok: false,
      reason: "not_found"
    };
  }

  if (room.hostId !== participantId) {
    return {
      ok: false,
      reason: "not_host"
    };
  }

  if (room.status !== "result") {
    return {
      ok: false,
      reason: "not_result"
    };
  }

  const restartedRoom = createRestartedLobbyState(room);
  restartedRoom.updatedAt = now();
  rooms.set(restartedRoom.code, restartedRoom);

  return {
    ok: true,
    room: cloneRoom(restartedRoom)
  };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant }))
  };

  if ((room.status !== "playing" && room.status !== "result") || !room.drawerId) {
    return snapshot;
  }

  const viewerRole = getViewerRole(room, viewerParticipantId);

  return {
    ...snapshot,
    drawerId: room.drawerId,
    viewerRole,
    guessHistory: getVisibleGuessHistory(room, viewerRole),
    scores: getScoreEntries(room),
    ...(room.winnerId ? { winnerId: room.winnerId } : {}),
    ...((room.status === "result" || viewerRole === "drawer") && room.secretWord
      ? { secretWord: room.secretWord }
      : {})
  };
}

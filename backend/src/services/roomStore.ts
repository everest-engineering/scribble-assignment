import { randomUUID } from "node:crypto";
import type {
  CanvasState,
  DrawingPoint,
  GuessHistoryEntry,
  Participant,
  Room,
  RoomSnapshot,
  ScoreAward,
  StoredGuessEntry
} from "../models/game.js";
import { STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();
const MINIMUM_PLAYERS_TO_START = 2;

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
  const trimmedName = name?.trim();
  return trimmedName && trimmedName.length > 0 ? trimmedName : "Player";
}

function createParticipant(name?: string): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    joinedAt: now(),
    score: 0
  };
}

function createEmptyCanvas(): CanvasState {
  return {
    strokes: []
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

function getDrawer(room: Room) {
  return room.participants.find((participant) => participant.id === room.hostParticipantId) ?? room.participants[0];
}

function getParticipant(room: Room, participantId?: string) {
  if (!participantId) {
    return undefined;
  }

  return room.participants.find((participant) => participant.id === participantId);
}

function hashSeed(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash + value.charCodeAt(index) * (index + 1)) % 2_147_483_647;
  }

  return hash;
}

function getSecretWord(room: Room, drawer: Participant) {
  const participantSeed = room.participants.map((participant) => participant.name).join("|");
  const selectionSeed = `${participantSeed}:${drawer.name}:${room.participants.length}`;
  return STARTER_WORDS[hashSeed(selectionSeed) % STARTER_WORDS.length];
}

function normalizeGuess(guess: string) {
  return guess.trim().toLowerCase();
}

function toGuessHistoryEntry(entry: StoredGuessEntry): GuessHistoryEntry {
  return {
    id: entry.id,
    participantId: entry.participantId,
    participantName: entry.participantName,
    guess: entry.guess,
    isCorrect: entry.isCorrect,
    scoreAwarded: entry.scoreAwarded,
    submittedAt: entry.submittedAt
  };
}

type RoomActionResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not-found" | "forbidden" | "conflict"; message: string };

type ActiveRoundRoom = Room & { round: NonNullable<Room["round"]> };

type ActiveRoundActionResult =
  | { ok: true; room: ActiveRoundRoom }
  | { ok: false; reason: "not-found" | "forbidden" | "conflict"; message: string };

function canStartRoom(room: Room, viewerParticipantId?: string) {
  return (
    room.status === "lobby" &&
    room.participants.length >= MINIMUM_PLAYERS_TO_START &&
    room.hostParticipantId === viewerParticipantId
  );
}

function getActiveRoundRoom(code: string): ActiveRoundActionResult {
  const room = rooms.get(code);

  if (!room) {
    return {
      ok: false,
      reason: "not-found",
      message: "Room code was not found"
    };
  }

  if (room.status !== "playing" || !room.round) {
    return {
      ok: false,
      reason: "conflict",
      message: "Game is not in an active round"
    };
  }

  return {
    ok: true,
    room: room as ActiveRoundRoom
  };
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName);
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

export function startRoom(code: string, participantId: string): RoomActionResult {
  const room = rooms.get(code);

  if (!room) {
    return {
      ok: false,
      reason: "not-found",
      message: "Room code was not found"
    };
  }

  if (room.hostParticipantId !== participantId) {
    return {
      ok: false,
      reason: "forbidden",
      message: "Only the host can start the game"
    };
  }

  if (room.status !== "lobby") {
    return {
      ok: false,
      reason: "conflict",
      message: "Game has already started"
    };
  }

  if (room.participants.length < MINIMUM_PLAYERS_TO_START) {
    return {
      ok: false,
      reason: "conflict",
      message: `At least ${MINIMUM_PLAYERS_TO_START} players are required to start the game`
    };
  }

  const drawer = getDrawer(room);

  room.participants = room.participants.map((participant) => ({
    ...participant,
    score: 0
  }));
  room.status = "playing";
  room.round = {
    drawerParticipantId: drawer.id,
    secretWord: getSecretWord(room, drawer),
    startedAt: now(),
    canvas: createEmptyCanvas(),
    guessHistory: []
  };
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    ok: true,
    room: cloneRoom(room)
  };
}

export function addDrawingStroke(code: string, participantId: string, points: DrawingPoint[]): RoomActionResult {
  const activeRoom = getActiveRoundRoom(code);

  if (!activeRoom.ok) {
    return activeRoom;
  }

  const { room } = activeRoom;
  const { round } = room;
  const participant = getParticipant(room, participantId);

  if (!participant) {
    return {
      ok: false,
      reason: "forbidden",
      message: "Only room participants can draw on the canvas"
    };
  }

  if (round.drawerParticipantId !== participantId) {
    return {
      ok: false,
      reason: "forbidden",
      message: "Only the drawer can update the canvas"
    };
  }

  round.canvas.strokes.push({
    id: randomUUID(),
    points: points.map((point) => ({ ...point })),
    drawnByParticipantId: participantId,
    createdAt: now()
  });
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    ok: true,
    room: cloneRoom(room)
  };
}

export function clearRoomCanvas(code: string, participantId: string): RoomActionResult {
  const activeRoom = getActiveRoundRoom(code);

  if (!activeRoom.ok) {
    return activeRoom;
  }

  const { room } = activeRoom;
  const { round } = room;
  const participant = getParticipant(room, participantId);

  if (!participant) {
    return {
      ok: false,
      reason: "forbidden",
      message: "Only room participants can clear the canvas"
    };
  }

  if (round.drawerParticipantId !== participantId) {
    return {
      ok: false,
      reason: "forbidden",
      message: "Only the drawer can clear the canvas"
    };
  }

  round.canvas = {
    strokes: [],
    clearedAt: now()
  };
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    ok: true,
    room: cloneRoom(room)
  };
}

export function submitGuess(code: string, participantId: string, guess: string): RoomActionResult {
  const activeRoom = getActiveRoundRoom(code);

  if (!activeRoom.ok) {
    return activeRoom;
  }

  const { room } = activeRoom;
  const { round } = room;
  const participant = getParticipant(room, participantId);

  if (!participant) {
    return {
      ok: false,
      reason: "forbidden",
      message: "Only room participants can submit guesses"
    };
  }

  if (round.drawerParticipantId === participantId) {
    return {
      ok: false,
      reason: "forbidden",
      message: "Drawer cannot submit guesses"
    };
  }

  const trimmedGuess = guess.trim();
  const normalizedGuess = normalizeGuess(trimmedGuess);
  const isCorrect = normalizedGuess === normalizeGuess(round.secretWord);
  const scoreAwarded: ScoreAward = isCorrect ? 100 : 0;

  round.guessHistory.push({
    id: randomUUID(),
    participantId,
    participantName: participant.name,
    guess: trimmedGuess,
    normalizedGuess,
    isCorrect,
    scoreAwarded,
    submittedAt: now()
  });
  participant.score += scoreAwarded;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    ok: true,
    room: cloneRoom(room)
  };
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const viewerParticipant = getParticipant(room, viewerParticipantId);
  const viewerIsHost = room.hostParticipantId === viewerParticipantId;
  const viewerIsDrawer = room.round?.drawerParticipantId === viewerParticipantId;
  const viewerCanDraw = room.status === "playing" && viewerIsDrawer;
  const viewerCanGuess = room.status === "playing" && Boolean(viewerParticipant) && !viewerIsDrawer;

  return {
    code: room.code,
    status: room.status,
    hostParticipantId: room.hostParticipantId,
    participants: room.participants.map((participant) => ({ ...participant })),
    viewerIsHost,
    canStartGame: canStartRoom(room, viewerParticipantId),
    minimumPlayersToStart: MINIMUM_PLAYERS_TO_START,
    drawerParticipantId: room.round?.drawerParticipantId,
    viewerIsDrawer,
    viewerCanDraw,
    viewerCanGuess,
    wordVisibility: room.round ? (viewerIsDrawer ? "visible" : "hidden") : undefined,
    secretWord: viewerIsDrawer ? room.round?.secretWord : undefined,
    canvas: room.round
      ? {
          strokes: room.round.canvas.strokes.map((stroke) => ({
            ...stroke,
            points: stroke.points.map((point) => ({ ...point }))
          })),
          clearedAt: room.round.canvas.clearedAt
        }
      : undefined,
    guessHistory: room.round ? room.round.guessHistory.map(toGuessHistoryEntry) : undefined
  };
}

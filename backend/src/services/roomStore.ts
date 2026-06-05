import { randomUUID } from "node:crypto";
import type { DrawingState, Participant, Room, RoomSnapshot } from "../models/game.js";
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

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function createParticipant(name: string): Participant {
  return {
    id: randomUUID(),
    name: name.trim(),
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

function emptyDrawing(): DrawingState {
  return { strokes: [] };
}

function getScores(room: Room) {
  return Object.fromEntries(room.participants.map((participant) => [participant.id, room.scores?.[participant.id] ?? 0]));
}

function findParticipant(room: Room, participantId: string) {
  return room.participants.find((participant) => participant.id === participantId) ?? null;
}

function requirePlayingRoom(room: Room) {
  if (room.status !== "playing" || !room.drawerParticipantId || !room.word) {
    return {
      ok: false as const,
      statusCode: 400,
      message: "Round is not active"
    };
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

export function joinRoom(code: string, playerName: string) {
  const room = rooms.get(normalizeCode(code));

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
  const room = rooms.get(normalizeCode(code));
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const drawer = room.drawerParticipantId
    ? room.participants.find((participant) => participant.id === room.drawerParticipantId) ?? null
    : null;
  const hasRoundDrawer = room.status === "playing" || room.status === "result";
  const canSeeSecretWord = Boolean(
    room.status === "playing" &&
      room.word &&
      room.drawerParticipantId &&
      viewerParticipantId === room.drawerParticipantId
  );

  return {
    code: room.code,
    status: room.status,
    hostParticipantId: room.hostParticipantId,
    isHost: viewerParticipantId === room.hostParticipantId,
    drawerParticipantId: hasRoundDrawer ? room.drawerParticipantId ?? null : null,
    drawerName: hasRoundDrawer ? drawer?.name ?? null : null,
    secretWord: canSeeSecretWord ? room.word ?? null : null,
    correctWord: room.status === "result" ? room.word ?? null : null,
    scores: room.participants.map((participant) => ({
      participantId: participant.id,
      participantName: participant.name,
      score: room.scores?.[participant.id] ?? 0
    })),
    drawing: room.drawing ? structuredClone(room.drawing) : emptyDrawing(),
    guesses: room.guesses ? room.guesses.map((guess) => ({ ...guess })) : [],
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}

export type StartGameResult =
  | {
      ok: true;
      room: Room;
    }
  | {
      ok: false;
      statusCode: number;
      message: string;
    };

export function startGame(code: string, participantId: string): StartGameResult {
  const room = rooms.get(normalizeCode(code));

  if (!room) {
    return {
      ok: false,
      statusCode: 404,
      message: "Unable to load room"
    };
  }

  const participantExists = room.participants.some((participant) => participant.id === participantId);

  if (!participantExists) {
    return {
      ok: false,
      statusCode: 403,
      message: "Participant is not in this room"
    };
  }

  if (room.hostParticipantId !== participantId) {
    return {
      ok: false,
      statusCode: 403,
      message: "Only the host can start the game"
    };
  }

  if (room.participants.length < 2) {
    return {
      ok: false,
      statusCode: 400,
      message: "At least 2 players are required to start"
    };
  }

  const [word] = STARTER_WORDS;

  if (!word) {
    return {
      ok: false,
      statusCode: 500,
      message: "No starter words are available"
    };
  }

  room.status = "playing";
  room.drawerParticipantId = room.participants[0].id;
  room.word = word;
  room.scores = getScores(room);
  room.drawing = emptyDrawing();
  room.guesses = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    ok: true,
    room: cloneRoom(room)
  };
}

export type RoomActionResult =
  | {
      ok: true;
      room: Room;
    }
  | {
      ok: false;
      statusCode: number;
      message: string;
    };

function getMutableRoom(code: string): RoomActionResult {
  const room = rooms.get(normalizeCode(code));

  if (!room) {
    return {
      ok: false,
      statusCode: 404,
      message: "Unable to load room"
    };
  }

  return { ok: true, room };
}

function saveActionRoom(room: Room): RoomActionResult {
  room.updatedAt = now();
  rooms.set(room.code, room);
  return { ok: true, room: cloneRoom(room) };
}

export function updateDrawing(code: string, participantId: string, drawing: DrawingState): RoomActionResult {
  const roomResult = getMutableRoom(code);

  if (!roomResult.ok) {
    return roomResult;
  }

  const room = roomResult.room;
  const playingResult = requirePlayingRoom(room);

  if (!playingResult.ok) {
    return playingResult;
  }

  const participant = findParticipant(room, participantId);

  if (!participant) {
    return {
      ok: false,
      statusCode: 403,
      message: "Participant is not in this room"
    };
  }

  if (room.drawerParticipantId !== participantId) {
    return {
      ok: false,
      statusCode: 403,
      message: "Only the drawer can update the drawing"
    };
  }

  room.drawing = structuredClone(drawing);
  return saveActionRoom(room);
}

export function clearDrawing(code: string, participantId: string): RoomActionResult {
  const roomResult = getMutableRoom(code);

  if (!roomResult.ok) {
    return roomResult;
  }

  return updateDrawing(roomResult.room.code, participantId, emptyDrawing());
}

export function submitGuess(code: string, participantId: string, guessText: string): RoomActionResult {
  const roomResult = getMutableRoom(code);

  if (!roomResult.ok) {
    return roomResult;
  }

  const room = roomResult.room;
  const playingResult = requirePlayingRoom(room);

  if (!playingResult.ok) {
    return playingResult;
  }

  const participant = findParticipant(room, participantId);

  if (!participant) {
    return {
      ok: false,
      statusCode: 403,
      message: "Participant is not in this room"
    };
  }

  if (room.drawerParticipantId === participantId) {
    return {
      ok: false,
      statusCode: 403,
      message: "The drawer cannot submit guesses"
    };
  }

  const trimmedGuess = guessText.trim();

  if (!trimmedGuess) {
    return {
      ok: false,
      statusCode: 400,
      message: "Guess is required"
    };
  }

  const isCorrect = trimmedGuess.toLocaleLowerCase() === room.word!.toLocaleLowerCase();
  const currentScores = getScores(room);
  const alreadyCorrect = (room.guesses ?? []).some(
    (guess) => guess.participantId === participantId && guess.isCorrect
  );
  const scoreDelta = isCorrect && !alreadyCorrect ? 100 : 0;
  room.scores = {
    ...currentScores,
    [participantId]: Math.min(100, currentScores[participantId] + scoreDelta)
  };
  room.guesses = [
    ...(room.guesses ?? []),
    {
      id: randomUUID(),
      participantId,
      participantName: participant.name,
      text: trimmedGuess,
      isCorrect,
      scoreDelta,
      submittedAt: now()
    }
  ];

  if (isCorrect) {
    room.status = "result";
  }

  return saveActionRoom(room);
}

export function restartGame(code: string, participantId: string): RoomActionResult {
  const roomResult = getMutableRoom(code);

  if (!roomResult.ok) {
    return roomResult;
  }

  const room = roomResult.room;
  const participant = findParticipant(room, participantId);

  if (!participant) {
    return {
      ok: false,
      statusCode: 403,
      message: "Participant is not in this room"
    };
  }

  if (room.hostParticipantId !== participantId) {
    return {
      ok: false,
      statusCode: 403,
      message: "Only the host can restart the room"
    };
  }

  if (room.status !== "result") {
    return {
      ok: false,
      statusCode: 400,
      message: "Room is not ready to restart"
    };
  }

  room.status = "lobby";
  delete room.drawerParticipantId;
  delete room.word;
  delete room.scores;
  delete room.drawing;
  delete room.guesses;

  return saveActionRoom(room);
}

export function resetRoomsForTests() {
  rooms.clear();
}

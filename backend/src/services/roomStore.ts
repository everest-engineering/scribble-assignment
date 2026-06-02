import { randomUUID } from "node:crypto";
import type {
  DrawingPath,
  Participant,
  Room,
  RoomSnapshot,
} from "../models/game.js";
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

function displayName(name?: string) {
  return name || "Player";
}

function createParticipant(name?: string, isHost = false): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    joinedAt: now(),
    isHost,
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

function selectSecretWord(room: Room) {
  const seed = [...room.code, room.createdAt]
    .flatMap((character) => character.codePointAt(0) ?? 0)
    .reduce((sum, code) => sum + code, 0);

  return STARTER_WORDS[seed % STARTER_WORDS.length];
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName, true);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    scores: { [participant.id]: 0 },
    guesses: [],
    drawingPaths: [],
    createdAt: now(),
    updatedAt: now(),
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id,
  };
}

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return null;
  }

  const participant = createParticipant(playerName, false);
  room.participants.push(participant);
  room.scores[participant.id] = 0;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id,
  };
}

export function getRoom(code: string) {
  const room = rooms.get(code.toUpperCase());
  return room ? cloneRoom(room) : null;
}

export function leaveRoom(code: string, participantId: string) {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return null;
  }

  const participantIndex = room.participants.findIndex(
    (p) => p.id === participantId,
  );

  if (participantIndex === -1) {
    return cloneRoom(room);
  }

  const [removedParticipant] = room.participants.splice(participantIndex, 1);
  delete room.scores[participantId];

  if (room.participants.length === 0) {
    rooms.delete(code.toUpperCase());
    return null;
  }

  if (removedParticipant.isHost) {
    // Assign new host
    room.participants[0].isHost = true;
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function startRoom(room: Room, participantId: string) {
  const host = room.participants.find((participant) => participant.isHost);

  if (!host || host.id !== participantId) {
    throw new Error("Only the host may start the game");
  }

  if (room.participants.length < 2) {
    throw new Error("At least two players are required to start the game");
  }

  if (room.status === "active") {
    return room;
  }

  const drawer = host || room.participants[0];
  room.drawerId = drawer.id;
  room.secretWord = selectSecretWord(room);
  room.status = "active";

  return saveRoom(room);
}

export function submitGuess(room: Room, participantId: string, guess: string) {
  const participant = room.participants.find((p) => p.id === participantId);

  if (!participant) {
    throw new Error("Participant not found");
  }

  if (room.drawerId === participantId) {
    throw new Error("The drawer cannot submit guesses");
  }

  if (room.status !== "active") {
    throw new Error("Guessing is only allowed during an active game");
  }

  const trimmedGuess = guess.trim();

  if (!trimmedGuess) {
    throw new Error("Guess is required");
  }

  const correct =
    typeof room.secretWord === "string" &&
    room.secretWord.toLowerCase() === trimmedGuess.toLowerCase();

  if (correct) {
    room.scores[participantId] = (room.scores[participantId] ?? 0) + 100;
  }

  room.guesses.push({
    participantId,
    participantName: participant.name,
    guess: trimmedGuess,
    correct,
    createdAt: now(),
  });

  if (correct) {
    room.status = "results";
  }

  return saveRoom(room);
}

export function restartRoom(room: Room, participantId: string) {
  const host = room.participants.find((participant) => participant.isHost);

  if (!host || host.id !== participantId) {
    throw new Error("Only the host may restart the game");
  }

  if (room.status === "lobby") {
    return room;
  }

  room.status = "lobby";
  room.drawerId = undefined;
  room.secretWord = undefined;
  room.drawingPaths = [];
  room.guesses = [];

  // Reset all participant scores to zero
  for (const participantId of Object.keys(room.scores)) {
    room.scores[participantId] = 0;
  }

  return saveRoom(room);
}

export function appendDrawing(
  room: Room,
  participantId: string,
  path: Pick<DrawingPath, "points"> &
    Partial<Pick<DrawingPath, "color" | "width">>,
) {
  if (room.drawerId !== participantId) {
    throw new Error("Only the drawer can draw on the canvas");
  }

  if (room.status !== "active") {
    throw new Error("Drawing is only allowed during an active game");
  }

  if (!path.points || path.points.length === 0) {
    throw new Error("A drawing path must contain at least one point");
  }

  room.drawingPaths.push({
    points: path.points,
    color: path.color ?? "#000000",
    width: path.width ?? 2,
  });

  return saveRoom(room);
}

export function clearDrawing(room: Room, participantId: string) {
  if (room.drawerId !== participantId) {
    throw new Error("Only the drawer can clear the canvas");
  }

  if (room.status !== "active") {
    throw new Error("Drawing is only allowed during an active game");
  }

  room.drawingPaths = [];
  return saveRoom(room);
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  const savedRoom = cloneRoom(room);
  rooms.set(room.code, savedRoom);
  return savedRoom;
}

export function toRoomSnapshot(
  room: Room,
  viewerParticipantId?: string,
): RoomSnapshot {
  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    drawerId: room.drawerId,
    secretWord:
      room.status === "results"
        ? room.secretWord
        : room.drawerId === viewerParticipantId
          ? room.secretWord
          : undefined,
    scores: { ...room.scores },
    guesses: room.guesses.map((guess) => ({ ...guess })),
    drawingPaths: room.drawingPaths.map((path) => ({ ...path })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
  };
}

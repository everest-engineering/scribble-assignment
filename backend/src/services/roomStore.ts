import { randomUUID } from "node:crypto";
import type {
  LobbyParticipantRole,
  Participant,
  ParticipantRole,
  Room,
  RoomSnapshot
} from "../models/game.js";
import { STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

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

function getDrawerId(room: Room) {
  return room.hostId;
}

function getGuesserIds(room: Room) {
  return room.participants
    .filter((participant) => participant.id !== room.hostId)
    .map((participant) => participant.id);
}

function getSecretWord() {
  return STARTER_WORDS[0];
}

function getViewerRole(room: Room, viewerParticipantId?: string): ParticipantRole {
  if (viewerParticipantId && room.drawerId === viewerParticipantId) {
    return "drawer";
  }

  return "guesser";
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName, "host");
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    guesserIds: [],
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
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

  room.status = "playing";
  room.drawerId = getDrawerId(room);
  room.guesserIds = getGuesserIds(room);
  room.secretWord = getSecretWord();
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    ok: true,
    room: cloneRoom(room)
  };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant }))
  };

  if (room.status !== "playing" || !room.drawerId) {
    return snapshot;
  }

  const viewerRole = getViewerRole(room, viewerParticipantId);

  return {
    ...snapshot,
    drawerId: room.drawerId,
    viewerRole,
    ...(viewerRole === "drawer" && room.secretWord ? { secretWord: room.secretWord } : {})
  };
}

import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema
} from "./schemas.js";
import {
  createRoom,
  getRoom,
  joinRoom,
  startGame,
  toRoomSnapshot
} from "../services/roomStore.js";

function normalizeCode(raw: string) {
  return raw.trim().toUpperCase();
}

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);

      if (!result) {
        throw new HttpError(503, "Maximum number of rooms reached");
      }

      response.status(201).json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/join", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { playerName } = joinRoomSchema.parse(request.body);
      const result = joinRoom(normalizeCode(code), playerName);

      if (!result) {
        const room = getRoom(normalizeCode(code));

        if (!room) {
          throw new HttpError(404, "Room not found");
        }

        if (room.status !== "lobby") {
          throw new HttpError(403, "Game already in progress");
        }

        throw new HttpError(403, "Room is full");
      }

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body);
      const room = startGame(normalizeCode(code), participantId);

      if (!room) {
        const existing = getRoom(normalizeCode(code));

        if (!existing) {
          throw new HttpError(404, "Room not found");
        }

        if (existing.hostId !== participantId) {
          throw new HttpError(403, "Only the host can start the game");
        }

        throw new HttpError(403, "At least 2 players are needed to start");
      }

      response.json({
        room: toRoomSnapshot(room)
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const room = getRoom(normalizeCode(code));

      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameParamsSchema
} from "./schemas.js";
import {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  startRoom,
  toRoomSnapshot
} from "../services/roomStore.js";

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);

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
      const result = joinRoom(code.toUpperCase(), playerName);

      if (!result) {
        const room = getRoom(code.toUpperCase());
        if (!room) {
          throw new HttpError(404, "Room not found");
        }
        if (room.status !== "lobby") {
          throw new HttpError(409, "Game already in progress");
        }
        throw new HttpError(409, "Room is full");
      }

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = startGameParamsSchema.parse(request.params);
      const { participantId } = request.body as { participantId?: string };

      if (!participantId) {
        throw new HttpError(400, "participantId is required");
      }

      const room = startRoom(code.toUpperCase(), participantId);

      if (!room) {
        const existing = getRoom(code.toUpperCase());
        if (!existing) {
          throw new HttpError(404, "Room not found");
        }
        if (existing.status !== "lobby") {
          throw new HttpError(409, "Game already started");
        }
        if (existing.hostId !== participantId) {
          throw new HttpError(403, "Only the host can start the game");
        }
        throw new HttpError(400, "Need at least 2 players to start");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/leave", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = request.body as { participantId?: string };

      if (!participantId) {
        throw new HttpError(400, "participantId is required");
      }

      const success = leaveRoom(code.toUpperCase(), participantId);

      if (!success) {
        const room = getRoom(code.toUpperCase());
        if (!room) {
          throw new HttpError(404, "Room not found");
        }
        throw new HttpError(404, "Participant not found in room");
      }

      response.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

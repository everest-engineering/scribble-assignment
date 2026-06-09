import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
} from "./schemas.js";
import {
  createRoom,
  getRoom,
  joinRoom,
  toRoomSnapshot,
} from "../services/roomStore.js";

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);

      response.status(201).json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId),
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/join", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { playerName } = joinRoomSchema.parse(request.body);
      const normalized = code.toUpperCase();

      // Validate code format: 4 chars, A-Z2-9
      if (!/^[A-Z2-9]{4}$/.test(normalized)) {
        throw new HttpError(400, "Malformed room code", {
          error: "malformed_room_code",
          message: "Room code is required and must be 4 characters",
        });
      }

      const result = joinRoom(normalized, playerName);

      if (!result) {
        throw new HttpError(404, "Room not found", {
          error: "room_not_found",
          message: "Room not found",
        });
      }

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId),
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const normalized = code.toUpperCase();

      if (!/^[A-Z2-9]{4}$/.test(normalized)) {
        throw new HttpError(400, "Malformed room code", {
          error: "malformed_room_code",
          message: "Room code is required and must be 4 characters",
        });
      }

      const room = getRoom(normalized);

      if (!room) {
        throw new HttpError(404, "Room not found", {
          error: "room_not_found",
          message: "Room not found",
        });
      }

      response.json({
        room: toRoomSnapshot(room, participantId),
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

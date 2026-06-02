import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startRoomRequestSchema
} from "./schemas.js";
import {
  createRoom,
  getRoom,
  joinRoom,
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
        throw new HttpError(404, "Room not found");
      }

      if (!result.ok) {
        if (result.reason === "not_found") {
          throw new HttpError(404, "Room not found");
        }
        if (result.reason === "full") {
          throw new HttpError(409, "Room is full");
        }
      }

      if (!result.ok) {
        throw new HttpError(500, "Unable to join room");
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
        throw new HttpError(404, "Room not found");
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
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startRoomRequestSchema.parse(request.body);
      const result = startRoom(code.toUpperCase(), participantId);

      if (!result.ok) {
        if (result.reason === "not_found") {
          throw new HttpError(404, "Room not found");
        }
        if (result.reason === "not_host") {
          throw new HttpError(403, "Only the host can start the game");
        }
        if (result.reason === "too_few_players") {
          throw new HttpError(400, "At least 2 players are required to start");
        }
      }

      if (!result.ok) {
        throw new HttpError(500, "Unable to start room");
      }

      response.json({
        room: toRoomSnapshot(result.room)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

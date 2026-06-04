import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  leaveRoomSchema,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startRoomSchema
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
      const result = joinRoom(code, playerName);

      if (!result) {
        throw new HttpError(404, "Unable to join room");
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
      const room = getRoom(code);

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
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startRoomSchema.parse(request.body);
      const result = startRoom(code, participantId);

      if ("error" in result) {
        if (result.error === "not_found") {
          throw new HttpError(404, "Unable to start room");
        }

        if (result.error === "forbidden") {
          throw new HttpError(403, "Only the host can start the game");
        }

        throw new HttpError(409, "At least 2 players are required to start");
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/leave", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = leaveRoomSchema.parse(request.body);
      const result = leaveRoom(code, participantId);

      if ("error" in result) {
        throw new HttpError(404, "Unable to leave room");
      }

      response.json({
        ok: true,
        deleted: result.deleted
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

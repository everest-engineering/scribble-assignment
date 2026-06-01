import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameQuerySchema
} from "./schemas.js";
import { mapRoomServiceError } from "./roomErrorMapper.js";
import { RoomServiceError } from "../services/roomErrors.js";
import {
  createRoom,
  getRoom,
  getRoomForParticipant,
  joinRoom,
  startGame,
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
      if (error instanceof RoomServiceError) {
        next(mapRoomServiceError(error));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/join", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { playerName } = joinRoomSchema.parse(request.body);
      const result = joinRoom(code, playerName);

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      if (error instanceof RoomServiceError) {
        next(mapRoomServiceError(error));
        return;
      }
      next(error);
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const room = getRoomForParticipant(code, participantId);

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      if (error instanceof RoomServiceError) {
        next(mapRoomServiceError(error));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameQuerySchema.parse(request.query);
      const room = startGame(code, participantId);

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      if (error instanceof RoomServiceError) {
        next(mapRoomServiceError(error));
        return;
      }
      next(error);
    }
  });

  return router;
}

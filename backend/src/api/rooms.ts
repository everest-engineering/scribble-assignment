import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema
} from "./schemas.js";
import { createRoom, getRoom, joinRoom, startGame, toRoomSnapshot } from "../services/roomStore.js";

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const trimmed = playerName.trim();

      if (!trimmed) {
        throw new HttpError(400, "Player name is required");
      }

      const result = createRoom(trimmed);

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
      const normalizedCode = normalizeCode(code);

      if (!normalizedCode) {
        throw new HttpError(400, "Room code is required");
      }

      const { playerName } = joinRoomSchema.parse(request.body);
      const trimmed = playerName.trim();

      if (!trimmed) {
        throw new HttpError(400, "Player name is required");
      }

      const result = joinRoom(normalizedCode, trimmed);

      if (!result) {
        throw new HttpError(404, "Room not found");
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
      const room = getRoom(normalizeCode(code));

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
      const { participantId } = startGameSchema.parse(request.body);
      const room = startGame(normalizeCode(code), participantId);

      response.json({
        room: toRoomSnapshot(room)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

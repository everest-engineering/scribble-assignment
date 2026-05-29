import { Router } from "express";
import type { Room } from "../models/game.js";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startRoomSchema
} from "./schemas.js";
import { createRoom, getRoom, joinRoom, startRoom, toRoomSnapshot } from "../services/roomStore.js";

function createRoomSessionResponse(room: Room, participantId: string) {
  return {
    participantId,
    room: toRoomSnapshot(room, participantId)
  };
}

function createRoomSnapshotResponse(room: Room, participantId?: string) {
  return {
    room: toRoomSnapshot(room, participantId)
  };
}

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);

      response.status(201).json(createRoomSessionResponse(result.room, result.participantId));
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
        throw new HttpError(404, "Room code was not found");
      }

      response.json(createRoomSessionResponse(result.room, result.participantId));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startRoomSchema.parse(request.body);
      const result = startRoom(code, participantId);

      if (!result.ok) {
        const statusCodeByReason = {
          "not-found": 404,
          forbidden: 403,
          conflict: 409
        } as const;

        throw new HttpError(statusCodeByReason[result.reason], result.message);
      }

      response.json(createRoomSnapshotResponse(result.room, participantId));
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
        throw new HttpError(404, "Room code was not found");
      }

      response.json(createRoomSnapshotResponse(room, participantId));
    } catch (error) {
      next(error);
    }
  });

  return router;
}

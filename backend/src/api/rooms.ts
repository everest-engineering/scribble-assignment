import { Router } from "express";
import type { Room } from "../models/game.js";
import {
  clearCanvasSchema,
  createRoomSchema,
  drawingStrokeSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startRoomSchema,
  submitGuessSchema
} from "./schemas.js";
import {
  addDrawingStroke,
  clearRoomCanvas,
  createRoom,
  getRoom,
  joinRoom,
  startRoom,
  submitGuess,
  toRoomSnapshot
} from "../services/roomStore.js";

type FailureReason = "not-found" | "forbidden" | "conflict";
type RoomActionSuccess = { ok: true; room: Room };
type RoomActionFailure = { ok: false; reason: FailureReason; message: string };

const statusCodeByReason: Record<FailureReason, number> = {
  "not-found": 404,
  forbidden: 403,
  conflict: 409
};

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

function throwForActionFailure(result: RoomActionFailure) {
  throw new HttpError(statusCodeByReason[result.reason], result.message);
}

function assertRoomActionSucceeded(result: RoomActionSuccess | RoomActionFailure): asserts result is RoomActionSuccess {
  if (!result.ok) {
    throwForActionFailure(result);
  }
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

      assertRoomActionSucceeded(result);

      response.json(createRoomSnapshotResponse(result.room, participantId));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/drawing", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, points } = drawingStrokeSchema.parse(request.body);
      const result = addDrawingStroke(code, participantId, points);

      assertRoomActionSucceeded(result);

      response.json(createRoomSnapshotResponse(result.room, participantId));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/drawing/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearCanvasSchema.parse(request.body);
      const result = clearRoomCanvas(code, participantId);

      assertRoomActionSucceeded(result);

      response.json(createRoomSnapshotResponse(result.room, participantId));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, guess } = submitGuessSchema.parse(request.body);
      const result = submitGuess(code, participantId, guess);

      assertRoomActionSucceeded(result);

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

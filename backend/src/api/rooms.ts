import { Router } from "express";
import {
  addStrokeSchema,
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  participantActionSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema,
  submitGuessSchema
} from "./schemas.js";
import {
  addStroke,
  clearDrawing,
  createRoom,
  getRoom,
  joinRoom,
  restartGame,
  RoomStoreError,
  startGame,
  submitGuess,
  toRoomSnapshot
} from "../services/roomStore.js";

function handleRoomStoreRoute(
  handler: () => ReturnType<typeof getRoom>,
  participantId: string | undefined,
  response: import("express").Response,
  next: import("express").NextFunction
) {
  try {
    const room = handler();

    if (!room) {
      throw new HttpError(404, "Room not found");
    }

    response.json({
      room: toRoomSnapshot(room, participantId)
    });
  } catch (error) {
    if (error instanceof RoomStoreError) {
      next(new HttpError(error.statusCode, error.message));
      return;
    }
    next(error);
  }
}

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
      if (error instanceof RoomStoreError) {
        next(new HttpError(error.statusCode, error.message));
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
      const room = getRoom(code);

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
      const { participantId } = startGameSchema.parse(request.body);
      handleRoomStoreRoute(() => startGame(code, participantId), participantId, response, next);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/drawing/strokes", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, stroke } = addStrokeSchema.parse(request.body);
      handleRoomStoreRoute(() => addStroke(code, participantId, stroke), participantId, response, next);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/drawing/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = participantActionSchema.parse(request.body);
      handleRoomStoreRoute(() => clearDrawing(code, participantId), participantId, response, next);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = submitGuessSchema.parse(request.body);
      handleRoomStoreRoute(() => submitGuess(code, participantId, text), participantId, response, next);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = participantActionSchema.parse(request.body);
      handleRoomStoreRoute(() => restartGame(code, participantId), participantId, response, next);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

import { Router } from "express";
import {
  createRoomSchema,
  drawingSchema,
  guessSchema,
  HttpError,
  joinRoomSchema,
  participantActionSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema
} from "./schemas.js";
import { RoomStoreError } from "../services/roomStore.js";
import {
  clearDrawing,
  createRoom,
  getRoom,
  joinRoom,
  restartGame,
  startGame,
  submitGuess,
  toRoomSnapshot,
  updateDrawing
} from "../services/roomStore.js";

function handleRoomError(error: unknown, next: (error: Error) => void) {
  if (error instanceof RoomStoreError) {
    next(new HttpError(error.statusCode, error.message));
    return;
  }

  next(error instanceof Error ? error : new Error("Unexpected server error"));
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
      handleRoomError(error, next);
    }
  });

  router.post("/:code/join", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { playerName } = joinRoomSchema.parse(request.body);
      const result = joinRoom(code, playerName);

      if (!result) {
        throw new HttpError(404, "Room not found. Check the code and try again.");
      }

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      handleRoomError(error, next);
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
      handleRoomError(error, next);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = participantActionSchema.parse(request.body);
      const room = startGame(code, participantId);

      response.json({
        room: toRoomSnapshot(room!, participantId)
      });
    } catch (error) {
      handleRoomError(error, next);
    }
  });

  router.post("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = guessSchema.parse(request.body);
      const room = submitGuess(code, participantId, text);

      response.json({
        room: toRoomSnapshot(room!, participantId)
      });
    } catch (error) {
      handleRoomError(error, next);
    }
  });

  router.put("/:code/drawing", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, strokes } = drawingSchema.parse(request.body);
      const room = updateDrawing(code, participantId, strokes);

      response.json({
        room: toRoomSnapshot(room!, participantId)
      });
    } catch (error) {
      handleRoomError(error, next);
    }
  });

  router.delete("/:code/drawing", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = participantActionSchema.parse(request.body);
      const room = clearDrawing(code, participantId);

      response.json({
        room: toRoomSnapshot(room!, participantId)
      });
    } catch (error) {
      handleRoomError(error, next);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = participantActionSchema.parse(request.body);
      const room = restartGame(code, participantId);

      response.json({
        room: toRoomSnapshot(room!, participantId)
      });
    } catch (error) {
      handleRoomError(error, next);
    }
  });

  return router;
}

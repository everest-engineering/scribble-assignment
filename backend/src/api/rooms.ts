import { Router } from "express";
import {
  createRoomSchema,
  drawingSchema,
  HttpError,
  joinRoomSchema,
  restartGameSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema,
  submitGuessSchema
} from "./schemas.js";
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
      const { participantId } = startGameSchema.parse(request.body);
      const result = startGame(code.toUpperCase(), participantId);

      if (!result.ok) {
        throw new HttpError(400, result.error);
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = submitGuessSchema.parse(request.body);
      const result = submitGuess(code.toUpperCase(), participantId, text);

      if (!result.ok) {
        throw new HttpError(400, result.error);
      }

      response.json({
        isCorrect: result.isCorrect,
        guess: result.guess,
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.put("/:code/drawing", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, data } = drawingSchema.parse(request.body);
      const result = updateDrawing(code.toUpperCase(), participantId, data);

      if (!result.ok) {
        throw new HttpError(400, result.error);
      }

      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:code/drawing", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = drawingSchema.parse({ ...request.body, data: "" });
      const result = clearDrawing(code.toUpperCase(), participantId);

      if (!result.ok) {
        throw new HttpError(400, result.error);
      }

      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartGameSchema.parse(request.body);
      const result = restartGame(code.toUpperCase(), participantId);

      if (!result.ok) {
        throw new HttpError(400, result.error);
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema,
  leaveRoomSchema,
  drawingSchema,
  guessSchema
} from "./schemas.js";
import { createRoom, getRoom, joinRoom, toRoomSnapshot, startGame, leaveRoom, updateDrawing, clearDrawing, submitGuess, endRound, restartGame } from "../services/roomStore.js";

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

      if (!result.success) {
        const statusCode = result.error?.includes("already in game") ? 409 : 404;
        throw new HttpError(statusCode, result.error ?? "Unable to join room");
      }

      response.json({
        participantId: result.participantId!,
        room: toRoomSnapshot(result.room!, result.participantId!)
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

      const result = startGame(code, participantId);
      if (!result.success) {
        const statusCode = result.error?.includes("Only the host") ? 403 : 400;
        throw new HttpError(statusCode, result.error ?? "Failed to start game");
      }

      response.json({ success: true, status: "game" });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/leave", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = leaveRoomSchema.parse(request.body);

      const result = leaveRoom(code, participantId);
      if (!result.success) {
        throw new HttpError(404, result.error ?? "Failed to leave room");
      }

      response.json({ success: true, message: "Left room successfully" });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/canvas", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { drawingData } = drawingSchema.parse(request.body);
      const result = updateDrawing(code, drawingData);
      if (!result.success) {
        throw new HttpError(400, result.error ?? "Failed to update drawing");
      }
      response.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/canvas/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const result = clearDrawing(code);
      if (!result.success) {
        throw new HttpError(400, result.error ?? "Failed to clear drawing");
      }
      response.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, guessText } = guessSchema.parse(request.body);
      const result = submitGuess(code, participantId, guessText);
      if (!result.success) {
        const statusCode = result.error?.includes("not found") ? 404 : 400;
        throw new HttpError(statusCode, result.error ?? "Failed to submit guess");
      }
      response.json({ success: true, guess: result.guess });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/end", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body);

      const result = endRound(code, participantId);
      if (!result.success) {
        const statusCode = result.error?.includes("Only the host") ? 403 : 400;
        throw new HttpError(statusCode, result.error ?? "Failed to end round");
      }

      response.json({ success: true, status: "result" });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body);

      const result = restartGame(code, participantId);
      if (!result.success) {
        const statusCode = result.error?.includes("Only the host") ? 403 : 400;
        throw new HttpError(statusCode, result.error ?? "Failed to restart game");
      }

      response.json({ success: true, status: "lobby" });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

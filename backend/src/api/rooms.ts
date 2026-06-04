import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  submitGuessSchema,
  updateCanvasSchema
} from "./schemas.js";
import { checkAutomaticCompletion, createRoom, endGame, getRoom, joinRoom, leaveRoom, restartGame, saveRoom, startGame, toRoomSnapshot } from "../services/roomStore.js";

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
      const participantId = request.headers["x-participant-id"] as string;

      startGame(code.toUpperCase(), participantId);

      response.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/end", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const participantId = request.headers["x-participant-id"] as string;

      endGame(code.toUpperCase(), participantId);

      response.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const participantId = request.headers["x-participant-id"] as string;

      restartGame(code.toUpperCase(), participantId);

      response.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { guess } = submitGuessSchema.parse(request.body);
      const participantId = request.headers["x-participant-id"] as string;

      const room = getRoom(code.toUpperCase());
      if (!room || room.status !== "in-game") {
        throw new HttpError(400, "Game not in progress");
      }

      const isCorrect = guess.toLowerCase() === room.currentWord?.toLowerCase();
      room.guessHistory.push({
        playerId: participantId,
        text: guess,
        isCorrect,
        timestamp: new Date().toISOString()
      });

      if (isCorrect) {
        room.scoreboard[participantId] = (room.scoreboard[participantId] || 0) + 100;
      }

      saveRoom(room);
      checkAutomaticCompletion(room);

      response.json({ success: true, isCorrect, pointsAwarded: isCorrect ? 100 : 0 });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/canvas", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { drawingEvents } = updateCanvasSchema.parse(request.body);
      const participantId = request.headers["x-participant-id"] as string;

      const room = getRoom(code.toUpperCase());
      if (!room || room.status !== "in-game" || room.drawerId !== participantId) {
        throw new HttpError(403, "Not allowed to draw");
      }

      if (drawingEvents === null) {
        room.canvasData = null;
      } else {
        room.canvasData = [...(room.canvasData || []), ...drawingEvents];
      }
      saveRoom(room);

      response.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/leave", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const participantId = request.headers["x-participant-id"] as string;

      leaveRoom(code.toUpperCase(), participantId);

      response.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

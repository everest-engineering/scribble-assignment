import { Router } from "express";
import { ZodError } from "zod";
import {
  canvasBodySchema,
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  submitGuessSchema
} from "./schemas.js";
import { addCanvasStroke, clearCanvas, createRoom, endGame, getRoom, joinRoom, nextWord, restartGame, startGame, submitGuess, toRoomSnapshot } from "../services/roomStore.js";

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

      if (!code || !code.trim()) {
        throw new HttpError(400, "Invalid room code. Please try again with correct one.");
      }

      const result = joinRoom(code.toUpperCase(), playerName);

      if (!result) {
        throw new HttpError(404, "Invalid room code. Please try again with correct one.");
      }

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      if (error instanceof ZodError) {
        next(new HttpError(400, "Invalid room code. Please try again with correct one."));
      } else {
        next(error);
      }
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);

      const { participantId } = roomViewerQuerySchema.parse(request.query);

      if (!participantId) {
        throw new HttpError(400, "participantId query parameter is required");
      }

      const result = startGame(code.toUpperCase(), participantId);

      if (!result.ok) {
        throw result.error;
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
      const { guess, participantId } = submitGuessSchema.parse(request.body);

      const result = submitGuess(code.toUpperCase(), participantId, guess);

      if (!result.ok) {
        throw result.error;
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId),
        ...(result.message ? { message: result.message } : {})
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/canvas", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const body = canvasBodySchema.parse(request.body);
      const { participantId } = roomViewerQuerySchema.parse(request.query);

      if (!participantId) {
        throw new HttpError(400, "participantId query parameter is required");
      }

      let result;

      if (body.type === "clear") {
        result = clearCanvas(code.toUpperCase(), participantId);
      } else {
        result = addCanvasStroke(code.toUpperCase(), participantId, body.stroke);
      }

      if (!result.ok) {
        throw result.error;
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/next-word", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);

      if (!participantId) {
        throw new HttpError(400, "participantId query parameter is required");
      }

      const result = nextWord(code.toUpperCase(), participantId);

      if (!result.ok) {
        throw result.error;
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/end-game", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);

      if (!participantId) {
        throw new HttpError(400, "participantId query parameter is required");
      }

      const result = endGame(code.toUpperCase(), participantId);

      if (!result.ok) {
        throw result.error;
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);

      if (!participantId) {
        throw new HttpError(400, "participantId query parameter is required");
      }

      const result = restartGame(code.toUpperCase(), participantId);

      if (!result.ok) {
        throw result.error;
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
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

  return router;
}

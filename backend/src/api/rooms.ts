import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  playAgainSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  leaveRoomSchema,
  startGameSchema,
  submitStrokesSchema,
  submitGuessSchema,
  revealWordSchema
} from "./schemas.js";
import { clearCanvas, createRoom, getRoom, getStrokes, joinRoom, leaveRoom, playAgain, revealWord, startGame, submitGuess, submitStrokes, toRoomSnapshot } from "../services/roomStore.js";

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
      const { participantId } = startGameSchema.parse(request.body);
      const result = startGame(code.toUpperCase(), participantId);

      if (!result.ok) {
        throw new HttpError(result.status, result.error);
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/leave", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = leaveRoomSchema.parse(request.body);
      const result = leaveRoom(code.toUpperCase(), participantId);

      if (!result.ok) {
        throw new HttpError(result.status, result.error);
      }

      if (!result.room) {
        response.json({ room: null });
        return;
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/strokes", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, action, strokes } = submitStrokesSchema.parse(request.body);

      if (action === "clear") {
        const result = clearCanvas(code.toUpperCase(), participantId);
        if (!result.ok) throw new HttpError(result.status, result.error);
        response.json({ strokes: [], clearVersion: result.room.clearVersion });
        return;
      }

      if (!strokes || strokes.length === 0) {
        throw new HttpError(400, "Strokes array is required for append action");
      }

      const result = submitStrokes(code.toUpperCase(), participantId, strokes);
      if (!result.ok) throw new HttpError(result.status, result.error);
      response.json({ strokes: result.room.strokes, clearVersion: result.room.clearVersion });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code/strokes", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const result = getStrokes(code.toUpperCase());
      if (!result.ok) throw new HttpError(result.status, result.error);
      response.json({ strokes: result.strokes, clearVersion: result.clearVersion });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = submitGuessSchema.parse(request.body);
      const result = submitGuess(code.toUpperCase(), participantId, text);
      if (!result.ok) throw new HttpError(result.status, result.error);

      response.json({
        isCorrect: result.isCorrect,
        allGuessersCorrect: result.allGuessersCorrect,
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/reveal", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = revealWordSchema.parse(request.body);
      const result = revealWord(code.toUpperCase(), participantId);
      if (!result.ok) throw new HttpError(result.status, result.error);

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/play-again", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = playAgainSchema.parse(request.body);
      const result = playAgain(code.toUpperCase(), participantId);
      if (!result.ok) throw new HttpError(result.status, result.error);

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

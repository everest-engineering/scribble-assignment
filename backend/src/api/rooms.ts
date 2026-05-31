import { Router } from "express";
import {
  createRoomSchema,
  guessSchema,
  HttpError,
  joinRoomSchema,
  participantOnlySchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema
} from "./schemas.js";
import { createRoom, getRoom, joinRoom, nextRound, restartGame, saveDrawing, startGame, submitGuess, toRoomSnapshot } from "../services/roomStore.js";

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

      if (!result) {
        throw new HttpError(404, "Room not found");
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      if (error instanceof Error && (error.message === "Only the host can start the game" || error.message === "At least 2 players required to start")) {
        next(new HttpError(403, error.message));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = guessSchema.parse(request.body);
      const result = submitGuess(code, participantId, text);

      if (!result) {
        throw new HttpError(404, "Room not found or no active round");
      }

      response.json(result);
    } catch (error) {
      if (error instanceof Error && (error.message === "The drawer cannot submit guesses" || error.message === "Guess text is required")) {
        next(new HttpError(400, error.message));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/next-round", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = participantOnlySchema.parse(request.body);
      const result = nextRound(code, participantId);

      if (!result) {
        throw new HttpError(404, "Room not found or not in round_end status");
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId),
        gameOver: result.gameOver
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Only the host can advance to the next round") {
        next(new HttpError(403, error.message));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = participantOnlySchema.parse(request.body);
      const result = restartGame(code, participantId);

      if (!result) {
        throw new HttpError(404, "Room not found or not in game_over status");
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Only the host can restart the game") {
        next(new HttpError(403, error.message));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/drawing", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, drawing } = request.body as { participantId: string; drawing: number[][][] };
      const result = saveDrawing(code, participantId, drawing);

      if (!result) {
        throw new HttpError(404, "Room not found or no active round");
      }

      response.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "Only the drawer can update the drawing") {
        next(new HttpError(403, error.message));
        return;
      }
      next(error);
    }
  });

  return router;
}

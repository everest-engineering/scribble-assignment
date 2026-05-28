import { Router } from "express";
import {
  clearDrawingSchema,
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema,
  submitGuessSchema,
  updateDrawingSchema
} from "./schemas.js";
import {
  clearDrawing,
  createRoom,
  getRoom,
  joinRoom,
  startGame,
  submitGuess,
  toRoomSnapshot,
  updateDrawing
} from "../services/roomStore.js";

type GameplayFailureReason =
  | "not-found"
  | "host-required"
  | "minimum-players"
  | "game-required"
  | "drawer-required"
  | "participant-required"
  | "guesser-required"
  | "guess-required";

function errorForReason(reason: GameplayFailureReason) {
  if (reason === "not-found") {
    return new HttpError(404, "Unable to load room");
  }

  if (reason === "host-required") {
    return new HttpError(403, "Only the host can start the game");
  }

  if (reason === "drawer-required") {
    return new HttpError(403, "Only the drawer can update the canvas");
  }

  if (reason === "guesser-required") {
    return new HttpError(403, "Only guessers can submit guesses");
  }

  if (reason === "participant-required") {
    return new HttpError(404, "Participant not found in room");
  }

  if (reason === "minimum-players") {
    return new HttpError(400, "At least 2 players are required to start");
  }

  if (reason === "guess-required") {
    return new HttpError(400, "Guess is required");
  }

  return new HttpError(400, "Game must be active");
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

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body);
      const result = startGame(code, participantId);

      if (!result.ok) {
        throw errorForReason(result.reason);
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.put("/:code/drawing", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, drawing } = updateDrawingSchema.parse(request.body);
      const result = updateDrawing(code, participantId, drawing);

      if (!result.ok) {
        throw errorForReason(result.reason);
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/drawing/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearDrawingSchema.parse(request.body);
      const result = clearDrawing(code, participantId);

      if (!result.ok) {
        throw errorForReason(result.reason);
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = submitGuessSchema.parse(request.body);
      const result = submitGuess(code, participantId, text);

      if (!result.ok) {
        throw errorForReason(result.reason);
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

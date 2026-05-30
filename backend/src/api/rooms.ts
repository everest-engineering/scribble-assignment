import { Router } from "express";
import {
  addStrokeSchema,
  clearCanvasSchema,
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startRoomSchema,
  submitGuessSchema
} from "./schemas.js";
import {
  addStroke,
  clearCanvas,
  createRoom,
  getRoom,
  joinRoom,
  startRoom,
  submitGuess,
  toRoomSnapshot
} from "../services/roomStore.js";

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);

      if (!result.ok) {
        throw new HttpError(400, "Player name is required");
      }

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

      if (!result.ok) {
        if (result.reason === "empty_name") {
          throw new HttpError(400, "Player name is required");
        }

        if (result.reason === "game_started") {
          throw new HttpError(409, "Game already started");
        }

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
      const { participantId } = startRoomSchema.parse(request.body);
      const result = startRoom(code.toUpperCase(), participantId);

      if (!result.ok) {
        switch (result.reason) {
          case "not_found":
            throw new HttpError(404, "Unable to load room");
          case "not_host":
            throw new HttpError(403, "Only the host can start the game");
          case "not_enough_players":
            throw new HttpError(403, "At least two players are required");
          case "game_started":
            throw new HttpError(409, "Game already started");
          default:
            throw new HttpError(400, "Unable to start game");
        }
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
      const { participantId, stroke } = addStrokeSchema.parse(request.body);
      const result = addStroke(code.toUpperCase(), participantId, stroke);

      if (!result.ok) {
        switch (result.reason) {
          case "not_found":
            throw new HttpError(404, "Unable to load room");
          case "not_playing":
            throw new HttpError(409, "Game not in progress");
          case "not_drawer":
            throw new HttpError(403, "Only the drawer can draw");
          case "invalid_stroke":
            throw new HttpError(400, "Invalid stroke");
          default:
            throw new HttpError(400, "Unable to add stroke");
        }
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/canvas/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearCanvasSchema.parse(request.body);
      const result = clearCanvas(code.toUpperCase(), participantId);

      if (!result.ok) {
        switch (result.reason) {
          case "not_found":
            throw new HttpError(404, "Unable to load room");
          case "not_playing":
            throw new HttpError(409, "Game not in progress");
          case "not_drawer":
            throw new HttpError(403, "Only the drawer can clear the canvas");
          default:
            throw new HttpError(400, "Unable to clear canvas");
        }
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
      const { participantId, guessText } = submitGuessSchema.parse(request.body);
      const result = submitGuess(code.toUpperCase(), participantId, guessText);

      if (!result.ok) {
        switch (result.reason) {
          case "not_found":
            throw new HttpError(404, "Unable to load room");
          case "not_playing":
            throw new HttpError(409, "Game not in progress");
          case "empty_guess":
            throw new HttpError(400, "Guess is required");
          case "is_drawer":
            throw new HttpError(403, "The drawer cannot submit guesses");
          case "not_participant":
            throw new HttpError(403, "Participant not in room");
          default:
            throw new HttpError(400, "Unable to submit guess");
        }
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

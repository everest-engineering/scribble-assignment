import { Router } from "express";
import {
  createRoomSchema,
  drawingSchema,
  endRoomSchema,
  guessSchema,
  HttpError,
  joinRoomSchema,
  restartRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startRoomSchema
} from "./schemas.js";
import {
  createRoom,
  endRound,
  getRoom,
  joinRoom,
  restartRound,
  startRound,
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

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startRoomSchema.parse(request.body);
      const result = startRound(code, participantId);

      if (!result.ok) {
        if (result.reason === "not_found") {
          throw new HttpError(404, "Room not found");
        }
        if (result.reason === "not_host") {
          throw new HttpError(403, "Only the host can start the game");
        }
        throw new HttpError(409, "At least 2 players are required to start");
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
      const { participantId, text } = guessSchema.parse(request.body);
      const result = submitGuess(code, participantId, text);

      if (!result.ok) {
        if (result.reason === "not_found") {
          throw new HttpError(404, "Room not found");
        }
        if (result.reason === "not_playing") {
          throw new HttpError(409, "The round is not active");
        }
        if (result.reason === "not_guesser") {
          throw new HttpError(403, "Only guessers can submit guesses");
        }
        throw new HttpError(400, "Invalid request payload");
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
      const { participantId, drawing } = drawingSchema.parse(request.body);
      const result = updateDrawing(code, participantId, drawing);

      if (!result.ok) {
        if (result.reason === "not_found") {
          throw new HttpError(404, "Room not found");
        }
        if (result.reason === "not_playing") {
          throw new HttpError(409, "The round is not active");
        }
        throw new HttpError(403, "Only the drawer can update the drawing");
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/end", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = endRoomSchema.parse(request.body);
      const result = endRound(code, participantId);

      if (!result.ok) {
        if (result.reason === "not_found") {
          throw new HttpError(404, "Room not found");
        }
        if (result.reason === "not_host") {
          throw new HttpError(403, "Only the host can end the round");
        }
        throw new HttpError(409, "The round is not active");
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
      const { participantId } = restartRoomSchema.parse(request.body);
      const result = restartRound(code, participantId);

      if (!result.ok) {
        if (result.reason === "not_found") {
          throw new HttpError(404, "Room not found");
        }
        if (result.reason === "not_host") {
          throw new HttpError(403, "Only the host can restart the game");
        }
        throw new HttpError(409, "Restart is only available after a round");
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

  return router;
}

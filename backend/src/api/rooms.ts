import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startRoomSchema,
  submitGuessSchema
} from "./schemas.js";
import {
  createRoom,
  endRound,
  joinRoom,
  pollRoom,
  restartRoom,
  startGame,
  submitGuess,
  toRoomSnapshot
} from "../services/roomStore.js";

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);

      // Empty / whitespace-only names are rejected, not defaulted (FR-010).
      if (!playerName) {
        throw new HttpError(400, "Please enter a name to continue.");
      }

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

      // Empty / whitespace-only names are rejected, not defaulted (FR-010).
      if (!playerName) {
        throw new HttpError(400, "Please enter a name to continue.");
      }

      const result = joinRoom(code.toUpperCase(), playerName);

      if ("failure" in result) {
        if (result.failure === "started") {
          throw new HttpError(409, "This game has already started");
        }
        if (result.failure === "full") {
          throw new HttpError(409, "This room is full");
        }
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
      const room = pollRoom(code.toUpperCase(), participantId);

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
      const { participantId } = startRoomSchema.parse(request.body);
      const result = startGame(code.toUpperCase(), participantId);

      if ("failure" in result) {
        if (result.failure === "not_host") {
          throw new HttpError(403, "Only the host can start the game");
        }
        if (result.failure === "too_few") {
          throw new HttpError(409, "At least 2 players are required to start");
        }
        if (result.failure === "already_started") {
          throw new HttpError(409, "This game has already started");
        }
        throw new HttpError(404, "Room not found");
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

      // Empty / whitespace-only guesses are rejected, not recorded (FR-003).
      if (!text) {
        throw new HttpError(400, "Please enter a guess.");
      }

      const result = submitGuess(code.toUpperCase(), participantId, text);

      if ("failure" in result) {
        if (result.failure === "drawer") {
          throw new HttpError(403, "The drawer cannot guess.");
        }
        if (result.failure === "not_active") {
          throw new HttpError(409, "The round is not active.");
        }
        throw new HttpError(404, "Room not found");
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
      // Reuses the start schema — both actions only need the requester's id.
      const { participantId } = startRoomSchema.parse(request.body);
      const result = endRound(code.toUpperCase(), participantId);

      if ("failure" in result) {
        if (result.failure === "not_host") {
          throw new HttpError(403, "Only the host can end the round.");
        }
        if (result.failure === "not_active") {
          throw new HttpError(409, "There is no active round to end.");
        }
        throw new HttpError(404, "Room not found");
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
      const { participantId } = startRoomSchema.parse(request.body);
      const result = restartRoom(code.toUpperCase(), participantId);

      if ("failure" in result) {
        if (result.failure === "not_host") {
          throw new HttpError(403, "Only the host can restart the game.");
        }
        throw new HttpError(404, "Room not found");
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

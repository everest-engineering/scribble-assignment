import { Router } from "express";
import {
  clearCanvasSchema,
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  restartRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startRoomRequestSchema,
  submitGuessSchema,
  updateCanvasSchema
} from "./schemas.js";
import {
  clearCanvas,
  createRoom,
  getRoom,
  joinRoom,
  restartRoom,
  startRoom,
  submitGuess,
  toRoomSnapshot,
  updateCanvas
} from "../services/roomStore.js";

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);

      if (!result.ok) {
        if (result.reason === "invalid_name") {
          throw new HttpError(400, "Name cannot be empty");
        }
      }

      if (!result.ok) {
        throw new HttpError(500, "Unable to create room");
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

      if (!result) {
        throw new HttpError(404, "Room not found");
      }

      if (!result.ok) {
        if (result.reason === "invalid_name") {
          throw new HttpError(400, "Name cannot be empty");
        }
        if (result.reason === "not_found") {
          throw new HttpError(404, "Room not found");
        }
        if (result.reason === "full") {
          throw new HttpError(409, "Room is full");
        }
      }

      if (!result.ok) {
        throw new HttpError(500, "Unable to join room");
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
      const { participantId } = startRoomRequestSchema.parse(request.body);
      const result = startRoom(code.toUpperCase(), participantId);

      if (!result.ok) {
        if (result.reason === "not_found") {
          throw new HttpError(404, "Room not found");
        }
        if (result.reason === "not_host") {
          throw new HttpError(403, "Only the host can start the game");
        }
        if (result.reason === "already_started") {
          throw new HttpError(409, "Game has already started");
        }
        if (result.reason === "too_few_players") {
          throw new HttpError(400, "At least 2 players are required to start");
        }
      }

      if (!result.ok) {
        throw new HttpError(500, "Unable to start room");
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  // T019: PUT /:code/canvas — drawer updates canvas state
  router.put("/:code/canvas", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, canvasDataUrl } = updateCanvasSchema.parse(request.body);
      const result = updateCanvas(code.toUpperCase(), participantId, canvasDataUrl);

      if (!result.ok) {
        if (result.reason === "not_found") throw new HttpError(404, "Room not found");
        if (result.reason === "not_active") throw new HttpError(400, "Round is not active");
        if (result.reason === "not_drawer") throw new HttpError(403, "Only the drawer can update the canvas");
      }

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // T020: DELETE /:code/canvas — drawer clears canvas
  router.delete("/:code/canvas", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearCanvasSchema.parse(request.body);
      const result = clearCanvas(code.toUpperCase(), participantId);

      if (!result.ok) {
        if (result.reason === "not_found") throw new HttpError(404, "Room not found");
        if (result.reason === "not_active") throw new HttpError(400, "Round is not active");
        if (result.reason === "not_drawer") throw new HttpError(403, "Only the drawer can clear the canvas");
      }

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // POST /:code/restart — host returns all players to lobby from results screen
  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartRoomSchema.parse(request.body);
      const result = restartRoom(code.toUpperCase(), participantId);

      if (!result.ok) {
        if (result.reason === "not_found") throw new HttpError(404, "Room not found");
        if (result.reason === "not_host") throw new HttpError(403, "Only the host can restart the game");
        if (result.reason === "not_finished") throw new HttpError(400, "Game has not finished yet");
      }

      if (!result.ok) throw new HttpError(500, "Unable to restart room");

      response.json({ room: toRoomSnapshot(result.room, participantId) });
    } catch (error) {
      next(error);
    }
  });

  // T035: POST /:code/guesses — guesser submits a guess
  router.post("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = submitGuessSchema.parse(request.body);
      const room = getRoom(code.toUpperCase());

      if (!room) throw new HttpError(404, "Room not found");

      const result = submitGuess(code.toUpperCase(), participantId, text);

      if (!result.ok) {
        if (result.reason === "not_found") throw new HttpError(404, "Room not found");
        if (result.reason === "not_active") throw new HttpError(400, "Round is not active");
        if (result.reason === "is_drawer") throw new HttpError(403, "The drawer cannot submit guesses");
        if (result.reason === "empty_guess") throw new HttpError(400, "Guess cannot be empty");
        if (result.reason === "already_correct") throw new HttpError(409, "You have already guessed correctly this round");
      }

      if (!result.ok) throw new HttpError(500, "Unable to submit guess");

      const participantName =
        room.participants.find((p) => p.id === participantId)?.name ?? "Unknown";

      response.status(201).json({
        guess: {
          id: result.guess.id,
          participantId: result.guess.participantId,
          participantName,
          text: result.guess.text,
          correct: result.guess.correct,
          submittedAt: result.guess.submittedAt
        }
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

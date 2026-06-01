import { Router } from "express";
import {
  createRoomSchema,
  clearCanvasSchema,
  HttpError,
  drawCanvasSchema,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  restartRoomSchema,
  submitGuessSchema,
  startRoomSchema,
} from "./schemas.js";
import {
  createRoom,
  clearCanvas,
  drawCanvas,
  getRoom,
  joinRoom,
  restartRoom,
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
      const { participantId, secretWord } = startRoomSchema.parse(request.body);
      const room = startRoom(code.toUpperCase(), participantId, secretWord);

      if (!room) {
        throw new HttpError(404, "Unable to start room");
      }

      response.json({ room: toRoomSnapshot(room, participantId) });
    } catch (error) {
      if (error instanceof Error && error.message === "Only the host can start the game") {
        next(new HttpError(403, error.message));
        return;
      }

      if (error instanceof Error && error.message === "At least 2 players are required to start") {
        next(new HttpError(409, error.message));
        return;
      }

      if (error instanceof Error && error.message === "Secret word must come from the starter list") {
        next(new HttpError(400, error.message));
        return;
      }

      if (error instanceof Error && error.message === "Round is already in progress") {
        next(new HttpError(409, error.message));
        return;
      }

      next(error);
    }
  });

  router.post("/:code/draw", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, stroke } = drawCanvasSchema.parse(request.body);
      const room = drawCanvas(code.toUpperCase(), participantId, stroke);

      if (!room) {
        throw new HttpError(404, "Unable to draw on room");
      }

      response.json({ room: toRoomSnapshot(room, participantId) });
    } catch (error) {
      if (error instanceof Error && error.message === "No active round") {
        next(new HttpError(409, error.message));
        return;
      }

      if (error instanceof Error && error.message === "Round has ended") {
        next(new HttpError(409, error.message));
        return;
      }

      if (error instanceof Error && error.message === "Only the drawer can perform this action") {
        next(new HttpError(403, error.message));
        return;
      }

      if (error instanceof Error && error.message === "Participant is not in the room") {
        next(new HttpError(403, error.message));
        return;
      }

      next(error);
    }
  });

  router.post("/:code/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearCanvasSchema.parse(request.body);
      const room = clearCanvas(code.toUpperCase(), participantId);

      if (!room) {
        throw new HttpError(404, "Unable to clear room");
      }

      response.json({ room: toRoomSnapshot(room, participantId) });
    } catch (error) {
      if (error instanceof Error && error.message === "No active round") {
        next(new HttpError(409, error.message));
        return;
      }

      if (error instanceof Error && error.message === "Round has ended") {
        next(new HttpError(409, error.message));
        return;
      }

      if (error instanceof Error && error.message === "Only the drawer can perform this action") {
        next(new HttpError(403, error.message));
        return;
      }

      if (error instanceof Error && error.message === "Participant is not in the room") {
        next(new HttpError(403, error.message));
        return;
      }

      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, guessText } = submitGuessSchema.parse(request.body);
      const room = submitGuess(code.toUpperCase(), participantId, guessText);

      if (!room) {
        throw new HttpError(404, "Unable to submit guess");
      }

      response.json({ room: toRoomSnapshot(room, participantId) });
    } catch (error) {
      if (error instanceof Error && error.message === "No active round") {
        next(new HttpError(409, error.message));
        return;
      }

      if (error instanceof Error && error.message === "Round has ended") {
        next(new HttpError(409, error.message));
        return;
      }

      if (error instanceof Error && error.message === "The drawer cannot submit guesses") {
        next(new HttpError(403, error.message));
        return;
      }

      if (error instanceof Error && error.message === "Participant is not in the room") {
        next(new HttpError(403, error.message));
        return;
      }

      if (error instanceof Error && error.message === "Guess text is required") {
        next(new HttpError(400, error.message));
        return;
      }

      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartRoomSchema.parse(request.body);
      const room = restartRoom(code.toUpperCase(), participantId);

      if (!room) {
        throw new HttpError(404, "Unable to restart room");
      }

      response.json({ room: toRoomSnapshot(room, participantId) });
    } catch (error) {
      if (error instanceof Error && error.message === "No active round") {
        next(new HttpError(409, error.message));
        return;
      }

      if (error instanceof Error && error.message === "Round has not ended") {
        next(new HttpError(409, error.message));
        return;
      }

      if (error instanceof Error && error.message === "Only the host can restart the game") {
        next(new HttpError(403, error.message));
        return;
      }

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

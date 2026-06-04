import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema
} from "./schemas.js";
import {
  createRoom,
  endRound,
  getRoom,
  joinRoom,
  nextRound,
  restartGame,
  startGame,
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
      const { participantId } = roomViewerQuerySchema.parse(request.query);

      if (!participantId) {
        throw new HttpError(400, "Participant ID is required");
      }

      const room = startGame(code.toUpperCase(), participantId);

      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Only the host")) {
        next(new HttpError(403, error.message));
        return;
      }
      if (error instanceof Error && error.message.includes("At least 2 players")) {
        next(new HttpError(400, error.message));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/draw", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const { data } = request.body;

      if (!participantId) {
        throw new HttpError(400, "Participant ID is required");
      }

      const room = updateCanvas(code.toUpperCase(), participantId, data);

      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Only the drawer")) {
        next(new HttpError(403, error.message));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const { text } = request.body;

      if (!participantId) {
        throw new HttpError(400, "Participant ID is required");
      }

      if (!text || text.trim().length === 0) {
        throw new HttpError(400, "Guess text is required");
      }

      const room = submitGuess(code.toUpperCase(), participantId, text);

      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Drawers cannot submit guesses")) {
        next(new HttpError(403, error.message));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/end", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);

      if (!participantId) {
        throw new HttpError(400, "Participant ID is required");
      }

      const room = endRound(code.toUpperCase(), participantId);

      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Only the host")) {
        next(new HttpError(403, error.message));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);

      if (!participantId) {
        throw new HttpError(400, "Participant ID is required");
      }

      const room = restartGame(code.toUpperCase(), participantId);

      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Only the host")) {
        next(new HttpError(403, error.message));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/next-round", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);

      if (!participantId) {
        throw new HttpError(400, "Participant ID is required");
      }

      const room = nextRound(code.toUpperCase(), participantId);

      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Only the host")) {
        next(new HttpError(403, error.message));
        return;
      }
      next(error);
    }
  });

  return router;
}

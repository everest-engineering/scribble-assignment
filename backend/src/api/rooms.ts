import { Router } from "express";
import {
  clearCanvasSchema,
  createRoomSchema,
  drawStrokeSchema,
  endRoundSchema,
  guessSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameParamsSchema
} from "./schemas.js";
import {
  appendStroke,
  clearCanvas,
  createRoom,
  endRound,
  getCanvasState,
  getRoom,
  joinRoom,
  leaveRoom,
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
        const room = getRoom(code.toUpperCase());
        if (!room) {
          throw new HttpError(404, "Room not found");
        }
        if (room.status !== "lobby") {
          throw new HttpError(409, "Game already in progress");
        }
        throw new HttpError(409, "Room is full");
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
      const { code } = startGameParamsSchema.parse(request.params);
      const { participantId } = request.body as { participantId?: string };

      if (!participantId) {
        throw new HttpError(400, "participantId is required");
      }

      const room = startRoom(code.toUpperCase(), participantId);

      if (!room) {
        const existing = getRoom(code.toUpperCase());
        if (!existing) {
          throw new HttpError(404, "Room not found");
        }
        if (existing.status !== "lobby") {
          throw new HttpError(409, "Game already started");
        }
        if (existing.hostId !== participantId) {
          throw new HttpError(403, "Only the host can start the game");
        }
        throw new HttpError(400, "Need at least 2 players to start");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/draw", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, color, points } = drawStrokeSchema.parse(request.body);
      const result = appendStroke(code.toUpperCase(), participantId, { color, points });

      if (!result) {
        const room = getRoom(code.toUpperCase());
        if (!room) throw new HttpError(404, "Room not found");
        if (room.status !== "playing") throw new HttpError(409, "Game is not in progress");
        throw new HttpError(403, "Only the drawer can draw");
      }

      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:code/draw", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearCanvasSchema.parse(request.body);
      const result = clearCanvas(code.toUpperCase(), participantId);

      if (!result) {
        const room = getRoom(code.toUpperCase());
        if (!room) throw new HttpError(404, "Room not found");
        if (room.status !== "playing") throw new HttpError(409, "Game is not in progress");
        throw new HttpError(403, "Only the drawer can clear the canvas");
      }

      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code/canvas", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      const strokes = getCanvasState(code.toUpperCase());
      response.json({ strokes });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = guessSchema.parse(request.body);
      const result = submitGuess(code.toUpperCase(), participantId, text);

      if (!result) {
        const room = getRoom(code.toUpperCase());
        if (!room) throw new HttpError(404, "Room not found");
        if (room.status !== "playing") throw new HttpError(409, "Game is not in progress");
        throw new HttpError(403, "Only guessers can submit guesses");
      }

      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/end-round", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = endRoundSchema.parse(request.body);
      const room = endRound(code.toUpperCase(), participantId);

      if (!room) {
        const existing = getRoom(code.toUpperCase());
        if (!existing) throw new HttpError(404, "Room not found");
        if (existing.status !== "playing") throw new HttpError(409, "Game is not in progress");
        throw new HttpError(403, "Only the host can end the round");
      }

      response.json({ room: toRoomSnapshot(room, participantId) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/leave", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = request.body as { participantId?: string };

      if (!participantId) {
        throw new HttpError(400, "participantId is required");
      }

      const success = leaveRoom(code.toUpperCase(), participantId);

      if (!success) {
        const room = getRoom(code.toUpperCase());
        if (!room) {
          throw new HttpError(404, "Room not found");
        }
        throw new HttpError(404, "Participant not found in room");
      }

      response.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

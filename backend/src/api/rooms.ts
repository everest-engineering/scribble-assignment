import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema,
  strokeSchema,
  guessSchema,
  finishRoundSchema,
  restartGameSchema
} from "./schemas.js";
import { 
  createRoom, 
  getRoom, 
  joinRoom, 
  toRoomSnapshot, 
  startGame, 
  addStrokes, 
  addGuess,
  finishRound,
  restartGame
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

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body);
      
      try {
        const room = startGame(code.toUpperCase(), participantId);
        
        if (!room) {
          throw new HttpError(404, "Room not found");
        }
        
        response.json({
          room: toRoomSnapshot(room, participantId)
        });
      } catch (err) {
        throw new HttpError(403, err instanceof Error ? err.message : "Forbidden");
      }
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/finish", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = finishRoundSchema.parse(request.body);
      
      try {
        const room = finishRound(code.toUpperCase(), participantId);
        if (!room) {
          throw new HttpError(404, "Room not found");
        }
        response.json({
          room: toRoomSnapshot(room, participantId)
        });
      } catch (err) {
        throw new HttpError(403, err instanceof Error ? err.message : "Forbidden");
      }
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartGameSchema.parse(request.body);
      
      try {
        const room = restartGame(code.toUpperCase(), participantId);
        if (!room) {
          throw new HttpError(404, "Room not found");
        }
        response.json({
          room: toRoomSnapshot(room, participantId)
        });
      } catch (err) {
        throw new HttpError(403, err instanceof Error ? err.message : "Forbidden");
      }
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/strokes", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, strokes } = strokeSchema.parse(request.body);
      
      try {
        const room = addStrokes(code.toUpperCase(), participantId, strokes);
        if (!room) {
          throw new HttpError(404, "Room not found");
        }
        response.json({
          room: toRoomSnapshot(room, participantId)
        });
      } catch (err) {
        throw new HttpError(403, err instanceof Error ? err.message : "Forbidden");
      }
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = guessSchema.parse(request.body);
      
      try {
        const room = addGuess(code.toUpperCase(), participantId, text);
        if (!room) {
          throw new HttpError(404, "Room not found");
        }
        response.json({
          room: toRoomSnapshot(room, participantId)
        });
      } catch (err) {
        throw new HttpError(403, err instanceof Error ? err.message : "Forbidden");
      }
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/join", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { playerName } = joinRoomSchema.parse(request.body);
      
      try {
        const result = joinRoom(code.toUpperCase(), playerName);

        if (!result) {
          throw new HttpError(404, "Room not found");
        }

        response.json({
          participantId: result.participantId,
          room: toRoomSnapshot(result.room, result.participantId)
        });
      } catch (err) {
        if (err instanceof Error && err.message === "Room already in progress") {
          throw new HttpError(403, err.message);
        }
        throw err;
      }
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

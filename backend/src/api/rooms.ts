import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  submitGuessSchema,
  updateCanvasSchema
} from "./schemas.js";
import {
  createRoom,
  getRoom,
  joinRoom,
  startGame,
  submitGuess,
  toRoomSnapshot,
  updateCanvas,
  endRound,
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

  router.post("/:code/join", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { playerName } = joinRoomSchema.parse(request.body);
      
      let result;
      try {
        result = joinRoom(code.toUpperCase(), playerName);
      } catch (err) {
        if (err instanceof Error && err.message === "Player name already taken in this room") {
          throw new HttpError(400, err.message);
        }
        throw err;
      }

      if (!result) {
        throw new HttpError(404, "Room not found. Please check the code and try again.");
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
        throw new HttpError(400, "participantId is required");
      }

      let resultRoom;
      try {
        resultRoom = startGame(code.toUpperCase(), participantId);
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === "Only the host can start the game") {
            throw new HttpError(403, err.message);
          }
          if (err.message === "Cannot start game: at least 2 players are required") {
            throw new HttpError(400, err.message);
          }
        }
        throw err;
      }

      if (!resultRoom) {
        throw new HttpError(404, "Room not found");
      }

      response.json({
        room: toRoomSnapshot(resultRoom, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/canvas", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const { drawingData } = updateCanvasSchema.parse(request.body);

      if (!participantId) {
        throw new HttpError(400, "participantId is required");
      }

      let resultRoom;
      try {
        resultRoom = updateCanvas(code.toUpperCase(), participantId, drawingData);
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === "Only the active drawer can draw on the canvas") {
            throw new HttpError(403, err.message);
          }
          if (err.message === "Cannot draw: game is not active") {
            throw new HttpError(400, err.message);
          }
        }
        throw err;
      }

      if (!resultRoom) {
        throw new HttpError(404, "Room not found");
      }

      response.json({
        room: toRoomSnapshot(resultRoom, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const { guessText } = submitGuessSchema.parse(request.body);

      if (!participantId) {
        throw new HttpError(400, "participantId is required");
      }

      let resultRoom;
      try {
        resultRoom = submitGuess(code.toUpperCase(), participantId, guessText);
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === "Drawer cannot submit guesses") {
            throw new HttpError(403, err.message);
          }
          if (err.message === "Cannot submit guess: game is not active" || err.message === "Guess cannot be empty") {
            throw new HttpError(400, err.message);
          }
        }
        throw err;
      }

      if (!resultRoom) {
        throw new HttpError(404, "Room not found");
      }

      response.json({
        room: toRoomSnapshot(resultRoom, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/end", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);

      if (!participantId) {
        throw new HttpError(400, "participantId is required");
      }

      let resultRoom;
      try {
        resultRoom = endRound(code.toUpperCase(), participantId);
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === "Only the host can end the round") {
            throw new HttpError(403, err.message);
          }
        }
        throw err;
      }

      if (!resultRoom) {
        throw new HttpError(404, "Room not found");
      }

      response.json({
        room: toRoomSnapshot(resultRoom, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);

      if (!participantId) {
        throw new HttpError(400, "participantId is required");
      }

      let resultRoom;
      try {
        resultRoom = restartGame(code.toUpperCase(), participantId);
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === "Only the host can restart the game") {
            throw new HttpError(403, err.message);
          }
        }
        throw err;
      }

      if (!resultRoom) {
        throw new HttpError(404, "Room not found");
      }

      response.json({
        room: toRoomSnapshot(resultRoom, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

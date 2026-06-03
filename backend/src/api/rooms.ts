import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startRoomSchema,
  addStrokeSchema,
  submitGuessSchema,
  endRoundSchema,
  restartRoomSchema
} from "./schemas.js";
import { createRoom, getRoom, joinRoom, startRoom, toRoomSnapshot, addStroke, clearCanvas, submitGuess, endRound, restartRoom } from "../services/roomStore.js";

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
      const { participantId } = startRoomSchema.parse(request.body);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      if (room.hostId !== participantId) {
        throw new HttpError(403, "Only the host can start the game");
      }

      if (room.participants.length < 2) {
        throw new HttpError(409, "At least 2 players are required to start");
      }

      const snapshot = startRoom(code.toUpperCase());

      if (!snapshot || !snapshot.currentWord) {
        throw new HttpError(500, "No words available to start the game");
      }

      response.json({ room: snapshot });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/stroke", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, stroke } = addStrokeSchema.parse(request.body);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      if (room.drawerId !== participantId) {
        throw new HttpError(403, "Only the drawer can draw");
      }

      const snapshot = addStroke(code.toUpperCase(), stroke, participantId);

      if (!snapshot) {
        throw new HttpError(404, "Unable to load room");
      }

      response.json({ room: snapshot });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startRoomSchema.parse(request.body);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      if (room.drawerId !== participantId) {
        throw new HttpError(403, "Only the drawer can clear the canvas");
      }

      const snapshot = clearCanvas(code.toUpperCase(), participantId);

      if (!snapshot) {
        throw new HttpError(404, "Unable to load room");
      }

      response.json({ room: snapshot });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = submitGuessSchema.parse(request.body);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      if (room.drawerId === participantId) {
        throw new HttpError(403, "The drawer cannot submit guesses");
      }

      const guesser = room.participants.find((p) => p.id === participantId);

      if (!guesser) {
        throw new HttpError(404, "Player not found in room");
      }

      const { snapshot, correct } = submitGuess(code.toUpperCase(), participantId, guesser.name, text);

      if (!snapshot) {
        throw new HttpError(404, "Unable to load room");
      }

      response.json({ room: snapshot, correct });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/end", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = endRoundSchema.parse(request.body);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      if (room.hostId !== participantId) {
        throw new HttpError(403, "Only the host can end the round");
      }

      if (room.status !== "active") {
        throw new HttpError(409, "Game is not active");
      }

      const snapshot = endRound(code.toUpperCase());

      if (!snapshot) {
        throw new HttpError(404, "Unable to end round");
      }

      response.json({ room: snapshot });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartRoomSchema.parse(request.body);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      if (room.hostId !== participantId) {
        throw new HttpError(403, "Only the host can restart");
      }

      const snapshot = restartRoom(code.toUpperCase());

      if (!snapshot) {
        throw new HttpError(404, "Unable to restart room");
      }

      response.json({ room: snapshot });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

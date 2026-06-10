import { Router } from "express";
import {
  canvasActionSchema,
  createRoomSchema,
  guessSubmissionSchema,
  HttpError,
  joinRoomSchema,
  playerIdQuerySchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema
} from "./schemas.js";
import { appendCanvasAction, clearCanvas, createRoom, getRoom, joinRoom, startGame, submitGuess, toRoomSnapshot } from "../services/roomStore.js";

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
        throw new HttpError(404, "Room not found — check the code and try again");
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
      const { participantId } = startGameSchema.parse(request.body);
      const result = startGame(code.toUpperCase(), participantId);

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/canvas", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { playerId } = playerIdQuerySchema.parse(request.query);
      const action = canvasActionSchema.parse(request.body);

      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      if (room.drawerId !== playerId) {
        throw new HttpError(403, "Only the drawer can submit canvas actions");
      }

      if (room.status !== "playing") {
        throw new HttpError(400, "Game is not in progress");
      }

      const timestamp = new Date().toISOString();

      if (action.type === "clear") {
        clearCanvas(room, action.timestamp ?? timestamp);
      } else {
        appendCanvasAction(room, {
          type: "stroke",
          points: action.points,
          color: action.color,
          width: action.width,
          timestamp: action.timestamp ?? timestamp
        });
      }

      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { playerId } = playerIdQuerySchema.parse(request.query);
      const { text } = guessSubmissionSchema.parse(request.body);

      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      if (room.status !== "playing") {
        throw new HttpError(400, "Game is not in progress");
      }

      const result = submitGuess(room, playerId, text);

      response.json({
        correct: result.correct,
        score: result.score,
        guessId: result.guessId
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

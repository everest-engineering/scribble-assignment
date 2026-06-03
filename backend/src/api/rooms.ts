import { Router } from "express";
import {
  createRoomSchema,
  guessSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema
} from "./schemas.js";
import {
  createRoom,
  getRoom,
  joinRoom,
  restartGame,
  startGame,
  submitGuess,
  toRoomSnapshot,
  type RestartGameError,
  type StartGameError,
  type SubmitGuessError
} from "../services/roomStore.js";

const startGameErrors: Record<StartGameError, { status: number; message: string }> = {
  not_found: { status: 404, message: "Room not found." },
  forbidden: { status: 403, message: "Only the host can start the game." },
  not_lobby: { status: 409, message: "The game has already started." },
  too_few_players: { status: 400, message: "At least 2 players are required to start." }
};

const guessErrors: Record<SubmitGuessError, { status: number; message: string }> = {
  not_found: { status: 404, message: "Room not found." },
  not_playing: { status: 409, message: "The game is not in progress." },
  not_participant: { status: 403, message: "You are not in this room." },
  drawer_cannot_guess: { status: 403, message: "The drawer cannot guess." }
};

const restartGameErrors: Record<RestartGameError, { status: number; message: string }> = {
  not_found: { status: 404, message: "Room not found." },
  forbidden: { status: 403, message: "Only the host can restart the game." }
};

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
        throw new HttpError(404, "Room not found.");
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

      if (!result.ok) {
        const { status, message } = startGameErrors[result.error];
        throw new HttpError(status, message);
      }

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = guessSchema.parse(request.body);
      const result = submitGuess(code.toUpperCase(), participantId, text);

      if (!result.ok) {
        const { status, message } = guessErrors[result.error];
        throw new HttpError(status, message);
      }

      response.json({
        guess: result.guess,
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body);
      const result = restartGame(code.toUpperCase(), participantId);

      if (!result.ok) {
        const { status, message } = restartGameErrors[result.error];
        throw new HttpError(status, message);
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
        throw new HttpError(404, "Room not found.");
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

import { Router } from "express";
import {
  createRoomSchema,
  guessSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema,
  strokeSchema
} from "./schemas.js";
import { createRoom, getRoom, joinRoom, saveRoom, selectWord, toRoomSnapshot } from "../services/roomStore.js";

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
      const { participantId } = startGameSchema.parse(request.body);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      if (room.hostId !== participantId) {
        throw new HttpError(403, "Only the host can start the game");
      }

      if (room.participants.length < 2) {
        throw new HttpError(400, "At least 2 players are required to start");
      }

      room.drawerId = room.hostId;
      room.currentWord = selectWord(room.code);
      room.status = "playing";
      saveRoom(room);

      response.json({
        room: toRoomSnapshot(room, participantId)
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

  router.post("/:code/strokes", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const body = strokeSchema.parse(request.body);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      if (room.status !== "playing") {
        throw new HttpError(400, "Game is not in progress");
      }

      if (body.participantId !== room.drawerId) {
        throw new HttpError(403, "Only the drawer can submit strokes");
      }

      if (body.type === "draw") {
        room.strokes.push(body);
      } else if (body.type === "clear") {
        room.strokes = [];
      }

      saveRoom(room);
      response.json({ room: toRoomSnapshot(room, body.participantId) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const body = guessSchema.parse(request.body);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      const trimmedGuess = body.guess.trim();
      if (trimmedGuess.length === 0) {
        throw new HttpError(400, "Guess must not be empty");
      }

      if (room.status !== "playing" || room.currentWord === null) {
        throw new HttpError(400, "Game is not in a valid playing state");
      }

      if (body.participantId === room.drawerId) {
        throw new HttpError(403, "Drawer cannot guess their own word");
      }

      const participant = room.participants.find((p) => p.id === body.participantId);
      if (!participant) {
        throw new HttpError(404, "Participant not found in room");
      }

      const alreadyCorrect = room.guesses.some(
        (g) => g.participantId === body.participantId && g.correct
      );
      if (alreadyCorrect) {
        throw new HttpError(400, "You have already guessed correctly this round");
      }

      const correct = trimmedGuess.toLowerCase() === room.currentWord.toLowerCase();
      if (correct) {
        participant.score += 100;
      }

      room.guesses.push({
        participantId: participant.id,
        participantName: participant.name,
        text: trimmedGuess,
        correct
      });

      saveRoom(room);
      response.json({ correct, score: participant.score });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

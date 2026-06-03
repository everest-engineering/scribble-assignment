import { randomUUID } from "node:crypto";
import { Router } from "express";
import {
  clearSchema,
  createRoomSchema,
  guessSchema,
  HttpError,
  joinRoomParamsSchema,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startRoomSchema,
  strokeSchema
} from "./schemas.js";
import { createRoom, getRoom, joinRoom, saveRoom, toRoomSnapshot } from "../services/roomStore.js";
import { STARTER_WORDS } from "../seed/starterData.js";

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
      const { code } = joinRoomParamsSchema.parse(request.params);
      const { playerName } = joinRoomSchema.parse(request.body);
      const result = joinRoom(code, playerName);

      if (!result) {
        throw new HttpError(404, "Room not found");
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
      const { participantId } = startRoomSchema.parse(request.body);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      if (room.hostId !== participantId) {
        throw new HttpError(403, "Only the host can start the game");
      }

      if (room.participants.length < 2) {
        throw new HttpError(400, "At least 2 players are required to start the game");
      }

      room.status = "active";
      room.drawerId = room.hostId;
      room.currentWord = STARTER_WORDS[0];
      room.strokes = [];
      room.guesses = [];
      room.scores = Object.fromEntries(room.participants.map((p) => [p.id, 0]));
      const updatedRoom = saveRoom(room);

      response.json({
        room: toRoomSnapshot(updatedRoom!, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/stroke", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, stroke } = strokeSchema.parse(request.body);
      const room = getRoom(code.toUpperCase());

      if (!room) throw new HttpError(404, "Room not found");
      if (room.status !== "active") throw new HttpError(400, "Room is not active");
      if (room.drawerId !== participantId) throw new HttpError(403, "Only the drawer can draw");

      room.strokes.push({
        points: stroke.points,
        color: stroke.color ?? "#000000",
        lineWidth: stroke.lineWidth ?? 4
      });
      const updatedRoom = saveRoom(room);

      response.json({ room: toRoomSnapshot(updatedRoom!, participantId) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearSchema.parse(request.body);
      const room = getRoom(code.toUpperCase());

      if (!room) throw new HttpError(404, "Room not found");
      if (room.status !== "active") throw new HttpError(400, "Room is not active");
      if (room.drawerId !== participantId) throw new HttpError(403, "Only the drawer can clear the canvas");

      room.strokes = [];
      const updatedRoom = saveRoom(room);

      response.json({ room: toRoomSnapshot(updatedRoom!, participantId) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = guessSchema.parse(request.body);
      const room = getRoom(code.toUpperCase());

      if (!room) throw new HttpError(404, "Room not found");
      if (room.status !== "active") throw new HttpError(400, "Room is not active");

      const trimmed = text.trim();
      if (!trimmed) throw new HttpError(400, "Guess cannot be empty");
      if (room.drawerId === participantId) throw new HttpError(403, "The drawer cannot guess");
      if (room.guesses.some((g) => g.participantId === participantId && g.correct)) {
        throw new HttpError(403, "You have already guessed correctly");
      }

      const correct = trimmed.toLowerCase() === room.currentWord!.toLowerCase();
      const guess = {
        id: randomUUID(),
        participantId,
        text: trimmed,
        correct,
        submittedAt: new Date().toISOString()
      };

      room.guesses.push(guess);
      room.scores[participantId] = (room.scores[participantId] ?? 0) + (correct ? 100 : 0);
      const updatedRoom = saveRoom(room);

      response.json({ guess, room: toRoomSnapshot(updatedRoom!, participantId) });
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

import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  guessPayloadSchema,
  canvasEventSchema,
  ERR_GUESS_REQUIRED,
  ERR_GUESS_TOO_LONG,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startRoomSchema,
  restartRoomSchema
} from "./schemas.js";
import {
  createRoom,
  getRoom,
  joinRoom,
  toRoomSnapshot,
  startGame,
  submitGuess,
  getGuesses,
  appendCanvasEvent,
  restartRoom
} from "../services/roomStore.js";
import { reconnectSchema } from "./schemas.js";
import { reconnectParticipant } from "../services/roomStore.js";

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const name = playerName === undefined ? undefined : playerName.trim();
      if (name === "") {
        throw new HttpError(400, "Please enter a name.", "ERR_NAME_REQUIRED");
      }
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
      const name = playerName === undefined ? undefined : playerName.trim();
      if (name === "") {
        throw new HttpError(400, "Please enter a name.", "ERR_NAME_REQUIRED");
      }

      const result = joinRoom(
        code.toUpperCase(),
        playerName as string | undefined
      );

      if (!result) {
        throw new HttpError(404, "Unable to join room");
      }

      if ((result as any).reason === "not-lobby") {
        throw new HttpError(409, "Room is not accepting joins");
      }

      response.json({
        participantId: (result as any).participantId,
        room: toRoomSnapshot(
          (result as any).room,
          (result as any).participantId
        )
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startRoomSchema.parse(request.body);

      const result = startGame(code.toUpperCase(), participantId);

      if ((result as any).reason === "not-found") {
        throw new HttpError(404, "Unable to find room");
      }

      if ((result as any).reason === "not-host") {
        throw new HttpError(403, "Only the host can start the game");
      }

      if ((result as any).reason === "not-enough") {
        throw new HttpError(409, "Not enough players to start the game");
      }

      if ((result as any).reason === "no-words") {
        throw new HttpError(409, "No starter words configured", "ERR_NO_WORDS");
      }

      if ((result as any).reason === "already-in-game") {
        throw new HttpError(409, "Game already started");
      }

      response.json({
        room: toRoomSnapshot((result as any).room, participantId)
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

  // Drawer-only endpoint to retrieve the secret word for the active round
  router.get("/:code/secret-word", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      if (room.status !== "in-game" || !room.drawerId) {
        throw new HttpError(409, "Game not in progress");
      }

      if (!participantId || participantId !== room.drawerId) {
        throw new HttpError(403, "Only the drawer may view the secret word");
      }

      response.json({ secretWord: room.secretWord });
    } catch (error) {
      next(error);
    }
  });

  // GET last-round-summary for a room
  router.get("/:code/last-round-summary", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      const summary = room.lastRoundSummary;
      response.json({ lastRoundSummary: summary ?? null });
    } catch (error) {
      next(error);
    }
  });

  // POST restart endpoint — host may restart round and preserve participants
  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartRoomSchema.parse(request.body);

      const result = restartRoom(code.toUpperCase(), participantId);

      if ((result as any).reason === "not-found") {
        throw new HttpError(404, "Unable to find room");
      }

      if ((result as any).reason === "not-host") {
        throw new HttpError(403, "Only the host can restart the room");
      }

      response.json({
        room: toRoomSnapshot((result as any).room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  // POST reconnect — allow clients with a previous participantId to reattach
  router.post("/:code/reconnect", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = reconnectSchema.parse(request.body);

      const result = reconnectParticipant(code.toUpperCase(), participantId);

      if ((result as any).reason === "not-found") {
        throw new HttpError(404, "Unable to find room or participant");
      }

      response.json({
        participantId: (result as any).participantId,
        room: toRoomSnapshot((result as any).room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  // POST a guess: validate, score, and persist
  router.post("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = guessPayloadSchema.parse(request.body);

      const trimmed = text === undefined ? "" : text.trim();
      if (!trimmed) {
        throw new HttpError(400, "Please enter a guess.", ERR_GUESS_REQUIRED);
      }

      if (trimmed.length > 200) {
        throw new HttpError(400, "Guess too long.", ERR_GUESS_TOO_LONG);
      }

      const result = submitGuess(code.toUpperCase(), participantId, trimmed);

      if ((result as any).reason === "not-found") {
        throw new HttpError(404, "Unable to find room");
      }

      if ((result as any).reason === "not-in-game") {
        throw new HttpError(409, "Game not in progress");
      }

      response.status(201).json({ guess: (result as any).guess });
    } catch (error) {
      next(error);
    }
  });

  // GET guess history
  router.get("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const guesses = getGuesses(code.toUpperCase());
      if (guesses === null) {
        throw new HttpError(404, "Unable to find room");
      }
      response.json({ guesses });
    } catch (error) {
      next(error);
    }
  });

  // POST canvas event (drawer only)
  router.post("/:code/canvas-events", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, event } = canvasEventSchema.parse(request.body);

      const canvasEvent = { ...event, timestamp: new Date().toISOString() };

      const result = appendCanvasEvent(
        code.toUpperCase(),
        participantId,
        canvasEvent as any
      );

      if ((result as any).reason === "not-found") {
        throw new HttpError(404, "Unable to find room");
      }

      if ((result as any).reason === "not-authorized") {
        throw new HttpError(403, "Only the drawer may post canvas events");
      }

      response.status(201).json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

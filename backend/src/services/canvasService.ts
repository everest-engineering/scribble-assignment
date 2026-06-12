import type { Stroke, CanvasState } from "../models/canvas.js";
import { addStrokeActionSchema, clearCanvasActionSchema } from "../models/canvas.js";
import { HttpError } from "../api/schemas.js";
import { getRoom, saveRoom } from "./roomStore.js";

function getDrawerCheckedRoom(code: string, participantId: string) {
  const room = getRoom(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status !== "playing") {
    throw new HttpError(400, "Game is not in progress");
  }

  const participant = room.participants.find((p) => p.id === participantId);

  if (!participant) {
    throw new HttpError(404, "Participant not found");
  }

  if (participant.role !== "drawer") {
    throw new HttpError(403, "Only the drawer can perform this action");
  }

  if (!room.canvasState) {
    room.canvasState = {
      strokes: [],
      roundNumber: 1
    };
  }

  return room;
}

export function addStroke(code: string, participantId: string, stroke: Stroke): CanvasState {
  const parsed = addStrokeActionSchema.parse({ participantId, stroke });
  const room = getDrawerCheckedRoom(code, parsed.participantId);

  room.canvasState!.strokes.push(parsed.stroke);
  saveRoom(room);

  return room.canvasState!;
}

export function clearCanvas(code: string, participantId: string): CanvasState {
  const parsed = clearCanvasActionSchema.parse({ participantId });
  const room = getDrawerCheckedRoom(code, parsed.participantId);

  room.canvasState!.strokes = [];
  saveRoom(room);

  return room.canvasState!;
}

export function getCanvas(code: string): CanvasState | null {
  const room = getRoom(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  return room.canvasState ?? null;
}

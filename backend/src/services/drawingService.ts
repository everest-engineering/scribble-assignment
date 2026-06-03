import { DrawingAction } from "../models/drawing.js";
import { getRoom, saveRoom } from "./roomStore.js";

export function handleDrawingAction(roomCode: string, participantId: string, action: DrawingAction) {
  const room = getRoom(roomCode);
  if (!room) {
    throw new Error("Room not found");
  }

  if (room.drawerId !== participantId) {
    throw new Error("Only the drawer can perform drawing actions");
  }

  if (action.type === "CLEAR") {
    room.drawingState = [];
  } else {
    room.drawingState.push(action);
  }

  return saveRoom(room);
}

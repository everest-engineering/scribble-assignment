import { Router } from "express";
import { roomCodeParamsSchema } from "./schemas.js";
import { addStrokeActionSchema, clearCanvasActionSchema } from "../models/canvas.js";
import { addStroke, clearCanvas, getCanvas } from "../services/canvasService.js";

export function createCanvasRouter() {
  const router = Router();

  router.post("/:code/canvas/strokes", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, stroke } = addStrokeActionSchema.parse(request.body);
      const canvasState = addStroke(code.toUpperCase(), participantId, stroke);

      response.json({ canvasState });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/canvas/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearCanvasActionSchema.parse(request.body);
      const canvasState = clearCanvas(code.toUpperCase(), participantId);

      response.json({ canvasState });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code/canvas", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const canvasState = getCanvas(code.toUpperCase());

      response.json({ canvasState });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

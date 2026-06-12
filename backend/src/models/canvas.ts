import { z } from "zod";

export const pointSchema = z.object({
  x: z.number().finite().min(0).max(1),
  y: z.number().finite().min(0).max(1)
});

export type Point = z.infer<typeof pointSchema>;

export const strokeSchema = z.object({
  id: z.string().uuid(),
  points: z.array(pointSchema).min(2).max(1000),
  colour: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  width: z.union([z.literal(2), z.literal(4), z.literal(8)]),
  createdAt: z.string().datetime()
});

export type Stroke = z.infer<typeof strokeSchema>;

export interface CanvasState {
  strokes: Stroke[];
  roundNumber: number;
}

export const addStrokeActionSchema = z.object({
  participantId: z.string(),
  stroke: strokeSchema
});

export const clearCanvasActionSchema = z.object({
  participantId: z.string()
});

export type DrawingAction = {
  type: "add_stroke";
  stroke: Stroke;
  participantId: string;
} | {
  type: "clear";
  participantId: string;
};

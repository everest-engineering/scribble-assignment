import { z } from "zod";

export const GuessSchema = z.object({
  text: z.string().trim().min(1, "Guess cannot be empty").max(50, "Guess is too long"),
});

export type GuessPayload = z.infer<typeof GuessSchema>;

export interface Guess {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  timestamp: number;
}

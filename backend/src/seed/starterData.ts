import type { ParticipantRole } from "../models/game.js";

export const STARTER_WORDS = [
  "rocket",
  "pizza",
  "castle",
  "guitar",
  "sunflower"
] as const;

export const STARTER_ROLES: ParticipantRole[] = ["drawer", "guesser"];

export type StarterWord = (typeof STARTER_WORDS)[number];

export function isStarterWord(word: string): word is StarterWord {
  return (STARTER_WORDS as readonly string[]).includes(word);
}

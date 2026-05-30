import type { ParticipantRole } from "../models/game.js";

export const STARTER_WORDS = [
  "rocket",
  "pizza",
  "castle",
  "guitar",
  "sunflower",
  "dragon",
  "bicycle",
  "umbrella",
  "mountain",
  "telescope",
  "penguin",
  "volcano"
] as const;

export const STARTER_ROLES: ParticipantRole[] = ["drawer", "guesser"];

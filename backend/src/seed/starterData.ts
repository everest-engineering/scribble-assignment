import type { ParticipantRole } from "../models/game.js";

export const STARTER_WORDS = [
  "rocket",
  "pizza",
  "castle",
  "guitar",
  "sunflower",
  "mountain",
  "bicycle",
  "umbrella",
  "diamond",
  "lantern",
  "penguin",
  "cactus",
  "anchor",
  "volcano",
  "camera",
  "snowflake",
  "telescope",
  "parachute",
  "lighthouse",
  "treasure",
  "compass",
  "rainbow",
  "balloon",
  "crown"
] as const;

export const STARTER_ROLES: ParticipantRole[] = ["drawer", "guesser"];

import type { ParticipantRole } from "../models/game.js";

export const STARTER_WORDS = [
  "rocket",
  "pizza",
  "castle",
  "guitar",
  "sunflower",
  "umbrella",
  "dragon",
  "anchor",
  "bridge",
  "candle",
  "desert",
  "elephant",
  "feather",
  "giraffe",
  "hammer",
  "island",
  "jungle",
  "kettle",
  "ladder",
  "mirror",
  "nebula",
  "orange",
  "puzzle",
  "quartz",
  "ribbon",
  "saddle",
  "tunnel",
  "vortex",
  "window",
  "zeppelin"
] as const;

export const STARTER_ROLES: ParticipantRole[] = ["drawer", "guesser"];

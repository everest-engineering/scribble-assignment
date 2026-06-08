import { STARTER_WORDS } from "../seed/starterData.js";

// Deterministically pick the round's secret word from the starter list.
// Seeded by `${code}:${roundNumber}` so a given room code at a given round
// always yields the same word — reproducible and testable (FR-005, SC-005).
// Pure: no Math.random, no Date.
export function selectWord(code: string, roundNumber: number): string {
  const seed = `${code}:${roundNumber}`;

  // djb2 string hash, kept unsigned.
  let hash = 5381;
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) + hash + seed.charCodeAt(index)) >>> 0;
  }

  return STARTER_WORDS[hash % STARTER_WORDS.length];
}

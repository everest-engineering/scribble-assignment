import { STARTER_WORDS } from "../seed/starterData.js";

export function selectRoundWord(roomCode: string, roundNumber: number) {
  const normalizedCode = roomCode.trim().toUpperCase();
  let hash = roundNumber;

  for (const character of normalizedCode) {
    hash += character.charCodeAt(0);
  }

  const index = hash % STARTER_WORDS.length;
  return STARTER_WORDS[index];
}

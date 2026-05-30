import { STARTER_WORDS } from "../seed/starterData.js";

export function selectWord(roomCode: string): string {
  const index =
    [...roomCode].reduce((sum, character) => sum + character.charCodeAt(0), 0) %
    STARTER_WORDS.length;

  return STARTER_WORDS[index];
}

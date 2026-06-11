import { STARTER_WORDS } from "../seed/starterData.js";

export function selectWord(roomCode: string, roundNumber: number): string {
  let hash = 0;
  for (let i = 0; i < roomCode.length; i++) {
    hash = (hash * 31 + roomCode.charCodeAt(i)) | 0;
  }
  const index = Math.abs((hash + roundNumber - 1)) % STARTER_WORDS.length;
  return STARTER_WORDS[index];
}

export const STARTER_WORDS = [
  "apple",
  "banana",
  "car",
  "dog",
  "elephant",
  "fish",
  "guitar",
  "house",
  "ice",
  "jungle",
  "kite",
  "lion",
  "monkey",
  "ninja",
  "ocean",
  "pizza",
  "queen",
  "rocket",
  "sun",
  "tree",
  "umbrella",
  "volcano",
  "watermelon",
  "xylophone",
  "yacht",
  "zebra"
];

export function getWordForRoom(roomCode: string, roundNumber: number = 1): string {
  // Deterministic selection based on room code and round number
  const sum = roomCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = (sum + roundNumber) % STARTER_WORDS.length;
  return STARTER_WORDS[index];
}

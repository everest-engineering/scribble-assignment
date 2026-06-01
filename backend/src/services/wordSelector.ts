import { createHmac } from "node:crypto";

/**
 * Deterministically selects a word from `list` using HMAC-SHA256 keyed by
 * `seed` and message `roundIndex`.
 *
 * @param seed - secret seed string (room seed)
 * @param roundIndex - non-negative integer identifying the round
 * @param list - non-empty array of candidate words
 */
export function selectDeterministicWord(
  seed: string,
  roundIndex: number,
  list: readonly string[]
): string {
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error("starter word list must be a non-empty array");
  }

  const h = createHmac("sha256", seed).update(String(roundIndex)).digest();
  const hex = h.toString("hex");
  const N = BigInt("0x" + hex);
  const idx = Number(N % BigInt(list.length));
  return list[idx];
}

export default selectDeterministicWord;

# Discovery Notes

## Incomplete Behaviors Found in Starter

1. **No host tracking** — The starter `Room` model had no `hostId` field. The creator was just the first participant with no special designation. No host-only permissions existed.

2. **No start-game endpoint or validation** — The lobby page had an unconditional "Start Game" button that navigated directly to `/game` without any backend call. No validation that the starter was the host or that ≥2 players were present.

3. **No drawer assignment on game start** — `startGame()` only set `status = "playing"`. No drawer was assigned, no secret word was selected, and no round was tracked.

4. **No lobby auto-polling** — The lobby used a manual "Refresh Room" button instead of automatic polling at ~2s intervals.

5. **No player name validation** — The Zod schemas used `z.string().optional()`, so empty/whitespace-only names were silently defaulted to "Player".

## Key Assumptions Made

1. **Host is always the first drawer** — For Scenario 2, we assumed the host (room creator) is the drawer for the first round. This matches "the host (or first player)" wording in the scenario.

2. **Deterministic word selection via room code** — The secret word is selected by summing the char codes of the room code and taking modulo word count. This ensures reproducibility: the same room code always picks the same word.

3. **Server-side secret word gating** — The `toRoomSnapshot()` function conditionally includes `secretWord` only when the viewer is the drawer. This means the frontend never receives the word for non-drawers — the enforcement happens server-side.

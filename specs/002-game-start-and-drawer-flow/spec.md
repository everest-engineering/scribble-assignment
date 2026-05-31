## Scenario 2 — Game Start & Drawer Flow

### Acceptance Criteria

**AC2.1 — Player name validation on game start**
- All player names are trimmed before the game starts.
- Any player with an empty/whitespace-only name after trim is rejected with: "All players must have a valid name."
- The game does not start if any name is invalid.

**AC2.2 — Drawer assignment**
- When the game starts, the host (room creator) becomes the first drawer.
- The drawer is identified by `drawerId` on the room.
- The lobby and game screen clearly indicate who the drawer is.

**AC2.3 — Secret word selection**
- The secret word is selected deterministically from `STARTER_WORDS`.
- Selection formula: `STARTER_WORDS[participantCount % STARTER_WORDS.length]`.
- The same room always produces the same word for the same participant set.

**AC2.4 — Drawer-only word visibility**
- The secret word is included in the room snapshot only when the requesting `participantId` matches the `drawerId`.
- For guessers, the word field is `null` or omitted.
- The drawer sees: "Your word: [secret word]" on the game screen.
- Guessers see: "Waiting for drawer to start drawing..."

### Edge Cases

- If the host leaves (not handled — out of scope for this lab), the drawer assignment remains as-is.
- Word selection is deterministic per room state (same participants = same word).

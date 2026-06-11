# Phase 0 Research — Gameplay Interaction

This file resolves the technical decisions left implicit by the spec. Each section follows the **Decision → Rationale → Alternatives Considered** format mandated by the plan template.

## 1. Guess comparison rule

**Decision**: Server compares `guess.text.trim().toLowerCase() === round.secretWord.trim().toLowerCase()`. Internal whitespace is **not** normalised — `"rock et"` does NOT match `"rocket"`.

**Rationale**: Matches the default in the spec's Open Questions §1. It is the simplest rule that still tolerates the two most common user mistakes (trailing space, accidental capitals). Collapsing internal whitespace would require an arbitrary policy (one space, no space, hyphens?) that the spec does not require.

**Alternatives considered**:

- **Aggressive normalisation** (`.replace(/\s+/g, "").toLowerCase()`): too forgiving; would accept `"r o c k e t"`. Reject — distorts game feel.
- **Levenshtein distance ≤ 1**: out of scope; introduces tuning surface and a third-party dependency.

## 2. Guess length cap

**Decision**: Max 50 Unicode codepoints on the trimmed string. Enforced by the Zod schema (`z.string().trim().min(1).max(50)`).

**Rationale**: All starter words are ≤ 10 codepoints; 50 gives 5× headroom and matches typical chat input caps. Caps both bandwidth and DOM size for the feed (50 entries × 50 chars = trivial).

**Alternatives considered**:

- **No cap**: rejected — a single client could grow the in-memory room indefinitely.
- **20 chars**: rejected — too tight; words like `"sunflower"` (9) leave little room for accidental typing/erroneous guesses we want logged.

## 3. Idempotency of correct guesses

**Decision**: Once a participant submits a **correct** guess in the current round, they are added to `round.lockedParticipantIds` and any subsequent guess from them in this round is rejected with HTTP `409` and body `{ "message": "You have already guessed correctly this round" }`. The score is NOT incremented again.

**Rationale**: Prevents accidental double-scoring from network retries or rapid double-clicks without needing dedupe tokens, while keeping the rule explicit to the user.

**Alternatives considered**:

- **Soft-allow but no second `+100`**: would still let the feed grow with the same correct guess repeatedly. Rejected — clutters the feed.
- **First-correct ends the round**: out of scope (Open Question §3).

## 4. Drawer guess attempts

**Decision**: Server returns HTTP `403` with body `{ "message": "Drawers cannot guess in their own round" }`. Frontend hides the input entirely when `state.mode === "drawer"` (defence in depth — server is still the source of truth).

**Rationale**: Matches the spec's FR-004 and aligns with the established 403 pattern from feature 002 (non-host start).

**Alternatives considered**:

- **400**: rejected — the request is well-formed; the actor is unauthorised.

## 5. Scoring storage shape

**Decision**: `scores: Record<string, number>` on `Round` (not `Room`). Initialised inside `startRoom` to `{ [participant.id]: 0 }` for every current participant at the moment the round starts. Late-joiners after a round has started do NOT appear in `scores` (the lobby gate already prevents joins once `room.round !== null` is reachable, but defensively we just leave them out).

**Rationale**: Scoping scores to the round keeps the "scores reset every round" rule trivial when a future feature adds round 2. Using a plain object map keeps JSON serialisation effortless.

**Alternatives considered**:

- **`Score[]` array**: rejected — forces O(n) lookup on every guess.
- **Per-participant counter on `Participant`**: rejected — would persist across rounds, contradicting the spec's FR-009 ("scores start at 0 at round start").

## 6. Guess history shape & order

**Decision**: `Round.guesses: Guess[]` stored in **chronological** order (oldest at index 0). Snapshot exposes the same array as `RoundView.guesses: GuessView[]` after stripping any future-secret fields (currently the structure is identical — `GuessView === Guess`).

**Rationale**: Chronological is the most natural read order for a chat-like feed and matches the user's mental model. The frontend can reverse for display if desired.

**Alternatives considered**:

- **Reverse chronological**: rejected — pushes the surprise to the bottom of the list; mismatch with chat conventions.
- **Capped circular buffer (e.g., last 100)**: not needed at this scale; round lifetime is short and in-memory.

## 7. Snapshot wire shape extensions

**Decision**: Add three fields to `RoundView`:

```ts
interface RoundView {
  // existing (feature 002)
  roundNumber: number;
  drawerParticipantId: string;
  maskedWord: string;
  secretWord?: string;
  // NEW (feature 003)
  guesses: GuessView[];
  scores: Record<string, number>;
  lockedParticipantIds: string[];
}
```

None of the new fields contain the secret word. `lockedParticipantIds` is publicly visible (the UI uses it to grey out the input for the corresponding viewer); it does NOT leak the word because it's just a list of participant ids.

**Rationale**: Keeping all round-scoped state inside `RoundView` (instead of hoisting onto `RoomSnapshot`) means a future "round 2" feature can drop the field-set wholesale by issuing a new `Round` object — no schema migration.

**Alternatives considered**:

- **Top-level `RoomSnapshot.scores`**: rejected — scores are intrinsically round-scoped.
- **Separate `GET /rooms/:code/guesses` endpoint**: rejected — adds another poll cycle and breaks atomicity between feed and score.

## 8. Polling cadence reuse

**Decision**: No new polling cadence. The existing `useLobbyPolling` hook (feature 001) at ~2s with visibility-aware pause/resume is reused unchanged — the feed and scoreboard are populated by the same `GET /rooms/:code` snapshot it already fetches.

**Rationale**: Constitution §II ("Polling-Only") and §IV ("Extend, Don't Replace"). One source of truth for sync cadence.

**Alternatives considered**:

- **Tighter polling during a round (e.g., 500ms)**: rejected — server load is fine at 2s for 2–6 participants and SC-001 (≤2s observed delay) is met. Tighter polling would risk overshooting the SC budget on slow networks.
- **Burst-then-back-off**: rejected — added complexity, no measurable benefit at this scale.

## 9. Drawer canvas — drawing fidelity & sync

**Decision**: Use the platform-native HTML5 `<canvas>` 2D context with `pointer*` events (pointerdown/move/up). The canvas is **local-only**: no canvas state is transmitted to the server, no canvas state is rendered for guessers. A Clear button calls `ctx.clearRect(0, 0, width, height)`.

**Rationale**: Native canvas means zero new dependencies (Constitution §IV). Pointer events handle mouse, pen, and touch with one code path. Skipping sync keeps the round payload tiny and avoids encoding strokes.

**Alternatives considered**:

- **`react-konva` or `fabric.js`**: rejected — new top-level dependency.
- **SVG with `<path>` accumulation**: rejected — more React reconciliation overhead than `canvas` for freehand drawing.
- **Sync strokes over polling**: rejected by the spec (FR-010, Assumptions). Would also blow the payload size budget for ~2s polling.

## 10. Test strategy

**Decision**: Mirror the test split established in features 001/002.

- **Backend unit tests** (`roomStore.test.ts`): pure functions, snapshot shape, scoring math, lockout.
- **Backend integration tests** (`rooms.test.ts`): HTTP envelope, status codes, idempotency, leak guard (`response.text()` must not contain `"secretWord"` in non-drawer payloads, must contain the new `guesses` array).
- **Schema tests** (`schemas.test.ts`): `submitGuessSchema` Zod cases — empty, whitespace-only, > 50 chars, missing `participantId`, valid path.
- **Frontend unit tests**: pure helpers (e.g., `isGuessSubmittable(text)`), `GuessPanel` DOM cases (drawer hides input, feed renders, no cleartext leak), `DrawerCanvas` (clear empties), `submitGuess()` API mapping.

**Rationale**: Same patterns the team already knows; no Playwright/RTL setup required (feature 002's RoundView tests already use the `react-dom/client` + `act` pattern).

**Alternatives considered**:

- **Add `@testing-library/react`**: rejected — Constitution §IV (no new top-level deps) and our existing render harness works fine.

## Resolved Open Questions from `spec.md`

| # | Question | Default | Status |
|---|---|---|---|
| 1 | Internal whitespace in guess comparison | trim only; internal preserved | **Confirmed** (§1 above) |
| 2 | Drawer's score | stays `0`; drawer cannot guess | **Confirmed** (§4 above) |
| 3 | Correct guess ends the round? | no | **Confirmed** (deferred to a future feature) |

No `[NEEDS CLARIFICATION]` remain.

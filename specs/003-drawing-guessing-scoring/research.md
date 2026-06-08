# Phase 0 Research: Active Round Drawing, Guessing & Scoring

All decisions respect the Constitution (in-memory only, REST polling ~2s, no WebSockets, no new dependencies, single round). Each is recorded as Decision / Rationale / Alternatives.

## 1. How guesses reach the server

- **Decision**: Add a dedicated action endpoint `POST /rooms/:code/guess` with body `{ participantId, text }`, returning the viewer-aware `RoomSnapshot`. Sync of the guess history to *other* players continues via the existing `GET /rooms/:code` poll.
- **Rationale**: Mirrors the existing `POST /rooms/:code/start` action (Constitution III explicitly allows action endpoints; it only forbids new *transports* for state sync). The submitter gets an immediate snapshot; everyone else converges on the next ~2s poll (SC-004). Keeps all writes in `roomStore`.
- **Alternatives considered**: (a) Piggyback guesses on the GET poll query — rejected: pollutes a read with a side-effecting write and the poll is also a heartbeat. (b) WebSocket push — prohibited by Constitution III/IV.

## 2. Correctness comparison

- **Decision**: A guess is correct when `guess.trim().toLowerCase() === word.trim().toLowerCase()` (exact match after trim + lowercase). Isolate as a pure helper `guessEvaluation.ts`: `normalizeGuess(text)` and `isCorrect(text, word)`.
- **Rationale**: Matches FR-002/FR-004 and the Constitution V.2 validation checklist (trim, empty-check, case-insensitive). A separate pure module is unit-testable in isolation, mirroring `wordSelection.ts`. Empty-after-trim is rejected upstream (route) so it never reaches scoring.
- **Alternatives considered**: Fuzzy/Levenshtein matching — out of scope (spec: partial/fuzzy not correct). Locale-aware collation — unnecessary for the ASCII starter word list; `toLowerCase()` suffices.

## 3. Where scores live and when they reset

- **Decision**: Add `score: number` to `Participant` (default `0` at creation). On `startGame`, explicitly set every participant's `score = 0` (FR-006). Award `+100` on a player's first correct guess of the round.
- **Rationale**: Scores are per-player and already travel in `participants[]` of the snapshot, so the `Scoreboard` renders with no new top-level field. Resetting at round start makes "all scores start at 0" explicit and survives any future reuse of a participant object.
- **Alternatives considered**: A separate `scores: Record<id, number>` map on the room — more plumbing and a parallel structure to keep in sync with `participants`. Storing score only on the round — loses the natural per-player home and complicates the snapshot.

## 4. Enforcing "100 points at most once per round" (FR-007)

- **Decision**: Track `correctPlayerIds: string[]` on the `Round`. Award 100 only when the player's id is **not** already present, then add it. Subsequent correct submissions by the same player are still recorded in history but score nothing.
- **Rationale**: Simple, serializable (array, not Set, so it survives `structuredClone`), and directly answers FR-007. The client can also derive "I already solved it" from the history to disable the guess box.
- **Alternatives considered**: A `solved` boolean per participant — works too, but `correctPlayerIds` keeps round-scoped state on the round (cleared naturally when a new round would be created later) and avoids widening `Participant` further.

## 5. Preventing the word leaking through the guess feed (FR-011, SC-008)

- **Decision**: Store the raw guess `text` server-side, but in `toRoundSnapshot` **omit `text` for any correct guess** for *all* viewers; emit only `{ id, playerId, playerName, correct: true }`. Incorrect guesses keep their verbatim `text`. The UI renders correct entries as "✅ {playerName} guessed the word!".
- **Rationale**: A correct guess's text *is* the secret word, so transmitting it would leak the answer to players who have not solved it — exactly the failure mode raised in clarification. Masking at the snapshot boundary reuses feature 002's proven word-secrecy pattern (the server, not the client, withholds the secret). Nothing the UI needs requires the correct text.
- **Alternatives considered**: Per-viewer filtering (show the real text only to those who already solved) — more complex, and still risks accidental exposure; provides no UX benefit since solvers already know the word. Showing all guesses verbatim — rejected in clarification (would leak).

## 6. Drawing canvas (US3, FR-012/FR-013/FR-015)

- **Decision**: A new frontend `Canvas.tsx` using the native HTML `<canvas>` 2D context with Pointer Events for strokes and a **Clear** button that wipes the canvas. **Drawer-local only** — no canvas state is sent to the server or to guessers. Guessers see a static "Waiting for {drawer}…" placeholder (the existing GamePage placeholder, kept).
- **Rationale**: FR-015/clarification scoped canvas sync out. Native canvas needs no dependency (Constitution IV) and renders strokes/clear instantly (SC-007). Keeping it client-only means zero new transport (Constitution III).
- **Alternatives considered**: A drawing library (e.g. fabric/excalidraw) — unjustified new dependency. Streaming strokes via polling — out of scope and impractical at ~2s; would also re-introduce a real-time-ish concern.

## 7. Guess-history synchronization & the missing poll loop

- **Decision**: Add a ~2s `setInterval` poll loop to `GamePage` (calling `roomStore.fetchRoom()`), matching `LobbyPage`'s pattern. The submitter also updates immediately from the guess response.
- **Rationale**: `GamePage` today has **no** poll loop, so without this, guesses/scores would never sync for other players (FR-008/FR-009/SC-004). Reusing `LobbyPage`'s exact pattern keeps it consistent and inherits the existing 404-closed-room ejection in `fetchRoom`.
- **Alternatives considered**: A single shared app-level poller — larger refactor than needed; per-page interval is the established pattern.

## 8. Round does not end on a correct guess (FR-016)

- **Decision**: No round-termination logic in this feature. A correct guess only scores and records; the round stays `playing` and others keep guessing.
- **Rationale**: Clarification chose "continue for all guessers"; round end (timer / all-correct) is explicitly a later feature and Constitution IV forbids timers here.
- **Alternatives considered**: End on first correct — rejected in clarification; would pull round-lifecycle work into this slice.

## Resolved unknowns

No remaining `NEEDS CLARIFICATION`. All Technical Context fields are concrete and constitution-aligned.

# Research: Result, Restart & Final Validation

## Decision 1 — Result screen route: `/result` (not `/result/:code`)

**Decision**: Use `/result` (parameterless route), refining the spec clarification that named `/result/:code`.

**Rationale**: All existing SPA routes — `/lobby`, `/game` — are parameterless. The room code and `participantId` live in the `RoomStore` singleton, not in the URL. Adding `:code` to `/result` would require `ResultPage` to call `useParams()` and reconcile with the store, adding complexity with no benefit. The navigation trigger (poll detects `status === "ended"`) is unaffected by the route shape.

**Alternatives considered**: `/result/:code` — rejected; would be the only param-based route in a codebase that uses store-driven routing throughout; adds reconciliation logic for no functional gain.

---

## Decision 2 — Race condition: simultaneous correct guess + manual end-round

**Decision**: First write wins; the second call hits the status guard and returns 409. No locking required.

**Rationale**: Node.js executes JavaScript single-threaded. Two concurrent HTTP requests are processed sequentially in the event loop. Once the first handler sets `room.status = "ended"`, any subsequent call to `endRound` or `submitGuess` finds `status !== "playing"` and throws `HttpError(409)`. In-memory Map mutations within a single synchronous block are atomic relative to other event loop turns.

**Alternatives considered**: Optimistic locking with a version counter — rejected; unnecessary complexity for an in-memory, single-process server with a handful of concurrent players.

---

## Decision 3 — `submitGuess` return type stays `Guess`; status change propagates via poll

**Decision**: `submitGuess` service function and the `POST /:code/guesses` route continue to return `{ guess: Guess }`. The round-end transition is picked up by all clients on their next 2-second poll.

**Rationale**: Feature 003 tests assert on the `{ guess }` response shape. Changing the return type would break those tests and conflate two concerns (guess submission vs. room state). All clients already poll; they pick up `status === "ended"` within ≤2 s (SC-001).

**Alternatives considered**: Return `{ guess, room }` — rejected to preserve backward compatibility with feature 003 tests and to keep the guess endpoint single-purpose.

---

## Decision 4 — `toRoomSnapshot` for `"ended"` status

**Decision**: When `status === "ended"`, expose `currentDrawerId`, `revealedWord`, `strokes`, `guesses`, `scores`. Do not expose `currentWord` (superseded by `revealedWord`).

**Rationale**: The result screen needs the full round data (FR-007, FR-008). `revealedWord` is the authoritative word reveal visible to all participants — no per-viewer masking. `currentWord` had drawer-only visibility semantics baked in; a separate field avoids reusing conditional logic for a different purpose.

**Alternatives considered**: Reuse `currentWord` for the word reveal on the result screen — rejected; `currentWord` carries masking semantics (non-drawers see `null`) which would have to be unwound just for the ended state, making `toRoomSnapshot` harder to reason about.

---

## Decision 5 — Frontend navigation flow

**Decision**:

- `GamePage` poll: on `room.status === "ended"` → `navigate("/result", { replace: true })`
- `ResultPage` poll: on `room.status === "lobby"` → `navigate("/lobby", { replace: true })`; on missing room → `navigate("/", { replace: true })`

**Rationale**: Consistent with the existing `LobbyPage` pattern (navigates to `/game` when status becomes `"playing"`). Each page owns its own outbound navigation based on status. This avoids adding side-effects (navigation) into the `RoomStore`, which would couple the store to React Router.

**Alternatives considered**: Central navigation guard in `App.tsx` or `RoomStore` — rejected; violates separation of concerns and makes the store aware of the router.

---

## Decision 6 — Host authorization via `participantId` body field

**Decision**: `endRound` and `restartRoom` accept `participantId` in the request body and validate `participantId === room.hostId`. Returns 403 if not.

**Rationale**: Consistent with `startRoom` (which also uses `startRoomSchema` but only checks the room code — host check is implicit because the feature assumes only the host calls start). Adding an explicit `participantId` check for end/restart is required because the spec (FR-009) requires a 403 response for non-host callers. No session or token system is available (Principle V).

**Alternatives considered**: Derive host identity from a session cookie or query param — rejected; no auth layer exists by constitution.
